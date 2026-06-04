/**
 * Booking Cancel Page
 * Shown when user cancels a payment
 */

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle, ArrowLeft, RefreshCw, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function BookingCancel() {
  const [, navigate] = useLocation();
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bid = params.get("booking_id");
    setBookingId(bid);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0F1C]">
      <Header />
      
      <main className="pt-20 pb-20">
        <div className="container max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {/* Cancel Icon */}
            <div className="mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-24 h-24 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto"
              >
                <XCircle className="w-12 h-12 text-orange-500" />
              </motion.div>
            </div>

            {/* Cancel Message */}
            <h1 className="text-3xl font-bold text-white mb-4">
              Pagamento Cancelado
            </h1>
            <p className="text-gray-400 mb-8">
              O pagamento foi cancelado. Sua reserva ainda está pendente e você pode tentar novamente quando quiser.
            </p>

            {/* Info Card */}
            <Card className="bg-white/5 border-white/10 mb-8 text-left">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">O que acontece agora?</h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm shrink-0">1</span>
                    <span>Sua reserva foi salva como pendente e não será perdida</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm shrink-0">2</span>
                    <span>Você pode retomar o pagamento a qualquer momento em "Minhas Reservas"</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm shrink-0">3</span>
                    <span>Se tiver dúvidas, entre em contato com nosso suporte</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {bookingId && (
                <Button
                  onClick={() => navigate(`/my-bookings`)}
                  className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Ver Minhas Reservas
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Home
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/messages")}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Falar com Suporte
              </Button>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
