import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Percent, Crown, Shield, TrendingUp, CheckCircle } from "lucide-react";

const revenueSources = [
  {
    icon: Percent,
    tag: "Core Revenue",
    title: "Taxa de Transação",
    description:
      "Take rate escalável (15-25%) sobre cada aluguel. Tiers dinâmicos recompensam proprietários de alta performance.",
  },
  {
    icon: Crown,
    tag: "Recorrência (ARR)",
    title: "Assinaturas Power-Host",
    description:
      "SaaS para gestão de frotas (5+ carros): ferramentas avançadas de pricing, relatórios fiscais e suporte prioritário.",
  },
  {
    icon: Shield,
    tag: "High Margin",
    title: "Serviços Adicionais",
    description:
      "Margem sobre seguros on-demand, taxas de limpeza, entrega de veículo e gestão de multas.",
  },
  {
    icon: TrendingUp,
    tag: "Ticket Médio",
    title: "Upsells Estratégicos",
    description:
      "Venda cruzada durante a jornada: upgrades de categoria, quilometragem extra, condutor adicional e acessórios.",
  },
];

function AnimatedValue({ value, prefix = "", suffix = "" }: { value: string; prefix?: string; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [displayed, setDisplayed] = useState(false);

  useEffect(() => {
    if (isInView) {
      setTimeout(() => setDisplayed(true), 300);
    }
  }, [isInView]);

  return (
    <span ref={ref} className={`transition-opacity duration-500 ${displayed ? "opacity-100" : "opacity-0"}`}>
      {prefix}{value}{suffix}
    </span>
  );
}

export default function RevenueSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="section-padding" ref={ref}>
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block text-teal font-semibold text-sm uppercase tracking-wider mb-4"
          >
            Modelo de Negócio
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
          >
            RECEITA <span className="text-gradient">ESCALÁVEL</span> & PREVISÍVEL
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-muted-foreground"
          >
            Uma arquitetura financeira desenhada para margem composta, recorrência e LTV de longo prazo.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Unit Economics Card */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-2 glass-card p-6 lg:p-8"
          >
            <h3 className="font-display text-xl font-bold mb-6">Unit Economics</h3>

            <div className="space-y-6">
              {/* LTV */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">LTV (Lifetime Value)</p>
                  <p className="font-display text-2xl font-bold">
                    <AnimatedValue prefix="R$ " value="1.200" suffix=" / ano" />
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal/20 text-teal border border-teal/30">
                  Alta Rentabilidade
                </span>
              </div>

              {/* CAC */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">CAC (Custo de Aquisição)</p>
                  <p className="font-display text-2xl font-bold">
                    <AnimatedValue prefix="Payback < " value="4" suffix=" meses" />
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-cyan/20 text-cyan border border-cyan/30">
                  Eficiente
                </span>
              </div>

              {/* Margem */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground">Margem Bruta</p>
                  <p className="font-display text-3xl font-bold text-teal">
                    <AnimatedValue prefix="~" value="35" suffix="%" />
                  </p>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={isInView ? { width: "35%" } : {}}
                    transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-teal to-cyan"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Estrutura asset-light sem depreciação de frota.
                </p>
              </div>
            </div>

            {/* Focus Badge */}
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Foco em retenção e upsell automatizado.
            </div>
          </motion.div>

          {/* Revenue Sources Grid */}
          <div className="lg:col-span-3 grid sm:grid-cols-2 gap-4">
            {revenueSources.map((source, index) => (
              <motion.div
                key={source.title}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                className="glass-card p-5 group hover:border-teal/30 transition-colors"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center shrink-0 group-hover:bg-teal/20 transition-colors">
                    <source.icon className="w-5 h-5 text-teal" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded bg-muted text-muted-foreground">
                    {source.tag}
                  </span>
                </div>
                <h4 className="font-display font-semibold mb-2">{source.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {source.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Validation Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mt-12 text-center"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Modelo Validado em 3 Mercados Piloto
          </span>
        </motion.div>
      </div>
    </section>
  );
}
