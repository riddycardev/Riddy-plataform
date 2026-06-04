/**
 * RIDDY Host Section - For Car Owners
 * Design: CTA section for hosts with earnings calculator
 * Encourage car owners to list their vehicles
 */

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Car, DollarSign, Calendar, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";

const carTypes = [
  { value: "popular", label: "Popular", sublabel: "Onix, HB20", dailyRate: 120 },
  { value: "sedan", label: "Sedan", sublabel: "Civic, Corolla", dailyRate: 180 },
  { value: "suv", label: "SUV", sublabel: "RAV4, Compass", dailyRate: 250 },
  { value: "luxury", label: "Luxo", sublabel: "BMW, Mercedes", dailyRate: 450 },
];

export default function HostSection() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedCar, setSelectedCar] = useState(carTypes[1]);
  const [daysPerMonth, setDaysPerMonth] = useState(15);

  const handleStartEarning = () => {
    if (isAuthenticated) {
      navigate("/host");
    } else {
      navigate("/signup");
    }
  };

  const monthlyEarnings = selectedCar.dailyRate * daysPerMonth;
  const yearlyEarnings = monthlyEarnings * 12;

  return (
    <section id="proprietarios" className="py-16 md:py-20 lg:py-28 bg-gradient-to-b from-[#0D1424] to-[#0A0F1C] overflow-hidden">
      <div className="container px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-emerald-400 text-sm font-semibold uppercase tracking-wider mb-4 block">
              Para Proprietários
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6 leading-tight">
              Transforme seu carro em{" "}
              <span className="text-gradient">renda extra</span>
            </h2>
            <p className="text-gray-400 text-base md:text-lg mb-6 md:mb-8 leading-relaxed">
              Seu carro fica parado a maior parte do tempo? Na RIDDY, você pode ganhar dinheiro 
              compartilhando-o com pessoas verificadas. Seguro incluso, suporte completo e 
              pagamentos garantidos.
            </p>

            {/* Benefits */}
            <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
              {[
                "Seguro premium incluso em todas as viagens",
                "Você define preços, disponibilidade e regras",
                "Verificação completa de todos os locatários",
                "Pagamentos em até 3 dias úteis",
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-300 text-sm md:text-base">{benefit}</span>
                </div>
              ))}
            </div>

            <Button 
              onClick={handleStartEarning}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-[#0A0F1C] font-semibold px-6 md:px-8 h-11 md:h-12 text-sm md:text-base"
            >
              Comece a Ganhar
              <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </motion.div>

          {/* Right - Calculator */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-white/5 rounded-2xl md:rounded-3xl p-5 sm:p-6 md:p-8 border border-white/10">
              <div className="flex items-center gap-3 mb-5 md:mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-semibold text-white text-lg md:text-xl truncate">
                    Calculadora de Ganhos
                  </h3>
                  <p className="text-gray-400 text-xs md:text-sm">Veja quanto você pode ganhar</p>
                </div>
              </div>

              {/* Car Type Selector - Mobile Optimized */}
              <div className="mb-5 md:mb-6">
                <label className="text-gray-400 text-xs md:text-sm mb-2 block">Tipo do seu carro</label>
                <div className="grid grid-cols-2 gap-2">
                  {carTypes.map((car) => (
                    <button
                      key={car.value}
                      onClick={() => setSelectedCar(car)}
                      className={`p-2.5 sm:p-3 rounded-xl text-left transition-all ${
                        selectedCar.value === car.value
                          ? "bg-emerald-500/20 border-emerald-500/50 border"
                          : "bg-white/5 border border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <span className={`block text-xs sm:text-sm font-medium truncate ${
                        selectedCar.value === car.value ? "text-emerald-400" : "text-white"
                      }`}>
                        {car.label}
                      </span>
                      <span className="block text-[10px] sm:text-xs text-gray-500 truncate mt-0.5">
                        {car.sublabel}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Days Slider */}
              <div className="mb-6 md:mb-8">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-gray-400 text-xs md:text-sm">Dias alugados por mês</label>
                  <span className="text-white font-semibold text-sm md:text-base">{daysPerMonth} dias</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="25"
                  value={daysPerMonth}
                  onChange={(e) => setDaysPerMonth(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] md:text-xs text-gray-500 mt-1">
                  <span>5 dias</span>
                  <span>25 dias</span>
                </div>
              </div>

              {/* Results */}
              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl md:rounded-2xl p-4 md:p-6 border border-emerald-500/20">
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                  <div className="min-w-0">
                    <p className="text-gray-400 text-xs md:text-sm mb-1">Ganho Mensal</p>
                    <p className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white truncate">
                      R$ {monthlyEarnings.toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-400 text-xs md:text-sm mb-1">Ganho Anual</p>
                    <p className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-emerald-400 truncate">
                      R$ {yearlyEarnings.toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
                <p className="text-gray-500 text-[10px] md:text-xs mt-3 md:mt-4">
                  * Valores estimados baseados na média de preços da plataforma.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
