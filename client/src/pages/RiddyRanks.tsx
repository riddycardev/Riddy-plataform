/**
 * RIDDY Ranks — Tela premium de níveis, conquistas e benefícios
 * - Exibe APENAS o contexto do modo atual (locatário OU anfitrião)
 * - Layout mobile-first sem DashboardLayout (evita corte e sidebar desnecessária)
 * - Design ultra-premium: glassmorphism, partículas, anéis animados, micro-interações
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserMode } from "@/contexts/UserModeContext";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Trophy,
  Star,
  Zap,
  Shield,
  Crown,
  ChevronRight,
  ChevronLeft,
  Lock,
  Share2,
  Sparkles,
  TrendingUp,
  Car,
  CheckCircle,
  Award,
  Download,
  X,
  ArrowLeftRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RIDER_LEVELS, HOST_LEVELS, ACHIEVEMENTS } from "@shared/levels";
import { generateRiddyCard } from "@/lib/generateRiddyCard";

// ─── ICON MAP ────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ReactNode> = {
  Compass: <span>🧭</span>,
  Map: <span>🗺️</span>,
  Mountain: <span>⛰️</span>,
  Steering: <span>🏎️</span>,
  Crown: <Crown className="w-5 h-5" />,
  Key: <span>🔑</span>,
  Shield: <Shield className="w-5 h-5" />,
  Star: <Star className="w-5 h-5" />,
  Trophy: <Trophy className="w-5 h-5" />,
  Diamond: <span>💎</span>,
  Home: <span>🏠</span>,
  ShieldCheck: <Shield className="w-5 h-5" />,
  Zap: <Zap className="w-5 h-5" />,
  TrendingUp: <TrendingUp className="w-5 h-5" />,
  Car: <Car className="w-5 h-5" />,
  Award: <Award className="w-5 h-5" />,
  Sunrise: <span>🌅</span>,
  CheckCircle: <CheckCircle className="w-5 h-5" />,
  Gem: <span>💎</span>,
  Rocket: <span>🚀</span>,
  Route: <span>🛣️</span>,
  MapPin: <span>📍</span>,
  Heart: <span>❤️</span>,
};

// ─── PROGRESS RING ───────────────────────────────────────────────────────────
function ProgressRing({
  percent,
  color,
  size = 120,
  strokeWidth = 7,
}: {
  percent: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color}
        strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.4, ease: "easeOut", delay: 0.4 }}
        style={{ filter: `drop-shadow(0 0 8px ${color}99)` }}
      />
    </svg>
  );
}

// ─── LEVEL CARD ──────────────────────────────────────────────────────────────
function LevelCard({
  level,
  isCurrent,
  isUnlocked,
}: {
  level: (typeof RIDER_LEVELS)[0] | (typeof HOST_LEVELS)[0];
  isCurrent: boolean;
  isUnlocked: boolean;
}) {
  const [expanded, setExpanded] = useState(isCurrent);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: level.level * 0.06 }}
      onClick={() => setExpanded(!expanded)}
      className="relative rounded-2xl overflow-hidden cursor-pointer select-none active:scale-[0.99] transition-transform"
      style={{
        background: isCurrent
          ? `linear-gradient(135deg, ${level.color}1A, ${level.color}08)`
          : isUnlocked
          ? "rgba(255,255,255,0.03)"
          : "rgba(255,255,255,0.015)",
        border: isCurrent
          ? `1px solid ${level.color}55`
          : isUnlocked
          ? "1px solid rgba(255,255,255,0.07)"
          : "1px solid rgba(255,255,255,0.03)",
        boxShadow: isCurrent ? `0 0 24px ${level.color}18` : "none",
      }}
    >
      {/* Glow no nível atual */}
      {isCurrent && (
        <div
          className="absolute inset-0 opacity-[0.12] pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 20% 50%, ${level.color}80, transparent 65%)`,
          }}
        />
      )}

      {/* Badge "SEU NÍVEL" */}
      {isCurrent && (
        <div
          className="absolute top-3 right-3 text-[9px] font-black px-2 py-0.5 rounded-full tracking-widest"
          style={{ background: `${level.color}22`, color: level.color, border: `1px solid ${level.color}44` }}
        >
          SEU NÍVEL
        </div>
      )}

      <div className="relative p-4 flex items-center gap-4 pr-10">
        {/* Ícone */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-transform"
          style={{
            background: isUnlocked
              ? `linear-gradient(135deg, ${level.color}30, ${level.color}10)`
              : "rgba(255,255,255,0.04)",
            border: `1px solid ${isUnlocked ? level.color + "44" : "rgba(255,255,255,0.06)"}`,
            color: isUnlocked ? level.color : "#444",
          }}
        >
          {isUnlocked
            ? ICON_MAP[level.icon] ?? <Trophy className="w-5 h-5" />
            : <Lock className="w-4 h-4 text-gray-700" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold" style={{ color: isUnlocked ? level.color : "#444" }}>
            Nível {level.level}
          </p>
          <p className="text-white font-bold text-[15px] leading-tight truncate">
            {level.name}
          </p>
          <p className="text-gray-500 text-xs mt-0.5 truncate">{level.subtitle}</p>
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute right-4 top-1/2 -translate-y-1/2"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </motion.div>
      </div>

      {/* Expanded: benefícios */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <div
                className="h-px w-full"
                style={{ background: `linear-gradient(90deg, ${level.color}44, transparent)` }}
              />
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                Benefícios
              </p>
              <ul className="space-y-2">
                {level.benefits.map((b: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle
                      className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                      style={{ color: isUnlocked ? level.color : "#444" }}
                    />
                    <span className={isUnlocked ? "text-gray-300" : "text-gray-600"}>
                      {b}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-600 mt-1 italic">
                {level.minRentals === 0
                  ? "Nenhum requisito — nível inicial"
                  : `Requer ${level.minRentals}+ locações concluídas`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── ACHIEVEMENT CARD ────────────────────────────────────────────────────────
function AchievementCard({
  achievement,
  unlocked,
  unlockedAt,
  onShare,
}: {
  achievement: (typeof ACHIEVEMENTS)[0];
  unlocked: boolean;
  unlockedAt: Date | null;
  onShare: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.93 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative rounded-2xl p-4 flex flex-col gap-2.5"
      style={{
        background: unlocked
          ? `linear-gradient(135deg, ${achievement.color}18, ${achievement.color}06)`
          : "rgba(255,255,255,0.02)",
        border: unlocked
          ? `1px solid ${achievement.color}33`
          : "1px solid rgba(255,255,255,0.05)",
        boxShadow: unlocked ? `0 0 20px ${achievement.color}10` : "none",
      }}
    >
      {/* Ícone */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
        style={{
          background: unlocked
            ? `linear-gradient(135deg, ${achievement.color}33, ${achievement.color}11)`
            : "rgba(255,255,255,0.04)",
          color: unlocked ? achievement.color : "#333",
        }}
      >
        {unlocked
          ? ICON_MAP[achievement.icon] ?? <Award className="w-5 h-5" />
          : <Lock className="w-4 h-4" />}
      </div>

      <div className="flex-1">
        <p
          className="font-bold text-sm leading-tight"
          style={{ color: unlocked ? achievement.color : "#444" }}
        >
          {achievement.title}
        </p>
        <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
          {achievement.description}
        </p>
        {unlocked && unlockedAt && (
          <p className="text-[10px] text-gray-600 mt-1">
            {new Date(unlockedAt).toLocaleDateString("pt-BR")}
          </p>
        )}
      </div>

      {unlocked && (
        <button
          onClick={(e) => { e.stopPropagation(); onShare(); }}
          className="flex items-center gap-1.5 text-xs font-semibold self-start px-3 py-1.5 rounded-full transition-all active:scale-95"
          style={{
            background: `${achievement.color}22`,
            color: achievement.color,
            border: `1px solid ${achievement.color}33`,
          }}
        >
          <Share2 className="w-3 h-3" />
          Compartilhar
        </button>
      )}
    </motion.div>
  );
}

// ─── SHARE CARD MODAL ────────────────────────────────────────────────────────
function ShareCardModal({
  isOpen,
  onClose,
  levelColor,
  isGenerating,
  onDownload,
  previewUrl,
}: {
  isOpen: boolean;
  onClose: () => void;
  levelColor: string;
  isGenerating: boolean;
  onDownload: () => void;
  previewUrl: string | null;
}) {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3, type: "spring", damping: 25 }}
          className="relative w-full max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0A0F1C, #0d1526)",
            border: `1px solid ${levelColor}33`,
            boxShadow: `0 -20px 60px ${levelColor}18`,
          }}
        >
          {/* Handle bar (mobile) */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>

          <div className="p-6 pt-4">
            <p className="text-white font-bold text-lg mb-0.5">Seu Cartão RIDDY</p>
            <p className="text-gray-500 text-sm mb-5">
              Baixe e compartilhe nos Stories do Instagram
            </p>

            {/* Preview */}
            <div
              className="rounded-2xl overflow-hidden mb-5 mx-auto"
              style={{
                width: "160px",
                aspectRatio: "9/16",
                background: "#020A14",
                border: `1px solid ${levelColor}22`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isGenerating ? (
                <div className="flex flex-col items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-7 h-7" style={{ color: levelColor }} />
                  </motion.div>
                  <p className="text-gray-500 text-xs">Gerando...</p>
                </div>
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Cartão RIDDY"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Sparkles className="w-7 h-7 opacity-25" style={{ color: levelColor }} />
                  <p className="text-gray-600 text-xs">Prévia</p>
                </div>
              )}
            </div>

            <Button
              onClick={onDownload}
              disabled={isGenerating}
              className="w-full font-bold py-3 rounded-xl text-black"
              style={{
                background: isGenerating
                  ? "rgba(255,255,255,0.08)"
                  : `linear-gradient(135deg, ${levelColor}, ${levelColor}cc)`,
                color: isGenerating ? "#555" : "#000",
                boxShadow: isGenerating ? "none" : `0 4px 24px ${levelColor}44`,
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? "Gerando..." : "Baixar PNG (9:16)"}
            </Button>
            <p className="text-center text-xs text-gray-600 mt-2">
              Alta resolução (810×1440px) — perfeito para Stories
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
export default function RiddyRanks() {
  const { user } = useAuth();
  const { isHost, isAdmin } = useUserMode();
  const [, navigate] = useLocation();

  // Contexto: anfitrião usa "host", locatário usa "rider"
  const context: "rider" | "host" = isHost ? "host" : "rider";

  const [innerTab, setInnerTab] = useState<"levels" | "achievements">("levels");
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: levelData, isLoading } = trpc.levels.getMyLevel.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: achievementsRaw } = trpc.levels.getMyAchievements.useQuery(undefined, {
    enabled: !!user,
  });
  const markShared = trpc.levels.markAchievementShared.useMutation();

  // Dados do contexto atual
  const data = context === "rider" ? levelData?.rider : levelData?.host;
  const cfg = data?.config;
  const levels = context === "rider" ? RIDER_LEVELS : HOST_LEVELS;

  // Conquistas filtradas pelo contexto
  const filteredAchievements = achievementsRaw?.filter(
    (a) => a.context === (context === "rider" ? "renter" : "host")
  ) ?? [];
  const unlockedCount = filteredAchievements.filter((a) => a.unlocked).length;

  const handleShareAchievement = (key: string, title: string) => {
    markShared.mutate({ achievementKey: key });
    const text = `🏆 Desbloqueei a conquista "${title}" no RIDDY! 🚗✨\n\nBaixe o app: riddycar.com`;
    navigator.clipboard?.writeText(text).catch(() => {});
    toast.success("Texto copiado! Cole no Instagram Stories 🎉", { duration: 3000 });
  };

  // Emoji map para o canvas generator
  const CARD_EMOJI_MAP: Record<string, string> = {
    Compass: "🧭", Map: "🗺️", Mountain: "⛰️", Steering: "🏎️", Crown: "👑",
    Key: "🔑", Shield: "🛡️", Star: "⭐", Trophy: "🏆", Diamond: "💎",
    Home: "🏠", ShieldCheck: "✅", Zap: "⚡", TrendingUp: "📈", Car: "🚗",
    Award: "🎖️", Sunrise: "🌅", CheckCircle: "✔️", Gem: "💎",
    Rocket: "🚀", Route: "🛣️", MapPin: "📍", Heart: "❤️",
  };

  const RIDER_PHRASES: Record<number, string> = {
    1: "Sua jornada começa aqui. O caminho é longo e cheio de aventuras.",
    2: "Você já conhece o caminho. Continue explorando o Brasil.",
    3: "A aventura está no seu DNA. Cada km conta.",
    4: "Elite na estrada. Você redefiniu o que é viajar.",
    5: "Lenda RIDDY. Poucos chegaram onde você chegou.",
  };

  const HOST_PHRASES: Record<number, string> = {
    1: "Bem-vindo à frota RIDDY. Sua jornada como anfitrião começa agora.",
    2: "Confiança que gera reservas. Você está construindo algo sólido.",
    3: "Referência em hospitalidade. Seu padrão inspira outros anfitriões.",
    4: "Performance de alto nível. Você é o benchmark da plataforma.",
    5: "O anfitrião que define o padrão. Uma lenda da frota RIDDY.",
  };

  const buildCardData = useCallback(() => {
    if (!data || !cfg || !user) return null;
    const stats = context === "rider"
      ? [
          { label: "Locações", value: String(data.totalRentals) },
          { label: "KM rodados", value: ((data as any).totalKm ?? 0).toLocaleString("pt-BR") },
          { label: "Nota média", value: (data as any).avgRating > 0 ? Number((data as any).avgRating).toFixed(1) : "—" },
        ]
      : [
          { label: "Locações", value: String(data.totalRentals) },
          { label: "Faturamento", value: `R$ ${(((data as any).totalEarnings ?? 0) / 1000).toFixed(1)}k` },
          { label: "Nota média", value: (data as any).avgRating > 0 ? Number((data as any).avgRating).toFixed(1) : "—" },
        ];
    return {
      userName: user.name ?? "Usuário RIDDY",
      context,
      levelName: cfg.name,
      levelSubtitle: cfg.subtitle,
      levelNumber: data.currentLevel,
      levelColor: cfg.color,
      levelEmoji: CARD_EMOJI_MAP[cfg.icon] ?? "🏆",
      progressPercent: data.progressPercent,
      nextLevelName: data.nextConfig?.name,
      scoreToNext: data.scoreToNext ?? undefined,
      stats,
      phrase: context === "rider"
        ? (RIDER_PHRASES[data.currentLevel] ?? RIDER_PHRASES[1])
        : (HOST_PHRASES[data.currentLevel] ?? HOST_PHRASES[1]),
      unlockedAchievements: unlockedCount,
    };
  }, [data, cfg, user, context, unlockedCount]);

  const handleOpenShareModal = useCallback(async () => {
    setShowShareModal(true);
    setPreviewUrl(null);
    setIsGenerating(true);
    try {
      const cardData = buildCardData();
      if (!cardData) throw new Error("Sem dados");
      const url = await generateRiddyCard(cardData);
      setPreviewUrl(url);
    } catch (err) {
      console.error("Card generation error:", err);
      toast.error("Erro ao gerar cartão. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  }, [buildCardData]);

  const handleDownload = useCallback(async () => {
    setIsGenerating(true);
    try {
      const cardData = buildCardData();
      if (!cardData) throw new Error("Sem dados");
      const url = await generateRiddyCard(cardData);
      setPreviewUrl(url);
      const link = document.createElement("a");
      link.download = `riddy-ranks-${context}-${Date.now()}.png`;
      link.href = url;
      link.click();
      toast.success("Cartão baixado! Compartilhe nos Stories 🚀", { duration: 4000 });
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Erro ao baixar cartão. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  }, [buildCardData, context]);

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen pb-28"
      style={{ background: "linear-gradient(180deg, #060B18 0%, #0A0F1C 100%)" }}
    >
      {/* ── TOP BAR ── */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between px-4 py-3.5"
        style={{
          background: "rgba(6,11,24,0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <button
          onClick={() => { if (window.history.length > 1) { navigate(-1 as any); } else { navigate('/menu'); } }}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4" style={{ color: cfg?.color ?? "#22d3ee" }} />
          <span className="text-white font-bold text-base">RIDDY Ranks</span>
        </div>

        {/* Contexto atual */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
          style={{
            background: isHost ? "rgba(168,85,247,0.15)" : "rgba(34,211,238,0.12)",
            color: isHost ? "#a855f7" : "#22d3ee",
            border: `1px solid ${isHost ? "rgba(168,85,247,0.3)" : "rgba(34,211,238,0.25)"}`,
          }}
        >
          {isHost ? "🏠" : "🚗"}
          {isHost ? "Anfitrião" : "Locatário"}
        </div>
      </div>

      <div className="px-4 pt-5 space-y-5 max-w-lg mx-auto">

        {/* ── HERO CARD ── */}
        {isLoading || !data || !cfg ? (
          <div className="h-52 rounded-3xl bg-white/[0.04] animate-pulse" />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl overflow-hidden p-5"
            style={{
              background: `linear-gradient(135deg, ${cfg.color}1C, ${cfg.color}08, rgba(10,15,28,0.97))`,
              border: `1px solid ${cfg.color}44`,
              boxShadow: `0 0 40px ${cfg.color}14`,
            }}
          >
            {/* Background glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 85% 15%, ${cfg.color}28, transparent 55%)`,
              }}
            />

            <div className="relative flex items-center gap-4">
              {/* Progress ring + ícone */}
              <div className="relative flex-shrink-0">
                <ProgressRing percent={data.progressPercent} color={cfg.color} size={96} strokeWidth={6} />
                <div
                  className="absolute inset-0 flex items-center justify-center text-2xl"
                  style={{ color: cfg.color }}
                >
                  {ICON_MAP[cfg.icon] ?? <Trophy className="w-7 h-7" />}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-[10px] font-black uppercase tracking-widest mb-0.5"
                  style={{ color: cfg.color }}
                >
                  {isHost ? "ANFITRIÃO" : "LOCATÁRIO"} · NÍVEL {data.currentLevel}
                </p>
                <h1 className="text-xl font-black text-white leading-tight">
                  {cfg.name}
                </h1>
                <p className="text-gray-400 text-xs mt-0.5">{cfg.subtitle}</p>

                {data.nextLevel && data.nextConfig ? (
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                      <span>Para {data.nextConfig.name}</span>
                      <span style={{ color: cfg.color }} className="font-bold">{data.progressPercent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${data.progressPercent}%` }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${cfg.color}, ${data.nextConfig.color})`,
                          boxShadow: `0 0 10px ${cfg.color}88`,
                        }}
                      />
                    </div>
                    {(data as any).scoreToNext && (
                      <p className="text-[11px] text-gray-600 mt-1">
                        {(data as any).scoreToNext} pts para o próximo nível
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" style={{ color: cfg.color }} />
                    <span className="text-sm font-bold" style={{ color: cfg.color }}>
                      Nível máximo atingido! ✦
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats grid */}
            <div className="relative mt-4 grid grid-cols-3 gap-2">
              {context === "rider" ? (
                <>
                  <StatCell label="Locações" value={String(data.totalRentals)} color={cfg.color} />
                  <StatCell label="KM rodados" value={((data as any).totalKm ?? 0).toLocaleString("pt-BR")} color={cfg.color} />
                  <StatCell
                    label="Nota média"
                    value={(data as any).avgRating > 0 ? (data as any).avgRating.toFixed(1) + " ★" : "—"}
                    color={cfg.color}
                  />
                </>
              ) : (
                <>
                  <StatCell label="Locações" value={String(data.totalRentals)} color={cfg.color} />
                  <StatCell
                    label="Faturamento"
                    value={"R$ " + ((data as any).totalEarnings ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                    color={cfg.color}
                    small
                  />
                  <StatCell
                    label="Nota média"
                    value={(data as any).avgRating > 0 ? (data as any).avgRating.toFixed(1) + " ★" : "—"}
                    color={cfg.color}
                  />
                </>
              )}
            </div>

            {/* Score badge */}
            {(data as any).score > 0 && (
              <div className="relative mt-3 flex items-center justify-between">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold"
                  style={{ background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}30` }}
                >
                  <Zap className="w-3 h-3" />
                  Score Riddy: {(data as any).score} pts
                </div>
                {(data as any).rankNational && (
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{ background: "rgba(255,255,255,0.05)", color: "#888" }}
                  >
                    <Trophy className="w-3 h-3" />
                    #{(data as any).rankNational} nacional
                  </div>
                )}
              </div>
            )}

            {/* Social proof */}
            {(data as any).socialProof && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="relative mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-500" />
                <p className="text-xs text-gray-400 leading-relaxed">
                  {(data as any).socialProof}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── TABS INTERNAS ── */}
        <div
          className="flex rounded-2xl p-1 gap-1"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {(["levels", "achievements"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setInnerTab(t)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: innerTab === t
                  ? cfg
                    ? `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}10)`
                    : "rgba(255,255,255,0.1)"
                  : "transparent",
                color: innerTab === t ? (cfg?.color ?? "#22d3ee") : "#555",
                border: innerTab === t
                  ? `1px solid ${cfg?.color ?? "#22d3ee"}33`
                  : "1px solid transparent",
              }}
            >
              {t === "levels" ? "Níveis" : `Conquistas (${unlockedCount}/${filteredAchievements.length})`}
            </button>
          ))}
        </div>

        {/* ── NÍVEIS ── */}
        <AnimatePresence mode="wait">
          {innerTab === "levels" && (
            <motion.div
              key="levels"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {(levels as ((typeof RIDER_LEVELS)[0] | (typeof HOST_LEVELS)[0])[]).map((level) => (
                <LevelCard
                  key={level.level}
                  level={level}
                  isCurrent={data?.currentLevel === level.level}
                  isUnlocked={(data?.currentLevel ?? 0) >= level.level}
                />
              ))}
            </motion.div>
          )}

          {/* ── CONQUISTAS ── */}
          {innerTab === "achievements" && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {filteredAchievements.length === 0 ? (
                <div className="text-center py-16 text-gray-600">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Nenhuma conquista disponível ainda</p>
                  <p className="text-xs mt-1 text-gray-700">Complete locações para desbloquear</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredAchievements.map((a) => (
                    <AchievementCard
                      key={a.key}
                      achievement={a}
                      unlocked={a.unlocked}
                      unlockedAt={a.unlockedAt}
                      onShare={() => handleShareAchievement(a.key, a.title)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CTA COMPARTILHAR ── */}
        {data && cfg && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="rounded-2xl p-5"
            style={{
              background: `linear-gradient(135deg, ${cfg.color}14, rgba(10,15,28,0.9))`,
              border: `1px solid ${cfg.color}30`,
            }}
          >
            <div className="flex items-center gap-4">
              {/* Mini preview do cartão */}
              <div
                className="flex-shrink-0 rounded-xl overflow-hidden cursor-pointer transition-transform hover:scale-105 active:scale-95"
                style={{
                  width: "52px",
                  aspectRatio: "9/16",
                  background: "#020A14",
                  border: `1px solid ${cfg.color}33`,
                  position: "relative",
                }}
                onClick={handleOpenShareModal}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `radial-gradient(ellipse at 80% 10%, ${cfg.color}50 0%, transparent 55%),
                                 linear-gradient(180deg, #020A14 0%, #0A0F1C 50%, #020A14 100%)`,
                  }}
                />
                <div
                  style={{
                    position: "relative",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "6px",
                    gap: "3px",
                  }}
                >
                  <div style={{ fontSize: "16px" }}>
                    {ICON_MAP[cfg.icon] ?? "🏆"}
                  </div>
                  <div style={{ fontSize: "5px", fontWeight: 900, color: "#fff", textAlign: "center", lineHeight: 1.2 }}>
                    {cfg.name}
                  </div>
                  <div style={{ fontSize: "4px", color: cfg.color, fontWeight: 700, letterSpacing: "0.3px", textTransform: "uppercase" }}>
                    RIDDY
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">Mostre seu nível</p>
                <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
                  Gere um cartão premium 9:16 para compartilhar nos Stories
                </p>
                <Button
                  onClick={handleOpenShareModal}
                  size="sm"
                  className="mt-3 font-bold text-xs text-black"
                  style={{
                    background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)`,
                    boxShadow: `0 4px 16px ${cfg.color}44`,
                  }}
                >
                  <Share2 className="w-3.5 h-3.5 mr-1.5" />
                  Gerar Cartão para Instagram
                </Button>
              </div>
            </div>
          </motion.div>
        )}

      </div>

      {/* ── SHARE MODAL ── */}
      {data && cfg && (
        <ShareCardModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          levelColor={cfg.color}
          isGenerating={isGenerating}
          onDownload={handleDownload}
          previewUrl={previewUrl}
        />
      )}
    </div>
  );
}

// ─── STAT CELL ───────────────────────────────────────────────────────────────
function StatCell({
  label,
  value,
  color,
  small = false,
}: {
  label: string;
  value: string;
  color: string;
  small?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-3 text-center"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <p
        className={`font-black text-white leading-tight ${small ? "text-sm" : "text-base"}`}
        style={{ textShadow: `0 0 12px ${color}44` }}
      >
        {value}
      </p>
      <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
