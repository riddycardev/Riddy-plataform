import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Users, TrendingUp, Globe } from "lucide-react";

const pillars = [
  {
    icon: Users,
    title: "Democratizar o Acesso",
    description:
      "Levar mobilidade de qualidade, eliminando barreiras financeiras e burocráticas da propriedade tradicional.",
  },
  {
    icon: TrendingUp,
    title: "Transformação de Ativos",
    description:
      "Converter carros ociosos — passivos de depreciação — em ativos financeiros produtivos geradores de renda recorrente para famílias.",
  },
  {
    icon: Globe,
    title: "Escala Global Inteligente",
    description:
      "Expandir com um modelo asset-light, regulatório-ready e altamente escalável, começando pela liderança absoluta na região.",
  },
];

export default function VisionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="visao" className="section-padding relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/city-mobility.png"
          alt="City mobility"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      </div>

      <div className="container relative z-10" ref={ref}>
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block text-cyan font-semibold text-sm uppercase tracking-wider mb-4"
          >
            Nossa Visão
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
          >
            Construir o ecossistema de mobilidade mais{" "}
            <span className="text-gradient">inteligente, eficiente e acessível</span>{" "}
            da América Latina.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-muted-foreground"
          >
            Não somos apenas uma plataforma de aluguel. Somos a infraestrutura que
            desbloqueia o valor oculto em milhões de veículos.
          </motion.p>
        </div>

        {/* Pillars Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              className="group relative"
            >
              <div className="glass-card p-6 lg:p-8 h-full transition-all duration-300 hover:border-cyan/30 hover:bg-card/70">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-cyan/10 flex items-center justify-center mb-5 group-hover:bg-cyan/20 transition-colors">
                  <pillar.icon className="w-6 h-6 text-cyan" />
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-semibold mb-3">
                  {pillar.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>

                {/* Decorative Line */}
                <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-cyan/0 via-cyan/50 to-cyan/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Brand Promise */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-block px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan/10 via-teal/10 to-cyan/10 border border-cyan/20">
            <p className="text-lg md:text-xl font-medium">
              <span className="text-cyan">"</span>
              Liberdade para ir. Segurança para ficar.
              <span className="text-cyan">"</span>
            </p>
            <p className="text-sm text-muted-foreground mt-2">Brand Promise</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
