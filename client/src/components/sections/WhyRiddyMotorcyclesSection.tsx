/**
 * RIDDY Why RIDDY Section - Motorcycles Edition
 * Design: Key benefits and trust signals specific to motorcycles
 * Mobile Optimized
 */

import { motion } from "framer-motion";
import { Shield, Users, Headphones, RotateCcw, Zap, CheckCircle } from "lucide-react";

const benefits = [
  {
    icon: Shield,
    title: "Seguro Premium Incluso",
    description: "Cobertura completa contra danos, roubo e responsabilidade civil. Você dirige tranquilo.",
  },
  {
    icon: Users,
    title: "Verificação Rigorosa",
    description: "Todos os locatários passam por verificação de CNH A/AB, identidade e antecedentes.",
  },
  {
    icon: Headphones,
    title: "Suporte 24 Horas",
    description: "Equipe brasileira disponível a qualquer momento para ajudar em emergências ou dúvidas.",
  },
  {
    icon: RotateCcw,
    title: "Cancelamento Flexível",
    description: "Políticas claras e justas. Reembolso integral em até 24h antes da viagem.",
  },
  {
    icon: Zap,
    title: "Processo Rápido",
    description: "Reserve sua moto em minutos. Retire em horas. Dirija com segurança e liberdade.",
  },
  {
    icon: CheckCircle,
    title: "Motos Inspecionadas",
    description: "Cada moto passa por checklist de segurança, mecânica e condições antes de ser listada.",
  },
];

export default function WhyRiddyMotorcyclesSection() {
  return (
    <section id="por-que-riddy-motos" className="py-12 sm:py-16 md:py-20 lg:py-28 bg-gradient-to-b from-[#0D1424] to-[#0A0F1C]">
      <div className="container px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-12 md:mb-16"
        >
          <span className="text-orange-400 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4 block">
            Por que RIDDY
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
            Sua segurança é nossa prioridade
          </h2>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-2">
            Construímos a RIDDY pensando em cada detalhe para garantir uma experiência segura, confiável e emocionante.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-white/5 hover:border-orange-400/30 transition-all duration-300"
              >
                <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/20 transition-all duration-300">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400" />
                  </div>
                  <h3 className="font-semibold text-white text-sm sm:text-base md:text-lg">{benefit.title}</h3>
                </div>
                <p className="text-gray-400 text-xs sm:text-sm md:text-base leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 sm:mt-16 md:mt-20 pt-12 sm:pt-16 md:pt-20 border-t border-white/5"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-orange-400 mb-1 sm:mb-2">
                98%
              </div>
              <p className="text-gray-400 text-xs sm:text-sm">Satisfação dos clientes</p>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-orange-400 mb-1 sm:mb-2">
                100%
              </div>
              <p className="text-gray-400 text-xs sm:text-sm">Verificado</p>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-orange-400 mb-1 sm:mb-2">
                24h
              </div>
              <p className="text-gray-400 text-xs sm:text-sm">Suporte disponível</p>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-orange-400 mb-1 sm:mb-2">
                Sem Burocracia
              </div>
              <p className="text-gray-400 text-xs sm:text-sm">Processo simples</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
