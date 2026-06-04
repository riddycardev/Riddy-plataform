import { useState } from "react";
import { Slider } from "@/components/ui/slider";

// Preços por cilindrada (R$/dia)
const MOTORCYCLE_PRICES: Record<number, number> = {
  125: 80,
  150: 90,
  160: 100,
  300: 120,
  600: 180,
  1000: 250,
  1200: 300,
};

const CYLINDER_OPTIONS = [125, 150, 160, 300, 600, 1000, 1200];

export default function CalculadoraMotoSection() {
  const [selectedCylinder, setSelectedCylinder] = useState(125);
  const [daysPerMonth, setDaysPerMonth] = useState(15);

  const pricePerDay = MOTORCYCLE_PRICES[selectedCylinder];
  const estimatedEarnings = daysPerMonth * pricePerDay;

  return (
    <section className="relative py-16 sm:py-20 md:py-24 bg-gradient-to-b from-black via-orange-950/10 to-black overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-20 w-72 h-72 bg-orange-500 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-10 left-20 w-72 h-72 bg-orange-600 rounded-full blur-3xl opacity-15"></div>
      </div>

      <div className="container relative z-10 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-white">
            Calculadora de Ganhos
          </h2>
          <p className="text-base sm:text-lg text-gray-300">
            Veja quanto você pode ganhar com sua moto
          </p>
        </div>

        {/* Calculator Card */}
        <div className="max-w-2xl mx-auto bg-gradient-to-br from-orange-950/40 to-black/40 border border-orange-500/30 rounded-2xl p-8 sm:p-12 backdrop-blur-sm">
          {/* Cylinder Selector */}
          <div className="mb-10">
            <label className="block text-sm font-semibold text-orange-300 mb-4">
              Selecione a Cilindrada
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {CYLINDER_OPTIONS.map((cc) => (
                <button
                  key={cc}
                  onClick={() => setSelectedCylinder(cc)}
                  className={`py-2 px-3 rounded-lg font-semibold text-sm transition-all ${
                    selectedCylinder === cc
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/50"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {cc}cc
                </button>
              ))}
            </div>
          </div>

          {/* Price Display */}
          <div className="mb-10 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <p className="text-gray-300 text-sm mb-2">Preço por dia</p>
            <p className="text-3xl sm:text-4xl font-bold text-orange-400">
              R$ {pricePerDay.toLocaleString("pt-BR")}
            </p>
          </div>

          {/* Days Slider */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-semibold text-orange-300">
                Dias alugados por mês
              </label>
              <span className="text-2xl font-bold text-orange-400">
                {daysPerMonth} dias
              </span>
            </div>
            <Slider
              value={[daysPerMonth]}
              onValueChange={(value) => setDaysPerMonth(value[0])}
              min={5}
              max={25}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>5 dias</span>
              <span>25 dias</span>
            </div>
          </div>

          {/* Earnings Display */}
          <div className="p-6 bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/50 rounded-xl">
            <p className="text-gray-300 text-sm mb-2">Ganho estimado por mês</p>
            <p className="text-4xl sm:text-5xl font-bold text-orange-300">
              R$ {estimatedEarnings.toLocaleString("pt-BR")}
            </p>
            <p className="text-xs text-gray-400 mt-3">
              * Valores estimados baseados na média de preços da plataforma
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
