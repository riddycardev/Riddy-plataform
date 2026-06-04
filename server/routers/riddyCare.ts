/**
 * Riddy Suporte Router — Sistema de Suporte 24/7
 *
 * Procedures:
 *  - support.createTicket        → abre ticket com IA como primeira camada
 *  - support.sendTicketMessage   → envia mensagem em ticket existente
 *  - support.getTicket           → busca ticket com mensagens
 *  - support.listMyTickets       → inbox do locatário
 *  - support.listHostTickets     → inbox do anfitrião
 *  - support.adminListTickets    → painel admin (todos os tickets)
 *  - support.adminUpdateTicket   → admin atualiza status/prioridade/assignee
 *  - support.adminReply          → agente responde ticket
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  supportTickets,
  ticketMessages,
  ticketAttachments,
  ticketSequence,
  vehicles,
  bookings,
  users,
} from "../../drizzle/schema";
import { eq, desc, and, or, inArray, sql } from "drizzle-orm";
import { generateChatResponse, buildSupportSystemPrompt } from "../openai";
import { notifyOwner } from "../_core/notification";

// ─── Categorias sensíveis que disparam escalonamento para humano ──────────────
const SENSITIVE_CATEGORIES = new Set([
  "emergencia",
  "problema_veiculo",
  "cancelamento",
  "reembolso",
  "caucao",
  "pagamento",
]);

const SENSITIVE_KEYWORDS = [
  "acidente", "batida", "colisão", "dano", "quebrou", "roubado", "roubo",
  "emergência", "urgente", "socorro", "disputa", "fraude", "não recebi",
  "não foi estornado", "caução", "não devolveu", "sumiu",
];

function detectsSensitiveContent(text: string): boolean {
  const lower = text.toLowerCase();
  return SENSITIVE_KEYWORDS.some((kw) => lower.includes(kw));
}

// ─── Gera próximo número de ticket ───────────────────────────────────────────
type DbType = NonNullable<Awaited<ReturnType<typeof getDb>>>;
async function nextTicketNumber(db: DbType): Promise<number> {
  const rows = await db.select().from(ticketSequence).limit(1);
  if (rows.length === 0) {
    await db.insert(ticketSequence).values({ lastNumber: 1001 });
    return 1001;
  }
  const next = rows[0].lastNumber + 1;
  await db.update(ticketSequence).set({ lastNumber: next }).where(eq(ticketSequence.id, rows[0].id));
  return next;
}

// ─── Prioridade automática por categoria ─────────────────────────────────────
function autoPriority(category: string): "P0" | "P1" | "P2" | "P3" | "P4" {
  if (category === "emergencia") return "P0";
  if (["checkin", "checkout", "problema_veiculo"].includes(category)) return "P1";
  if (["pagamento", "documentos"].includes(category)) return "P2";
  if (["caucao", "reembolso", "cancelamento"].includes(category)) return "P3";
  return "P4";
}

// ─── System prompt de suporte ─────────────────────────────────────────────────
function buildTicketSystemPrompt(category: string, vehicleInfo?: string, bookingInfo?: string): string {
  let ctx = `Você é a Lumi, assistente de suporte da RIDDY, plataforma de aluguel de veículos no Brasil.
Sempre se apresente como Lumi quando perguntada sobre seu nome.
Responda sempre em português brasileiro, de forma curta, profissional e empática.
Categoria do ticket: ${category}.`;

  if (vehicleInfo) ctx += `\nVeículo relacionado: ${vehicleInfo}.`;
  if (bookingInfo) ctx += `\nReserva relacionada: ${bookingInfo}.`;

  ctx += `\n\nSe o assunto envolver: acidente, emergência, dano no veículo, caução, disputa, pagamento não localizado, documento recusado ou cancelamento sensível — responda o que puder e adicione ao final da sua resposta a tag [ESCALAR].

Nunca revele dados pessoais sensíveis de outros usuários.
Nunca sugira canais fora da plataforma (WhatsApp, email pessoal, etc).`;

  return ctx;
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const riddyCareRouter = router({

  // ── Criar ticket com resposta automática da IA ──────────────────────────────
  createTicket: protectedProcedure
    .input(z.object({
      category: z.enum([
        "reserva", "pagamento", "documentos", "caucao", "checkin",
        "checkout", "problema_veiculo", "cancelamento", "reembolso",
        "emergencia", "outro",
      ]),
      title: z.string().min(5).max(255),
      description: z.string().min(10).max(2000),
      vehicleId: z.number().optional(),
      bookingId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
      const userId = ctx.user.id;

      // Busca contexto do veículo/reserva
      let vehicleInfo: string | undefined;
      let hostId: number | undefined;
      let bookingInfo: string | undefined;

      if (input.vehicleId) {
        const [v] = await db.select({
          brand: vehicles.brand,
          model: vehicles.model,
          year: vehicles.year,
          hostId: vehicles.hostId,
        }).from(vehicles).where(eq(vehicles.id, input.vehicleId)).limit(1);
        if (v) {
          vehicleInfo = `${v.brand} ${v.model} ${v.year}`;
          hostId = v.hostId;
        }
      }

      if (input.bookingId) {
        const [b] = await db.select({
          id: bookings.id,
          startDate: bookings.startDate,
          endDate: bookings.endDate,
          status: bookings.status,
        }).from(bookings).where(eq(bookings.id, input.bookingId)).limit(1);
        if (b) {
          bookingInfo = `Reserva #${b.id} (${b.status})`;
        }
      }

      // Gera número do ticket
      const ticketNumber = await nextTicketNumber(db);

      // Prioridade automática
      const isSensitive = SENSITIVE_CATEGORIES.has(input.category) || detectsSensitiveContent(input.description);
      const priority = input.category === "emergencia" ? "P0" : autoPriority(input.category);

      // Cria ticket
      const [result] = await db.insert(supportTickets).values({
        ticketNumber,
        userId,
        vehicleId: input.vehicleId,
        bookingId: input.bookingId,
        hostId,
        category: input.category,
        priority,
        status: "open",
        title: input.title,
        description: input.description,
        escalatedToHuman: isSensitive,
        source: "user_manual",
      });

      const ticketId = result.insertId;

      // Salva mensagem inicial do usuário
      await db.insert(ticketMessages).values({
        ticketId,
        senderId: userId,
        senderType: "user",
        content: input.description,
        readByUser: true,
        readByAgent: false,
      });

      // Resposta da IA
      const systemPrompt = buildTicketSystemPrompt(input.category, vehicleInfo, bookingInfo);
      let aiContent = "Obrigado por entrar em contato com o suporte RIDDY. Estou analisando sua solicitação.";
      let needsHuman = isSensitive;

      try {
        const aiResult = await generateChatResponse([
          { role: "system", content: systemPrompt },
          { role: "user", content: `${input.title}\n\n${input.description}` },
        ]);
        const raw = aiResult.content;
        needsHuman = needsHuman || aiResult.needsHumanReview;
        aiContent = raw.replace("[ESCALAR]", "").trim();
        if (raw.includes("[ESCALAR]")) needsHuman = true;
      } catch (e) {
        console.error("[RiddyCare] AI error:", e);
      }

      // Salva resposta da IA
      await db.insert(ticketMessages).values({
        ticketId,
        senderId: null,
        senderType: "ai",
        content: aiContent,
        readByUser: false,
        readByAgent: true,
      });

      // Se sensível, atualiza para escalado + notifica owner
      if (needsHuman) {
        await db.update(supportTickets)
          .set({ escalatedToHuman: true, priority: priority === "P4" ? "P2" : priority })
          .where(eq(supportTickets.id, ticketId));

        await notifyOwner({
          title: `🚨 Riddy Suporte — Ticket #${ticketNumber} escalado`,
          content: `Categoria: ${input.category} | Prioridade: ${priority}\nUsuário: ${ctx.user.name || ctx.user.email}\n\n${input.description.substring(0, 200)}`,
        }).catch(() => {});
      }

      return { ticketId, ticketNumber, escalatedToHuman: needsHuman, aiResponse: aiContent };
    }),

  // ── Enviar mensagem em ticket existente ─────────────────────────────────────
  sendTicketMessage: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
      content: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
      const userId = ctx.user.id;

      // Verifica acesso ao ticket
      const [ticket] = await db.select().from(supportTickets)
        .where(and(eq(supportTickets.id, input.ticketId), eq(supportTickets.userId, userId)))
        .limit(1);

      if (!ticket) throw new TRPCError({ code: "NOT_FOUND", message: "Ticket não encontrado" });
      if (ticket.status === "closed") throw new TRPCError({ code: "BAD_REQUEST", message: "Ticket encerrado" });

      // Salva mensagem do usuário
      await db.insert(ticketMessages).values({
        ticketId: input.ticketId,
        senderId: userId,
        senderType: "user",
        content: input.content,
        readByUser: true,
        readByAgent: false,
      });

      // Atualiza ticket
      await db.update(supportTickets)
        .set({ status: "open", updatedAt: new Date() })
        .where(eq(supportTickets.id, input.ticketId));

      // Resposta da IA (apenas se não escalado para humano)
      let aiResponse: string | null = null;
      if (!ticket.escalatedToHuman) {
        try {
          // Busca histórico
          const history = await db.select().from(ticketMessages)
            .where(eq(ticketMessages.ticketId, input.ticketId))
            .orderBy(ticketMessages.createdAt)
            .limit(10);

          const messages = history.map((m) => ({
            role: (m.senderType === "user" ? "user" : "assistant") as "user" | "assistant",
            content: m.content,
          }));

          const systemPrompt = buildTicketSystemPrompt(ticket.category);
          const aiResult = await generateChatResponse([
            { role: "system", content: systemPrompt },
            ...messages,
          ]);

          const raw = aiResult.content;
          aiResponse = raw.replace("[ESCALAR]", "").trim();
          const needsHuman = aiResult.needsHumanReview || raw.includes("[ESCALAR]");

          await db.insert(ticketMessages).values({
            ticketId: input.ticketId,
            senderId: null,
            senderType: "ai",
            content: aiResponse,
            readByUser: false,
            readByAgent: true,
          });

          if (needsHuman) {
            await db.update(supportTickets)
              .set({ escalatedToHuman: true })
              .where(eq(supportTickets.id, input.ticketId));
          }
        } catch (e) {
          console.error("[RiddyCare] AI reply error:", e);
        }
      }

      return { success: true, aiResponse };
    }),

  // ── Buscar ticket com mensagens ─────────────────────────────────────────────
  getTicket: protectedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
      const userId = ctx.user.id;
      const isAdmin = ctx.user.role === "admin";

      const [ticket] = await db.select().from(supportTickets)
        .where(
          isAdmin
            ? eq(supportTickets.id, input.ticketId)
            : and(eq(supportTickets.id, input.ticketId), eq(supportTickets.userId, userId))
        )
        .limit(1);

      if (!ticket) throw new TRPCError({ code: "NOT_FOUND" });

      const messages = await db.select().from(ticketMessages)
        .where(eq(ticketMessages.ticketId, input.ticketId))
        .orderBy(ticketMessages.createdAt);

      // Marca mensagens como lidas pelo usuário
      if (!isAdmin) {
        await db.update(ticketMessages)
          .set({ readByUser: true })
          .where(and(eq(ticketMessages.ticketId, input.ticketId), eq(ticketMessages.readByUser, false)));
      }

      // Busca info do veículo se houver
      let vehicleInfo = null;
      if (ticket.vehicleId) {
        const [v] = await db.select({
          brand: vehicles.brand,
          model: vehicles.model,
          year: vehicles.year,
          mainImageUrl: vehicles.mainImageUrl,
        }).from(vehicles).where(eq(vehicles.id, ticket.vehicleId)).limit(1);
        vehicleInfo = v || null;
      }

      return { ticket, messages, vehicleInfo };
    }),

  // ── Inbox do locatário ──────────────────────────────────────────────────────
  listMyTickets: protectedProcedure
    .input(z.object({
      status: z.enum(["open", "in_progress", "waiting_user", "resolved", "closed", "all"]).default("all"),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
      const userId = ctx.user.id;

      const conditions = [eq(supportTickets.userId, userId)];
      if (input.status !== "all") {
        conditions.push(eq(supportTickets.status, input.status));
      }

      const tickets = await db.select().from(supportTickets)
        .where(and(...conditions))
        .orderBy(desc(supportTickets.updatedAt))
        .limit(50);

      return tickets;
    }),

  // ── Inbox do anfitrião ──────────────────────────────────────────────────────
  listHostTickets: protectedProcedure
    .input(z.object({
      status: z.enum(["open", "in_progress", "waiting_user", "resolved", "closed", "all"]).default("all"),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });
      const hostId = ctx.user.id;

      const conditions = [eq(supportTickets.hostId, hostId)];
      if (input.status !== "all") {
        conditions.push(eq(supportTickets.status, input.status));
      }

      const tickets = await db.select().from(supportTickets)
        .where(and(...conditions))
        .orderBy(desc(supportTickets.updatedAt))
        .limit(50);

      return tickets;
    }),

  // ── Admin: listar todos os tickets ─────────────────────────────────────────
  adminListTickets: adminProcedure
    .input(z.object({
      status: z.enum(["open", "in_progress", "waiting_user", "resolved", "closed", "all"]).default("open"),
      priority: z.enum(["P0", "P1", "P2", "P3", "P4", "all"]).default("all"),
      category: z.string().optional(),
      escalatedOnly: z.boolean().default(false),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      const conditions: ReturnType<typeof eq>[] = [];
      if (input.status !== "all") conditions.push(eq(supportTickets.status, input.status));
      if (input.priority !== "all") conditions.push(eq(supportTickets.priority, input.priority));
      if (input.escalatedOnly) conditions.push(eq(supportTickets.escalatedToHuman, true));

      const tickets = await db.select({
        ticket: supportTickets,
        userName: users.name,
        userEmail: users.email,
      })
        .from(supportTickets)
        .leftJoin(users, eq(users.id, supportTickets.userId))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(
          // P0 primeiro, depois por data
          sql`FIELD(${supportTickets.priority}, 'P0', 'P1', 'P2', 'P3', 'P4')`,
          desc(supportTickets.updatedAt)
        )
        .limit(input.limit)
        .offset(input.offset);

      const [{ count }] = await db.select({ count: sql<number>`COUNT(*)` })
        .from(supportTickets)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return { tickets, total: count };
    }),

  // ── Admin: atualizar ticket ─────────────────────────────────────────────────
  adminUpdateTicket: adminProcedure
    .input(z.object({
      ticketId: z.number(),
      status: z.enum(["open", "in_progress", "waiting_user", "resolved", "closed"]).optional(),
      priority: z.enum(["P0", "P1", "P2", "P3", "P4"]).optional(),
      assignedTo: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (input.status) updates.status = input.status;
      if (input.priority) updates.priority = input.priority;
      if (input.assignedTo) updates.assignedTo = input.assignedTo;
      if (input.status === "resolved" || input.status === "closed") {
        updates.resolvedAt = new Date();
      }

      await db.update(supportTickets).set(updates).where(eq(supportTickets.id, input.ticketId));
      return { success: true };
    }),

  // ── Admin: responder ticket ─────────────────────────────────────────────────
  adminReply: adminProcedure
    .input(z.object({
      ticketId: z.number(),
      content: z.string().min(1).max(2000),
      isInternal: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

      await db.insert(ticketMessages).values({
        ticketId: input.ticketId,
        senderId: ctx.user.id,
        senderType: "agent",
        content: input.content,
        isInternal: input.isInternal,
        readByUser: false,
        readByAgent: true,
      });

      if (!input.isInternal) {
        await db.update(supportTickets)
          .set({ status: "waiting_user", updatedAt: new Date() })
          .where(eq(supportTickets.id, input.ticketId));
      }

      return { success: true };
    }),

  // ── Stats para o admin ──────────────────────────────────────────────────────
  adminStats: adminProcedure.query(async () => {
    const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

    const [open] = await db.select({ count: sql<number>`COUNT(*)` })
      .from(supportTickets).where(eq(supportTickets.status, "open"));
    const [p0] = await db.select({ count: sql<number>`COUNT(*)` })
      .from(supportTickets).where(and(eq(supportTickets.priority, "P0"), eq(supportTickets.status, "open")));
    const [escalated] = await db.select({ count: sql<number>`COUNT(*)` })
      .from(supportTickets).where(and(eq(supportTickets.escalatedToHuman, true), eq(supportTickets.status, "open")));
    const [inProgress] = await db.select({ count: sql<number>`COUNT(*)` })
      .from(supportTickets).where(eq(supportTickets.status, "in_progress"));

    return {
      open: open.count,
      p0Emergencies: p0.count,
      escalated: escalated.count,
      inProgress: inProgress.count,
    };
  }),

  // ── Chat rápido inline (sem criar ticket) ──────────────────────────────────────────
  // Usado pelo widget flutuante e pelo VehicleOwnerChat para responder perguntas rápidas
  quickChat: protectedProcedure
    .input(z.object({
      messages: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })),
      faqCategory: z.string().optional(),
      vehicleId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      // Busca dados do veículo para enriquecer o contexto da IA
      let vehicleContext = "";
      if (input.vehicleId) {
        const db = await getDb();
        if (db) {
           const [veh] = await db.select({
            brand: vehicles.brand,
            model: vehicles.model,
            year: vehicles.year,
            dailyPrice: vehicles.dailyPrice,
            pickupCity: vehicles.pickupCity,
            pickupState: vehicles.pickupState,
            fuelType: vehicles.fuelType,
            transmission: vehicles.transmission,
            seats: vehicles.seats,
          }).from(vehicles).where(eq(vehicles.id, input.vehicleId)).limit(1);
          if (veh) {
            vehicleContext = `
Veículo em questão:
- ${veh.brand} ${veh.model} ${veh.year}
- Preço: R$ ${veh.dailyPrice}/dia
- Localização: ${veh.pickupCity}, ${veh.pickupState}
- Combustível: ${veh.fuelType}
- Câmbio: ${veh.transmission}
- Lugares: ${veh.seats}`;
          }
        }
      }

      const systemPrompt = `Você é a Lumi, assistente da RIDDY, plataforma de aluguel de veículos no Brasil.
Sempre se apresente como Lumi quando perguntada sobre seu nome.
Responda sempre em português brasileiro, de forma curta, profissional e empática.
Se o assunto envolver: acidente, emergência, dano no veículo, caução, disputa, pagamento não localizado, documento recusado ou cancelamento sensível — responda o que puder e adicione ao final da sua resposta a tag [ESCALAR].
Nunca revele dados pessoais sensíveis de outros usuários.
Nunca sugira canais fora da plataforma (WhatsApp, email pessoal, etc).
Mantenha respostas concisas (máx 3 parágrafos).${vehicleContext}`;

      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...input.messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ];

      const { content, needsHumanReview } = await generateChatResponse(messages);

      return {
        reply: content,
        needsEscalation: needsHumanReview,
      };
    }),
});
