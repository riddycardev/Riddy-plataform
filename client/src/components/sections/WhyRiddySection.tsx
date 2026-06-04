/**
 * RIDDY Why Choose Us Section - Trust & Safety
 * Design: Trust signals and competitive advantages
 * Inspired by Turo's Trust & Safety page
 */

import { motion } from "framer-motion";
import { Shield, UserCheck, Headphones, CreditCard, FileCheck, Clock } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Seguro Completo",
    description: "Proteção total contra danos, roubo e responsabilidade civil. Você dirige tranquilo, nós cuidamos do resto.",
    highlight: "Até R$ 200.000",
  },
  {
    icon: UserCheck,
    title: "Verificação Rigorosa",
    description: "Todos os anfitriões e locatários passam por verificação de identidade, CNH e antecedentes.",
    highlight: "100% Verificado",
  },
  {
    icon: Headphones,
    title: "Suporte 24 Horas",
    description: "Equipe brasileira disponível a qualquer momento para ajudar você em emergências ou dúvidas.",
    highlight: "Atendimento Local",
  },
  {
    icon: CreditCard,
    title: "Pagamento Seguro",
    description: "Transações protegidas com criptografia. Pagamento só é liberado após confirmação da entrega.",
    highlight: "Garantia Total",
  },
  {
    icon: FileCheck,
    title: "Veículos Inspecionados",
    description: "Cada carro passa por checklist de segurança e condições antes de ser listado na plataforma.",
    highlight: "Qualidade Garantida",
  },
  {
    icon: Clock,
    title: "Cancelamento Flexível",
    description: "Políticas de cancelamento claras e justas. Reembolso integral em até 24h antes da viagem.",
    highlight: "Sem Burocracia",
  },
];

export default function WhyRiddySection() {
  return (
    <section id="seguranca" className="py-20 md:py-28 bg-[#0A0F1C]">
      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-cyan-400 text-sm font-semibold uppercase tracking-wider mb-4 block">
            Por que RIDDY
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Sua segurança é nossa prioridade
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Construímos a RIDDY pensando em cada detalhe para garantir uma experiência segura e confiável.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group bg-white/5 rounded-2xl p-6 border border-white/5 hover:border-cyan-500/30 transition-all duration-300"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-cyan-400" />
              </div>

              {/* Highlight Badge */}
              <span className="inline-block px-3 py-1 bg-cyan-500/10 text-cyan-400 text-xs font-semibold rounded-full mb-3">
                {feature.highlight}
              </span>

              {/* Content */}
              <h3 className="font-display font-semibold text-white text-xl mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
