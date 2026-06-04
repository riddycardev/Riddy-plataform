/**
 * RIDDY Story — Página de Stories Cinematográficos
 * 6 formatos premium para Instagram Stories (1080×1920px)
 * Referências: Apple · Spotify Wrapped · Porsche · Uber Black · Nubank Ultravioleta
 */
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserMode } from "@/contexts/UserModeContext";
import { toast } from "sonner";
import {
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateRiddyStory, type StoryType, type StoryData } from "@/lib/generateRiddyStory";

// ─── FORMATOS ────────────────────────────────────────────────────────────────
interface StoryFormat {
  type: StoryType;
  label: string;
  description: string;
  emoji: string;
  trigger: string;
}

const STORY_FORMATS: StoryFormat[] = [
  {
    type: "welcome",
    label: "Bem-vindo à RIDDY",
    description: "Foto de carro noturno, tipografia massiva, sua identidade RIDDY.",
    emoji: "🌃",
    trigger: "Ao criar conta",
  },
  {
    type: "first_rental",
    label: "Primeira Locação",
    description: "Carro ao pôr do sol, troféu dourado, conquista histórica.",
    emoji: "🏆",
    trigger: "Ao completar 1ª locação",
  },
  {
    type: "level_up",
    label: "Novo Nível",
    description: "Carro noturno com luzes, hexágono, seu novo nível em destaque.",
    emoji: "⭐",
    trigger: "Ao subir de nível",
  },
  {
    type: "km_milestone",
    label: "Marco de KM",
    description: "Estrada com Via Láctea, número de km em tipografia épica.",
    emoji: "🛣️",
    trigger: "A cada marco de km",
  },
  {
    type: "motivational",
    label: "Próximo Destino",
    description: "Carro azul urbano, pergunta motivacional, identidade de membro.",
    emoji: "🗺️",
    trigger: "A qualquer momento",
  },
  {
    type: "explorer",
    label: "Cartão Explorer",
    description: "Fundo escuro premium, logo RIDDY, 3 pilares da marca.",
    emoji: "💎",
    trigger: "Ao entrar no nível Explorer",
  },
];

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export default function RiddyStory() {
  const { user } = useAuth();
  const { isHost } = useUserMode();
  const [, navigate] = useLocation();

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const { data: levelData } = trpc.levels.getMyLevel.useQuery(undefined, {
    enabled: !!user,
  });

  const context = isHost ? "host" : "rider";
  const data = context === "rider" ? levelData?.rider : levelData?.host;
  const cfg = data?.currentLevel ?? data?.config;

  const selectedFormat = STORY_FORMATS[selectedIdx];

  // ─── Monta StoryData ──────────────────────────────────────────────────────
  const buildStoryData = useCallback((): StoryData => {
    const userName = user?.name?.split(" ")[0] ?? "Usuário";
    const levelName = (cfg as any)?.name ?? "Explorer";
    const levelColor = (cfg as any)?.color ?? "#00D4FF";
    const km = (data as any)?.totalKm ?? 1000;
    const milestones = [100, 500, 1000, 2500, 5000, 10000, 25000, 50000];
    const kmMilestone = milestones.find((m) => m >= km) ?? km;
    const nextLevelName = (data as any)?.nextConfig?.name ?? levelName;

    return {
      type: selectedFormat.type,
      userName,
      levelName,
      levelColor,
      newLevelName: nextLevelName,
      km: kmMilestone,
      nextGoal: (data as any)?.nextConfig?.name,
    };
  }, [selectedFormat.type, user, cfg, data]);

  // ─── Gera preview ao trocar formato ──────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setPreviewUrl(null);
    setIsDownloaded(false);
    let cancelled = false;

    const generate = async () => {
      setIsGenerating(true);
      try {
        const storyData = buildStoryData();
        const url = await generateRiddyStory(storyData);
        if (!cancelled) setPreviewUrl(url);
      } catch (err) {
        console.error("Story generation error:", err);
        if (!cancelled) toast.error("Erro ao gerar Story. Tente novamente.");
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    };

    const timer = setTimeout(generate, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedIdx, user, buildStoryData]);

  // ─── Download ─────────────────────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.download = `riddy-story-${selectedFormat.type}-${Date.now()}.png`;
    link.href = previewUrl;
    link.click();
    setIsDownloaded(true);
    toast.success("Story baixado! Compartilhe no Instagram 🚀", { duration: 4000 });
    setTimeout(() => setIsDownloaded(false), 3000);
  }, [previewUrl, selectedFormat.type]);

  // ─── Compartilhar ─────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    if (!previewUrl) return;
    try {
      const res = await fetch(previewUrl);
      const blob = await res.blob();
      const file = new File([blob], `riddy-story-${selectedFormat.type}.png`, {
        type: "image/png",
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "RIDDY Story",
          text: "Compartilhando minha jornada na RIDDY! 🚗✨",
        });
      } else {
        handleDownload();
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        handleDownload();
      }
    }
  }, [previewUrl, selectedFormat.type, handleDownload]);

  const prevFormat = () =>
    setSelectedIdx((i) => (i - 1 + STORY_FORMATS.length) % STORY_FORMATS.length);
  const nextFormat = () =>
    setSelectedIdx((i) => (i + 1) % STORY_FORMATS.length);

  const accentColor = (cfg as any)?.color ?? "#00D4FF";

  return (
    <div
      className="min-h-screen pb-28"
      style={{ background: "linear-gradient(180deg, #020A14 0%, #050F1E 100%)" }}
    >
      {/* ── TOP BAR ── */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between px-5 py-4"
        style={{ background: "rgba(2,10,20,0.92)", backdropFilter: "blur(16px)" }}
      >
        <button
          onClick={() => navigate("/riddy-ranks")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Voltar</span>
        </button>

        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: accentColor }} />
          <span className="text-white font-bold text-sm tracking-wider">RIDDY STORY</span>
        </div>

        <div className="w-16" />
      </div>

      {/* ── HEADER ── */}
      <div className="px-6 pt-6 pb-4 text-center">
        <h1 className="text-white font-black text-2xl tracking-tight mb-1">
          Compartilhe sua jornada
        </h1>
        <p className="text-gray-500 text-sm">
          Stories premium para Instagram · 1080×1920px
        </p>
      </div>

      {/* ── SELETOR DE FORMATOS ── */}
      <div className="px-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {STORY_FORMATS.map((fmt, idx) => (
            <button
              key={fmt.type}
              onClick={() => setSelectedIdx(idx)}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl transition-all"
              style={{
                background:
                  idx === selectedIdx
                    ? `${accentColor}18`
                    : "rgba(255,255,255,0.04)",
                border: `1.5px solid ${
                  idx === selectedIdx ? accentColor : "rgba(255,255,255,0.08)"
                }`,
                boxShadow:
                  idx === selectedIdx ? `0 0 20px ${accentColor}22` : "none",
              }}
            >
              <span className="text-2xl">{fmt.emoji}</span>
              <span
                className="text-xs font-semibold whitespace-nowrap"
                style={{
                  color: idx === selectedIdx ? accentColor : "#6b7280",
                }}
              >
                {fmt.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── PREVIEW DO STORY ── */}
      <div className="px-6">
        <div className="relative">
          {/* Navegação lateral */}
          <button
            onClick={prevFormat}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={nextFormat}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>

          {/* Preview 9:16 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedIdx}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mx-auto rounded-3xl overflow-hidden relative"
              style={{
                width: "100%",
                maxWidth: "320px",
                aspectRatio: "9/16",
                background: "#020A14",
                border: `1.5px solid ${accentColor}22`,
                boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${accentColor}12`,
              }}
            >
              {isGenerating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-10 h-10" style={{ color: accentColor }} />
                  </motion.div>
                  <p className="text-gray-500 text-sm font-medium">Gerando Story...</p>
                </div>
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="RIDDY Story Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <span className="text-5xl">{selectedFormat.emoji}</span>
                  <p className="text-gray-600 text-sm">Carregando...</p>
                </div>
              )}

              {/* Glow sutil no topo */}
              <div
                className="absolute inset-x-0 top-0 h-16 pointer-events-none"
                style={{
                  background: `linear-gradient(180deg, ${accentColor}08, transparent)`,
                }}
              />
            </motion.div>
          </AnimatePresence>

          {/* Dots de paginação */}
          <div className="flex justify-center gap-1.5 mt-4">
            {STORY_FORMATS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                className="rounded-full transition-all"
                style={{
                  width: idx === selectedIdx ? "20px" : "6px",
                  height: "6px",
                  background:
                    idx === selectedIdx ? accentColor : "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Info do formato selecionado */}
        <motion.div
          key={`info-${selectedIdx}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-5 text-center"
        >
          <p className="text-white font-bold text-lg">{selectedFormat.label}</p>
          <p className="text-gray-500 text-sm mt-0.5">{selectedFormat.description}</p>
          <div
            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <span className="text-xs" style={{ color: accentColor }}>⚡</span>
            <span className="text-gray-500 text-xs">{selectedFormat.trigger}</span>
          </div>
        </motion.div>

        {/* Botões de ação */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleShare}
            disabled={isGenerating || !previewUrl}
            className="flex-1 h-14 rounded-2xl font-bold text-base"
            style={{
              background:
                isGenerating || !previewUrl
                  ? "rgba(255,255,255,0.06)"
                  : `linear-gradient(135deg, ${accentColor}, #0066FF)`,
              color: isGenerating || !previewUrl ? "#4b5563" : "#000",
              boxShadow:
                !isGenerating && previewUrl
                  ? `0 4px 24px ${accentColor}33`
                  : "none",
            }}
          >
            <Share2 className="w-5 h-5 mr-2" />
            Compartilhar
          </Button>

          <Button
            onClick={handleDownload}
            disabled={isGenerating || !previewUrl}
            variant="outline"
            className="h-14 px-5 rounded-2xl font-bold"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1.5px solid rgba(255,255,255,0.12)",
              color: isDownloaded ? "#22c55e" : "white",
            }}
          >
            {isDownloaded ? (
              <Check className="w-5 h-5" />
            ) : (
              <Download className="w-5 h-5" />
            )}
          </Button>
        </div>

        <p className="text-center text-xs text-gray-600 mt-3">
          Alta resolução 1080×1920px · Perfeito para Instagram Stories
        </p>

        {/* Dica */}
        <div
          className="mt-5 p-4 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p className="text-gray-400 text-xs text-center leading-relaxed">
            💡 <strong className="text-gray-300">Dica:</strong> Baixe o Story e adicione ao
            Instagram como imagem de fundo. Use "Adicionar Sticker" para marcar{" "}
            <span style={{ color: accentColor }}>@riddycar</span>
          </p>
        </div>
      </div>
    </div>
  );
}
