/**
 * Admin Level Analytics — Painel de Analytics de Níveis
 * Distribuição de usuários por nível, top performers, conquistas mais desbloqueadas.
 * Design: dark premium, gráficos de barras, cards glassmorphism.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy, Crown, Star, Zap, Users, TrendingUp, Award,
  Medal, BarChart3, Sparkles, Loader2,
} from "lucide-react";
import { ACHIEVEMENTS } from "@shared/levels";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const LEVEL_NAMES_RIDER = ["", "Explorer", "Road Rider", "Riddy Pro", "Elite Driver", "Riddy Legend"];
const LEVEL_NAMES_HOST = ["", "Iniciante", "Verificado", "Pro", "Elite", "Lenda RIDDY"];
const LEVEL_COLORS = ["", "#6B7280", "#22D3EE", "#A855F7", "#F59E0B", "#FFD700"];

function DistributionBar({
  level,
  count,
  maxCount,
  context,
}: {
  level: number;
  count: number;
  maxCount: number;
  context: "renter" | "host";
}) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  const color = LEVEL_COLORS[level] ?? "#6B7280";
  const name = context === "renter" ? LEVEL_NAMES_RIDER[level] : LEVEL_NAMES_HOST[level];

  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-right">
        <span className="text-xs font-semibold" style={{ color }}>
          {name ?? `Nível ${level}`}
        </span>
      </div>
      <div className="flex-1 h-6 rounded-lg bg-white/5 overflow-hidden relative">
        <div
          className="h-full rounded-lg transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: `${color}33`, borderRight: `2px solid ${color}` }}
        />
        <span className="absolute inset-0 flex items-center pl-3 text-xs text-white/60">
          {count.toLocaleString("pt-BR")} usuários
        </span>
      </div>
      <div className="w-12 text-right text-xs text-white/40">
        {pct.toFixed(1)}%
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function AdminLevelAnalytics() {
  const [context, setContext] = useState<"renter" | "host">("renter");

  const { data, isLoading } = trpc.levels.adminLevelAnalytics.useQuery(undefined, {
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const dist = context === "renter" ? data?.riderDistribution : data?.hostDistribution;
  const topPerformers = context === "renter" ? data?.topRiders : data?.topHosts;
  const maxCount = Math.max(...(dist?.map((d) => d.count) ?? [1]));

  // Total de usuários com nível
  const totalUsers = dist?.reduce((sum, d) => sum + d.count, 0) ?? 0;

  // Conquistas mais populares com nome
  const topAchievements = data?.topAchievements?.map((a) => ({
    ...a,
    config: ACHIEVEMENTS.find((cfg) => cfg.key === a.key),
  })) ?? [];

  return (
    <div className="space-y-6">
      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          icon={<Users className="w-5 h-5 text-cyan-400" />}
          label="Usuários com Nível"
          value={totalUsers.toLocaleString("pt-BR")}
          color="cyan"
        />
        <KpiCard
          icon={<Crown className="w-5 h-5 text-yellow-400" />}
          label="Riddy Legends"
          value={(dist?.find((d) => d.level === 5)?.count ?? 0).toLocaleString("pt-BR")}
          color="yellow"
        />
        <KpiCard
          icon={<Award className="w-5 h-5 text-purple-400" />}
          label="Conquistas Desbloqueadas"
          value={(data?.achievementsTotal ?? 0).toLocaleString("pt-BR")}
          color="purple"
        />
        <KpiCard
          icon={<TrendingUp className="w-5 h-5 text-green-400" />}
          label="Score Médio"
          value={
            dist && dist.length > 0
              ? Math.round(
                  dist.reduce((sum, d) => sum + (d.avgScore ?? 0) * d.count, 0) / (totalUsers || 1)
                ).toString()
              : "—"
          }
          color="green"
        />
      </div>

      {/* ── Tabs ── */}
      <Tabs value={context} onValueChange={(v) => setContext(v as "renter" | "host")}>
        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl">
          <TabsTrigger
            value="renter"
            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-white/50 rounded-lg px-5"
          >
            <Users className="w-4 h-4 mr-2" />
            Locatários
          </TabsTrigger>
          <TabsTrigger
            value="host"
            className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 text-white/50 rounded-lg px-5"
          >
            <Award className="w-4 h-4 mr-2" />
            Anfitriões
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Distribuição de Níveis ── */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-white font-semibold">Distribuição por Nível</h3>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((level) => {
              const d = dist?.find((d) => d.level === level);
              return (
                <DistributionBar
                  key={level}
                  level={level}
                  count={d?.count ?? 0}
                  maxCount={maxCount}
                  context={context}
                />
              );
            })}
          </div>
        </div>

        {/* ── Top 10 Performers ── */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6">
          <div className="flex items-center gap-2 mb-5">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h3 className="text-white font-semibold">Top 10 Performers</h3>
          </div>
          <div className="space-y-2">
            {(topPerformers ?? []).map((p, idx) => (
              <div
                key={p.userId}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors"
              >
                {/* Rank */}
                <div className="w-6 flex-shrink-0 text-center">
                  {idx === 0 ? (
                    <Crown className="w-4 h-4 text-yellow-400 mx-auto" />
                  ) : idx === 1 ? (
                    <Trophy className="w-4 h-4 text-gray-400 mx-auto" />
                  ) : idx === 2 ? (
                    <Medal className="w-4 h-4 text-amber-600 mx-auto" />
                  ) : (
                    <span className="text-xs text-white/30 font-bold">{idx + 1}</span>
                  )}
                </div>
                {/* Avatar */}
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={p.avatar ?? undefined} />
                  <AvatarFallback className="bg-white/10 text-white/60 text-xs">
                    {(p.name ?? "?")[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {p.name?.split(" ")[0] ?? "Usuário"}
                  </p>
                  <div className="flex items-center gap-1 text-white/30 text-xs">
                    <span
                      className="font-semibold"
                      style={{ color: LEVEL_COLORS[p.level] ?? "#6B7280" }}
                    >
                      {context === "renter"
                        ? LEVEL_NAMES_RIDER[p.level]
                        : LEVEL_NAMES_HOST[p.level]}
                    </span>
                    <span>·</span>
                    <span>{p.totalRentals} loc.</span>
                    {p.city && <><span>·</span><span>{p.city}</span></>}
                  </div>
                </div>
                {/* Score */}
                <div className="flex items-center gap-1 text-yellow-400 text-sm font-bold flex-shrink-0">
                  <Zap className="w-3.5 h-3.5" />
                  {p.score}
                </div>
              </div>
            ))}
            {(!topPerformers || topPerformers.length === 0) && (
              <p className="text-white/30 text-sm text-center py-6">
                Nenhum dado disponível ainda.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Conquistas Mais Desbloqueadas ── */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="text-white font-semibold">Conquistas Mais Desbloqueadas</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {topAchievements.map((a, idx) => (
            <div
              key={a.key}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: (a.config?.color ?? "#6B7280") + "22" }}
              >
                {a.config?.icon ?? "🏆"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {a.config?.title ?? a.key}
                </p>
                <p className="text-white/40 text-xs">
                  {a.count.toLocaleString("pt-BR")} vezes
                </p>
              </div>
              <div className="text-white/30 text-xs font-bold flex-shrink-0">
                #{idx + 1}
              </div>
            </div>
          ))}
          {topAchievements.length === 0 && (
            <p className="text-white/30 text-sm col-span-3 text-center py-6">
              Nenhuma conquista desbloqueada ainda.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "cyan" | "yellow" | "purple" | "green";
}) {
  const colorMap = {
    cyan: "bg-cyan-500/10 border-cyan-500/20",
    yellow: "bg-yellow-500/10 border-yellow-500/20",
    purple: "bg-purple-500/10 border-purple-500/20",
    green: "bg-green-500/10 border-green-500/20",
  };

  return (
    <div className={`rounded-2xl border p-4 ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-white/50 text-xs">{label}</span>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
  );
}
