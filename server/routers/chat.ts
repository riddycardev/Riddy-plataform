/**
 * Chat Router — Chat híbrido IA + Anfitrião
 */

import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { vehicleChats, chatMessages, vehicles, users } from "../../drizzle/schema";
import {
  generateChatResponse,
  buildVehicleSystemPrompt,
  buildSupportSystemPrompt,
} from "../openai";
import { notifyOwner } from "../_core/notification";

// ─── helpers ────────────────────────────────────────────────────────────────

async function getVehicleContext(vehicleId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).limit(1);
  return rows[0] ?? null;
}

async function getHostName(hostId: number): Promise<string> {
  const db = await getDb();
  if (!db) return "Proprietário";
  const rows = await db.select({ name: users.name }).from(users).where(eq(users.id, hostId)).limit(1);
  return rows[0]?.name ?? "Proprietário";
}

async function getChatHistory(chatId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  const msgs = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.chatId, chatId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
  return msgs.reverse();
}

// ─── router ─────────────────────────────────────────────────────────────────

export const chatRouter = router({
  /**
   * Cria ou retorna uma sessão de chat existente.
   */
  getOrCreate: protectedProcedure
    .input(
      z.object({
        mode: z.enum(["vehicle", "support"]),
        vehicleId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      const renterId = ctx.user.id;

      if (input.mode === "vehicle") {
        if (!input.vehicleId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "vehicleId obrigatório para chat de veículo" });
        }

        const existing = await db
          .select()
          .from(vehicleChats)
          .where(
            and(
              eq(vehicleChats.renterId, renterId),
              eq(vehicleChats.vehicleId, input.vehicleId),
              eq(vehicleChats.mode, "vehicle"),
              eq(vehicleChats.status, "open")
            )
          )
          .limit(1);

        if (existing[0]) return existing[0];

        const vehicle = await getVehicleContext(input.vehicleId);
        if (!vehicle) throw new TRPCError({ code: "NOT_FOUND", message: "Veículo não encontrado" });

        const [newChat] = await db.insert(vehicleChats).values({
          vehicleId: input.vehicleId,
          renterId,
          hostId: vehicle.hostId,
          mode: "vehicle",
          status: "open",
          pendingHostReply: 0,
        });

        const chatId = Number(newChat.insertId);

        const welcomeMsg = `Olá! 👋 Sou o assistente do ${vehicle.brand} ${vehicle.model} ${vehicle.year}. Como posso ajudar? Você pode me perguntar sobre o veículo, documentos necessários, processo de reserva ou qualquer dúvida antes de alugar.`;
        await db.insert(chatMessages).values({
          chatId,
          senderId: null,
          senderType: "ai",
          content: welcomeMsg,
          needsHostReview: false,
          readByHost: true,
          readByRenter: false,
        });

        return {
          id: chatId,
          vehicleId: input.vehicleId,
          renterId,
          hostId: vehicle.hostId,
          mode: "vehicle" as const,
          status: "open" as const,
          pendingHostReply: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      // mode="support"
      const existing = await db
        .select()
        .from(vehicleChats)
        .where(
          and(
            eq(vehicleChats.renterId, renterId),
            eq(vehicleChats.mode, "support"),
            eq(vehicleChats.status, "open")
          )
        )
        .limit(1);

      if (existing[0]) return existing[0];

      const [newChat] = await db.insert(vehicleChats).values({
        vehicleId: null,
        renterId,
        hostId: null,
        mode: "support",
        status: "open",
        pendingHostReply: 0,
      });

      const chatId = Number(newChat.insertId);

      const welcomeMsg = `Olá! 👋 Sou o assistente de suporte da RIDDY. Estou aqui 24/7 para ajudar com dúvidas sobre reservas, documentos, pagamentos ou qualquer questão da plataforma. Como posso ajudar?`;
      await db.insert(chatMessages).values({
        chatId,
        senderId: null,
        senderType: "ai",
        content: welcomeMsg,
        needsHostReview: false,
        readByHost: true,
        readByRenter: false,
      });

      return {
        id: chatId,
        vehicleId: null,
        renterId,
        hostId: null,
        mode: "support" as const,
        status: "open" as const,
        pendingHostReply: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }),

  /**
   * Locatário envia uma mensagem. A IA processa e responde automaticamente.
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        chatId: z.number(),
        content: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const chat = await db
        .select()
        .from(vehicleChats)
        .where(and(eq(vehicleChats.id, input.chatId), eq(vehicleChats.renterId, ctx.user.id)))
        .limit(1);

      if (!chat[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Chat não encontrado" });
      if (chat[0].status === "closed") throw new TRPCError({ code: "BAD_REQUEST", message: "Chat encerrado" });

      // Salva mensagem do usuário
      await db.insert(chatMessages).values({
        chatId: input.chatId,
        senderId: ctx.user.id,
        senderType: "user",
        content: input.content,
        needsHostReview: false,
        readByHost: false,
        readByRenter: true,
      });

      // Histórico para contexto da IA
      const history = await getChatHistory(input.chatId, 10);
      const historyForAI: Array<{ role: "user" | "assistant"; content: string }> = history.map((m) => ({
        role: (m.senderType === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.content,
      }));

      // System prompt conforme o modo
      let systemPrompt: string;
      if (chat[0].mode === "vehicle" && chat[0].vehicleId) {
        const vehicle = await getVehicleContext(chat[0].vehicleId);
        if (vehicle) {
          const hostName = chat[0].hostId ? await getHostName(chat[0].hostId) : undefined;
          systemPrompt = buildVehicleSystemPrompt({
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            category: vehicle.category ?? "sedan",
            transmission: vehicle.transmission ?? "manual",
            fuelType: vehicle.fuelType ?? "flex",
            seats: vehicle.seats ?? 5,
            dailyPrice: vehicle.dailyPrice,
            dailyKmLimit: vehicle.dailyKmLimit ?? 200,
            extraKmPrice: vehicle.extraKmPrice ?? "1.00",
            pickupCity: vehicle.pickupCity ?? "",
            pickupState: vehicle.pickupState ?? "",
            deliveryAvailable: vehicle.deliveryAvailable ?? false,
            minRentalDays: vehicle.minRentalDays ?? 1,
            maxRentalDays: vehicle.maxRentalDays ?? 30,
            smokingAllowed: vehicle.smokingAllowed ?? false,
            petsAllowed: vehicle.petsAllowed ?? false,
            hostName,
            features: vehicle.features as string[] | null,
          });
        } else {
          systemPrompt = buildSupportSystemPrompt();
        }
      } else {
        systemPrompt = buildSupportSystemPrompt();
      }

      // Chama a IA
      const aiMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: systemPrompt },
        ...historyForAI,
        { role: "user", content: input.content },
      ];

      let aiContent = "";
      let needsHostReview = false;

      try {
        const result = await generateChatResponse(aiMessages, { fast: true, maxTokens: 400 });
        aiContent = result.content;
        needsHostReview = result.needsHumanReview;
      } catch {
        aiContent = "Desculpe, estou com dificuldades técnicas no momento. O proprietário irá responder em breve.";
        needsHostReview = true;
      }

      // Salva resposta da IA
      await db.insert(chatMessages).values({
        chatId: input.chatId,
        senderId: null,
        senderType: "ai",
        content: aiContent,
        needsHostReview,
        readByHost: !needsHostReview,
        readByRenter: false,
      });

      if (needsHostReview) {
        await db
          .update(vehicleChats)
          .set({ pendingHostReply: sql`${vehicleChats.pendingHostReply} + 1`, updatedAt: new Date() })
          .where(eq(vehicleChats.id, input.chatId));

        await notifyOwner({
          title: chat[0].mode === "vehicle" ? "Nova pergunta sobre seu veículo" : "Suporte RIDDY: pergunta escalada",
          content: `"${input.content.slice(0, 100)}${input.content.length > 100 ? "..." : ""}" — A IA não teve certeza. Acesse o painel para responder.`,
        }).catch(() => {});
      }

      return {
        userMessage: { senderType: "user" as const, content: input.content },
        aiMessage: { senderType: "ai" as const, content: aiContent, needsHostReview },
      };
    }),

  /**
   * Anfitrião responde manualmente.
   */
  hostReply: protectedProcedure
    .input(
      z.object({
        chatId: z.number(),
        content: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const chat = await db
        .select()
        .from(vehicleChats)
        .where(and(eq(vehicleChats.id, input.chatId), eq(vehicleChats.hostId, ctx.user.id)))
        .limit(1);

      if (!chat[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Chat não encontrado ou sem permissão" });

      await db.insert(chatMessages).values({
        chatId: input.chatId,
        senderId: ctx.user.id,
        senderType: "host",
        content: input.content,
        needsHostReview: false,
        readByHost: true,
        readByRenter: false,
      });

      await db
        .update(vehicleChats)
        .set({ pendingHostReply: 0, updatedAt: new Date() })
        .where(eq(vehicleChats.id, input.chatId));

      return { success: true };
    }),

  /**
   * Histórico de mensagens de um chat.
   */
  getMessages: protectedProcedure
    .input(z.object({ chatId: z.number(), limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const chat = await db
        .select()
        .from(vehicleChats)
        .where(eq(vehicleChats.id, input.chatId))
        .limit(1);

      if (!chat[0]) throw new TRPCError({ code: "NOT_FOUND" });

      const isRenter = chat[0].renterId === ctx.user.id;
      const isHost = chat[0].hostId === ctx.user.id;
      const isAdmin = ctx.user.role === "admin";

      if (!isRenter && !isHost && !isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const msgs = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.chatId, input.chatId))
        .orderBy(chatMessages.createdAt)
        .limit(input.limit);

      // Marca como lido
      if (isRenter) {
        await db
          .update(chatMessages)
          .set({ readByRenter: true })
          .where(and(eq(chatMessages.chatId, input.chatId), eq(chatMessages.readByRenter, false)));
      }
      if (isHost) {
        await db
          .update(chatMessages)
          .set({ readByHost: true })
          .where(and(eq(chatMessages.chatId, input.chatId), eq(chatMessages.readByHost, false)));
      }

      return { chat: chat[0], messages: msgs };
    }),

  /**
   * Lista chats do anfitrião (painel de mensagens).
   */
  listHostChats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const chats = await db
      .select({
        id: vehicleChats.id,
        vehicleId: vehicleChats.vehicleId,
        renterId: vehicleChats.renterId,
        hostId: vehicleChats.hostId,
        mode: vehicleChats.mode,
        status: vehicleChats.status,
        pendingHostReply: vehicleChats.pendingHostReply,
        createdAt: vehicleChats.createdAt,
        updatedAt: vehicleChats.updatedAt,
        renterName: users.name,
      })
      .from(vehicleChats)
      .leftJoin(users, eq(vehicleChats.renterId, users.id))
      .where(eq(vehicleChats.hostId, ctx.user.id))
      .orderBy(desc(vehicleChats.updatedAt))
      .limit(50);

    const result = await Promise.all(
      chats.map(async (row) => {
        const lastMsg = await db
          .select()
          .from(chatMessages)
          .where(eq(chatMessages.chatId, row.id))
          .orderBy(desc(chatMessages.createdAt))
          .limit(1);

        return {
          ...row,
          renterName: row.renterName ?? "Usuário",
          lastMessage: lastMsg[0] ?? null,
          unreadCount: lastMsg[0] && !lastMsg[0].readByHost ? 1 : 0,
        };
      })
    );

    return result;
  }),
});
