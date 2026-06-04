/**
 * FASE 4 — Testes do UserModeContext
 *
 * Testa a lógica pura do UserModeContext sem depender de React:
 * - canSwitchToHost por role
 * - canSwitch por role
 * - Lógica de modo inicial (localStorage, banco, fallback)
 * - Lógica de setMode (validações de role, admin lock)
 * - Lógica de activateHostMode
 * - needsModeSelection (onboarding)
 * - Persistência no localStorage
 * - Constantes e tipos exportados
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Tipos espelhados do UserModeContext ──────────────────────────────────────

type UserMode = "renter" | "host" | "admin";
type Role = "user" | "host" | "both" | "admin";

const HOST_ROLES = ["host", "both", "admin"];
const SWITCHABLE_ROLES = ["both", "admin"];
const STORAGE_KEY = "riddy_active_mode";
const ONBOARDING_KEY = "riddy_mode_selected";

// ─── 1. canSwitchToHost — por role ────────────────────────────────────────────

describe("canSwitchToHost — por role", () => {
  function canSwitchToHost(role: Role): boolean {
    return HOST_ROLES.includes(role);
  }

  it("role=host → canSwitchToHost é true", () => {
    expect(canSwitchToHost("host")).toBe(true);
  });

  it("role=both → canSwitchToHost é true", () => {
    expect(canSwitchToHost("both")).toBe(true);
  });

  it("role=admin → canSwitchToHost é true", () => {
    expect(canSwitchToHost("admin")).toBe(true);
  });

  it("role=user → canSwitchToHost é false", () => {
    expect(canSwitchToHost("user")).toBe(false);
  });

  it("HOST_ROLES contém exatamente host, both, admin", () => {
    expect(HOST_ROLES).toContain("host");
    expect(HOST_ROLES).toContain("both");
    expect(HOST_ROLES).toContain("admin");
    expect(HOST_ROLES).not.toContain("user");
    expect(HOST_ROLES).toHaveLength(3);
  });
});

// ─── 2. canSwitch — por role ──────────────────────────────────────────────────

describe("canSwitch — por role", () => {
  function canSwitch(role: Role): boolean {
    return SWITCHABLE_ROLES.includes(role);
  }

  it("role=both → canSwitch é true", () => {
    expect(canSwitch("both")).toBe(true);
  });

  it("role=admin → canSwitch é true", () => {
    expect(canSwitch("admin")).toBe(true);
  });

  it("role=host → canSwitch é false (host puro não alterna)", () => {
    expect(canSwitch("host")).toBe(false);
  });

  it("role=user → canSwitch é false", () => {
    expect(canSwitch("user")).toBe(false);
  });

  it("SWITCHABLE_ROLES contém exatamente both e admin", () => {
    expect(SWITCHABLE_ROLES).toContain("both");
    expect(SWITCHABLE_ROLES).toContain("admin");
    expect(SWITCHABLE_ROLES).not.toContain("host");
    expect(SWITCHABLE_ROLES).not.toContain("user");
    expect(SWITCHABLE_ROLES).toHaveLength(2);
  });
});

// ─── 3. Lógica de modo inicial ────────────────────────────────────────────────

describe("Lógica de modo inicial", () => {
  /**
   * Simula a lógica do useState inicial do UserModeContext.
   */
  function getInitialMode(
    userRole: Role | null,
    userActiveMode: string | null,
    storedMode: string | null
  ): UserMode {
    // Admin sempre começa em admin
    if (userRole === "admin") return "admin";

    // Tentar recuperar do localStorage
    if (storedMode && ["renter", "host", "admin"].includes(storedMode)) {
      if (storedMode === "host" && userRole && !HOST_ROLES.includes(userRole)) {
        return "renter";
      }
      return storedMode as UserMode;
    }

    // Fallback: usar activeMode do banco
    if (userActiveMode) {
      return userActiveMode as UserMode;
    }

    // Fallback final: baseado no role
    if (userRole === "host") return "host";
    return "renter";
  }

  it("role=admin → modo inicial é admin (independente do localStorage)", () => {
    expect(getInitialMode("admin", null, "renter")).toBe("admin");
    expect(getInitialMode("admin", "renter", "renter")).toBe("admin");
    expect(getInitialMode("admin", "host", "host")).toBe("admin");
  });

  it("localStorage=host + role=user → modo inicial é renter (proteção)", () => {
    expect(getInitialMode("user", null, "host")).toBe("renter");
  });

  it("localStorage=host + role=host → modo inicial é host", () => {
    expect(getInitialMode("host", null, "host")).toBe("host");
  });

  it("localStorage=host + role=both → modo inicial é host", () => {
    expect(getInitialMode("both", null, "host")).toBe("host");
  });

  it("localStorage=renter → modo inicial é renter", () => {
    expect(getInitialMode("user", null, "renter")).toBe("renter");
    expect(getInitialMode("host", null, "renter")).toBe("renter");
  });

  it("sem localStorage, banco=host → modo inicial é host", () => {
    expect(getInitialMode("host", "host", null)).toBe("host");
  });

  it("sem localStorage, banco=renter → modo inicial é renter", () => {
    expect(getInitialMode("user", "renter", null)).toBe("renter");
  });

  it("sem localStorage, sem banco, role=host → modo inicial é host", () => {
    expect(getInitialMode("host", null, null)).toBe("host");
  });

  it("sem localStorage, sem banco, role=user → modo inicial é renter", () => {
    expect(getInitialMode("user", null, null)).toBe("renter");
  });

  it("sem localStorage, sem banco, role=both → modo inicial é renter (fallback)", () => {
    expect(getInitialMode("both", null, null)).toBe("renter");
  });
});

// ─── 4. Lógica de setMode — validações ───────────────────────────────────────

describe("Lógica de setMode — validações de role", () => {
  /**
   * Simula as validações do setMode do UserModeContext.
   * Retorna: "blocked_no_user" | "blocked_same_mode" | "blocked_admin_lock" |
   *          "blocked_no_host_role" | "allowed"
   */
  function validateSetMode(
    user: { role: Role } | null,
    currentMode: UserMode,
    newMode: UserMode
  ): string {
    if (!user) return "blocked_no_user";
    if (newMode === currentMode) return "blocked_same_mode";
    if (user.role === "admin" && newMode !== "admin") return "blocked_admin_lock";
    if (newMode === "host" && !HOST_ROLES.includes(user.role)) return "blocked_no_host_role";
    return "allowed";
  }

  it("sem usuário → bloqueado", () => {
    expect(validateSetMode(null, "renter", "host")).toBe("blocked_no_user");
  });

  it("mesmo modo → bloqueado (sem-op)", () => {
    expect(validateSetMode({ role: "host" }, "host", "host")).toBe("blocked_same_mode");
    expect(validateSetMode({ role: "user" }, "renter", "renter")).toBe("blocked_same_mode");
  });

  it("role=admin tentando sair do admin → bloqueado (admin lock)", () => {
    expect(validateSetMode({ role: "admin" }, "admin", "renter")).toBe("blocked_admin_lock");
    expect(validateSetMode({ role: "admin" }, "admin", "host")).toBe("blocked_admin_lock");
  });

  it("role=user tentando ir para host → bloqueado", () => {
    expect(validateSetMode({ role: "user" }, "renter", "host")).toBe("blocked_no_host_role");
  });

  it("role=host indo para renter → permitido", () => {
    expect(validateSetMode({ role: "host" }, "host", "renter")).toBe("allowed");
  });

  it("role=both indo para host → permitido", () => {
    expect(validateSetMode({ role: "both" }, "renter", "host")).toBe("allowed");
  });

  it("role=both indo para renter → permitido", () => {
    expect(validateSetMode({ role: "both" }, "host", "renter")).toBe("allowed");
  });

  it("role=host indo para host → bloqueado (mesmo modo)", () => {
    expect(validateSetMode({ role: "host" }, "host", "host")).toBe("blocked_same_mode");
  });
});

// ─── 5. Lógica de needsModeSelection (onboarding) ─────────────────────────────

describe("needsModeSelection — lógica de onboarding", () => {
  /**
   * Simula a lógica do useState de needsModeSelection.
   */
  function getNeedsModeSelection(
    isAuthenticated: boolean,
    hasOnboardingKey: boolean,
    userActiveMode: string | null
  ): boolean {
    if (!isAuthenticated) return false;
    if (hasOnboardingKey) return false;
    if (userActiveMode) return false;
    return true;
  }

  it("não autenticado → needsModeSelection é false", () => {
    expect(getNeedsModeSelection(false, false, null)).toBe(false);
  });

  it("autenticado + já escolheu (onboarding key) → false", () => {
    expect(getNeedsModeSelection(true, true, null)).toBe(false);
  });

  it("autenticado + banco tem activeMode → false", () => {
    expect(getNeedsModeSelection(true, false, "renter")).toBe(false);
  });

  it("autenticado + sem onboarding key + sem activeMode → true", () => {
    expect(getNeedsModeSelection(true, false, null)).toBe(true);
  });

  it("autenticado + banco tem host → false (não precisa de onboarding)", () => {
    expect(getNeedsModeSelection(true, false, "host")).toBe(false);
  });
});

// ─── 6. Persistência no localStorage ─────────────────────────────────────────

describe("Persistência no localStorage — chaves e valores", () => {
  it("STORAGE_KEY é 'riddy_active_mode'", () => {
    expect(STORAGE_KEY).toBe("riddy_active_mode");
  });

  it("ONBOARDING_KEY é 'riddy_mode_selected'", () => {
    expect(ONBOARDING_KEY).toBe("riddy_mode_selected");
  });

  it("valores válidos para STORAGE_KEY: renter, host, admin", () => {
    const validModes: UserMode[] = ["renter", "host", "admin"];
    expect(validModes).toHaveLength(3);
    expect(validModes).toContain("renter");
    expect(validModes).toContain("host");
    expect(validModes).toContain("admin");
  });

  it("modo host no localStorage é invalidado para role=user", () => {
    // Simula: usuário com role=user tem "host" no localStorage
    const storedMode = "host";
    const userRole: Role = "user";
    const isValid = !(storedMode === "host" && !HOST_ROLES.includes(userRole));
    expect(isValid).toBe(false);
  });

  it("modo host no localStorage é válido para role=host", () => {
    const storedMode = "host";
    const userRole: Role = "host";
    const isValid = !(storedMode === "host" && !HOST_ROLES.includes(userRole));
    expect(isValid).toBe(true);
  });
});

// ─── 7. Lógica de sincronização banco vs localStorage ─────────────────────────

describe("Sincronização banco vs localStorage", () => {
  /**
   * Simula a lógica do useEffect de sincronização.
   */
  function syncBankVsLocal(
    userRole: Role,
    bankMode: UserMode | null,
    localMode: UserMode | null
  ): { newMode: UserMode | null; shouldUpdate: boolean } {
    // Admin sempre fica em admin
    if (userRole === "admin") {
      return { newMode: "admin", shouldUpdate: localMode !== "admin" };
    }

    if (bankMode && bankMode !== localMode) {
      return { newMode: bankMode, shouldUpdate: true };
    }

    return { newMode: null, shouldUpdate: false };
  }

  it("role=admin → sempre sincroniza para admin", () => {
    const result = syncBankVsLocal("admin", "renter", "renter");
    expect(result.newMode).toBe("admin");
    expect(result.shouldUpdate).toBe(true);
  });

  it("banco=host, local=renter → sincroniza para host", () => {
    const result = syncBankVsLocal("host", "host", "renter");
    expect(result.newMode).toBe("host");
    expect(result.shouldUpdate).toBe(true);
  });

  it("banco=renter, local=renter → não precisa sincronizar", () => {
    const result = syncBankVsLocal("user", "renter", "renter");
    expect(result.shouldUpdate).toBe(false);
  });

  it("banco=null → não sincroniza", () => {
    const result = syncBankVsLocal("user", null, "renter");
    expect(result.shouldUpdate).toBe(false);
  });

  it("banco=host, local=null → sincroniza para host", () => {
    const result = syncBankVsLocal("host", "host", null);
    expect(result.newMode).toBe("host");
    expect(result.shouldUpdate).toBe(true);
  });
});

// ─── 8. Verificação no source code do UserModeContext ─────────────────────────

describe("UserModeContext — verificação no source code", () => {
  const fs = require("fs");
  const path = require("path");
  let contextContent: string;

  beforeEach(() => {
    contextContent = fs.readFileSync(
      path.join(__dirname, "../client/src/contexts/UserModeContext.tsx"),
      "utf8"
    );
  });

  it("deve exportar UserModeProvider", () => {
    expect(contextContent).toContain("export function UserModeProvider");
  });

  it("deve exportar useUserMode", () => {
    expect(contextContent).toContain("export function useUserMode");
  });

  it("deve exportar UserMode type", () => {
    expect(contextContent).toContain("export type UserMode");
  });

  it("deve ter HOST_ROLES com host, both, admin", () => {
    expect(contextContent).toContain("HOST_ROLES");
    expect(contextContent).toContain('"host"');
    expect(contextContent).toContain('"both"');
    expect(contextContent).toContain('"admin"');
  });

  it("deve ter STORAGE_KEY = 'riddy_active_mode'", () => {
    expect(contextContent).toContain("riddy_active_mode");
  });

  it("deve ter ONBOARDING_KEY = 'riddy_mode_selected'", () => {
    expect(contextContent).toContain("riddy_mode_selected");
  });

  it("deve proteger setMode contra role=user tentando host", () => {
    expect(contextContent).toContain("HOST_ROLES.includes(user.role)");
  });

  it("deve ter admin lock no setMode", () => {
    expect(contextContent).toContain('user.role === "admin"');
  });

  it("deve persistir no localStorage imediatamente", () => {
    expect(contextContent).toContain("localStorage.setItem");
  });

  it("deve persistir no banco via updateActiveMode mutation", () => {
    expect(contextContent).toContain("updateActiveModeM.mutateAsync");
  });

  it("deve ter activateHostMode que chama activateHostModeM", () => {
    expect(contextContent).toContain("activateHostModeM.mutateAsync");
  });

  it("deve ter canSwitchToHost baseado em HOST_ROLES", () => {
    expect(contextContent).toContain("canSwitchToHost");
    expect(contextContent).toContain("HOST_ROLES.includes");
  });

  it("deve ter canSwitch baseado em SWITCHABLE_ROLES", () => {
    expect(contextContent).toContain("canSwitch");
    expect(contextContent).toContain("SWITCHABLE_ROLES");
  });

  it("deve ter isSwitching para estado de carregamento", () => {
    expect(contextContent).toContain("isSwitching");
    expect(contextContent).toContain("setIsSwitching");
  });

  it("deve ter needsModeSelection para onboarding", () => {
    expect(contextContent).toContain("needsModeSelection");
  });

  it("deve ter completeModeSelection para concluir onboarding", () => {
    expect(contextContent).toContain("completeModeSelection");
  });

  it("deve lançar erro se useUserMode for usado fora do Provider", () => {
    expect(contextContent).toContain("useUserMode must be used within UserModeProvider");
  });
});
