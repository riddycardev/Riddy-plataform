/**
 * App Download Section
 * Seção para promover o download do aplicativo mobile
 */

import { motion } from "framer-motion";
import { Apple, Play, QrCode, Smartphone, Star, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function AppDownloadSection() {
  const { data: platformStats } = trpc.review.getPlatformStats.useQuery();

  const totalReviews = platformStats?.totalReviews ?? 0;
  const averageRating = platformStats?.averageRating ?? 0;
  const hasRealStats = totalReviews > 0 && averageRating > 0;

  // Format review count for display (e.g. 1234 → "1.2k", 50000 → "50k")
  function formatReviewCount(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
    return String(n);
  }
  return (
    <section className="py-24 bg-gradient-to-b from-[#0A0F1C] to-[#0F1629] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium">Disponível para iOS e Android</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Leve a RIDDY no seu
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400"> bolso</span>
            </h2>

            <p className="text-lg text-gray-400 max-w-lg">
              Baixe o aplicativo RIDDY e tenha acesso a milhares de carros na palma da sua mão. 
              Reserve, gerencie e acompanhe suas viagens de qualquer lugar.
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">Reserva Rápida</p>
                  <p className="text-sm text-gray-400">Em 3 cliques</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">100% Seguro</p>
                  <p className="text-sm text-gray-400">Dados protegidos</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {hasRealStats ? `${averageRating.toFixed(1)} Estrelas` : "Alta Avaliação"}
                  </p>
                  <p className="text-sm text-gray-400">
                    {hasRealStats ? `+${formatReviewCount(totalReviews)} avaliações` : "Usuários satisfeitos"}
                  </p>
                </div>
              </div>
            </div>

            {/* Download Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-gray-100 h-14 px-6 rounded-xl"
              >
                <Apple className="w-6 h-6 mr-3" />
                <div className="text-left">
                  <p className="text-xs opacity-70">Baixar na</p>
                  <p className="font-semibold">App Store</p>
                </div>
              </Button>

              <Button
                size="lg"
                className="bg-white text-black hover:bg-gray-100 h-14 px-6 rounded-xl"
              >
                <Play className="w-6 h-6 mr-3" />
                <div className="text-left">
                  <p className="text-xs opacity-70">Disponível no</p>
                  <p className="font-semibold">Google Play</p>
                </div>
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-4">
              <div>
                <p className="text-3xl font-bold text-white">
                  {hasRealStats ? `${formatReviewCount(totalReviews)}+` : "Em breve"}
                </p>
                <p className="text-sm text-gray-400">Avaliações</p>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div>
                <p className="text-3xl font-bold text-white">
                  {hasRealStats ? averageRating.toFixed(1) : "—"}
                </p>
                <p className="text-sm text-gray-400">Avaliação média</p>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div>
                <p className="text-3xl font-bold text-white">24/7</p>
                <p className="text-sm text-gray-400">Suporte</p>
              </div>
            </div>
          </motion.div>

          {/* Right Content - Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative flex justify-center"
          >
            {/* Phone Frame */}
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 to-teal-500/30 blur-3xl scale-150" />
              
              {/* Phone */}
              <div className="relative w-[280px] h-[580px] bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] p-3 shadow-2xl border border-white/10">
                {/* Screen */}
                <div className="w-full h-full bg-[#0A0F1C] rounded-[2.5rem] overflow-hidden relative">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-10" />
                  
                  {/* App Content */}
                  <div className="p-6 pt-12 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                          <span className="text-black font-bold text-sm">R</span>
                        </div>
                        <span className="font-bold text-white">RIDDY</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/10" />
                    </div>

                    {/* Search Bar */}
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <p className="text-sm text-gray-400">Onde você quer ir?</p>
                    </div>

                    {/* Featured Car */}
                    <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-4 border border-white/10">
                      <div className="w-full h-24 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 rounded-xl mb-3 flex items-center justify-center">
                        <span className="text-4xl">🚗</span>
                      </div>
                      <p className="font-semibold text-white text-sm">BMW Série 5</p>
                      <p className="text-xs text-gray-400">São Paulo, SP</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-cyan-400 font-bold">R$ 450/dia</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs text-white">4.9</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-4 gap-2">
                      {['SUVs', 'Luxo', 'Elétricos', 'Populares'].map((cat) => (
                        <div key={cat} className="bg-white/5 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-400">{cat}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Nav */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#0F1629] border-t border-white/10 flex items-center justify-around px-6">
                    <div className="w-6 h-6 rounded bg-cyan-500/20" />
                    <div className="w-6 h-6 rounded bg-white/10" />
                    <div className="w-6 h-6 rounded bg-white/10" />
                    <div className="w-6 h-6 rounded bg-white/10" />
                  </div>
                </div>
              </div>

              {/* QR Code Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="absolute -right-8 top-1/2 -translate-y-1/2 bg-white p-4 rounded-2xl shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-3">
                  <QrCode className="w-5 h-5 text-gray-800" />
                  <span className="text-sm font-medium text-gray-800">Escaneie para baixar</span>
                </div>
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                  {/* QR Code Placeholder */}
                  <div className="grid grid-cols-5 gap-1">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 ${Math.random() > 0.5 ? 'bg-gray-800' : 'bg-white'}`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
