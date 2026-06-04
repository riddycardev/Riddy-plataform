import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Clock, DollarSign, FileText, Building2 } from "lucide-react";

const problems = [
  {
    icon: DollarSign,
    title: "Custo Proibitivo para Usuários",
    description:
      "Modelos tradicionais cobram taxas inflacionadas para cobrir ineficiências operacionais, tornando o acesso inviável para o dia a dia.",
  },
  {
    icon: FileText,
    title: "Burocracia & Baixa Rentabilidade",
    description:
      "Para proprietários, rentabilizar o carro é complexo, arriscado e burocrático, com margens corroídas por intermediários.",
  },
  {
    icon: Building2,
    title: "Modelos Legados Engessados",
    description:
      "Grandes locadoras dependem de CAPEX pesado e renovação de frota, incapazes de escalar elasticamente conforme a demanda.",
  },
];

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

export default function ProblemSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="section-padding bg-muted/30" ref={ref}>
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block text-coral font-semibold text-sm uppercase tracking-wider mb-4"
          >
            O Problema
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold"
          >
            FALHAS ESTRUTURAIS{" "}
            <span className="text-muted-foreground font-normal">DO MERCADO ATUAL</span>
          </motion.h2>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Big Stat */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-card p-8 lg:p-10"
          >
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-coral" />
              <h3 className="font-display text-xl font-semibold">
                Subutilização Massiva
              </h3>
            </div>

            {/* Animated Percentage */}
            <div className="relative mb-8">
              <div className="text-7xl md:text-8xl lg:text-9xl font-display font-bold text-coral">
                <AnimatedCounter target={95} suffix="%" />
              </div>
              <p className="text-lg text-muted-foreground mt-2">TEMPO OCIOSO</p>
            </div>

            {/* Progress Ring Visual */}
            <div className="relative w-48 h-48 mx-auto mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className="text-coral"
                  initial={{ strokeDasharray: "0 283" }}
                  animate={isInView ? { strokeDasharray: "268.65 283" } : {}}
                  transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-display font-bold text-coral">95%</span>
              </div>
            </div>

            <p className="text-muted-foreground text-center">
              A frota privada passa a maior parte da vida útil parada, depreciando
              na garagem enquanto gera custos de manutenção e impostos.
            </p>
          </motion.div>

          {/* Right: Problem Cards */}
          <div className="space-y-4">
            {problems.map((problem, index) => (
              <motion.div
                key={problem.title}
                initial={{ opacity: 0, x: 40 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className="glass-card p-6 group hover:border-coral/30 transition-colors"
              >
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-coral/10 flex items-center justify-center shrink-0 group-hover:bg-coral/20 transition-colors">
                    <problem.icon className="w-5 h-5 text-coral" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold mb-2">
                      {problem.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {problem.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
