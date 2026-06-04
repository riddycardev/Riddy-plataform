/**
 * RIDDY Ranking — Leaderboard Regional Premium
 * Ranking nacional, estadual e por cidade de locatários e anfitriões.
 * Design: dark glassmorphism, gradientes por nível, animações suaves.
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy, Crown, Star, MapPin, Globe, ChevronUp, Loader2,
  TrendingUp, Users, Sparkles, Medal, Award, Zap,
} from "lucide-react";
import { Link } from "wouter";
import type { RiderLevelConfig, HostLevelConfig } from "@shared/levels";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"] as const;
const RANK_ICONS = [Crown, Trophy, Medal];

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="w-5 h-5" style={{ color: RANK_COLORS[0] }} />;
  if (rank === 2) return <Trophy className="w-5 h-5" style={{ color: RANK_COLORS[1] }} />;
  if (rank === 3) return <Medal className="w-5 h-5" style={{ color: RANK_COLORS[2] }} />;
  return <span className="text-sm font-bold text-white/50 w-5 text-center">{rank}</span>;
}

function ScoreBar({ score, max = 1000 }: { score: number; max?: number }) {
  const pct = Math.min(100, (score / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500"
        />
      </div>
      <span className="text-xs text-white/60 tabular-nums w-8 text-right">{score}</span>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function RiddyRanking() {
  const { user } = useAuth();
  const [context, setContext] = useState<"renter" | "host">("renter");
  const [scope] = useState<"national">("national");

  const { data: ranking, isLoading } = trpc.levels.getRanking.useQuery(
    { context, scope, limit: 50 },
    { staleTime: 60_000 }
  );

  const { data: myRanking } = trpc.levels.getMyRanking.useQuery(
    { context },
    { enabled: !!user, staleTime: 60_000 }
  );

  const top3 = useMemo(() => ranking?.slice(0, 3) ?? [], [ranking]);
  const rest = useMemo(() => ranking?.slice(3) ?? [], [ranking]);

  return (
    <div className="min-h-screen bg-[#0A0F1C]">
      <Header />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-16 px-4">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-4">
              <Trophy className="w-4 h-4" />
              RIDDY Ranking
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Os Melhores da{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                Plataforma
              </span>
            </h1>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Ranking em tempo real dos locatários e anfitriões com maior reputação na RIDDY.
            </p>
          </motion.div>

          {/* Meu ranking */}
          {user && myRanking && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6 inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
            >
              <div className="flex items-center gap-1.5 text-white/70 text-sm">
                <Globe className="w-4 h-4 text-cyan-400" />
                Sua posição nacional:
              </div>
              <span className="text-xl font-black text-white">
                #{myRanking.rankNational}
              </span>
              <div className="h-4 w-px bg-white/20" />
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400 font-semibold">Top {100 - myRanking.percentile}%</span>
              </div>
              <div className="h-4 w-px bg-white/20" />
              <div className="flex items-center gap-1 text-sm text-white/50">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-yellow-400 font-semibold">{myRanking.myScore}</span>
                <span>pts</span>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Tabs ── */}
      <div className="max-w-4xl mx-auto px-4 pb-4">
        <Tabs value={context} onValueChange={(v) => setContext(v as "renter" | "host")}>
          <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl">
            <TabsTrigger
              value="renter"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-white/50 rounded-lg px-6"
            >
              <Users className="w-4 h-4 mr-2" />
              Locatários
            </TabsTrigger>
            <TabsTrigger
              value="host"
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 text-white/50 rounded-lg px-6"
            >
              <Award className="w-4 h-4 mr-2" />
              Anfitriões
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ── Conteúdo ── */}
      <div className="max-w-4xl mx-auto px-4 pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={context}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* ── Pódio Top 3 ── */}
              {top3.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {/* 2º lugar */}
                  {top3[1] && (
                    <PodiumCard entry={top3[1]} position={2} context={context} isMe={top3[1].userId === user?.id} />
                  )}
                  {/* 1º lugar — maior */}
                  {top3[0] && (
                    <PodiumCard entry={top3[0]} position={1} context={context} isMe={top3[0].userId === user?.id} featured />
                  )}
                  {/* 3º lugar */}
                  {top3[2] && (
                    <PodiumCard entry={top3[2]} position={3} context={context} isMe={top3[2].userId === user?.id} />
                  )}
                </div>
              )}

              {/* ── Lista ── */}
              <div className="space-y-2">
                {rest.map((entry, idx) => (
                  <RankRow
                    key={entry.userId}
                    entry={entry}
                    context={context}
                    isMe={entry.userId === user?.id}
                    delay={idx * 0.03}
                  />
                ))}
              </div>

              {(!ranking || ranking.length === 0) && (
                <div className="text-center py-20 text-white/30">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum usuário no ranking ainda.</p>
                  <p className="text-sm mt-1">Complete locações para aparecer aqui!</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <Footer />
    </div>
  );
}

// ─── PÓDIO ────────────────────────────────────────────────────────────────────

interface RankEntry {
  rank: number;
  userId: number;
  name: string;
  avatar?: string | null;
  city?: string | null;
  state?: string | null;
  score: number;
  level: number;
  totalRentals: number;
  avgRating: number;
  levelConfig: RiderLevelConfig | HostLevelConfig;
}

function PodiumCard({
  entry, position, context, isMe, featured = false,
}: {
  entry: RankEntry;
  position: 1 | 2 | 3;
  context: "renter" | "host";
  isMe: boolean;
  featured?: boolean;
}) {
  const cfg = entry.levelConfig;
  const heights = { 1: "h-56", 2: "h-44", 3: "h-44" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: position * 0.1 }}
      className={`relative flex flex-col items-center justify-end rounded-2xl overflow-hidden border ${
        isMe ? "border-cyan-400/40" : "border-white/10"
      } ${heights[position]} ${featured ? "mt-0" : "mt-8"}`}
      style={{
        background: `linear-gradient(180deg, ${cfg.color}15 0%, #0A0F1C 100%)`,
      }}
    >
      {/* Posição */}
      <div
        className="absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
        style={{ background: RANK_COLORS[position - 1] + "22", color: RANK_COLORS[position - 1] }}
      >
        {position}
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-2 p-4">
        <div className="relative">
          <Avatar className={`${featured ? "w-16 h-16" : "w-12 h-12"} border-2`} style={{ borderColor: cfg.color + "66" }}>
            <AvatarImage src={entry.avatar ?? undefined} />
            <AvatarFallback style={{ background: cfg.color + "22", color: cfg.color }}>
              {(entry.name ?? "?")[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {position === 1 && (
            <Crown
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5"
              style={{ color: RANK_COLORS[0] }}
            />
          )}
        </div>

        <div className="text-center">
          <p className="text-white font-semibold text-sm truncate max-w-[90px]">
            {entry.name?.split(" ")[0] ?? "Usuário"}
          </p>
          <div
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1"
            style={{ background: cfg.color + "22", color: cfg.color }}
          >
            <span>{cfg.icon === "Crown" ? "👑" : cfg.icon === "Gem" ? "💎" : "⭐"}</span>
            {cfg.name}
          </div>
        </div>

        <div className="flex items-center gap-1 text-yellow-400 text-xs">
          <Zap className="w-3 h-3" />
          <span className="font-bold">{entry.score}</span>
          <span className="text-white/30">pts</span>
        </div>
      </div>

      {/* Barra de pódio */}
      <div
        className={`w-full ${featured ? "h-8" : "h-5"} flex items-center justify-center`}
        style={{ background: RANK_COLORS[position - 1] + "22" }}
      >
        <span className="text-[10px] font-bold" style={{ color: RANK_COLORS[position - 1] }}>
          #{position}
        </span>
      </div>
    </motion.div>
  );
}

// ─── LINHA DE RANKING ─────────────────────────────────────────────────────────

function RankRow({
  entry, context, isMe, delay,
}: {
  entry: RankEntry;
  context: "renter" | "host";
  isMe: boolean;
  delay: number;
}) {
  const cfg = entry.levelConfig;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
        isMe
          ? "bg-cyan-500/10 border-cyan-500/30"
          : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
      }`}
    >
      {/* Rank */}
      <div className="w-8 flex justify-center flex-shrink-0">
        {getRankIcon(entry.rank)}
      </div>

      {/* Avatar */}
      <Avatar className="w-10 h-10 flex-shrink-0 border" style={{ borderColor: cfg.color + "44" }}>
        <AvatarImage src={entry.avatar ?? undefined} />
        <AvatarFallback style={{ background: cfg.color + "22", color: cfg.color }}>
          {(entry.name ?? "?")[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm truncate">
            {entry.name?.split(" ")[0] ?? "Usuário"}
            {isMe && <span className="ml-1 text-cyan-400 text-xs">(você)</span>}
          </span>
          <div
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0"
            style={{ background: cfg.color + "22", color: cfg.color }}
          >
            {cfg.name}
          </div>
        </div>
        {(entry.city || entry.state) && (
          <div className="flex items-center gap-1 text-white/30 text-xs mt-0.5">
            <MapPin className="w-3 h-3" />
            {[entry.city, entry.state].filter(Boolean).join(", ")}
          </div>
        )}
        <div className="mt-1.5">
          <ScoreBar score={entry.score} />
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <div className="flex items-center gap-1 text-yellow-400 text-sm font-bold">
          <Star className="w-3.5 h-3.5 fill-yellow-400" />
          {entry.avgRating.toFixed(1)}
        </div>
        <div className="text-white/30 text-xs">
          {entry.totalRentals} loc.
        </div>
      </div>
    </motion.div>
  );
}
