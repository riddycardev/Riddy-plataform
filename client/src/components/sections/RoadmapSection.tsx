import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { CheckCircle, ArrowRight, MapPin, Cpu, Crown } from "lucide-react";

const phases = [
  {
    period: "PRÓXIMO 0-6 MESES",
    title: "Validação & Tração",
    subtitle: "H1 2026",
    status: "active",
    items: [
      { text: "MVP Validado (NPS 92)", done: true },
      { text: "500+ Carros na Base", done: true },
      { text: "Unit Economics Positivos", done: true },
    ],
  },
  {
    period: "PRÓXIMOS 6-12 MESES",
    title: "Expansão Estratégica",
    subtitle: "H2 2026",
    status: "upcoming",
    items: [
      { text: "Launch: SP, RJ e BH", done: false },
      { text: "Parcerias de Seguros", done: false },
      { text: "Captação Series A", done: false },
    ],
  },
  {
    period: "ANO 1-2",
    title: "Consolidação & Escala",
    subtitle: "2026 - 2027",
    status: "future",
    items: [
      { text: "Expansão Nacional", done: false },
      { text: "Plataforma Tech 2.0", done: false },
      { text: "Breakeven Operacional", done: false },
    ],
  },
  {
    period: "VISÃO 3-5 ANOS",
    title: "Liderança Global",
    subtitle: "2028+",
    status: "vision",
    items: [
      { text: "Expansão LATAM", done: false },
      { text: "IPO Readiness", done: false },
      { text: "Liderança de Mercado", done: false },
    ],
  },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "active":
      return CheckCircle;
    case "upcoming":
      return ArrowRight;
    case "future":
      return Cpu;
    case "vision":
      return Crown;
    default:
      return CheckCircle;
  }
};

export default function RoadmapSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="roadmap" className="section-padding bg-muted/30" ref={ref}>
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block text-cyan font-semibold text-sm uppercase tracking-wider mb-4"
          >
            Roadmap Estratégico
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold"
          >
            CLAREZA NA <span className="text-gradient">EXECUÇÃO</span>
          </motion.h2>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline Line - Desktop */}
          <div className="hidden lg:block absolute top-8 left-0 right-0 h-0.5 bg-border">
            <motion.div
              initial={{ width: 0 }}
              animate={isInView ? { width: "25%" } : {}}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-gradient-to-r from-cyan to-teal"
            />
          </div>

          {/* Phases Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {phases.map((phase, index) => {
              const StatusIcon = getStatusIcon(phase.status);
              const isActive = phase.status === "active";

              return (
                <motion.div
                  key={phase.title}
                  initial={{ opacity: 0, y: 40 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.15 }}
                  className="relative"
                >
                  {/* Timeline Node - Desktop */}
                  <div className="hidden lg:flex absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-background border-2 border-border items-center justify-center z-10">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isActive ? "bg-cyan animate-pulse" : "bg-muted"
                      }`}
                    />
                  </div>

                  {/* Card */}
                  <div
                    className={`glass-card p-6 h-full transition-all duration-300 ${
                      isActive
                        ? "border-cyan/50 glow-cyan"
                        : "hover:border-border/80"
                    }`}
                  >
                    {/* Period Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          isActive
                            ? "bg-cyan/20 text-cyan border border-cyan/30"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {phase.period}
                      </span>
                      {isActive && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                          EM EXECUÇÃO
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-display text-xl font-bold mb-1">
                      {phase.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {phase.subtitle}
                    </p>

                    {/* Items */}
                    <ul className="space-y-2">
                      {phase.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-2">
                          {item.done ? (
                            <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-muted-foreground/30 shrink-0 mt-0.5" />
                          )}
                          <span
                            className={`text-sm ${
                              item.done
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {item.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Status Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 1 }}
          className="flex justify-center mt-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            EM EXECUÇÃO
          </span>
        </motion.div>
      </div>
    </section>
  );
}
