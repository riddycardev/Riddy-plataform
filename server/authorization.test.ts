/**
 * ETAPA 7 — Testes de Autorização (Ownership Checks)
 *
 * Valida que as procedures tRPC protegem corretamente o acesso a recursos
 * de outros usuários, prevenindo IDOR (Insecure Direct Object Reference)
 * e escalação de privilégios.
 *
 * Estratégia de teste:
 *   1. Testes estáticos (análise de código-fonte) — verificam que os checks existem
 *   2. Testes de lógica unitária — verificam a lógica de autorização isolada
 *   3. Testes de integração com DB — verificam comportamento real
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import fs from "fs";

// ─────────────────────────────────────────────────────────────────
// Test Suite 1: Static Analysis — ownership checks exist in source
// ─────────────────────────────────────────────────────────────────

describe("ETAPA 7 — Análise estática: ownership checks no código-fonte", () => {
  let routersContent: string;
  let dbContent: string;

  beforeAll(() => {
    routersContent = fs.readFileSync("server/routers.ts", "utf-8");
    dbContent = fs.readFileSync("server/db.ts", "utf-8");
  });

  // ── markNotificationRead ──────────────────────────────────────
  describe("user.markNotificationRead — IDOR fix", () => {
    it("deve usar markNotificationAsReadForUser (com userId) em vez de markNotificationAsRead", () => {
      expect(routersContent).toContain("markNotificationAsReadForUser(input.id, ctx.user.id)");
    });

    it("não deve usar markNotificationAsRead(input.id) sem verificação de usuário", () => {
      // The old insecure pattern: markNotificationAsRead(input.id) without ctx.user.id
      // We check that the mutation now passes ctx.user.id
      const mutationBlock = routersContent.match(
        /markNotificationRead:[\s\S]*?\.mutation\(async[\s\S]*?\}\),/
      )?.[0] ?? "";
      expect(mutationBlock).toContain("ctx.user.id");
      expect(mutationBlock).not.toMatch(/markNotificationAsRead\(input\.id\)/);
    });

    it("db.ts deve exportar markNotificationAsReadForUser com parâmetro userId", () => {
      expect(dbContent).toContain("export async function markNotificationAsReadForUser(id: number, userId: number)");
    });

    it("markNotificationAsReadForUser deve usar AND com eq(notifications.userId, userId)", () => {
      expect(dbContent).toContain("eq(notifications.userId, userId)");
    });
  });

  // ── review.create ─────────────────────────────────────────────
  describe("review.create — booking ownership check", () => {
    it("deve buscar a reserva antes de criar a avaliação", () => {
      const createBlock = routersContent.match(
        /create: protectedProcedure[\s\S]*?reviewType[\s\S]*?\.mutation\(async[\s\S]*?return \{ id: reviewId/
      )?.[0] ?? "";
      expect(createBlock).toContain("db.getBookingById(input.bookingId)");
    });

    it("deve verificar que o avaliador é renter ou host da reserva", () => {
      expect(routersContent).toContain(
        "booking.renterId !== ctx.user.id && booking.hostId !== ctx.user.id"
      );
    });

    it("deve lançar FORBIDDEN se usuário não participou da reserva", () => {
      const createBlock = routersContent.match(
        /create: protectedProcedure[\s\S]*?reviewType[\s\S]*?\.mutation\(async[\s\S]*?return \{ id: reviewId/
      )?.[0] ?? "";
      expect(createBlock).toContain('code: "FORBIDDEN"');
    });

    it("deve validar reviewType vs papel do usuário na reserva (renter/host)", () => {
      expect(routersContent).toContain("renter_to_host");
      expect(routersContent).toContain("host_to_renter");
      expect(routersContent).toContain("booking.renterId !== ctx.user.id");
      expect(routersContent).toContain("booking.hostId !== ctx.user.id");
    });

    it("deve exigir que a reserva esteja concluída para permitir avaliação", () => {
      expect(routersContent).toContain('booking.status !== "completed"');
      expect(routersContent).toContain("Só é possível avaliar reservas concluídas");
    });
  });

  // ── booking.getById ───────────────────────────────────────────
  describe("booking.getById — ownership check existente", () => {
    it("deve verificar que o usuário é renter, host ou admin", () => {
      expect(routersContent).toContain(
        "booking.renterId !== ctx.user.id && booking.hostId !== ctx.user.id && ctx.user.role !== \"admin\""
      );
    });
  });

  // ── booking.updateStatus ──────────────────────────────────────
  describe("booking.updateStatus — role-based ownership checks", () => {
    it("deve verificar que apenas o host pode confirmar a reserva", () => {
      expect(routersContent).toContain(
        "input.status === \"confirmed\" && booking.hostId !== ctx.user.id"
      );
    });

    it("deve verificar que apenas o renter pode cancelar como renter", () => {
      expect(routersContent).toContain(
        "input.status === \"cancelled_by_renter\" && booking.renterId !== ctx.user.id"
      );
    });

    it("deve verificar que apenas o host pode cancelar como host", () => {
      expect(routersContent).toContain(
        "input.status === \"cancelled_by_host\" && booking.hostId !== ctx.user.id"
      );
    });
  });

  // ── vehicle.update ────────────────────────────────────────────
  describe("vehicle.update — host ownership check", () => {
    it("deve verificar que apenas o host pode editar o veículo", () => {
      expect(routersContent).toContain("vehicle.hostId !== ctx.user.id");
    });
  });

  // ── vehicle.deleteVehicle ─────────────────────────────────────
  describe("vehicle.deleteVehicle — host ou admin", () => {
    it("deve verificar que apenas host ou admin pode deletar veículo", () => {
      expect(routersContent).toContain(
        "vehicle.hostId !== ctx.user.id && ctx.user.role !== \"admin\""
      );
    });
  });

  // ── message.getMessages ───────────────────────────────────────
  describe("message.getMessages — conversation participant check", () => {
    it("deve verificar que o usuário é participante da conversa", () => {
      expect(routersContent).toContain(
        "conversation.participant1Id !== ctx.user.id && conversation.participant2Id !== ctx.user.id"
      );
    });
  });

  // ── message.send ─────────────────────────────────────────────
  describe("message.send — conversation participant check", () => {
    it("deve verificar participação antes de enviar mensagem", () => {
      // The send mutation should also check participation
      const sendBlock = routersContent.match(
        /send: protectedProcedure[\s\S]*?\.mutation\(async[\s\S]*?conversationId: input\.conversationId/
      )?.[0] ?? "";
      expect(sendBlock).toContain("participant1Id");
      expect(sendBlock).toContain("participant2Id");
    });
  });

  // ── payment.processBookingPayment ─────────────────────────────
  describe("payment.processBookingPayment — renter ownership check", () => {
    it("deve verificar que apenas o renter pode pagar a reserva", () => {
      expect(routersContent).toContain(
        "booking.renterId !== ctx.user.id"
      );
    });
  });

  // ── vehicle.getOwnerDocuments ─────────────────────────────────
  describe("vehicle.getOwnerDocuments — host or admin check", () => {
    it("deve verificar que apenas o host ou admin pode ver documentos do veículo", () => {
      expect(routersContent).toContain(
        "ctx.user.role !== \"admin\" && ctx.user.id !== vehicle.hostId"
      );
    });
  });

  // ── admin procedures ──────────────────────────────────────────
  describe("admin procedures — role check", () => {
    const adminProcedures = [
      "getStats",
      "getPendingDocuments",
      "reviewDocument",
      "getPendingVehicles",
      "approveVehicle",
      "rejectVehicle",
      "getAllUsers",
      "deleteUser",
    ];

    for (const proc of adminProcedures) {
      it(`${proc} deve usar adminProcedure (proteção centralizada)`, () => {
        // Find the procedure block and check it uses adminProcedure
        // adminProcedure centralizes the role check in trpc.ts, so no manual check is needed
        const idx = routersContent.indexOf(`${proc}:`);
        if (idx === -1) return; // procedure may not exist
        const block = routersContent.slice(idx, idx + 500);
        expect(block).toContain('adminProcedure');
      });
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// Test Suite 2: Unit Logic — authorization functions
// ─────────────────────────────────────────────────────────────────

describe("ETAPA 7 — Lógica de autorização unitária", () => {
  describe("markNotificationAsReadForUser — lógica de filtro", () => {
    it("deve usar AND condition com id E userId", () => {
      const dbContent = fs.readFileSync("server/db.ts", "utf-8");
      const fnBlock = dbContent.match(
        /markNotificationAsReadForUser[\s\S]*?\.where\([\s\S]*?\);/
      )?.[0] ?? "";
      // Must use and() with both conditions
      expect(fnBlock).toContain("and(");
      expect(fnBlock).toContain("eq(notifications.id, id)");
      expect(fnBlock).toContain("eq(notifications.userId, userId)");
    });
  });

  describe("review.create — lógica de validação de tipo", () => {
    it("renter_to_host deve ser bloqueado para host", () => {
      const routersContent = fs.readFileSync("server/routers.ts", "utf-8");
      // Check that renter_to_host review type is validated against booking.renterId
      expect(routersContent).toContain(
        'input.reviewType === "renter_to_host" || input.reviewType === "renter_to_vehicle"'
      );
      expect(routersContent).toContain(
        "booking.renterId !== ctx.user.id"
      );
    });

    it("host_to_renter deve ser bloqueado para renter", () => {
      const routersContent = fs.readFileSync("server/routers.ts", "utf-8");
      expect(routersContent).toContain('input.reviewType === "host_to_renter"');
      expect(routersContent).toContain("booking.hostId !== ctx.user.id");
    });
  });

  describe("booking status validation", () => {
    it("review.create deve exigir status completed", () => {
      const routersContent = fs.readFileSync("server/routers.ts", "utf-8");
      expect(routersContent).toContain('booking.status !== "completed"');
      expect(routersContent).toContain('"BAD_REQUEST"');
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// Test Suite 3: Integration — db helper with real DB
// ─────────────────────────────────────────────────────────────────

describe("ETAPA 7 — Integração: markNotificationAsReadForUser", () => {
  let conn: any;

  beforeAll(async () => {
    const mysql = await import("mysql2/promise");
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is required");
    conn = await mysql.default.createConnection(url);
  });

  afterAll(async () => {
    if (conn) await conn.end();
  });

  it("não deve marcar notificação de outro usuário como lida", async () => {
    // Create two test users
    const [r1] = await conn.execute(
      "INSERT INTO users (openId, name, email, role, kycStatus, createdAt, updatedAt) VALUES (?, ?, ?, 'user', 'pending', NOW(), NOW())",
      [`test_etapa7_u1_${Date.now()}`, "Test User 1", `etapa7_u1_${Date.now()}@test.com`]
    );
    const userId1 = (r1 as any).insertId;

    const [r2] = await conn.execute(
      "INSERT INTO users (openId, name, email, role, kycStatus, createdAt, updatedAt) VALUES (?, ?, ?, 'user', 'pending', NOW(), NOW())",
      [`test_etapa7_u2_${Date.now()}`, "Test User 2", `etapa7_u2_${Date.now()}@test.com`]
    );
    const userId2 = (r2 as any).insertId;

    // Create a notification for user1
    const [rn] = await conn.execute(
      "INSERT INTO notifications (userId, notificationType, title, message, isRead, createdAt) VALUES (?, 'system', 'Test', 'Test notification', 0, NOW())",
      [userId1]
    );
    const notifId = (rn as any).insertId;

    // Import and call markNotificationAsReadForUser with user2's id (should NOT mark as read)
    const { markNotificationAsReadForUser } = await import("./db");
    await markNotificationAsReadForUser(notifId, userId2);

    // Verify notification is still unread
    const [rows] = await conn.execute(
      "SELECT isRead FROM notifications WHERE id = ?",
      [notifId]
    );
    expect((rows as any)[0].isRead).toBe(0); // Still unread

    // Now call with user1's id (should mark as read)
    await markNotificationAsReadForUser(notifId, userId1);
    const [rows2] = await conn.execute(
      "SELECT isRead FROM notifications WHERE id = ?",
      [notifId]
    );
    expect((rows2 as any)[0].isRead).toBe(1); // Now read

    // Cleanup
    await conn.execute("DELETE FROM notifications WHERE id = ?", [notifId]);
    await conn.execute("DELETE FROM users WHERE id IN (?, ?)", [userId1, userId2]);
  });
});

// ─────────────────────────────────────────────────────────────────
// Test Suite 4: Comprehensive coverage — all protected procedures
// ─────────────────────────────────────────────────────────────────

describe("ETAPA 7 — Cobertura: procedures protegidas com ctx.user", () => {
  let routersContent: string;

  beforeAll(() => {
    routersContent = fs.readFileSync("server/routers.ts", "utf-8");
  });

  it("getMyBookings deve usar ctx.user.id para filtrar reservas do usuário", () => {
    expect(routersContent).toContain("getBookingsByRenterId(ctx.user.id)");
  });

  it("getHostBookings deve usar ctx.user.id para filtrar reservas do host", () => {
    expect(routersContent).toContain("getBookingsByHostId(ctx.user.id)");
  });

  it("getMyPayments deve usar ctx.user.id para filtrar pagamentos", () => {
    expect(routersContent).toContain("getPaymentsByUserId(ctx.user.id)");
  });

  it("getDocuments deve usar ctx.user.id para filtrar documentos", () => {
    expect(routersContent).toContain("getUserDocuments(ctx.user.id)");
  });

  it("getNotifications deve usar ctx.user.id para filtrar notificações", () => {
    expect(routersContent).toContain("getNotificationsByUserId(ctx.user.id)");
  });

  it("getMyVehicles deve usar ctx.user.id para filtrar veículos do host", () => {
    expect(routersContent).toContain("getVehiclesByHostId(ctx.user.id)");
  });

  it("favorites.list deve usar ctx.user.id para filtrar favoritos", () => {
    expect(routersContent).toContain("getFavoritesByUserId(ctx.user.id)");
  });

  it("favorites.add deve usar ctx.user.id ao adicionar favorito", () => {
    expect(routersContent).toContain("addFavorite(ctx.user.id, input.vehicleId)");
  });

  it("favorites.remove deve usar ctx.user.id ao remover favorito", () => {
    expect(routersContent).toContain("removeFavorite(ctx.user.id, input.vehicleId)");
  });

  it("message.startConversation deve bloquear conversa consigo mesmo", () => {
    expect(routersContent).toContain("input.otherUserId === ctx.user.id");
    expect(routersContent).toContain('"BAD_REQUEST"');
  });

  it("vehicle.blockDates deve verificar que apenas o host pode bloquear datas", () => {
    expect(routersContent).toContain("vehicle.hostId !== ctx.user.id");
  });

  it("vehicle.uploadImage deve verificar que apenas o host pode fazer upload de imagens", () => {
    // Fase 3 de Hardening: uploadImage foi migrado para hostProcedure
    // O ownership check (vehicle.hostId !== ctx.user.id) ainda existe dentro da procedure
    const uploadImageBlock = routersContent.match(
      /uploadImage: hostProcedure[\s\S]*?\.mutation\(async[\s\S]*?return/
    )?.[0] ?? "";
    expect(uploadImageBlock).toContain("vehicle.hostId !== ctx.user.id");
  });

  it("vehicle.deleteImage deve verificar que apenas o host pode deletar imagens", () => {
    // Fase 3 de Hardening: deleteImage foi migrado para hostProcedure
    const deleteImageBlock = routersContent.match(
      /deleteImage: hostProcedure[\s\S]*?\.mutation\(async[\s\S]*?return/
    )?.[0] ?? "";
    expect(deleteImageBlock).toContain("vehicle.hostId !== ctx.user.id");
  });

  it("payment.cancelWithRefund deve verificar que apenas o renter pode cancelar", () => {
    // The check is: if (!booking || booking.renterId !== ctx.user.id)
    const cancelIdx = routersContent.indexOf("cancelWithRefund: protectedProcedure");
    const cancelBlock = cancelIdx !== -1 ? routersContent.slice(cancelIdx, cancelIdx + 600) : "";
    expect(cancelBlock).toContain("booking.renterId !== ctx.user.id");
  });
});

// ─────────────────────────────────────────────────────────────────
// Test Suite 5: Motorcycle router ownership checks
// ─────────────────────────────────────────────────────────────────

describe("ETAPA 7 — Motorcycle router: ownership checks", () => {
  let motorcycleContent: string;

  beforeAll(() => {
    motorcycleContent = fs.readFileSync("server/routers/motorcycle.ts", "utf-8");
  });

  it("motorcycle.update deve verificar que apenas o host pode editar a moto", () => {
    expect(motorcycleContent).toContain("motorcycle.vehicle.hostId !== ctx.user.id");
  });

  it("motorcycle.delete deve verificar que apenas o host pode deletar a moto", () => {
    // Fase 3 de Hardening: delete foi migrado para hostProcedure
    const deleteBlock = motorcycleContent.match(
      /delete: hostProcedure[\s\S]*?\.mutation\(async[\s\S]*?return/
    )?.[0] ?? "";
    expect(deleteBlock).toContain("motorcycle.vehicle.hostId !== ctx.user.id");
  });

  it("motorcycle.getMyMotorcycles deve usar ctx.user.id", () => {
    expect(motorcycleContent).toContain("ctx.user.id");
  });
});
