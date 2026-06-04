/**
 * RIDDY LEGEND — Tela Exclusiva de Status Premium
 * Identidade visual própria: dourado, partículas, glassmorphism.
 * Acessível apenas para usuários com nível 5 (Riddy Legend).
 */
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Crown, Star, Zap, Shield, Gift, Trophy, ChevronRight,
  Sparkles, Globe, TrendingUp, Lock, Loader2,
} from "lucide-react";

// ─── PARTÍCULAS DOURADAS ──────────────────────────────────────────────────────

function GoldParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: {
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; life: number; maxLife: number;
    }[] = [];

    const createParticle = () => ({
      x: Math.random() * canvas.width,
      y: canvas.height + 10,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -(Math.random() * 1.5 + 0.5),
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.6 + 0.2,
      life: 0,
      maxLife: Math.random() * 200 + 100,
    });

    for (let i = 0; i < 40; i++) {
      const p = createParticle();
      p.y = Math.random() * canvas.height;
      p.life = Math.random() * p.maxLife;
      particles.push(p);
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const progress = p.life / p.maxLife;
        const alpha = p.opacity * (1 - progress);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.fill();

        if (p.life >= p.maxLife || p.y < -10) {
          particles[i] = createParticle();
        }
      }

      animId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function RiddyLegend() {
  const { user } = useAuth();
  const { data: levelData, isLoading } = trpc.levels.getMyLevel.useQuery(undefined, {
    enabled: !!user,
  });

  const isLegend = levelData?.rider.currentLevel === 5;
  const isHostLegend = levelData?.host.currentLevel === 5;
  const hasLegend = isLegend || isHostLegend;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A00] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A00] overflow-hidden">
      <Header />

      {/* ── Hero Legend ── */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Partículas douradas */}
        <GoldParticles />

        {/* Gradiente de fundo */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-yellow-500/5 blur-3xl" />
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-yellow-900/10 via-transparent to-[#0A0A00]" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Ícone Crown animado */}
            <div className="flex justify-center mb-6">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-yellow-500/30">
                  <Crown className="w-12 h-12 text-black" />
                </div>
                {/* Halo */}
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border-2 border-yellow-400/50"
                />
              </motion.div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm font-semibold mb-4">
              <Sparkles className="w-4 h-4" />
              Status Exclusivo
            </div>

            <h1 className="text-5xl sm:text-7xl font-black mb-4">
              <span className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-600 bg-clip-text text-transparent">
                RIDDY
              </span>
              <br />
              <span className="text-white">LEGEND</span>
            </h1>

            <p className="text-xl text-white/50 max-w-xl mx-auto mb-8">
              {hasLegend
                ? "Você alcançou o mais alto nível da plataforma. Bem-vindo à elite."
                : "O topo da hierarquia RIDDY. Conquistado por poucos. Reconhecido por todos."}
            </p>

            {hasLegend ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/30">
                  <Avatar className="w-10 h-10 border-2 border-yellow-400/50">
                    <AvatarImage src={user?.avatarUrl ?? undefined} />
                    <AvatarFallback className="bg-yellow-500/20 text-yellow-400">
                      {user?.name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-white font-bold">{user?.name?.split(" ")[0]}</p>
                    <p className="text-yellow-400 text-xs font-semibold">Riddy Legend</p>
                  </div>
                </div>
                <Link href="/riddy-ranks">
                  <Button className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold hover:from-yellow-400 hover:to-amber-500 px-6">
                    Ver Meus Benefícios
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <Link href="/riddy-ranks">
                <Button
                  variant="outline"
                  className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 px-8"
                >
                  Ver Meu Progresso
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Benefícios Exclusivos ── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-3">
              Benefícios{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                Exclusivos
              </span>
            </h2>
            <p className="text-white/40">Apenas Riddy Legends têm acesso a estes privilégios.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {LEGEND_BENEFITS.map((benefit, idx) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className={`relative rounded-2xl p-6 border overflow-hidden ${
                  hasLegend
                    ? "bg-yellow-500/5 border-yellow-500/20"
                    : "bg-white/[0.02] border-white/[0.06]"
                }`}
              >
                {!hasLegend && (
                  <div className="absolute top-3 right-3">
                    <Lock className="w-4 h-4 text-white/20" />
                  </div>
                )}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: benefit.color + "22" }}
                >
                  <benefit.icon className="w-6 h-6" style={{ color: benefit.color }} />
                </div>
                <h3 className={`font-bold mb-2 ${hasLegend ? "text-white" : "text-white/50"}`}>
                  {benefit.title}
                </h3>
                <p className={`text-sm ${hasLegend ? "text-white/60" : "text-white/30"}`}>
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Caminho para Legend ── */}
      {!hasLegend && (
        <section className="py-16 px-4 border-t border-white/5">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-black text-white mb-3">
              Como Alcançar o Status Legend?
            </h2>
            <p className="text-white/40 mb-8">
              O status Riddy Legend é conquistado por meio de consistência, reputação e volume.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {LEGEND_REQUIREMENTS.map((req, idx) => (
                <div
                  key={req.label}
                  className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 text-center"
                >
                  <div className="text-3xl font-black text-yellow-400 mb-1">{req.value}</div>
                  <div className="text-white/60 text-sm">{req.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link href="/riddy-ranks">
                <Button className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold px-8">
                  Ver Meu Progresso Atual
                  <TrendingUp className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Hall da Fama ── */}
      <LegendHallOfFame />

      <Footer />
    </div>
  );
}

// ─── HALL DA FAMA ─────────────────────────────────────────────────────────────

function LegendHallOfFame() {
  const { data: ranking } = trpc.levels.getRanking.useQuery(
    { context: "renter", scope: "national", limit: 5 },
    { staleTime: 120_000 }
  );

  const legends = ranking?.filter((r) => r.level === 5) ?? [];

  if (legends.length === 0) return null;

  return (
    <section className="py-16 px-4 border-t border-yellow-500/10">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-semibold mb-4">
            <Crown className="w-4 h-4" />
            Hall da Fama
          </div>
          <h2 className="text-2xl font-black text-white">
            Os Riddy Legends da Plataforma
          </h2>
        </div>

        <div className="space-y-3">
          {legends.map((legend, idx) => (
            <motion.div
              key={legend.userId}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/20"
            >
              <div className="relative">
                <Avatar className="w-12 h-12 border-2 border-yellow-400/50">
                  <AvatarImage src={legend.avatar ?? undefined} />
                  <AvatarFallback className="bg-yellow-500/20 text-yellow-400">
                    {(legend.name ?? "?")[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Crown className="absolute -top-2 -right-1 w-4 h-4 text-yellow-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold">{legend.name?.split(" ")[0]}</p>
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Globe className="w-3 h-3" />
                  {[legend.city, legend.state].filter(Boolean).join(", ") || "Brasil"}
                  <span>·</span>
                  <span>{legend.totalRentals} locações</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-yellow-400 font-bold">
                <Zap className="w-4 h-4" />
                {legend.score}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── DADOS ESTÁTICOS ──────────────────────────────────────────────────────────

const LEGEND_BENEFITS = [
  {
    icon: Gift,
    color: "#FFD700",
    title: "12% de Desconto",
    description: "O maior desconto da plataforma em todas as locações, aplicado automaticamente.",
  },
  {
    icon: Shield,
    color: "#22D3EE",
    title: "Garantia Mínima",
    description: "Caução reduzida ao mínimo. Sua reputação fala por você.",
  },
  {
    icon: Zap,
    color: "#A855F7",
    title: "Prioridade Máxima",
    description: "Suas reservas têm prioridade sobre outros usuários em caso de conflito.",
  },
  {
    icon: Star,
    color: "#F59E0B",
    title: "Badge Dourado",
    description: "Badge exclusivo visível em todo o perfil e nas listagens de veículos.",
  },
  {
    icon: Trophy,
    color: "#EC4899",
    title: "Suporte VIP",
    description: "Linha direta com a equipe RIDDY. Resposta em menos de 2 horas.",
  },
  {
    icon: Globe,
    color: "#10B981",
    title: "Hall da Fama",
    description: "Seu nome na página Riddy Legend, visível para toda a comunidade.",
  },
];

const LEGEND_REQUIREMENTS = [
  { value: "100+", label: "Locações concluídas" },
  { value: "4.8+", label: "Avaliação média" },
  { value: "850+", label: "Score Riddy" },
];
