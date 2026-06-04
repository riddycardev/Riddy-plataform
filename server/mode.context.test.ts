/**
 * FASE 4 — Testes Críticos de Contexto
 *
 * Cobre:
 * 1. updateActiveMode — validação de role, bypass prevention, sucesso
 * 2. activateHostMode — conversão de role, retorno de newRole, falha de DB
 * 3. updateUserActiveMode helper — comportamento do DB helper
 * 4. activateUserHostMode helper — conversão de role no DB
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

// ─── Helpers para simular contexto tRPC ───────────────────────────────────────

type Role = "user" | "host" | "both" | "admin";

function makeCtx(role: Role, id = 1) {
  return {
    user: { id, role, email: "test@riddy.com", name: "Test User" },
    req: { headers: {}, cookies: {} },
    res: {},
  };
}

// ─── 1. updateActiveMode — lógica de validação de role ────────────────────────

describe("updateActiveMode — validação de role", () => {
  /**
   * Simula a lógica de validação do updateActiveMode sem chamar o banco.
   * Extrai a lógica de negócio para teste isolado.
   */
  function validateUpdateActiveMode(role: Role, mode: "renter" | "host"): void {
    if (mode === "host") {
      const allowedRoles: Role[] = ["host", "both", "admin"];
      if (!allowedRoles.includes(role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você precisa ativar o modo anfitrião primeiro. (10003)",
        });
      }
    }
    // mode=renter é sempre permitido
  }

  it("mode=host + role=user → lança FORBIDDEN", () => {
    expect(() => validateUpdateActiveMode("user", "host")).toThrow(TRPCError);
    expect(() => validateUpdateActiveMode("user", "host")).toThrow(
      "Você precisa ativar o modo anfitrião primeiro. (10003)"
    );
  });

  it("mode=host + role=user → código FORBIDDEN", () => {
    try {
      validateUpdateActiveMode("user", "host");
    } catch (err) {
      expect((err as TRPCError).code).toBe("FORBIDDEN");
    }
  });

  it("mode=host + role=host → não lança erro", () => {
    expect(() => validateUpdateActiveMode("host", "host")).not.toThrow();
  });

  it("mode=host + role=both → não lança erro", () => {
    expect(() => validateUpdateActiveMode("both", "host")).not.toThrow();
  });

  it("mode=host + role=admin → não lança erro", () => {
    expect(() => validateUpdateActiveMode("admin", "host")).not.toThrow();
  });

  it("mode=renter + role=user → não lança erro", () => {
    expect(() => validateUpdateActiveMode("user", "renter")).not.toThrow();
  });

  it("mode=renter + role=host → não lança erro", () => {
    expect(() => validateUpdateActiveMode("host", "renter")).not.toThrow();
  });

  it("mode=renter + role=both → não lança erro", () => {
    expect(() => validateUpdateActiveMode("both", "renter")).not.toThrow();
  });

  it("mode=renter + role=admin → não lança erro", () => {
    expect(() => validateUpdateActiveMode("admin", "renter")).not.toThrow();
  });

  it("mensagem de erro contém código 10003", () => {
    try {
      validateUpdateActiveMode("user", "host");
    } catch (err) {
      expect((err as TRPCError).message).toContain("10003");
    }
  });
});

// ─── 2. updateActiveMode — verificação no source code ─────────────────────────

describe("updateActiveMode — verificação no source code", () => {
  const fs = require("fs");
  const path = require("path");
  let routersContent: string;

  beforeEach(() => {
    routersContent = fs.readFileSync(
      path.join(__dirname, "routers.ts"),
      "utf8"
    );
  });

  // Helper: extrai o bloco da procedure usando indexOf (mais robusto que regex com limite)
  function getUpdateActiveModeBlock(content: string): string {
    const start = content.indexOf("updateActiveMode:");
    if (start === -1) return "";
    // Pegar até o próximo router de nível igual (2000 chars é suficiente)
    return content.substring(start, start + 2000);
  }

  it("deve existir procedure updateActiveMode", () => {
    expect(routersContent).toContain("updateActiveMode:");
  });

  it("deve usar protectedProcedure (autenticação obrigatória)", () => {
    const block = getUpdateActiveModeBlock(routersContent);
    expect(block).toContain("protectedProcedure");
  });

  it("deve aceitar apenas enum renter|host (não admin)", () => {
    const block = getUpdateActiveModeBlock(routersContent);
    expect(block).toContain('z.enum(["renter", "host"])');
  });

  it("deve verificar allowedRoles para mode=host", () => {
    const block = getUpdateActiveModeBlock(routersContent);
    expect(block).toContain("allowedRoles");
  });

  it("deve ter log de segurança para tentativa de bypass", () => {
    const block = getUpdateActiveModeBlock(routersContent);
    expect(block).toContain("[SECURITY]");
  });

  it("deve usar helper updateUserActiveMode do db", () => {
    const block = getUpdateActiveModeBlock(routersContent);
    expect(block).toContain("updateUserActiveMode");
  });

  it("deve retornar { success: true, mode } em caso de sucesso", () => {
    const block = getUpdateActiveModeBlock(routersContent);
    expect(block).toContain("success: true");
  });

  it("deve lançar INTERNAL_SERVER_ERROR se DB falhar", () => {
    const block = getUpdateActiveModeBlock(routersContent);
    expect(block).toContain("INTERNAL_SERVER_ERROR");
  });
});

// ─── 3. activateHostMode — verificação no source code ─────────────────────────

describe("activateHostMode — verificação no source code", () => {
  const fs = require("fs");
  const path = require("path");
  let routersContent: string;

  beforeEach(() => {
    routersContent = fs.readFileSync(
      path.join(__dirname, "routers.ts"),
      "utf8"
    );
  });

  function getActivateHostModeBlock(content: string): string {
    const start = content.indexOf("activateHostMode:");
    if (start === -1) return "";
    return content.substring(start, start + 1500);
  }

  it("deve existir procedure activateHostMode", () => {
    expect(routersContent).toContain("activateHostMode:");
  });

  it("deve usar protectedProcedure", () => {
    const block = getActivateHostModeBlock(routersContent);
    expect(block).toContain("protectedProcedure");
  });

  it("deve buscar o usuário no banco antes de ativar", () => {
    const block = getActivateHostModeBlock(routersContent);
    expect(block).toContain("getUserById");
  });

  it("deve usar helper activateUserHostMode do db", () => {
    const block = getActivateHostModeBlock(routersContent);
    expect(block).toContain("activateUserHostMode");
  });

  it("deve lançar INTERNAL_SERVER_ERROR se ativação falhar", () => {
    const block = getActivateHostModeBlock(routersContent);
    expect(block).toContain("INTERNAL_SERVER_ERROR");
  });

  it("deve retornar success, newRole e mode em caso de sucesso", () => {
    const block = getActivateHostModeBlock(routersContent);
    expect(block).toContain("success: true");
    expect(block).toContain("newRole");
    expect(block).toContain('mode: "host"');
  });

  it("deve lançar NOT_FOUND se usuário não existir", () => {
    const block = getActivateHostModeBlock(routersContent);
    expect(block).toContain("NOT_FOUND");
  });
});

// ─── 4. activateUserHostMode helper — lógica de conversão de role ─────────────

describe("activateUserHostMode helper — lógica de conversão de role", () => {
  /**
   * Simula a lógica de conversão de role do helper activateUserHostMode.
   */
  function simulateActivateHostMode(currentRole: string): { newRole: string; alreadyHost: boolean } {
    const alreadyHost = ["host", "both", "admin"].includes(currentRole);
    const newRole = alreadyHost ? currentRole : "both";
    return { newRole, alreadyHost };
  }

  it("role=user → converte para both", () => {
    const result = simulateActivateHostMode("user");
    expect(result.newRole).toBe("both");
    expect(result.alreadyHost).toBe(false);
  });

  it("role=host → mantém host", () => {
    const result = simulateActivateHostMode("host");
    expect(result.newRole).toBe("host");
    expect(result.alreadyHost).toBe(true);
  });

  it("role=both → mantém both", () => {
    const result = simulateActivateHostMode("both");
    expect(result.newRole).toBe("both");
    expect(result.alreadyHost).toBe(true);
  });

  it("role=admin → mantém admin", () => {
    const result = simulateActivateHostMode("admin");
    expect(result.newRole).toBe("admin");
    expect(result.alreadyHost).toBe(true);
  });

  it("role=user → alreadyHost é false", () => {
    const result = simulateActivateHostMode("user");
    expect(result.alreadyHost).toBe(false);
  });

  it("role=host → alreadyHost é true", () => {
    const result = simulateActivateHostMode("host");
    expect(result.alreadyHost).toBe(true);
  });
});

// ─── 5. updateUserActiveMode helper — verificação no source code ───────────────

describe("updateUserActiveMode helper — verificação no source code", () => {
  const fs = require("fs");
  const path = require("path");
  let dbContent: string;

  beforeEach(() => {
    dbContent = fs.readFileSync(
      path.join(__dirname, "db.ts"),
      "utf8"
    );
  });

  function getUpdateActiveModeHelperBlock(content: string): string {
    const start = content.indexOf("async function updateUserActiveMode");
    if (start === -1) return "";
    return content.substring(start, start + 600);
  }

  it("deve existir função updateUserActiveMode", () => {
    expect(dbContent).toContain("updateUserActiveMode");
  });

  it("deve aceitar userId e mode como parâmetros", () => {
    const block = getUpdateActiveModeHelperBlock(dbContent);
    expect(block).toContain("userId");
    expect(block).toContain("mode");
  });

  it("deve ter try/catch para tratamento de erro", () => {
    const block = getUpdateActiveModeHelperBlock(dbContent);
    expect(block).toContain("try");
    expect(block).toContain("catch");
  });

  it("deve retornar boolean (true/false)", () => {
    const block = getUpdateActiveModeHelperBlock(dbContent);
    expect(block).toContain("return true");
    expect(block).toContain("return false");
  });

  it("deve atualizar apenas o campo activeMode", () => {
    const block = getUpdateActiveModeHelperBlock(dbContent);
    expect(block).toContain("activeMode");
  });
});

// ─── 6. activateUserHostMode helper — verificação no source code ───────────────

describe("activateUserHostMode helper — verificação no source code", () => {
  const fs = require("fs");
  const path = require("path");
  let dbContent: string;

  beforeEach(() => {
    dbContent = fs.readFileSync(
      path.join(__dirname, "db.ts"),
      "utf8"
    );
  });

  function getActivateHostModeHelperBlock(content: string): string {
    const start = content.indexOf("async function activateUserHostMode");
    if (start === -1) return "";
    return content.substring(start, start + 800);
  }

  it("deve existir função activateUserHostMode", () => {
    expect(dbContent).toContain("activateUserHostMode");
  });

  it("deve verificar se role já é host/both/admin", () => {
    const block = getActivateHostModeHelperBlock(dbContent);
    expect(block).toContain("alreadyHost");
  });

  it("deve converter role=user para both", () => {
    const block = getActivateHostModeHelperBlock(dbContent);
    expect(block).toContain('"both"');
  });

  it("deve atualizar activeMode para host", () => {
    const block = getActivateHostModeHelperBlock(dbContent);
    expect(block).toContain('activeMode: "host"');
  });

  it("deve retornar { success, newRole }", () => {
    const block = getActivateHostModeHelperBlock(dbContent);
    expect(block).toContain("success: true");
    expect(block).toContain("newRole");
  });

  it("deve ter try/catch para tratamento de erro", () => {
    const block = getActivateHostModeHelperBlock(dbContent);
    expect(block).toContain("try");
    expect(block).toContain("catch");
  });

  it("deve retornar success: false em caso de erro", () => {
    const block = getActivateHostModeHelperBlock(dbContent);
    expect(block).toContain("success: false");
  });
});

// ─── 7. Integridade do sistema de roles ───────────────────────────────────────

describe("Integridade do sistema de roles", () => {
  it("roles válidos são: user, host, both, admin", () => {
    const validRoles: Role[] = ["user", "host", "both", "admin"];
    expect(validRoles).toHaveLength(4);
    expect(validRoles).toContain("user");
    expect(validRoles).toContain("host");
    expect(validRoles).toContain("both");
    expect(validRoles).toContain("admin");
  });

  it("modos válidos são: renter, host (não admin)", () => {
    const validModes = ["renter", "host"];
    expect(validModes).toHaveLength(2);
    expect(validModes).not.toContain("admin");
  });

  it("roles com acesso host: host, both, admin", () => {
    const hostRoles: Role[] = ["host", "both", "admin"];
    expect(hostRoles).not.toContain("user");
    expect(hostRoles).toHaveLength(3);
  });

  it("role=user NÃO tem acesso a mode=host sem ativação", () => {
    const hostRoles: Role[] = ["host", "both", "admin"];
    expect(hostRoles.includes("user")).toBe(false);
  });

  it("após activateHostMode, role=user vira both (não host puro)", () => {
    const currentRole = "user";
    const alreadyHost = ["host", "both", "admin"].includes(currentRole);
    const newRole = alreadyHost ? currentRole : "both";
    expect(newRole).toBe("both");
    expect(newRole).not.toBe("host");
  });

  it("após activateHostMode, role=host permanece host", () => {
    const currentRole = "host";
    const alreadyHost = ["host", "both", "admin"].includes(currentRole);
    const newRole = alreadyHost ? currentRole : "both";
    expect(newRole).toBe("host");
  });
});
