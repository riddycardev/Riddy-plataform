/**
 * ShareableCard — Cartão 9:16 premium para Instagram Stories
 * Design: dark glassmorphism, gradiente do nível, stats, branding RIDDY
 * Geração: html2canvas → PNG download
 */
import { forwardRef } from "react";
import type { RiderLevelConfig, HostLevelConfig } from "@shared/levels";

// ─── TIPOS ────────────────────────────────────────────────────────────────────
export interface ShareableCardProps {
  userName: string;
  context: "rider" | "host";
  levelConfig: RiderLevelConfig | HostLevelConfig;
  currentLevel: number;
  totalRentals: number;
  totalKm?: number;
  totalEarnings?: number;
  avgRating?: number;
  progressPercent: number;
  nextLevelName?: string;
  unlockedAchievements?: number;
}

// ─── EMOJI MAP ────────────────────────────────────────────────────────────────
const EMOJI_MAP: Record<string, string> = {
  Compass: "🧭",
  Map: "🗺️",
  Mountain: "⛰️",
  Steering: "🏎️",
  Crown: "👑",
  Key: "🔑",
  Shield: "🛡️",
  Star: "⭐",
  Trophy: "🏆",
  Diamond: "💎",
  Home: "🏠",
  ShieldCheck: "✅",
  Zap: "⚡",
  TrendingUp: "📈",
  Car: "🚗",
  Award: "🎖️",
  Sunrise: "🌅",
  CheckCircle: "✔️",
  Gem: "💎",
};

// ─── MOTIVATIONAL PHRASES ────────────────────────────────────────────────────
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

// ─── COMPONENT ────────────────────────────────────────────────────────────────
/**
 * Rendered off-screen (position: fixed, left: -9999px) and captured via html2canvas.
 * Width: 405px, Height: 720px → 9:16 ratio at 1x (html2canvas scale=2 → 810×1440px)
 */
export const ShareableCard = forwardRef<HTMLDivElement, ShareableCardProps>(
  (
    {
      userName,
      context,
      levelConfig,
      currentLevel,
      totalRentals,
      totalKm,
      totalEarnings,
      avgRating,
      progressPercent,
      nextLevelName,
      unlockedAchievements = 0,
    },
    ref
  ) => {
    const color = levelConfig.color;
    const phrase =
      context === "rider"
        ? RIDER_PHRASES[currentLevel] ?? RIDER_PHRASES[1]
        : HOST_PHRASES[currentLevel] ?? HOST_PHRASES[1];

    // Stats a exibir
    const stats =
      context === "rider"
        ? [
            { label: "Locações", value: String(totalRentals) },
            { label: "KM rodados", value: (totalKm ?? 0).toLocaleString("pt-BR") },
            {
              label: "Nota média",
              value: avgRating && avgRating > 0 ? avgRating.toFixed(1) : "—",
            },
          ]
        : [
            { label: "Locações", value: String(totalRentals) },
            {
              label: "Faturamento",
              value: `R$ ${((totalEarnings ?? 0) / 1000).toFixed(1)}k`,
            },
            {
              label: "Nota média",
              value: avgRating && avgRating > 0 ? avgRating.toFixed(1) : "—",
            },
          ];

    const emoji = EMOJI_MAP[levelConfig.icon] ?? "🏆";
    const firstName = userName.split(" ")[0];

    return (
      <div
        ref={ref}
        style={{
          position: "fixed",
          left: "-9999px",
          top: "-9999px",
          width: "405px",
          height: "720px",
          overflow: "hidden",
          fontFamily:
            "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: "#020A14",
          borderRadius: "24px",
        }}
      >
        {/* ── BACKGROUND GRADIENT ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at 80% 10%, ${color}40 0%, transparent 55%),
                         radial-gradient(ellipse at 20% 90%, ${color}25 0%, transparent 50%),
                         linear-gradient(180deg, #020A14 0%, #0A0F1C 50%, #020A14 100%)`,
          }}
        />

        {/* ── GRID PATTERN ── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(${color}08 1px, transparent 1px),
                               linear-gradient(90deg, ${color}08 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* ── TOP GLOW LINE ── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "10%",
            right: "10%",
            height: "2px",
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            boxShadow: `0 0 20px ${color}88`,
          }}
        />

        {/* ── CONTENT ── */}
        <div
          style={{
            position: "relative",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            padding: "32px 28px",
          }}
        >
          {/* ── HEADER: RIDDY LOGO ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "32px",
            }}
          >
            {/* Logo mark */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: `linear-gradient(135deg, ${color}88, ${color}44)`,
                  border: `1px solid ${color}66`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  fontWeight: 900,
                  color: color,
                  letterSpacing: "-1px",
                }}
              >
                R
              </div>
              <div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 900,
                    color: "#FFFFFF",
                    letterSpacing: "2px",
                  }}
                >
                  RIDDY
                </div>
                <div
                  style={{
                    fontSize: "8px",
                    color: `${color}cc`,
                    letterSpacing: "1.5px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  RANKS
                </div>
              </div>
            </div>

            {/* Context badge */}
            <div
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                background: `${color}18`,
                border: `1px solid ${color}44`,
                fontSize: "10px",
                fontWeight: 700,
                color: color,
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              {context === "rider" ? "🚗 Locatário" : "🏠 Anfitrião"}
            </div>
          </div>

          {/* ── LEVEL HERO ── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              marginBottom: "28px",
            }}
          >
            {/* Big emoji */}
            <div
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "28px",
                background: `linear-gradient(135deg, ${color}30, ${color}10)`,
                border: `2px solid ${color}55`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "48px",
                marginBottom: "20px",
                boxShadow: `0 0 40px ${color}44, 0 0 80px ${color}22`,
              }}
            >
              {emoji}
            </div>

            {/* User name */}
            <div
              style={{
                fontSize: "13px",
                color: `${color}cc`,
                fontWeight: 600,
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              {firstName}
            </div>

            {/* Level name */}
            <div
              style={{
                fontSize: "32px",
                fontWeight: 900,
                color: "#FFFFFF",
                lineHeight: 1.1,
                marginBottom: "6px",
                letterSpacing: "-0.5px",
              }}
            >
              {levelConfig.name}
            </div>

            {/* Level number badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 14px",
                borderRadius: "20px",
                background: `${color}20`,
                border: `1px solid ${color}44`,
                marginBottom: "12px",
              }}
            >
              <span style={{ fontSize: "10px", color: color, fontWeight: 700, letterSpacing: "1px" }}>
                NÍVEL {currentLevel}
              </span>
              <span style={{ color: `${color}66`, fontSize: "10px" }}>•</span>
              <span style={{ fontSize: "10px", color: `${color}aa`, fontWeight: 600 }}>
                {levelConfig.subtitle}
              </span>
            </div>
          </div>

          {/* ── PROGRESS BAR ── */}
          {nextLevelName && (
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <span style={{ fontSize: "10px", color: "#666", fontWeight: 600 }}>
                  Progresso para {nextLevelName}
                </span>
                <span style={{ fontSize: "10px", color: color, fontWeight: 700 }}>
                  {progressPercent}%
                </span>
              </div>
              <div
                style={{
                  height: "6px",
                  borderRadius: "3px",
                  background: "rgba(255,255,255,0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progressPercent}%`,
                    borderRadius: "3px",
                    background: `linear-gradient(90deg, ${color}, ${color}88)`,
                    boxShadow: `0 0 8px ${color}88`,
                  }}
                />
              </div>
            </div>
          )}

          {/* ── STATS GRID ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "10px",
              marginBottom: "24px",
            }}
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                style={{
                  padding: "14px 8px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 900,
                    color: "#FFFFFF",
                    lineHeight: 1,
                    marginBottom: "4px",
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: "9px",
                    color: "#555",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* ── ACHIEVEMENTS BADGE ── */}
          {unlockedAchievements > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "12px",
                background: "rgba(255,215,0,0.08)",
                border: "1px solid rgba(255,215,0,0.2)",
                marginBottom: "20px",
              }}
            >
              <span style={{ fontSize: "16px" }}>🏅</span>
              <span
                style={{
                  fontSize: "11px",
                  color: "#FFD700",
                  fontWeight: 700,
                }}
              >
                {unlockedAchievements} conquista{unlockedAchievements !== 1 ? "s" : ""} desbloqueada{unlockedAchievements !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* ── MOTIVATIONAL PHRASE ── */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "14px",
                background: `linear-gradient(135deg, ${color}10, rgba(255,255,255,0.02))`,
                border: `1px solid ${color}22`,
              }}
            >
              <p
                style={{
                  fontSize: "12px",
                  color: "#888",
                  fontStyle: "italic",
                  lineHeight: 1.5,
                  margin: 0,
                  textAlign: "center",
                }}
              >
                "{phrase}"
              </p>
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "9px",
                  color: "#444",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                Junte-se a mim
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: color,
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                }}
              >
                riddycar.com
              </div>
            </div>

            {/* Bottom glow dot */}
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: color,
                boxShadow: `0 0 12px ${color}, 0 0 24px ${color}88`,
              }}
            />
          </div>
        </div>

        {/* ── BOTTOM GLOW LINE ── */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "10%",
            right: "10%",
            height: "2px",
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            boxShadow: `0 0 20px ${color}88`,
          }}
        />
      </div>
    );
  }
);

ShareableCard.displayName = "ShareableCard";
