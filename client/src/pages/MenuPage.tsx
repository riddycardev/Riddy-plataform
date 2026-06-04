/**
 * MenuPage — Menu contextual por modo (estilo Turo)
 * Exibe itens de navegação diferentes para Locatário / Anfitrião / Admin
 */
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserMode } from "@/contexts/UserModeContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  User,
  ChevronRight,
  LogOut,
  Car,
  Bike,
  CalendarDays,
  DollarSign,
  Star,
  Settings,
  Shield,
  HelpCircle,
  FileText,
  Bell,
  CreditCard,
  LayoutDashboard,
  Users,
  BarChart2,
  ArrowLeftRight,
  Wrench,
  Trophy,
} from "lucide-react";
import LevelBadge from "@/components/LevelBadge";
import { trpc } from "@/lib/trpc";
import {   Crown, Zap, Share2 } from "lucide-react";

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  onClick?: () => void;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  danger?: boolean;
}

export default function MenuPage() {
  const { user, logout } = useAuth();
  const { mode, setMode, activateHostMode, canSwitchToHost, isHost, isAdmin } = useUserMode();
  const [, navigate] = useLocation();

  const { data: levelData } = trpc.levels.getMyLevel.useQuery(undefined, {
    enabled: !!user,
    staleTime: 60_000,
  });

  // Dados do nível conforme o modo atual
  const lvl = isHost ? levelData?.host : levelData?.rider;
  const pct = lvl?.progressPercent ?? 0;
  const currentLevelName = lvl?.config?.name ?? "Explorer";
  const nextLevelName = lvl?.nextConfig?.name ?? null;
  const isLegend = lvl?.currentLevel === 5;
  const score = lvl?.score ?? 0;
  const scoreToNext = lvl?.scoreToNext;

  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleSwitchToHost = async () => {
    if (canSwitchToHost) {
      await setMode("host");
      toast.success("Modo alternado para Anfitrião");
      navigate("/host");
    } else {
      await activateHostMode();
      toast.success("Conta de Anfitrião ativada!");
      navigate("/host");
    }
  };

  const handleSwitchToRenter = async () => {
    await setMode("renter");
    toast.success("Modo alternado para Locatário");
    navigate("/");
  };

  const go = (href: string) => navigate(href);

  // ─── Seções por modo ──────────────────────────────────────────────────────

  const renterSections: MenuSection[] = [
    {
      items: [
        { icon: User, label: "Conta", href: "/profile" },
        { icon: Trophy, label: "RIDDY Ranks", href: "/riddy-ranks" },
        { icon: Share2, label: "RIDDY Story", href: "/riddy-story" },
      ],
    },
    {
      title: "Minhas Atividades",
      items: [
        { icon: CalendarDays, label: "Minhas Reservas", href: "/my-bookings" },
        { icon: CreditCard, label: "Pagamentos", href: "/profile?tab=payment" },
        { icon: FileText, label: "Documentos", href: "/documents" },
        { icon: Bell, label: "Notificações", href: "/profile?tab=notifications" },
      ],
    },
    {
      title: "Suporte",
      items: [
        { icon: HelpCircle, label: "Ajuda e Suporte", href: "/support" },
        { icon: Shield, label: "Por que a RIDDY?", href: "/#why-riddy" },
        { icon: FileText, label: "Termos e Privacidade", href: "/privacy" },
      ],
    },
  ];

  const hostSections: MenuSection[] = [
    {
      title: "Painel do Anfitrião",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", href: "/host" },
        { icon: Car, label: "Meus Carros", href: "/host?section=vehicles" },
        { icon: Bike, label: "Minhas Motos", href: "/host?section=motorcycles" },
        { icon: CalendarDays, label: "Reservas Recebidas", href: "/host?section=bookings" },
        { icon: DollarSign, label: "Ganhos e Financeiro", href: "/host?section=earnings" },
        { icon: Star, label: "Avaliações", href: "/host?section=reviews" },
      ],
    },
    {
      title: "Conta",
      items: [
        { icon: User, label: "Perfil", href: "/profile" },
        { icon: Trophy, label: "RIDDY Ranks", href: "/riddy-ranks" },
        { icon: Share2, label: "RIDDY Story", href: "/riddy-story" },
        { icon: Settings, label: "Configurações do Anfitrião", href: "/profile?tab=settings" },
        { icon: Bell, label: "Notificações", href: "/profile?tab=notifications" },
      ],
    },
    {
      title: "Suporte",
      items: [
        { icon: HelpCircle, label: "Ajuda e Suporte", href: "/support" },
        { icon: FileText, label: "Termos e Privacidade", href: "/privacy" },
      ],
    },
  ];

  const adminSections: MenuSection[] = [
    {
      title: "Administração",
      items: [
        { icon: LayoutDashboard, label: "Painel Admin", href: "/admin" },
        { icon: Users, label: "Usuários", href: "/admin?section=users" },
        { icon: Car, label: "Veículos Pendentes", href: "/admin?section=vehicles" },
        { icon: BarChart2, label: "Relatórios", href: "/admin?section=reports" },
        { icon: Wrench, label: "Configurações do Sistema", href: "/admin?section=settings" },
      ],
    },
    {
      title: "Conta",
      items: [
        { icon: User, label: "Perfil", href: "/profile" },
      ],
    },
  ];

  const sections = isAdmin ? adminSections : isHost ? hostSections : renterSections;

  // ─── Card de destaque para troca de modo ─────────────────────────────────

  const renderModeCard = () => {
    if (isAdmin) return null;

    if (isHost) {
      // Anfitrião com role=both pode voltar para locatário
      if (user?.role === "both") {
        return (
          <div
            className="mx-4 mb-4 rounded-2xl p-4 flex items-center justify-between cursor-pointer active:opacity-80 transition-opacity"
            style={{ background: "linear-gradient(135deg, #0e7490 0%, #0891b2 100%)" }}
            onClick={handleSwitchToRenter}
          >
            <div>
              <p className="text-white font-semibold text-sm">Modo Locatário</p>
              <p className="text-cyan-100 text-xs mt-0.5">Alternar para alugar veículos</p>
            </div>
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-white" />
              <Badge className="bg-white/20 text-white border-0 text-xs">Alternar</Badge>
            </div>
          </div>
        );
      }
      return null;
    }

    // Locatário
    if (user?.role === "both" || user?.role === "host") {
      // Tem permissão de host — pode alternar
      return (
        <div
          className="mx-4 mb-4 rounded-2xl p-4 flex items-center justify-between cursor-pointer active:opacity-80 transition-opacity"
          style={{ background: "linear-gradient(135deg, #065f46 0%, #059669 100%)" }}
          onClick={handleSwitchToHost}
        >
          <div>
            <p className="text-white font-semibold text-sm">Modo Anfitrião</p>
            <p className="text-emerald-100 text-xs mt-0.5">Alternar para gerenciar seus veículos</p>
          </div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-white" />
            <Badge className="bg-white/20 text-white border-0 text-xs">Alternar</Badge>
          </div>
        </div>
      );
    }

    // role=user — nunca foi host — card de convite
    return (
      <div className="mx-4 mb-4 rounded-2xl overflow-hidden">
        <div
          className="p-4"
          style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-white font-bold text-base">Torne-se um Anfitrião</p>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Cadastre seu carro ou moto e comece a ganhar dinheiro com a RIDDY.
              </p>
              <Button
                size="sm"
                className="mt-3 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs px-4"
                onClick={handleSwitchToHost}
              >
                Saiba mais
              </Button>
            </div>
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Car className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0A0F1C] pb-24">
      {/* Header do perfil */}
      <div className="px-4 pt-6 pb-4">
        <div
          className="flex items-center gap-3 cursor-pointer active:opacity-80 transition-opacity"
          onClick={() => go("/profile")}
        >
          <Avatar className="w-14 h-14 border-2 border-white/10">
            <AvatarImage src={(user as any)?.avatarUrl || undefined} />
            <AvatarFallback className="bg-cyan-600 text-white font-bold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-lg leading-tight truncate">
              {user?.name || "Usuário"}
            </p>
            <p className="text-cyan-400 text-sm">Ver e editar perfil</p>
            <LevelBadge compact context={isHost ? "host" : "rider"} clickable={false} />
          </div>
          {isAdmin && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Admin</Badge>
          )}
          {isHost && !isAdmin && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Anfitrião</Badge>
          )}
        </div>
      </div>

      {/* ── Barra de Progresso de Nível ── */}
      {levelData && (
        <div
          className="mx-4 mb-4 rounded-2xl p-4 cursor-pointer active:opacity-80 transition-opacity"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          onClick={() => navigate("/riddy-ranks")}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isLegend ? (
                <Crown className="w-4 h-4 text-yellow-400" />
              ) : (
                <Zap className="w-4 h-4 text-cyan-400" />
              )}
              <span
                className="text-sm font-bold"
                style={{ color: isLegend ? "#FFD700" : isHost ? "#a855f7" : "#22d3ee" }}
              >
                {currentLevelName}
              </span>
              {score > 0 && (
                <span className="text-xs text-white/30 font-medium">{score} pts</span>
              )}
            </div>
            {!isLegend && nextLevelName && (
              <span className="text-xs text-white/30">
                {scoreToNext ? `${scoreToNext} pts para ${nextLevelName}` : nextLevelName}
              </span>
            )}
            {isLegend && (
              <span className="text-xs text-yellow-400/60">Nível máximo ✦</span>
            )}
          </div>
          {/* Barra de progresso */}
          <div className="h-2 rounded-full bg-white/[0.07] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, pct)}%`,
                background: isLegend
                  ? "linear-gradient(90deg, #FFD700, #FFA500)"
                  : isHost
                  ? "linear-gradient(90deg, #a855f7, #7c3aed)"
                  : "linear-gradient(90deg, #22d3ee, #0891b2)",
                boxShadow: isLegend
                  ? "0 0 8px rgba(255,215,0,0.5)"
                  : isHost
                  ? "0 0 8px rgba(168,85,247,0.4)"
                  : "0 0 8px rgba(34,211,238,0.4)",
              }}
            />
          </div>
          {!isLegend && (
            <p className="text-xs text-white/25 mt-1.5 text-right">{Math.round(pct)}% concluído</p>
          )}
        </div>
      )}

      {/* Card de troca de modo */}
      {renderModeCard()}

      {/* Seções de navegação */}
      <div className="px-4 space-y-6">
        {sections.map((section, si) => (
          <div key={si}>
            {section.title && (
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 px-1">
                {section.title}
              </p>
            )}
            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {section.items.map((item, ii) => {
                const Icon = item.icon;
                return (
                  <button
                    key={ii}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/5 active:bg-white/8 ${
                      ii < section.items.length - 1 ? "border-b border-white/5" : ""
                    } ${item.danger ? "text-red-400" : "text-white"}`}
                    onClick={() => {
                      if (item.onClick) {
                        item.onClick();
                      } else if (item.href) {
                        go(item.href);
                      }
                    }}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${item.danger ? "text-red-400" : "text-slate-400"}`} />
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge
                        variant={item.badgeVariant || "secondary"}
                        className="text-xs mr-1"
                      >
                        {item.badge}
                      </Badge>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Sair */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-red-400 transition-colors hover:bg-white/5 active:bg-white/8"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 flex-shrink-0 text-red-400" />
            <span className="flex-1 text-sm font-medium">Sair</span>
          </button>
        </div>

        {/* Versão */}
        <p className="text-center text-slate-600 text-xs pb-2">RIDDY v1.0.0</p>
      </div>
    </div>
  );
}
