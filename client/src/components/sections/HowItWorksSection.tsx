/**
 * RIDDY How It Works Section
 * Design: 3-step process for both renters and hosts
 * Clean, visual explanation of the platform - Mobile Optimized
 */

import { motion } from "framer-motion";
import { Search, Calendar, Car, Upload, CheckCircle, Wallet } from "lucide-react";

const renterSteps = [
  {
    icon: Search,
    title: "Busque",
    description: "Encontre o carro perfeito para sua necessidade entre milhares de opções.",
  },
  {
    icon: Calendar,
    title: "Reserve",
    description: "Escolha as datas, confirme com o anfitrião e faça o pagamento seguro.",
  },
  {
    icon: Car,
    title: "Dirija",
    description: "Retire o carro, aproveite sua viagem e devolva no local combinado.",
  },
];

const hostSteps = [
  {
    icon: Upload,
    title: "Cadastre",
    description: "Liste seu carro em minutos com fotos e defina sua disponibilidade.",
  },
  {
    icon: CheckCircle,
    title: "Aprove",
    description: "Revise as solicitações de reserva e aprove os locatários verificados.",
  },
  {
    icon: Wallet,
    title: "Ganhe",
    description: "Receba pagamentos seguros diretamente na sua conta bancária.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-12 sm:py-16 md:py-20 lg:py-28 bg-gradient-to-b from-[#0A0F1C] to-[#0D1424]">
      <div className="container px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-12 md:mb-16"
        >
          <span className="text-cyan-400 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4 block">
            Como Funciona
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
            Simples, rápido e seguro
          </h2>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-2">
            Seja para alugar um carro ou ganhar dinheiro com o seu, a RIDDY torna tudo fácil.
          </p>
        </motion.div>

        {/* Two Columns */}
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-16">
          {/* For Renters */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white/5 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-10 border border-white/5">
              <h3 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-white mb-5 sm:mb-6 md:mb-8 flex items-center gap-2 sm:gap-3">
                <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <Car className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                </span>
                Para Locatários
              </h3>

              <div className="space-y-5 sm:space-y-6 md:space-y-8">
                {renterSteps.map((step, index) => (
                  <div key={step.title} className="flex gap-3 sm:gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 flex items-center justify-center">
                        <step.icon className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                        <span className="text-cyan-400 text-xs sm:text-sm font-semibold">
                          Passo {index + 1}
                        </span>
                      </div>
                      <h4 className="font-display font-semibold text-white text-base sm:text-lg mb-0.5 sm:mb-1">
                        {step.title}
                      </h4>
                      <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* For Hosts */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-white/5 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-10 border border-white/5">
              <h3 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-white mb-5 sm:mb-6 md:mb-8 flex items-center gap-2 sm:gap-3">
                <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                </span>
                Para Proprietários
              </h3>

              <div className="space-y-5 sm:space-y-6 md:space-y-8">
                {hostSteps.map((step, index) => (
                  <div key={step.title} className="flex gap-3 sm:gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
                        <step.icon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                        <span className="text-emerald-400 text-xs sm:text-sm font-semibold">
                          Passo {index + 1}
                        </span>
                      </div>
                      <h4 className="font-display font-semibold text-white text-base sm:text-lg mb-0.5 sm:mb-1">
                        {step.title}
                      </h4>
                      <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
