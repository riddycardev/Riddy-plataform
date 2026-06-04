/**
 * Signup Choice Page
 * Página de escolha entre locatário e anfitrião
 */

import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Key, ArrowRight, Shield, DollarSign, Calendar, Star, Users } from "lucide-react";

const userBenefits = [
  { icon: Car, text: "Acesso a milhares de veículos" },
  { icon: Shield, text: "Seguro incluso em todas as viagens" },
  { icon: Star, text: "Avaliações verificadas" },
];

const hostBenefits = [
  { icon: DollarSign, text: "Ganhe dinheiro com seu carro" },
  { icon: Calendar, text: "Você define a disponibilidade" },
  { icon: Users, text: "Locatários verificados" },
];

export default function SignupChoice() {
  return (
    <div className="min-h-[100svh] bg-[#0A0F1C] flex items-center justify-center p-4 sm:p-6 py-8 sm:py-12">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-4xl relative z-10">
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-xl flex items-center justify-center">
              <span className="text-black font-bold text-xl sm:text-2xl">R</span>
            </div>
            <span className="text-2xl sm:text-3xl font-bold text-white">RIDDY</span>
          </Link>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Como você quer usar a RIDDY?
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Escolha o tipo de conta que melhor se adapta às suas necessidades
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          {/* Locatário Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-[#0F1629]/90 border-white/10 backdrop-blur-xl hover:border-cyan-500/50 transition-all duration-300 h-full group cursor-pointer">
              <Link href="/signup/user">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Key className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl text-white">Quero Alugar</CardTitle>
                  <CardDescription className="text-gray-400 text-sm sm:text-base">
                    Encontre o carro perfeito para sua viagem
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {userBenefits.map((benefit, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                          <benefit.icon className="w-4 h-4 text-cyan-400" />
                        </div>
                        <span className="text-gray-300 text-sm">{benefit.text}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold h-11 sm:h-12 mt-4 group-hover:shadow-lg group-hover:shadow-cyan-500/20 transition-all">
                    Criar conta de Locatário
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Link>
            </Card>
          </motion.div>

          {/* Anfitrião Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-[#0F1629]/90 border-white/10 backdrop-blur-xl hover:border-teal-500/50 transition-all duration-300 h-full group cursor-pointer">
              <Link href="/signup/host">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-teal-500/20 to-teal-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Car className="w-8 h-8 sm:w-10 sm:h-10 text-teal-400" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl text-white">Quero Anunciar</CardTitle>
                  <CardDescription className="text-gray-400 text-sm sm:text-base">
                    Ganhe dinheiro com seu veículo parado
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {hostBenefits.map((benefit, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                          <benefit.icon className="w-4 h-4 text-teal-400" />
                        </div>
                        <span className="text-gray-300 text-sm">{benefit.text}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button className="w-full bg-teal-500 hover:bg-teal-600 text-black font-semibold h-11 sm:h-12 mt-4 group-hover:shadow-lg group-hover:shadow-teal-500/20 transition-all">
                    Criar conta de Anfitrião
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Link>
            </Card>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8"
        >
          <p className="text-gray-400 text-sm">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
              Faça login
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
