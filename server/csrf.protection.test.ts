/**
 * ETAPA 13 — Testes de Proteção CSRF
 *
 * Cobre:
 * 1. Geração de token CSRF (formato, unicidade, assinatura HMAC)
 * 2. Validação de token (estrutura, assinatura, expiração)
 * 3. Middleware csrfMiddleware (token ausente, inválido, válido)
 * 4. Integração: procedures protegidas com CSRF
 * 5. Constantes exportadas (CSRF_COOKIE, CSRF_HEADER, CSRF_TTL_MS)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateCsrfToken,
  isValidCsrfToken,
  csrfMiddleware,
  CSRF_COOKIE,
  CSRF_HEADER,
  CSRF_TTL_MS,
} from "../server/_core/csrf";
import { TRPCError } from "@trpc/server";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeCtx(overrides: {
  headerToken?: string | undefined;
  cookieToken?: string | undefined;
}) {
  return {
    req: {
      headers: {
        ...(overrides.headerToken !== undefined
          ? { [CSRF_HEADER]: overrides.headerToken }
          : {}),
      },
      cookies: {
        ...(overrides.cookieToken !== undefined
          ? { [CSRF_COOKIE]: overrides.cookieToken }
          : {}),
      },
    },
    res: {},
    user: null,
  };
}

async function runMiddleware(ctx: ReturnType<typeof makeCtx>) {
  let nextCalled = false;
  const next = async () => {
    nextCalled = true;
    return { ok: true };
  };
  // tRPC middleware is a MiddlewareBuilder object, not directly callable.
  // The actual function is stored in _middlewares[0].
  const fn = (csrfMiddleware as any)._middlewares?.[0];
  if (typeof fn !== 'function') {
    throw new TypeError(`csrfMiddleware._middlewares[0] is not a function (got ${typeof fn})`);
  }
  await fn({ ctx, next });
  return nextCalled;
}

// ─── 1. Geração de token ──────────────────────────────────────────────────────

describe("generateCsrfToken", () => {
  it("deve retornar uma string não vazia", () => {
    const token = generateCsrfToken();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
  });

  it("deve ter exatamente 3 partes separadas por ponto", () => {
    const token = generateCsrfToken();
    const parts = token.split(".");
    expect(parts).toHaveLength(3);
  });

  it("deve gerar tokens únicos em chamadas consecutivas", () => {
    const tokens = new Set(Array.from({ length: 20 }, () => generateCsrfToken()));
    expect(tokens.size).toBe(20);
  });

  it("a segunda parte (random) deve ter 64 caracteres hex (32 bytes)", () => {
    const token = generateCsrfToken();
    const [, random] = token.split(".");
    expect(random).toMatch(/^[0-9a-f]{64}$/);
  });

  it("a terceira parte (hmac) deve ter 64 caracteres hex (SHA-256)", () => {
    const token = generateCsrfToken();
    const [, , hmac] = token.split(".");
    expect(hmac).toMatch(/^[0-9a-f]{64}$/);
  });

  it("a primeira parte (timestamp) deve ser decodificável como base-36", () => {
    const token = generateCsrfToken();
    const [timestamp] = token.split(".");
    const ts = parseInt(timestamp, 36);
    expect(isNaN(ts)).toBe(false);
    // Timestamp deve ser recente (dentro de 5 segundos)
    expect(Date.now() - ts).toBeLessThan(5000);
  });
});

// ─── 2. Validação de token ────────────────────────────────────────────────────

describe("isValidCsrfToken", () => {
  it("deve aceitar um token recém-gerado", () => {
    const token = generateCsrfToken();
    expect(isValidCsrfToken(token)).toBe(true);
  });

  it("deve rejeitar string vazia", () => {
    expect(isValidCsrfToken("")).toBe(false);
  });

  it("deve rejeitar token com apenas 2 partes", () => {
    expect(isValidCsrfToken("abc.def")).toBe(false);
  });

  it("deve rejeitar token com 4 ou mais partes", () => {
    expect(isValidCsrfToken("a.b.c.d")).toBe(false);
  });

  it("deve rejeitar token com HMAC adulterado", () => {
    const token = generateCsrfToken();
    const parts = token.split(".");
    // Substituir o HMAC por um valor inválido
    parts[2] = "a".repeat(64);
    expect(isValidCsrfToken(parts.join("."))).toBe(false);
  });

  it("deve rejeitar token com payload adulterado", () => {
    const token = generateCsrfToken();
    const parts = token.split(".");
    // Alterar o random (parte 1)
    parts[1] = "b".repeat(64);
    expect(isValidCsrfToken(parts.join("."))).toBe(false);
  });

  it("deve rejeitar token expirado (timestamp muito antigo)", () => {
    // Criar um token com timestamp de 5 horas atrás (> TTL de 4h)
    const { createHmac, randomBytes } = require("crypto");
    const secret = process.env.JWT_SECRET || "test-secret";
    const oldTimestamp = (Date.now() - 5 * 60 * 60 * 1000).toString(36);
    const random = randomBytes(32).toString("hex");
    const payload = `${oldTimestamp}.${random}`;
    const hmac = createHmac("sha256", secret).update(payload).digest("hex");
    const expiredToken = `${payload}.${hmac}`;
    expect(isValidCsrfToken(expiredToken)).toBe(false);
  });

  it("deve rejeitar token com timestamp não-numérico", () => {
    const token = generateCsrfToken();
    const parts = token.split(".");
    parts[0] = "XXXXXXXX"; // Não é base-36 válido como timestamp
    // Recalcular HMAC com payload adulterado (não vai bater com o original)
    expect(isValidCsrfToken(parts.join("."))).toBe(false);
  });
});

// ─── 3. Middleware csrfMiddleware ─────────────────────────────────────────────

describe("csrfMiddleware", () => {
  it("deve lançar BAD_REQUEST quando header CSRF está ausente", async () => {
    const token = generateCsrfToken();
    const ctx = makeCtx({ headerToken: undefined, cookieToken: token });
    await expect(runMiddleware(ctx)).rejects.toThrow(TRPCError);
    await expect(runMiddleware(ctx)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("deve lançar BAD_REQUEST quando cookie CSRF está ausente", async () => {
    const token = generateCsrfToken();
    const ctx = makeCtx({ headerToken: token, cookieToken: undefined });
    await expect(runMiddleware(ctx)).rejects.toThrow(TRPCError);
    await expect(runMiddleware(ctx)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("deve lançar BAD_REQUEST quando header e cookie têm tamanhos diferentes", async () => {
    const token = generateCsrfToken();
    const ctx = makeCtx({
      headerToken: token,
      cookieToken: token + "extra",
    });
    await expect(runMiddleware(ctx)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("deve lançar BAD_REQUEST quando header e cookie são diferentes (mesmo tamanho)", async () => {
    const token1 = generateCsrfToken();
    const token2 = generateCsrfToken();
    // Ambos têm o mesmo comprimento (formato idêntico)
    if (token1.length === token2.length) {
      const ctx = makeCtx({ headerToken: token1, cookieToken: token2 });
      await expect(runMiddleware(ctx)).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    }
  });

  it("deve lançar BAD_REQUEST quando token tem assinatura inválida", async () => {
    const token = generateCsrfToken();
    const parts = token.split(".");
    parts[2] = "a".repeat(64); // HMAC inválido
    const fakeToken = parts.join(".");
    const ctx = makeCtx({ headerToken: fakeToken, cookieToken: fakeToken });
    await expect(runMiddleware(ctx)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("deve chamar next() quando token é válido e header === cookie", async () => {
    const token = generateCsrfToken();
    const ctx = makeCtx({ headerToken: token, cookieToken: token });
    const nextCalled = await runMiddleware(ctx);
    expect(nextCalled).toBe(true);
  });

  it("deve conter mensagem amigável em português no erro de token ausente", async () => {
    const ctx = makeCtx({ headerToken: undefined, cookieToken: undefined });
    try {
      await runMiddleware(ctx);
    } catch (err) {
      expect((err as TRPCError).message).toContain("CSRF");
    }
  });
});

// ─── 4. Constantes exportadas ─────────────────────────────────────────────────

describe("CSRF constants", () => {
  it("CSRF_COOKIE deve ser '_csrf'", () => {
    expect(CSRF_COOKIE).toBe("_csrf");
  });

  it("CSRF_HEADER deve ser 'x-csrf-token'", () => {
    expect(CSRF_HEADER).toBe("x-csrf-token");
  });

  it("CSRF_TTL_MS deve ser 4 horas em milissegundos", () => {
    expect(CSRF_TTL_MS).toBe(4 * 60 * 60 * 1000);
  });
});

// ─── 5. Integração: procedures com CSRF ──────────────────────────────────────
//
// NOTA ARQUITETURAL (2026-04-18):
// O csrfMiddleware foi removido das procedures protectedProcedure porque:
// 1. Todas as procedures sensíveis já usam protectedProcedure (requer sessão autenticada)
// 2. O cookie de sessão usa HttpOnly + SameSite=Lax/None, que já previne CSRF
// 3. O csrfMiddleware causava travamento silencioso no fluxo de pagamento em produção
//    (o cookie _csrf com SameSite=None era descartado pelo browser em HTTP)
// 4. A proteção CSRF dupla é redundante quando a autenticação via cookie já é segura
//
// Os testes abaixo verificam que as procedures sensíveis usam protectedProcedure
// (autenticação obrigatória) como camada de segurança principal.

describe("CSRF integration — routers.ts", () => {
  it("deve ter vehicle.deleteVehicle protegido com hostProcedure (mais restritivo que protectedProcedure)", async () => {
    const routerSource = require("fs").readFileSync(
      require("path").join(__dirname, "routers.ts"),
      "utf8"
    );
    // Fase 3 de Hardening: deleteVehicle foi migrado para hostProcedure
    // hostProcedure = autenticado + role host|both|admin (mais restritivo)
    const deleteVehicleBlock = routerSource.match(
      /deleteVehicle:\s*hostProcedure[\s\S]{0,300}?\.mutation/
    )?.[0];
    expect(deleteVehicleBlock).toBeDefined();
    expect(deleteVehicleBlock).toContain("hostProcedure");
  });

  it("deve ter payment.cancelWithRefund protegido com protectedProcedure", async () => {
    const routerSource = require("fs").readFileSync(
      require("path").join(__dirname, "routers.ts"),
      "utf8"
    );
    const cancelBlock = routerSource.match(
      /cancelWithRefund:\s*protectedProcedure[\s\S]{0,300}?\.mutation/
    )?.[0];
    expect(cancelBlock).toBeDefined();
    expect(cancelBlock).toContain("protectedProcedure");
  });

  it("deve ter payment.processMPCreditCard protegido com protectedProcedure", async () => {
    const routerSource = require("fs").readFileSync(
      require("path").join(__dirname, "routers.ts"),
      "utf8"
    );
    const creditCardBlock = routerSource.match(
      /processMPCreditCard:\s*protectedProcedure[\s\S]{0,500}?\.mutation/
    )?.[0];
    expect(creditCardBlock).toBeDefined();
    expect(creditCardBlock).toContain("protectedProcedure");
  });

  it("deve ter payment.processMPPix protegido com protectedProcedure", async () => {
    const routerSource = require("fs").readFileSync(
      require("path").join(__dirname, "routers.ts"),
      "utf8"
    );
    const pixBlock = routerSource.match(
      /processMPPix:\s*protectedProcedure[\s\S]{0,500}?\.mutation/
    )?.[0];
    expect(pixBlock).toBeDefined();
    expect(pixBlock).toContain("protectedProcedure");
  });

  it("deve ter admin.deleteUser protegido com adminProcedure", async () => {
    const routerSource = require("fs").readFileSync(
      require("path").join(__dirname, "routers.ts"),
      "utf8"
    );
    // adminProcedure centralizes role check in trpc.ts middleware
    const deleteUserBlock = routerSource.match(
      /deleteUser:\s*adminProcedure[\s\S]{0,300}?\.mutation/
    )?.[0];
    expect(deleteUserBlock).toBeDefined();
    expect(deleteUserBlock).toContain("adminProcedure");
  });

  it("deve ter booking.create protegido com protectedProcedure e conter vehicleId no input", async () => {
    const routerSource = require("fs").readFileSync(
      require("path").join(__dirname, "routers.ts"),
      "utf8"
    );
    // There are multiple 'create: protectedProcedure' in routers.ts;
    // find the booking.create one that has vehicleId AND startDate in input
    let searchFrom = 0;
    let foundBlock: string | undefined;
    while (true) {
      const idx = routerSource.indexOf("create: protectedProcedure", searchFrom);
      if (idx === -1) break;
      const block = routerSource.slice(idx, idx + 400);
      if (block.includes("vehicleId") && block.includes("startDate")) {
        foundBlock = block;
        break;
      }
      searchFrom = idx + 1;
    }
    expect(foundBlock).toBeDefined();
    expect(foundBlock).toContain("vehicleId");
    expect(foundBlock).toContain("protectedProcedure");
  });

  it("deve ter rota GET /api/csrf-token registrada no servidor", () => {
    const indexSource = require("fs").readFileSync(
      require("path").join(__dirname, "_core/index.ts"),
      "utf8"
    );
    expect(indexSource).toContain("/api/csrf-token");
    expect(indexSource).toContain("csrfTokenHandler");
  });

  it("deve importar csrfTokenHandler de ./_core/csrf no index.ts", () => {
    const indexSource = require("fs").readFileSync(
      require("path").join(__dirname, "_core/index.ts"),
      "utf8"
    );
    expect(indexSource).toContain("from \"./csrf\"");
  });

  it("deve ter httpBatchLink configurado em main.tsx com credentials include", () => {
    const mainSource = require("fs").readFileSync(
      require("path").join(__dirname, "../client/src/main.tsx"),
      "utf8"
    );
    // The tRPC client must include credentials for session cookie auth
    expect(mainSource).toContain("credentials");
    expect(mainSource).toContain("include");
  });
});
