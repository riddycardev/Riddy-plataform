/**
 * LevelBadge — Badge premium de nível RIDDY Ranks
 * Exibe o nível atual do usuário com ícone, nome e barra de progresso
 */
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { Sparkles } from "lucide-react";

interface LevelBadgeProps {
  /** Se true, exibe versão compacta (só ícone + nome, sem barra) */
  compact?: boolean;
  /** Se true, clicável — navega para /riddy-ranks */
  clickable?: boolean;
  /** Contexto: locatário ou anfitrião */
  context?: "rider" | "host";
}

export default function LevelBadge({ compact = false, clickable = true, context = "rider" }: LevelBadgeProps) {
  const { user } = useAuth();
  const { data: levelData } = trpc.levels.getMyLevel.useQuery(undefined, {
    enabled: !!user,
    staleTime: 60_000,
  });

  if (!levelData) return null;

  const data = context === "rider" ? levelData.rider : levelData.host;
  const cfg = data.config;

  const badge = (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`inline-flex flex-col gap-1 ${clickable ? "cursor-pointer" : ""}`}
    >
      {/* Badge principal */}
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
        style={{
          background: `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}11)`,
          border: `1px solid ${cfg.color}44`,
          color: cfg.color,
        }}
      >
        <span className="text-sm">{cfg.icon}</span>
        <span>{cfg.name}</span>
        {data.currentLevel === 5 && (
          <Sparkles className="w-3 h-3" style={{ color: cfg.color }} />
        )}
      </div>

      {/* Barra de progresso (apenas no modo não-compacto) */}
      {!compact && data.nextLevel && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-[2px] rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${cfg.color}, ${data.nextConfig?.color ?? cfg.color})` }}
            />
          </div>
          <span className="text-[10px] text-gray-500 whitespace-nowrap">
            {data.rentalsToNext} loc. para {data.nextConfig?.name}
          </span>
        </div>
      )}
      {!compact && !data.nextLevel && (
        <p className="text-[10px] text-gray-500">Nível máximo atingido</p>
      )}
    </motion.div>
  );

  if (clickable) {
    return <Link href="/riddy-ranks">{badge}</Link>;
  }
  return badge;
}
