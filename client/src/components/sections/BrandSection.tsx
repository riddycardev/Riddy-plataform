import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Sparkles, Zap, Shield, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";

const brandPillars = [
  {
    icon: Sparkles,
    title: "Premium Acessível",
    description:
      "Democratizamos o acesso a carros de alto padrão. O design e a comunicação elevam a percepção de valor, atraindo usuários qualificados e afastando o risco.",
  },
  {
    icon: Zap,
    title: "Moderna & Ágil",
    description:
      "Uma marca nativa digital que fala a língua da nova economia. Design clean, UX intuitiva e comunicação direta, sem o 'corporativês' das locadoras tradicionais.",
  },
  {
    icon: Shield,
    title: "Confiança Radical",
    description:
      "Transparência total em cada etapa. Do seguro à precificação, eliminamos as 'letras miúdas' para construir relacionamentos de longo prazo.",
  },
  {
    icon: Users,
    title: "Comunidade Curada",
    description:
      "Mais que clientes, criamos um clube. Proprietários sentem orgulho de compartilhar, e motoristas cuidam como se fosse deles. O pertencimento gera zelo.",
  },
];

export default function BrandSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { data: platformStats } = trpc.review.getPlatformStats.useQuery();

  const averageRating = platformStats?.averageRating ?? 0;
  const hasRealRating = averageRating > 0;

  return (
    <section className="section-padding relative overflow-hidden" ref={ref}>
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 via-transparent to-teal/5" />
      </div>

      <div className="container relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block text-cyan font-semibold text-sm uppercase tracking-wider mb-4"
          >
            Posicionamento de Marca
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
          >
            MARCA ASPIRACIONAL{" "}
            <span className="text-muted-foreground font-normal">& CONFIÁVEL</span>
          </motion.h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Brand Promise Card */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="glass-card overflow-hidden">
              {/* Image */}
              <div className="relative h-64 md:h-80">
                <img
                  src="/images/app-mockup.png"
                  alt="RIDDY App"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                
                {/* Brand Promise Badge */}
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="inline-block px-3 py-1 rounded-full bg-cyan text-navy text-xs font-semibold mb-3">
                    BRAND PROMISE
                  </span>
                  <h3 className="font-display text-2xl md:text-3xl font-bold leading-tight">
                    "Liberdade para ir.
                    <br />
                    Segurança para ficar."
                  </h3>
                </div>
              </div>

              {/* Description */}
              <div className="p-6">
                <p className="text-muted-foreground leading-relaxed">
                  Construímos uma marca que equilibra a adrenalina da liberdade com a
                  solidez da confiança. Um convite ao movimento, apoiado por tecnologia
                  invisível e infalível.
                </p>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="glass-card p-4 text-center"
              >
                <p className="font-display text-3xl font-bold text-cyan">
                  {hasRealRating ? averageRating.toFixed(1) : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">USER RATING</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="glass-card p-4 text-center"
              >
                <p className="font-display text-3xl font-bold text-teal">24/7</p>
                <p className="text-xs text-muted-foreground mt-1">SUPORTE</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="glass-card p-4 text-center"
              >
                <p className="font-display text-2xl font-bold text-foreground">🇧🇷</p>
                <p className="text-xs text-muted-foreground mt-1">EQUIPE LOCAL</p>
              </motion.div>
            </div>
          </motion.div>

          {/* Right: Brand Pillars */}
          <div className="space-y-4">
            {brandPillars.map((pillar, index) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, x: 40 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className="glass-card p-5 group hover:border-cyan/30 transition-colors"
              >
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-cyan/10 flex items-center justify-center shrink-0 group-hover:bg-cyan/20 transition-colors">
                    <pillar.icon className="w-5 h-5 text-cyan" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold mb-1">{pillar.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Strategic Quote */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 glass-card p-8 text-center max-w-3xl mx-auto"
        >
          <blockquote className="text-lg md:text-xl italic text-muted-foreground mb-4">
            "A RIDDY não vende aluguel de carros. Vendemos a experiência de possuir o
            carro perfeito para cada momento, sem o ônus da posse."
          </blockquote>
          <cite className="text-sm font-semibold text-cyan not-italic">
            — POSICIONAMENTO ESTRATÉGICO
          </cite>
        </motion.div>
      </div>
    </section>
  );
}
