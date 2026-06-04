import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
  Shield,
  Fingerprint,
  Wifi,
  HeadphonesIcon,
  Car,
  User,
  ArrowRight,
} from "lucide-react";

const coreFeatures = [
  {
    title: "Camada de Confiança",
    items: ["KYC Biométrico", "Scoring de Risco", "Antifraude"],
  },
  {
    title: "Algoritmo de Matching",
    items: ["Precificação Dinâmica", "Alocação Inteligente"],
  },
  {
    title: "Experiência Digital",
    items: ["Check-in Keyless", "Telemetria", "Pagamentos"],
  },
];

const securityPillars = [
  {
    icon: Fingerprint,
    title: "Verificação Total",
    description:
      "Identidade validada em segundos com biometria facial e análise de antecedentes.",
  },
  {
    icon: Shield,
    title: "Seguro Integrado",
    description:
      "Proteção completa durante toda a locação, cobrindo danos, roubo e terceiros.",
  },
  {
    icon: Wifi,
    title: "Telemetria & IoT",
    description:
      "Rastreamento em tempo real e abertura do carro via app, sem troca de chaves física.",
  },
  {
    icon: HeadphonesIcon,
    title: "Suporte Humanizado",
    description:
      "Equipe dedicada 24/7 para resolver incidentes e garantir a melhor experiência.",
  },
];

export default function SolutionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="solucao" className="section-padding relative overflow-hidden" ref={ref}>
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/tech-abstract.png"
          alt="Tech background"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
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
            A Solução
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
          >
            A PONTE <span className="text-gradient">INTELIGENTE</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-muted-foreground"
          >
            Conectamos oferta e demanda através de um ecossistema seguro e sem fricção.
          </motion.p>
        </div>

        {/* Platform Flow Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-20"
        >
          <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-4">
            {/* Proprietários */}
            <div className="glass-card p-6 w-full lg:w-64 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Car className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">Proprietários</h3>
              <p className="text-sm text-muted-foreground">
                Transformação de ativos ociosos em renda recorrente
              </p>
            </div>

            {/* Arrow */}
            <ArrowRight className="w-8 h-8 text-cyan hidden lg:block" />
            <div className="lg:hidden w-8 h-8 flex items-center justify-center">
              <div className="w-0.5 h-8 bg-cyan" />
            </div>

            {/* RIDDY CORE OS */}
            <div className="glass-card p-6 w-full lg:w-auto lg:flex-1 max-w-xl glow-cyan border-cyan/30">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-bold text-cyan text-lg">
                  RIDDY CORE OS
                </h3>
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-coral" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                </div>
              </div>

              <div className="space-y-4">
                {coreFeatures.map((feature, index) => (
                  <div
                    key={feature.title}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="w-8 h-8 rounded-lg bg-cyan/20 flex items-center justify-center shrink-0">
                      <span className="text-cyan font-bold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {feature.items.join(" • ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow */}
            <ArrowRight className="w-8 h-8 text-cyan hidden lg:block" />
            <div className="lg:hidden w-8 h-8 flex items-center justify-center">
              <div className="w-0.5 h-8 bg-cyan" />
            </div>

            {/* Usuários */}
            <div className="glass-card p-6 w-full lg:w-64 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">Usuários</h3>
              <p className="text-sm text-muted-foreground">
                Acesso flexível, seguro e sem burocracia
              </p>
            </div>
          </div>
        </motion.div>

        {/* Security Pillars */}
        <div>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center font-display text-2xl font-semibold mb-10"
          >
            4 Pilares de Segurança
          </motion.h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {securityPillars.map((pillar, index) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                className="glass-card p-6 text-center group hover:border-teal/30 transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-teal/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-teal/20 transition-colors">
                  <pillar.icon className="w-7 h-7 text-teal" />
                </div>
                <h4 className="font-display font-semibold mb-2">{pillar.title}</h4>
                <p className="text-sm text-muted-foreground">{pillar.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
