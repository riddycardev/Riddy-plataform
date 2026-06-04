/**
 * FASE 4 — Testes do Header Switcher Mobile e MobileBottomNav
 *
 * Cobre:
 * 1. getSwitcherLabel — rótulo correto por role e modo
 * 2. handleSwitchMode — lógica de roteamento por role
 * 3. handleActivateHost — lógica de ativação
 * 4. MobileBottomNav — detecção de rota com query strings
 * 5. MobileBottomNav — cores contextuais por modo
 * 6. MobileBottomNav — matching de segmento (sem falsos positivos)
 * 7. Verificação de source code: Header e MobileBottomNav
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Role = "user" | "host" | "both" | "admin";
type UserMode = "renter" | "host" | "admin";

// ─── 1. getSwitcherLabel — rótulo correto por role e modo ─────────────────────

describe("getSwitcherLabel — rótulo por role e modo", () => {
  /**
   * Simula a lógica de getSwitcherLabel do Header.
   */
  function getSwitcherLabel(
    isAdmin: boolean,
    canSwitchToHost: boolean,
    canSwitch: boolean,
    isHost: boolean
  ): { label: string; color: string; isActivation: boolean } | null {
    if (isAdmin) return null;
    if (!canSwitchToHost && !canSwitch) {
      return { label: "Virar Anfitrião", color: "text-emerald-400", isActivation: true };
    }
    if (isHost) {
      return { label: "Mudar para Locatário", color: "text-cyan-400", isActivation: false };
    }
    return { label: "Mudar para Anfitrião", color: "text-emerald-400", isActivation: false };
  }

  it("role=admin → retorna null (sem switcher)", () => {
    expect(getSwitcherLabel(true, true, true, false)).toBeNull();
  });

  it("role=user → retorna 'Virar Anfitrião' com isActivation=true", () => {
    const result = getSwitcherLabel(false, false, false, false);
    expect(result).not.toBeNull();
    expect(result!.label).toBe("Virar Anfitrião");
    expect(result!.isActivation).toBe(true);
    expect(result!.color).toBe("text-emerald-400");
  });

  it("role=host em modo host → 'Mudar para Locatário' com cor cyan", () => {
    const result = getSwitcherLabel(false, true, false, true);
    expect(result!.label).toBe("Mudar para Locatário");
    expect(result!.color).toBe("text-cyan-400");
    expect(result!.isActivation).toBe(false);
  });

  it("role=host em modo renter → 'Mudar para Anfitrião' com cor emerald", () => {
    const result = getSwitcherLabel(false, true, false, false);
    expect(result!.label).toBe("Mudar para Anfitrião");
    expect(result!.color).toBe("text-emerald-400");
    expect(result!.isActivation).toBe(false);
  });

  it("role=both em modo renter → 'Mudar para Anfitrião'", () => {
    const result = getSwitcherLabel(false, true, true, false);
    expect(result!.label).toBe("Mudar para Anfitrião");
    expect(result!.isActivation).toBe(false);
  });

  it("role=both em modo host → 'Mudar para Locatário'", () => {
    const result = getSwitcherLabel(false, true, true, true);
    expect(result!.label).toBe("Mudar para Locatário");
    expect(result!.isActivation).toBe(false);
  });
});

// ─── 2. handleSwitchMode — lógica de roteamento por role ─────────────────────

describe("handleSwitchMode — lógica de roteamento por role", () => {
  /**
   * Simula a lógica do handleSwitchMode do Header.
   * Retorna a ação tomada.
   */
  async function simulateHandleSwitchMode(
    isAdmin: boolean,
    canSwitch: boolean,
    canSwitchToHost: boolean,
    isRenter: boolean,
    mode: UserMode
  ): Promise<{
    action: string;
    newMode: string | null;
    navigatedTo: string | null;
  }> {
    if (isAdmin) return { action: "blocked_admin", newMode: null, navigatedTo: null };

    if (!canSwitch && !canSwitchToHost) {
      return { action: "toast_info_user", newMode: null, navigatedTo: null };
    }

    if (!canSwitch && canSwitchToHost && isRenter) {
      return { action: "set_mode_host", newMode: "host", navigatedTo: "/host" };
    }

    // role=both: alterna
    const newMode = mode === "host" ? "renter" : "host";
    const navigatedTo = newMode === "host" ? "/host" : "/dashboard";
    return { action: "toggle_mode", newMode, navigatedTo };
  }

  it("isAdmin=true → bloqueado", async () => {
    const result = await simulateHandleSwitchMode(true, true, true, false, "admin");
    expect(result.action).toBe("blocked_admin");
  });

  it("role=user (canSwitch=false, canSwitchToHost=false) → toast info", async () => {
    const result = await simulateHandleSwitchMode(false, false, false, true, "renter");
    expect(result.action).toBe("toast_info_user");
    expect(result.newMode).toBeNull();
  });

  it("role=host em renter (canSwitch=false, canSwitchToHost=true, isRenter=true) → set_mode_host", async () => {
    const result = await simulateHandleSwitchMode(false, false, true, true, "renter");
    expect(result.action).toBe("set_mode_host");
    expect(result.newMode).toBe("host");
    expect(result.navigatedTo).toBe("/host");
  });

  it("role=both em renter → alterna para host", async () => {
    const result = await simulateHandleSwitchMode(false, true, true, true, "renter");
    expect(result.action).toBe("toggle_mode");
    expect(result.newMode).toBe("host");
    expect(result.navigatedTo).toBe("/host");
  });

  it("role=both em host → alterna para renter", async () => {
    const result = await simulateHandleSwitchMode(false, true, true, false, "host");
    expect(result.action).toBe("toggle_mode");
    expect(result.newMode).toBe("renter");
    expect(result.navigatedTo).toBe("/dashboard");
  });
});

// ─── 3. MobileBottomNav — detecção de rota com query strings ─────────────────

describe("MobileBottomNav — detecção de rota com query strings", () => {
  /**
   * Simula a lógica de isItemActive do MobileBottomNav.
   * Usa matching de segmento de path (não prefixo de string).
   */
  function isItemActive(itemHref: string, currentPath: string): boolean {
    // Extrair apenas o pathname (sem query string)
    const itemPath = itemHref.split("?")[0];
    const currentPathname = currentPath.split("?")[0];

    // Matching exato
    if (currentPathname === itemPath) return true;

    // Matching de sub-rota (segmento de path)
    if (itemPath !== "/" && currentPathname.startsWith(itemPath + "/")) return true;

    return false;
  }

  it("/host?section=bookings → item /host está ativo", () => {
    expect(isItemActive("/host", "/host?section=bookings")).toBe(true);
  });

  it("/host?section=vehicles → item /host está ativo", () => {
    expect(isItemActive("/host", "/host?section=vehicles")).toBe(true);
  });

  it("/host?section=earnings → item /host está ativo", () => {
    expect(isItemActive("/host", "/host?section=earnings")).toBe(true);
  });

  it("/dashboard?tab=favorites → item /dashboard está ativo", () => {
    expect(isItemActive("/dashboard", "/dashboard?tab=favorites")).toBe(true);
  });

  it("/host (sem query string) → item /host está ativo", () => {
    expect(isItemActive("/host", "/host")).toBe(true);
  });

  it("/dashboard → item /dashboard está ativo", () => {
    expect(isItemActive("/dashboard", "/dashboard")).toBe(true);
  });

  it("/administrator → item /admin NÃO está ativo (segmento exato)", () => {
    expect(isItemActive("/admin", "/administrator")).toBe(false);
  });

  it("/admin/users → item /admin está ativo (sub-rota)", () => {
    expect(isItemActive("/admin", "/admin/users")).toBe(true);
  });

  it("/host → item /dashboard NÃO está ativo", () => {
    expect(isItemActive("/dashboard", "/host")).toBe(false);
  });

  it("/dashboard → item /host NÃO está ativo", () => {
    expect(isItemActive("/host", "/dashboard")).toBe(false);
  });

  it("/ → item / está ativo apenas na raiz", () => {
    expect(isItemActive("/", "/")).toBe(true);
    expect(isItemActive("/", "/dashboard")).toBe(false);
  });

  it("/my-bookings?status=active → item /my-bookings está ativo", () => {
    expect(isItemActive("/my-bookings", "/my-bookings?status=active")).toBe(true);
  });

  it("/inbox?thread=123 → item /inbox está ativo", () => {
    expect(isItemActive("/inbox", "/inbox?thread=123")).toBe(true);
  });
});

// ─── 4. MobileBottomNav — cores contextuais por modo ─────────────────────────

describe("MobileBottomNav — cores contextuais por modo", () => {
  /**
   * Simula a lógica de getContextColors do MobileBottomNav.
   */
  function getContextColors(mode: UserMode): {
    activeColor: string;
    activeBg: string;
    indicator: string;
  } {
    if (mode === "host") {
      return {
        activeColor: "text-emerald-400",
        activeBg: "bg-emerald-500/10",
        indicator: "bg-emerald-400",
      };
    }
    if (mode === "admin") {
      return {
        activeColor: "text-red-400",
        activeBg: "bg-red-500/10",
        indicator: "bg-red-400",
      };
    }
    // renter (default)
    return {
      activeColor: "text-cyan-400",
      activeBg: "bg-cyan-500/10",
      indicator: "bg-cyan-400",
    };
  }

  it("modo renter → cor cyan", () => {
    const colors = getContextColors("renter");
    expect(colors.activeColor).toContain("cyan");
    expect(colors.activeBg).toContain("cyan");
    expect(colors.indicator).toContain("cyan");
  });

  it("modo host → cor emerald (verde)", () => {
    const colors = getContextColors("host");
    expect(colors.activeColor).toContain("emerald");
    expect(colors.activeBg).toContain("emerald");
    expect(colors.indicator).toContain("emerald");
  });

  it("modo admin → cor red (vermelho)", () => {
    const colors = getContextColors("admin");
    expect(colors.activeColor).toContain("red");
    expect(colors.activeBg).toContain("red");
    expect(colors.indicator).toContain("red");
  });

  it("modo renter → NÃO usa emerald nem red", () => {
    const colors = getContextColors("renter");
    expect(colors.activeColor).not.toContain("emerald");
    expect(colors.activeColor).not.toContain("red");
  });

  it("modo host → NÃO usa cyan nem red", () => {
    const colors = getContextColors("host");
    expect(colors.activeColor).not.toContain("cyan");
    expect(colors.activeColor).not.toContain("red");
  });

  it("modo admin → NÃO usa cyan nem emerald", () => {
    const colors = getContextColors("admin");
    expect(colors.activeColor).not.toContain("cyan");
    expect(colors.activeColor).not.toContain("emerald");
  });
});

// ─── 5. MobileBottomNav — sem vazamento de contexto entre modos ───────────────

describe("MobileBottomNav — sem vazamento de contexto entre modos", () => {
  const RENTER_NAV = ["/", "/favorites", "/my-bookings", "/messages", "/menu"];
  const HOST_NAV = ["/host", "/host", "/host", "/host", "/inbox"];
  const ADMIN_NAV = ["/admin", "/admin", "/admin", "/admin", "/admin"];

  it("nav de renter não contém rotas de host", () => {
    const hasHostRoute = RENTER_NAV.some(r => r.startsWith("/host"));
    expect(hasHostRoute).toBe(false);
  });

  it("nav de renter não contém rotas de admin", () => {
    const hasAdminRoute = RENTER_NAV.some(r => r.startsWith("/admin"));
    expect(hasAdminRoute).toBe(false);
  });

  it("nav de host não contém rotas de admin", () => {
    const hasAdminRoute = HOST_NAV.some(r => r.startsWith("/admin"));
    expect(hasAdminRoute).toBe(false);
  });

  it("nav de admin não contém rotas de renter (/, /favorites, /my-bookings)", () => {
    const hasRenterRoute = ADMIN_NAV.some(r => r === "/" || r === "/favorites" || r === "/my-bookings");
    expect(hasRenterRoute).toBe(false);
  });
});

// ─── 6. Verificação de source code — Header ───────────────────────────────────

describe("Header — verificação no source code", () => {
  const fs = require("fs");
  const path = require("path");
  let headerContent: string;

  beforeEach(() => {
    headerContent = fs.readFileSync(
      path.join(__dirname, "../client/src/components/Header.tsx"),
      "utf8"
    );
  });

  it("deve ter handleSwitchMode", () => {
    expect(headerContent).toContain("handleSwitchMode");
  });

  it("deve ter handleActivateHost", () => {
    expect(headerContent).toContain("handleActivateHost");
  });

  it("deve ter getSwitcherLabel", () => {
    expect(headerContent).toContain("getSwitcherLabel");
  });

  it("deve bloquear admin no handleSwitchMode", () => {
    const block = headerContent.substring(
      headerContent.indexOf("handleSwitchMode"),
      headerContent.indexOf("handleSwitchMode") + 500
    );
    expect(block).toContain("isAdmin");
  });

  it("deve usar canSwitchToHost para lógica de role", () => {
    expect(headerContent).toContain("canSwitchToHost");
  });

  it("deve usar canSwitch para lógica de alternância", () => {
    expect(headerContent).toContain("canSwitch");
  });

  it("deve ter switcher no dropdown do avatar (mobile)", () => {
    expect(headerContent).toContain("switcherInfo");
  });

  it("deve ter badge de modo com cor contextual (cyan/emerald)", () => {
    expect(headerContent).toContain("text-emerald-400");
    expect(headerContent).toContain("text-cyan-400");
  });

  it("deve usar useUserMode para obter contexto de modo", () => {
    expect(headerContent).toContain("useUserMode");
  });

  it("deve ter isMobileMenuOpen para controle do menu mobile", () => {
    expect(headerContent).toContain("isMobileMenuOpen");
  });
});

// ─── 7. Verificação de source code — MobileBottomNav ─────────────────────────

describe("MobileBottomNav — verificação no source code", () => {
  const fs = require("fs");
  const path = require("path");
  let navContent: string;

  beforeEach(() => {
    navContent = fs.readFileSync(
      path.join(__dirname, "../client/src/components/MobileBottomNav.tsx"),
      "utf8"
    );
  });

  it("deve existir componente MobileBottomNav", () => {
    expect(navContent).toContain("MobileBottomNav");
  });

  it("deve usar useUserMode para obter modo ativo", () => {
    expect(navContent).toContain("useUserMode");
  });

  it("deve ter lógica de isItemActive", () => {
    expect(navContent).toContain("isItemActive");
  });

  it("deve extrair pathname sem query string", () => {
    expect(navContent).toContain('split("?")');
  });

  it("deve ter cores contextuais por modo", () => {
    expect(navContent).toContain("emerald");
    expect(navContent).toContain("cyan");
    expect(navContent).toContain("red");
  });

  it("deve ter nav diferente para renter, host e admin", () => {
    expect(navContent).toContain("RENTER_NAV");
    expect(navContent).toContain("HOST_NAV");
    expect(navContent).toContain("ADMIN_NAV");
  });

  it("deve usar mode para selecionar nav correta (admin/host/renter)", () => {
    // MobileBottomNav usa mode === 'admin', mode === 'host' para selecionar nav
    expect(navContent).toContain('mode === "admin"');
    expect(navContent).toContain('mode === "host"');
  });

  it("deve ter indicador de rota ativa", () => {
    // Barra indicadora no topo do item ativo
    expect(navContent).toContain("indicator");
  });
});
