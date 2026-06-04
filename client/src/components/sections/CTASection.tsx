/**
 * RIDDY CTA Section - Final Call to Action
 * Design: Compelling final CTA with dual options
 */

import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Car, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";

export default function CTASection() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const handleSearchCars = () => {
    navigate("/search");
  };

  const handleListCar = () => {
    if (isAuthenticated) {
      navigate("/host");
    } else {
      navigate("/signup");
    }
  };

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-[#0D1424] to-[#0A0F1C] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Pronto para começar sua{" "}
            <span className="text-gradient">jornada</span>?
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
            Seja para alugar o carro dos seus sonhos ou transformar seu veículo em renda extra, 
            a RIDDY está aqui para você.
          </p>

          {/* Dual CTA Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Renter CTA */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-cyan-500/30 transition-all group"
            >
              <div className="w-14 h-14 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                <Car className="w-7 h-7 text-cyan-400" />
              </div>
              <h3 className="font-display font-semibold text-white text-xl mb-2">
                Quero Alugar
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                Encontre o carro perfeito para sua próxima aventura
              </p>
              <Button 
                onClick={handleSearchCars}
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-[#0A0F1C] font-semibold"
              >
                Buscar Carros
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>

            {/* Host CTA */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-emerald-500/30 transition-all group"
            >
              <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                <Wallet className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="font-display font-semibold text-white text-xl mb-2">
                Quero Ganhar
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                Transforme seu carro parado em renda extra mensal
              </p>
              <Button 
                onClick={handleListCar}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-[#0A0F1C] font-semibold"
              >
                Listar meu Carro
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
