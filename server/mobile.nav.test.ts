/**
 * Testes unitários para a lógica do MobileBottomNav e switcher do Header.
 *
 * Cobre:
 * - ERRO 6: Detecção de rota ativa com query strings
 * - ERRO 7: Cores contextuais por modo
 * - Switcher mobile: lógica de role e estado
 * - Persistência de modo após alternância
 */

import { describe, it, expect } from "vitest";

// ─── Helpers extraídos do MobileBottomNav ─────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  exactMatch?: boolean;
}

function parseHref(href: string): { pathname: string; search: string } {
  const [pathname, search = ""] = href.split("?");
  return { pathname, search };
}

function isItemActive(
  item: NavItem,
  currentPathname: string,
  currentSearch: string = ""
): boolean {
  const { pathname: hrefPathname, search: hrefSearch } = parseHref(item.href);

  if (hrefPathname === "/") {
    return currentPathname === "/";
  }

  if (item.exactMatch && hrefSearch) {
    return currentPathname === hrefPathname && currentSearch === hrefSearch;
  }

  // Matching por segmento de path (não apenas prefixo de string).
  // /admin deve ativar /admin e /admin/users, mas NÃO /administrator.
  return (
    currentPathname === hrefPathname ||
    currentPathname.startsWith(hrefPathname + "/")
  );
}

// ─── Configurações de modo ────────────────────────────────────────────────────

const MODE_COLORS = {
  renter: { active: "text-cyan-400", indicator: "bg-cyan-400" },
  host: { active: "text-emerald-400", indicator: "bg-emerald-400" },
  admin: { active: "text-red-400", indicator: "bg-red-400" },
} as const;

type Mode = keyof typeof MODE_COLORS;

function getColorsForMode(mode: Mode) {
  return MODE_COLORS[mode] ?? MODE_COLORS.renter;
}

// ─── Lógica do switcher (extraída do Header) ──────────────────────────────────

type UserRole = "user" | "host" | "admin";

interface SwitcherInfo {
  label: string;
  color: string;
  isActivation: boolean;
}

function getSwitcherLabel(
  mode: Mode,
  role: UserRole,
  canSwitch: boolean,
  canSwitchToHost: boolean
): SwitcherInfo | null {
  if (role === "admin") return null;

  const isHost = mode === "host";

  if (!canSwitchToHost && !canSwitch) {
    return { label: "Virar Anfitrião", color: "text-emerald-400", isActivation: true };
  }

  if (!canSwitch && canSwitchToHost && !isHost) {
    return { label: "Mudar para Anfitrião", color: "text-emerald-400", isActivation: false };
  }

  if (isHost) {
    return { label: "Mudar para Locatário", color: "text-cyan-400", isActivation: false };
  }

  return { label: "Mudar para Anfitrião", color: "text-emerald-400", isActivation: false };
}

// ─── TESTES: Detecção de rota ativa (ERRO 6) ──────────────────────────────────

describe("isItemActive — ERRO 6: Matching de rotas com query strings", () => {
  // Rota raiz
  it("ativa '/' apenas quando pathname é '/'", () => {
    const item: NavItem = { label: "Início", href: "/" };
    expect(isItemActive(item, "/")).toBe(true);
    expect(isItemActive(item, "/cars")).toBe(false);
    expect(isItemActive(item, "/host")).toBe(false);
  });

  // Matching por pathname simples
  it("ativa '/cars' quando pathname começa com /cars", () => {
    const item: NavItem = { label: "Buscar", href: "/cars" };
    expect(isItemActive(item, "/cars")).toBe(true);
    expect(isItemActive(item, "/cars/123")).toBe(true);
    expect(isItemActive(item, "/motorcycles")).toBe(false);
  });

  it("ativa '/my-bookings' quando pathname é /my-bookings", () => {
    const item: NavItem = { label: "Reservas", href: "/my-bookings" };
    expect(isItemActive(item, "/my-bookings")).toBe(true);
    expect(isItemActive(item, "/my-bookings/456")).toBe(true);
    expect(isItemActive(item, "/host")).toBe(false);
  });

  // Matching com exactMatch + query string
  it("ativa '/host?section=bookings' apenas quando pathname E query string coincidem", () => {
    const item: NavItem = {
      label: "Reservas",
      href: "/host?section=bookings",
      exactMatch: true,
    };
    // Correto: pathname /host + search section=bookings
    expect(isItemActive(item, "/host", "section=bookings")).toBe(true);
    // Errado: pathname /host mas sem query string
    expect(isItemActive(item, "/host", "")).toBe(false);
    // Errado: pathname /host mas query string diferente
    expect(isItemActive(item, "/host", "section=fleet")).toBe(false);
    // Errado: pathname diferente
    expect(isItemActive(item, "/dashboard", "section=bookings")).toBe(false);
  });

  it("ativa '/admin?section=users' apenas com pathname E query string corretos", () => {
    const item: NavItem = {
      label: "Usuários",
      href: "/admin?section=users",
      exactMatch: true,
    };
    expect(isItemActive(item, "/admin", "section=users")).toBe(true);
    expect(isItemActive(item, "/admin", "section=vehicles")).toBe(false);
    expect(isItemActive(item, "/admin", "")).toBe(false);
  });

  it("ativa '/admin?section=vehicles' apenas com pathname E query string corretos", () => {
    const item: NavItem = {
      label: "Veículos",
      href: "/admin?section=vehicles",
      exactMatch: true,
    };
    expect(isItemActive(item, "/admin", "section=vehicles")).toBe(true);
    expect(isItemActive(item, "/admin", "section=users")).toBe(false);
  });

  // Sem exactMatch: não deve usar query string
  it("sem exactMatch, ignora query string e usa apenas pathname", () => {
    const item: NavItem = { label: "Painel", href: "/host" };
    // Ativo em /host independente de query string
    expect(isItemActive(item, "/host", "")).toBe(true);
    expect(isItemActive(item, "/host", "section=bookings")).toBe(true);
    expect(isItemActive(item, "/host", "section=fleet")).toBe(true);
    // Não ativo em outros paths
    expect(isItemActive(item, "/dashboard", "")).toBe(false);
  });

  it("sem exactMatch, ativo em sub-rotas de /host", () => {
    const item: NavItem = { label: "Painel", href: "/host" };
    expect(isItemActive(item, "/host/add-vehicle", "")).toBe(true);
  });

  it("'/messages' ativo apenas em /messages e sub-rotas", () => {
    const item: NavItem = { label: "Inbox", href: "/messages" };
    expect(isItemActive(item, "/messages")).toBe(true);
    expect(isItemActive(item, "/messages/123")).toBe(true);
    expect(isItemActive(item, "/profile")).toBe(false);
  });

  it("'/favorites' ativo apenas em /favorites", () => {
    const item: NavItem = { label: "Favoritos", href: "/favorites" };
    expect(isItemActive(item, "/favorites")).toBe(true);
    expect(isItemActive(item, "/")).toBe(false);
    expect(isItemActive(item, "/cars")).toBe(false);
  });

  // Edge cases
  it("não ativa '/host' quando pathname é '/'", () => {
    const item: NavItem = { label: "Painel", href: "/host" };
    expect(isItemActive(item, "/")).toBe(false);
  });

  it("não ativa '/admin' quando pathname é '/administrator'", () => {
    const item: NavItem = { label: "Painel", href: "/admin" };
    expect(isItemActive(item, "/administrator")).toBe(false);
  });
});

// ─── TESTES: Cores contextuais (ERRO 7) ───────────────────────────────────────

describe("getColorsForMode — ERRO 7: Cores contextuais por modo", () => {
  it("modo renter retorna cores cyan", () => {
    const colors = getColorsForMode("renter");
    expect(colors.active).toBe("text-cyan-400");
    expect(colors.indicator).toBe("bg-cyan-400");
  });

  it("modo host retorna cores emerald", () => {
    const colors = getColorsForMode("host");
    expect(colors.active).toBe("text-emerald-400");
    expect(colors.indicator).toBe("bg-emerald-400");
  });

  it("modo admin retorna cores red", () => {
    const colors = getColorsForMode("admin");
    expect(colors.active).toBe("text-red-400");
    expect(colors.indicator).toBe("bg-red-400");
  });

  it("cores de renter e host são diferentes", () => {
    const renter = getColorsForMode("renter");
    const host = getColorsForMode("host");
    expect(renter.active).not.toBe(host.active);
    expect(renter.indicator).not.toBe(host.indicator);
  });

  it("cores de host e admin são diferentes", () => {
    const host = getColorsForMode("host");
    const admin = getColorsForMode("admin");
    expect(host.active).not.toBe(admin.active);
    expect(host.indicator).not.toBe(admin.indicator);
  });
});

// ─── TESTES: Switcher de modo (ERRO 5 — lógica do Header) ────────────────────

describe("getSwitcherLabel — ERRO 5: Lógica do switcher de modo", () => {
  it("admin não tem switcher (retorna null)", () => {
    expect(getSwitcherLabel("renter", "admin", false, false)).toBeNull();
    expect(getSwitcherLabel("host", "admin", true, true)).toBeNull();
  });

  it("role=user sem canSwitch e sem canSwitchToHost → ativação de host", () => {
    const info = getSwitcherLabel("renter", "user", false, false);
    expect(info).not.toBeNull();
    expect(info!.isActivation).toBe(true);
    expect(info!.label).toBe("Virar Anfitrião");
    expect(info!.color).toBe("text-emerald-400");
  });

  it("role=host com canSwitchToHost mas sem canSwitch, em modo renter → pode ir para host", () => {
    const info = getSwitcherLabel("renter", "host", false, true);
    expect(info).not.toBeNull();
    expect(info!.isActivation).toBe(false);
    expect(info!.label).toBe("Mudar para Anfitrião");
    expect(info!.color).toBe("text-emerald-400");
  });

  it("role=both (canSwitch=true), em modo host → pode ir para locatário", () => {
    const info = getSwitcherLabel("host", "host", true, true);
    expect(info).not.toBeNull();
    expect(info!.isActivation).toBe(false);
    expect(info!.label).toBe("Mudar para Locatário");
    expect(info!.color).toBe("text-cyan-400");
  });

  it("role=both (canSwitch=true), em modo renter → pode ir para anfitrião", () => {
    const info = getSwitcherLabel("renter", "host", true, true);
    expect(info).not.toBeNull();
    expect(info!.isActivation).toBe(false);
    expect(info!.label).toBe("Mudar para Anfitrião");
    expect(info!.color).toBe("text-emerald-400");
  });

  it("switcher de ativação tem cor emerald (verde)", () => {
    const info = getSwitcherLabel("renter", "user", false, false);
    expect(info!.color).toBe("text-emerald-400");
  });

  it("switcher para locatário tem cor cyan (azul)", () => {
    const info = getSwitcherLabel("host", "host", true, true);
    expect(info!.color).toBe("text-cyan-400");
  });

  it("switcher para anfitrião tem cor emerald (verde)", () => {
    const info = getSwitcherLabel("renter", "host", true, true);
    expect(info!.color).toBe("text-emerald-400");
  });
});

// ─── TESTES: Lógica de ocultação do nav ───────────────────────────────────────

describe("Ocultação do MobileBottomNav em dashboards", () => {
  const HIDDEN_PATHS = ["/host", "/dashboard", "/admin"];

  function shouldHideNav(currentPathname: string): boolean {
    return HIDDEN_PATHS.some(
      (p) =>
        currentPathname === p ||
        (currentPathname.startsWith(p + "/") && p !== "/")
    );
  }

  it("oculta em /host", () => {
    expect(shouldHideNav("/host")).toBe(true);
  });

  it("oculta em /dashboard", () => {
    expect(shouldHideNav("/dashboard")).toBe(true);
  });

  it("oculta em /admin", () => {
    expect(shouldHideNav("/admin")).toBe(true);
  });

  it("oculta em sub-rotas de /host", () => {
    expect(shouldHideNav("/host/add-vehicle")).toBe(true);
  });

  it("oculta em sub-rotas de /admin", () => {
    expect(shouldHideNav("/admin/users")).toBe(true);
  });

  it("NÃO oculta em /", () => {
    expect(shouldHideNav("/")).toBe(false);
  });

  it("NÃO oculta em /cars", () => {
    expect(shouldHideNav("/cars")).toBe(false);
  });

  it("NÃO oculta em /my-bookings", () => {
    expect(shouldHideNav("/my-bookings")).toBe(false);
  });

  it("NÃO oculta em /messages", () => {
    expect(shouldHideNav("/messages")).toBe(false);
  });

  it("NÃO oculta em /profile", () => {
    expect(shouldHideNav("/profile")).toBe(false);
  });

  it("NÃO oculta em /motorcycles", () => {
    expect(shouldHideNav("/motorcycles")).toBe(false);
  });

  // Edge case: /administrator não deve ser confundido com /admin
  it("NÃO oculta em /administrator (não é sub-rota de /admin)", () => {
    expect(shouldHideNav("/administrator")).toBe(false);
  });
});

// ─── TESTES: Seleção de nav por modo ─────────────────────────────────────────

describe("Seleção de navegação por modo", () => {
  const RENTER_HREFS = ["/", "/favorites", "/my-bookings", "/messages", "/menu"];
  const HOST_HREFS = ["/", "/host", "/host?section=bookings", "/messages", "/menu"];
  const ADMIN_HREFS = ["/admin", "/admin", "/admin?section=users", "/admin?section=vehicles", "/menu"];

  function getNavHrefs(mode: Mode): string[] {
    if (mode === "admin") return ADMIN_HREFS;
    if (mode === "host") return HOST_HREFS;
    return RENTER_HREFS;
  }

  it("modo renter usa navegação de locatário", () => {
    const hrefs = getNavHrefs("renter");
    expect(hrefs).toContain("/my-bookings");
    expect(hrefs).toContain("/messages"); // Inbox
    expect(hrefs).toContain("/favorites");
    expect(hrefs).not.toContain("/cars"); // Buscar removido
    expect(hrefs).not.toContain("/host?section=bookings");
  });

  it("modo host usa navegação de anfitrião", () => {
    const hrefs = getNavHrefs("host");
    expect(hrefs).toContain("/host?section=bookings");
    expect(hrefs).toContain("/messages");
    expect(hrefs).not.toContain("/my-bookings");
    expect(hrefs).not.toContain("/cars");
  });

  it("modo admin usa navegação de administrador", () => {
    const hrefs = getNavHrefs("admin");
    expect(hrefs).toContain("/admin?section=users");
    expect(hrefs).toContain("/admin?section=vehicles");
    expect(hrefs).not.toContain("/my-bookings");
    expect(hrefs).not.toContain("/host?section=bookings");
  });

  it("modo host tem 'Reservas Recebidas' (/host?section=bookings), não /my-bookings", () => {
    const hrefs = getNavHrefs("host");
    expect(hrefs).toContain("/host?section=bookings");
    expect(hrefs).not.toContain("/my-bookings");
  });

  it("modo renter tem 'Minhas Reservas' (/my-bookings), não /host?section=bookings", () => {
    const hrefs = getNavHrefs("renter");
    expect(hrefs).toContain("/my-bookings");
    expect(hrefs).not.toContain("/host?section=bookings");
  });
});
