import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { TrendingUp, MapPin, Globe } from "lucide-react";

const marketInsights = [
  {
    icon: TrendingUp,
    tag: "Alta Demanda",
    title: "Crescimento Exponencial",
    description:
      "A mudança cultural de 'posse' para 'acesso' está acelerando. A América Latina é a região de crescimento mais rápido para mobilidade compartilhada no mundo pós-2023.",
  },
  {
    icon: MapPin,
    title: "Território Inexplorado",
    description:
      "Enquanto EUA e Europa estão saturados, a LATAM carece de um player dominante no segmento P2P Premium. O alto custo dos veículos zero km favorece massivamente nosso modelo.",
  },
  {
    icon: Globe,
    title: "Modelo Validado",
    description:
      "Turo (EUA) e Getaround (Europa) provaram a tese com valuations bilionários. A RIDDY adapta esse sucesso para a realidade tropicalizada da América Latina.",
  },
];

export default function MarketSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="mercado" className="section-padding bg-muted/30" ref={ref}>
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block text-cyan font-semibold text-sm uppercase tracking-wider mb-4"
          >
            Mercado & Escala
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold"
          >
            MERCADO MASSIVO,{" "}
            <span className="text-gradient">OPORTUNIDADE INEXPLORADA</span>
          </motion.h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* TAM/SAM/SOM Visualization */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Concentric Circles */}
            <div className="relative w-full max-w-md mx-auto aspect-square">
              {/* TAM Circle */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={isInView ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center"
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-background rounded-full">
                  <span className="text-xs font-medium text-muted-foreground">TAM</span>
                </div>
              </motion.div>

              {/* SAM Circle */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={isInView ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="absolute inset-[15%] rounded-full border-2 border-cyan/50 flex items-center justify-center"
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-background rounded-full">
                  <span className="text-xs font-medium text-cyan">SAM</span>
                </div>
              </motion.div>

              {/* SOM Circle */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={isInView ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="absolute inset-[35%] rounded-full bg-gradient-to-br from-cyan/20 to-teal/20 border-2 border-cyan flex items-center justify-center"
              >
                <div className="text-center">
                  <span className="text-xs font-medium text-cyan block mb-1">SOM</span>
                  <span className="font-display text-2xl md:text-3xl font-bold text-cyan">
                    $120M
                  </span>
                  <span className="text-xs text-muted-foreground block mt-1">
                    Meta RIDDY (5-10 anos)
                  </span>
                </div>
              </motion.div>

              {/* TAM Value */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="absolute top-4 right-4 text-right"
              >
                <span className="font-display text-3xl md:text-4xl font-bold text-foreground">
                  $65B
                </span>
                <span className="text-xs text-muted-foreground block">
                  Mercado de Mobilidade LATAM
                </span>
              </motion.div>

              {/* SAM Value */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: 1.1 }}
                className="absolute bottom-[20%] left-4"
              >
                <span className="font-display text-2xl md:text-3xl font-bold text-cyan">
                  $12B
                </span>
                <span className="text-xs text-muted-foreground block">
                  Carsharing/Aluguel
                </span>
              </motion.div>
            </div>

            {/* CAGR Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 1.3 }}
              className="text-center mt-6"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted border border-border">
                <span className="text-sm font-medium">CAGR</span>
                <span className="font-display text-xl font-bold text-cyan">22%</span>
                <span className="text-sm text-muted-foreground">(2024-2030)</span>
              </span>
            </motion.div>
          </motion.div>

          {/* Market Insights */}
          <div className="space-y-4">
            {marketInsights.map((insight, index) => (
              <motion.div
                key={insight.title}
                initial={{ opacity: 0, x: 40 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.15 }}
                className="glass-card p-6 group hover:border-cyan/30 transition-colors"
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan/10 flex items-center justify-center shrink-0 group-hover:bg-cyan/20 transition-colors">
                    <insight.icon className="w-6 h-6 text-cyan" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-display font-semibold">{insight.title}</h3>
                      {insight.tag && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                          {insight.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Brazil Market Context */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-16 glass-card p-8"
        >
          <h3 className="font-display text-xl font-bold mb-6 text-center">
            Oportunidade Real no Brasil
          </h3>

          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="p-4">
              <p className="font-display text-3xl font-bold text-cyan mb-2">
                US$ 155,8M
              </p>
              <p className="text-sm text-muted-foreground">
                Mercado brasileiro de car sharing em 2024
              </p>
            </div>
            <div className="p-4 border-y md:border-y-0 md:border-x border-border">
              <p className="font-display text-3xl font-bold text-teal mb-2">
                US$ 380M
              </p>
              <p className="text-sm text-muted-foreground">
                Projeção para 2033 (CAGR ~22%)
              </p>
            </div>
            <div className="p-4">
              <p className="font-display text-3xl font-bold text-foreground mb-2">
                US$ 2,5B
              </p>
              <p className="text-sm text-muted-foreground">
                GMV da Turo em 2024 (referência global)
              </p>
            </div>
          </div>

          <p className="text-center text-muted-foreground mt-6 max-w-2xl mx-auto">
            Existe espaço claro para uma plataforma que adapte o conceito P2P à realidade
            brasileira, com estrutura jurídica, operacional e tecnológica adequada.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
