/**
 * RIDDY How It Works Section - Motorcycles Edition
 * Design: 3-step process for both renters and hosts (motorcycle-specific)
 * Clean, visual explanation of the motorcycle platform - Mobile Optimized
 */

import { motion } from "framer-motion";
import { Search, Calendar, Bike, Upload, CheckCircle, Wallet } from "lucide-react";

const renterSteps = [
  {
    icon: Search,
    title: "Busque",
    description: "Encontre a moto perfeita para sua aventura entre centenas de opções verificadas.",
  },
  {
    icon: Calendar,
    title: "Reserve",
    description: "Escolha as datas, confirme com o proprietário e faça o pagamento seguro com cobertura de seguro.",
  },
  {
    icon: Bike,
    title: "Dirija",
    description: "Retire a moto, aproveite a liberdade das ruas e devolva no local combinado.",
  },
];

const hostSteps = [
  {
    icon: Upload,
    title: "Cadastre",
    description: "Liste sua moto em minutos com fotos e especificações técnicas. Defina sua disponibilidade.",
  },
  {
    icon: CheckCircle,
    title: "Aprove",
    description: "Revise as solicitações de aluguel e aprove apenas locatários com CNH A ou AB verificada.",
  },
  {
    icon: Wallet,
    title: "Ganhe",
    description: "Receba pagamentos seguros diretamente na sua conta. Sem complicações, sem burocracia.",
  },
];

export default function HowItWorksMotorcyclesSection() {
  return (
    <section id="como-funciona-motos" className="py-12 sm:py-16 md:py-20 lg:py-28 bg-gradient-to-b from-[#0A0F1C] to-[#0D1424]">
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
            Como Funciona
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
            Simples, rápido e seguro
          </h2>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-2">
            Seja para alugar uma moto ou ganhar dinheiro com a sua, a RIDDY torna tudo fácil e seguro.
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
                <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <Bike className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400" />
                </span>
                Para Locatários
              </h3>

              <div className="space-y-4 sm:space-y-5 md:space-y-6">
                {renterSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="flex gap-3 sm:gap-4"
                    >
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-orange-500/10 border border-orange-500/20">
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white text-sm sm:text-base mb-1">
                          Passo {index + 1}: {step.title}
                        </h4>
                        <p className="text-gray-400 text-xs sm:text-sm">{step.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* For Hosts */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white/5 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 lg:p-10 border border-white/5">
              <h3 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-white mb-5 sm:mb-6 md:mb-8 flex items-center gap-2 sm:gap-3">
                <span className="w-8 h-8 sm:w-10 sm:w-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400" />
                </span>
                Para Proprietários
              </h3>

              <div className="space-y-4 sm:space-y-5 md:space-y-6">
                {hostSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="flex gap-3 sm:gap-4"
                    >
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-orange-500/10 border border-orange-500/20">
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white text-sm sm:text-base mb-1">
                          Passo {index + 1}: {step.title}
                        </h4>
                        <p className="text-gray-400 text-xs sm:text-sm">{step.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
