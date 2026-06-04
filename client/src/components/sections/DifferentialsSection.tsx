import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Gem, Zap, Settings, Layers, Globe } from "lucide-react";

const differentials = [
  {
    icon: Gem,
    category: "QUALIDADE",
    title: "P2P com Curadoria",
    description:
      "Fugimos do modelo aberto e desorganizado. Nossa frota passa por rigorosa inspeção, garantindo padrão de locadora com a flexibilidade do peer-to-peer.",
    badge: "VALIDADO",
    badgeColor: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  {
    icon: Zap,
    category: "EFICIÊNCIA",
    title: "Premium Acessível",
    description:
      "Experiência de luxo sem o preço de luxo. Estrutura de custos leve nos permite oferecer preços competitivos mantendo margens saudáveis.",
    badge: null,
    badgeColor: "",
  },
  {
    icon: Settings,
    category: "CONTROLE",
    title: "Tech & Segurança",
    description:
      "Nosso core não é o carro, é o dado. Algoritmos de risco proprietários, biometria facial e controle remoto em 100% da frota.",
    badge: "PATENTE PENDENTE",
    badgeColor: "bg-cyan/20 text-cyan border-cyan/30",
  },
  {
    icon: Layers,
    category: "INTEGRAÇÃO",
    title: "Ecossistema 360°",
    description:
      "Resolvemos a jornada completa do proprietário: seguros on-demand, manutenção preventiva parceira e gestão financeira automatizada.",
    badge: null,
    badgeColor: "",
  },
  {
    icon: Globe,
    category: "ESCALABILIDADE",
    title: "Plataforma Global",
    description:
      "Arquitetura API-first pronta para múltiplas moedas, idiomas e regulações. Nascemos na LATAM, desenhados para o mundo.",
    badge: null,
    badgeColor: "",
  },
];

export default function DifferentialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="diferenciais" className="section-padding bg-muted/30" ref={ref}>
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block text-cyan font-semibold text-sm uppercase tracking-wider mb-4"
          >
            Diferencial Competitivo
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold"
          >
            O QUE NOS TORNA <span className="text-gradient">ÚNICOS</span>
          </motion.h2>
        </div>

        {/* Differentials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {differentials.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              className={`glass-card p-6 lg:p-8 group hover:border-cyan/30 transition-all duration-300 ${
                index === 4 ? "md:col-span-2 lg:col-span-1" : ""
              }`}
            >
              {/* Icon & Badge Row */}
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-xl bg-cyan/10 flex items-center justify-center group-hover:bg-cyan/20 transition-colors">
                  <item.icon className="w-6 h-6 text-cyan" />
                </div>
                {item.badge && (
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Divider */}
              <div className="w-12 h-0.5 bg-cyan/50 mb-5" />

              {/* Content */}
              <h3 className="font-display text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {item.description}
              </p>

              {/* Category */}
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {item.category}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Badges Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="flex flex-wrap justify-center gap-6 mt-12"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-muted-foreground">VALIDADO</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan" />
            <span className="text-sm text-muted-foreground">PATENTE PENDENTE</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
