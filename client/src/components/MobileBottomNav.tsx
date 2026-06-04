/**
 * MobileBottomNav — Navegação inferior contextual por modo operacional.
 *
 * Comportamento por modo:
 * - Locatário (renter): Início | Favoritos | Reservas | Inbox | Menu
 * - Anfitrião (host):   Início | Painel | Reservas  | Inbox    | Menu
 * - Admin:              Início | Painel | Usuários  | Veículos | Menu
 *
 * "Reservas" no modo locatário → /my-bookings (reservas feitas pelo usuário)
 * "Reservas" no modo anfitrião → /host?section=bookings (reservas recebidas)
 * Sem mistura de contexto entre os modos.
 *
 * ERRO 6 CORRIGIDO: Detecção de rota ativa agora suporta query strings.
 *   - /host?section=bookings → isActive para item com href="/host?section=bookings"
 *   - Matching por pathname + query string completo quando href tem query string
 *   - Matching apenas por pathname quando href não tem query string
 *
 * ERRO 7 CORRIGIDO: Cores contextuais dinâmicas por modo.
 *   - Locatário: cyan (#06B6D4)
 *   - Anfitrião: emerald/verde (#10B981)
 *   - Admin: red (#EF4444)
 */

import { useLocation } from "wouter";
import { useTransition } from "react";
import {
  Home,
  Heart,
  CalendarDays,
  LayoutDashboard,
  MessageSquare,
  Users,
  Car,
  Menu,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserMode } from "@/contexts/UserModeContext";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** href completo, pode conter query string: /host?section=bookings */
  href: string;
  requiresAuth?: boolean;
  /**
   * Quando true, o active state é baseado em pathname + query string exata.
   * Quando false/undefined, apenas o pathname é comparado.
   */
  exactMatch?: boolean;
}

// ─── Configurações de navegação por modo ──────────────────────────────────────

const RENTER_NAV: NavItem[] = [
  { label: "Início", icon: Home, href: "/" },
  { label: "Favoritos", icon: Heart, href: "/favorites", requiresAuth: true },
  { label: "Reservas", icon: CalendarDays, href: "/my-bookings", requiresAuth: true },
  { label: "Inbox", icon: MessageSquare, href: "/messages", requiresAuth: true },
  { label: "Menu", icon: Menu, href: "/menu", requiresAuth: true },
];

const HOST_NAV: NavItem[] = [
  { label: "Início", icon: Home, href: "/" },
  { label: "Painel", icon: LayoutDashboard, href: "/host", requiresAuth: true },
  { label: "Reservas", icon: CalendarDays, href: "/host?section=bookings", requiresAuth: true, exactMatch: true },
  { label: "Inbox", icon: MessageSquare, href: "/messages", requiresAuth: true },
  { label: "Menu", icon: Menu, href: "/menu", requiresAuth: true },
];

const ADMIN_NAV: NavItem[] = [
  { label: "Início", icon: Home, href: "/admin" },
  { label: "Painel", icon: LayoutDashboard, href: "/admin", requiresAuth: true },
  { label: "Usuários", icon: Users, href: "/admin?section=users", requiresAuth: true, exactMatch: true },
  { label: "Veículos", icon: Car, href: "/admin?section=vehicles", requiresAuth: true, exactMatch: true },
  { label: "Menu", icon: Menu, href: "/menu", requiresAuth: true },
];

// ─── Cores contextuais por modo ───────────────────────────────────────────────

const MODE_COLORS = {
  renter: {
    active: "text-cyan-400",
    indicator: "bg-cyan-400",
    glow: "shadow-cyan-400/30",
  },
  host: {
    active: "text-emerald-400",
    indicator: "bg-emerald-400",
    glow: "shadow-emerald-400/30",
  },
  admin: {
    active: "text-red-400",
    indicator: "bg-red-400",
    glow: "shadow-red-400/30",
  },
} as const;

// ─── Rotas onde o bottom nav NÃO deve aparecer ────────────────────────────────
// (dashboards com sidebar própria — evitar duplicação de navegação)
// Nota: a ocultação usa startsWith no pathname, não na URL completa com query string
const HIDDEN_PATHS = ["/host", "/dashboard", "/admin"];

// ─── Helpers de matching de rota ──────────────────────────────────────────────

/**
 * Extrai pathname e query string de um href.
 * Ex: "/host?section=bookings" → { pathname: "/host", search: "section=bookings" }
 */
function parseHref(href: string): { pathname: string; search: string } {
  const [pathname, search = ""] = href.split("?");
  return { pathname, search };
}

/**
 * Retorna a URL atual (pathname + query string) do wouter.
 * wouter retorna apenas o pathname via useLocation(), mas a query string
 * está disponível via window.location.search.
 */
function getCurrentSearch(): string {
  if (typeof window === "undefined") return "";
  return window.location.search.replace(/^\?/, "");
}

/**
 * Verifica se um item de navegação está ativo com base na rota atual.
 *
 * Lógica:
 * 1. Se href = "/" → ativo apenas quando pathname === "/"
 * 2. Se exactMatch=true → ativo quando pathname E query string coincidem
 * 3. Caso contrário → ativo quando pathname começa com o basePath do href
 */
function isItemActive(item: NavItem, currentPathname: string): boolean {
  const { pathname: hrefPathname, search: hrefSearch } = parseHref(item.href);

  // Caso especial: raiz
  if (hrefPathname === "/") {
    return currentPathname === "/";
  }

  // Matching por pathname + query string (exactMatch)
  if (item.exactMatch && hrefSearch) {
    const currentSearch = getCurrentSearch();
    return currentPathname === hrefPathname && currentSearch === hrefSearch;
  }

  // Matching por segmento de path (não apenas prefixo de string).
  // /admin deve ativar /admin e /admin/users, mas NÃO /administrator.
  return (
    currentPathname === hrefPathname ||
    currentPathname.startsWith(hrefPathname + "/")
  );
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function MobileBottomNav() {
  const [location, navigate] = useLocation();
  const [, startTransition] = useTransition();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { mode } = useUserMode();

  // Ocultar em páginas de dashboard com sidebar
  // Usar apenas o pathname (sem query string) para a verificação de ocultação
  const currentPathname = location.split("?")[0];
  const shouldHide = HIDDEN_PATHS.some(
    (p) => currentPathname === p || (currentPathname.startsWith(p + "/") && p !== "/")
  );
  if (shouldHide) return null;

  // Aguardar o carregamento do auth para evitar flash de nav errada
  // (ex: renderizar RENTER_NAV e depois HOST_NAV causando 2 "Início" visíveis)
  if (authLoading) return null;

  // Selecionar navegação e cores pelo modo
  const navItems = mode === "admin" ? ADMIN_NAV : mode === "host" ? HOST_NAV : RENTER_NAV;
  const colors = MODE_COLORS[mode] ?? MODE_COLORS.renter;

  const handleNavClick = (item: NavItem, e: React.MouseEvent) => {
    e.preventDefault();
    if (item.requiresAuth && !isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    // Usar startTransition para sinalizar ao React que é uma transição não-urgente.
    // Isso evita que o Suspense mostre o PageLoader ao trocar de aba:
    // o React mantém a UI anterior visível enquanto prepara a nova rota.
    startTransition(() => {
      navigate(item.href);
    });
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0F1C]/95 backdrop-blur-xl border-t border-white/10"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Navegação principal mobile"
    >
      <div className="flex items-stretch h-16">
        {navItems.map((item) => {
          const active = isItemActive(item, location);
          const Icon = item.icon;

          return (
            <button
              key={item.href}
              onClick={(e) => handleNavClick(item, e)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 relative",
                active
                  ? colors.active
                  : "text-slate-500 hover:text-slate-300 active:scale-95"
              )}
              aria-current={active ? "page" : undefined}
            >
              {/* Active indicator bar — cor contextual */}
              {active && (
                <span
                  className={cn(
                    "absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full",
                    colors.indicator
                  )}
                />
              )}

              <Icon
                className={cn(
                  "transition-all duration-200",
                  active ? "w-5 h-5 scale-110" : "w-5 h-5"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium leading-none transition-all duration-200",
                  active ? colors.active : "text-slate-500"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
