/**
 * Booking Success / Return Page
 * Shown when the user returns from Mercado Pago Checkout Pro.
 * Polls the real payment status and shows confirmed, in-analysis, or error state.
 */

import { useEffect, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  ArrowRight,
  Loader2,
  Clock,
  AlertCircle,
  Car,
  CalendarDays,
  Hash,
} from "lucide-react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";

type PageState = "loading" | "confirmed" | "analysis" | "error";

export default function BookingSuccess() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const bookingIdParam = params.get("bookingId");
  const bookingId = bookingIdParam ? parseInt(bookingIdParam, 10) : null;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [bookingCode, setBookingCode] = useState<string | null>(null);
  const [vehicleName, setVehicleName] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);
  const MAX_POLLS = 60; // 5 min at 5s intervals

  // Fetch booking details for display
  const { data: bookingDetails } = trpc.booking.getById.useQuery(
    { id: bookingId! },
    { enabled: !!bookingId, retry: 2 }
  );

  // Polling query — disabled by default, triggered manually
  const pollStatus = trpc.booking.getPaymentStatus.useQuery(
    { bookingId: bookingId! },
    { enabled: false, retry: 1 }
  );

  const utils = trpc.useUtils();

  // Populate display info from booking details
  useEffect(() => {
    if (!bookingDetails) return;
    const v = bookingDetails.vehicle;
    if (v) setVehicleName(`${v.brand} ${v.model} ${v.year}`);
    // startDate and endDate are Date objects from the DB
    setStartDate(bookingDetails.startDate instanceof Date
      ? bookingDetails.startDate.toISOString().split("T")[0]
      : String(bookingDetails.startDate));
    setEndDate(bookingDetails.endDate instanceof Date
      ? bookingDetails.endDate.toISOString().split("T")[0]
      : String(bookingDetails.endDate));
    setTotalAmount(bookingDetails.totalAmount || bookingDetails.subtotal || null);
    setBookingCode(`#RDY-${String(bookingDetails.id).padStart(7, "0")}`);
  }, [bookingDetails]);

  // Start polling on mount
  useEffect(() => {
    if (!bookingId) {
      setPageState("error");
      setErrorMessage("Código da reserva não encontrado na URL.");
      return;
    }

    const poll = async () => {
      pollCountRef.current += 1;

      try {
        const result = await utils.booking.getPaymentStatus.fetch({ bookingId });

        if (result.bookingStatus === "confirmed" || result.paymentStatus === "completed") {
          stopPolling();
          setPageState("confirmed");
          return;
        }

        if (result.bookingStatus === "payment_failed" || result.paymentStatus === "failed") {
          stopPolling();
          setPageState("error");
          setErrorMessage("Pagamento recusado pelo Mercado Pago.");
          return;
        }

        // Still pending/processing
        setPageState("analysis");
      } catch {
        // Keep polling on transient errors
      }

      if (pollCountRef.current >= MAX_POLLS) {
        stopPolling();
        setPageState("analysis"); // Show analysis state after timeout
      }
    };

    const stopPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };

    // First poll immediately
    poll();
    pollingRef.current = setInterval(poll, 5000);

    return () => stopPolling();
  }, [bookingId]);

  // Auto-redirect to my-bookings after 8s when confirmed
  useEffect(() => {
    if (pageState !== "confirmed") return;
    const timer = setTimeout(() => navigate("/my-bookings"), 8000);
    return () => clearTimeout(timer);
  }, [pageState, navigate]);

  const formatDate = (d: string | null) => {
    if (!d) return "";
    try {
      return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  const formatCurrency = (v: string | null) => {
    if (!v) return "";
    const n = parseFloat(v);
    return isNaN(n) ? v : `R$ ${n.toFixed(2).replace(".", ",")}`;
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C]">
      <Header />
      <main className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <motion.div
          key={pageState}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* ── LOADING ── */}
          {pageState === "loading" && (
            <Card className="bg-[#111827] border-white/10 text-center">
              <CardContent className="p-10">
                <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-5">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Verificando pagamento...</h1>
                <p className="text-gray-400 text-sm">
                  Aguarde enquanto confirmamos seu pagamento com o Mercado Pago.
                </p>
              </CardContent>
            </Card>
          )}

          {/* ── CONFIRMED ── */}
          {pageState === "confirmed" && (
            <Card className="bg-[#111827] border-green-500/30">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-400" />
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-2">Pagamento Confirmado!</h1>
                  <p className="text-gray-400 text-sm">
                    Sua reserva está confirmada. Você será redirecionado em instantes.
                  </p>
                </div>

                {/* Booking details */}
                <div className="bg-white/5 rounded-xl p-4 space-y-3 mb-6">
                  {bookingCode && (
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Código da Reserva</p>
                        <p className="text-cyan-400 font-bold font-mono">{bookingCode}</p>
                      </div>
                    </div>
                  )}
                  {vehicleName && (
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-gray-400 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Veículo</p>
                        <p className="text-white font-medium">{vehicleName}</p>
                      </div>
                    </div>
                  )}
                  {startDate && endDate && (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Período</p>
                        <p className="text-white text-sm">
                          {formatDate(startDate)} → {formatDate(endDate)}
                        </p>
                      </div>
                    </div>
                  )}
                  {totalAmount && (
                    <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Total pago</span>
                      <span className="text-white font-bold text-lg">{formatCurrency(totalAmount)}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => navigate("/my-bookings")}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold h-12"
                  >
                    Ver Minhas Reservas
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/")}
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    Voltar para Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── IN ANALYSIS ── */}
          {pageState === "analysis" && (
            <Card className="bg-[#111827] border-blue-500/30">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-5">
                  <Clock className="w-8 h-8 text-blue-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Pagamento em Análise</h1>
                <p className="text-gray-400 text-sm mb-5">
                  Seu banco está analisando o pagamento. Você receberá uma notificação quando for aprovado.
                </p>

                {bookingCode && (
                  <div className="bg-white/5 rounded-xl p-4 mb-5">
                    <p className="text-xs text-gray-500 mb-1">Código da Reserva</p>
                    <p className="text-cyan-400 font-bold font-mono text-xl">{bookingCode}</p>
                    {vehicleName && (
                      <p className="text-gray-400 text-sm mt-1">{vehicleName}</p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 text-blue-400 text-xs mb-6">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Verificando automaticamente a cada 5 segundos...</span>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => navigate("/my-bookings")}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
                  >
                    Ver Minhas Reservas
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/")}
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    Voltar para Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── ERROR ── */}
          {pageState === "error" && (
            <Card className="bg-[#111827] border-red-500/30">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-5">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Pagamento Recusado</h1>
                <p className="text-gray-400 text-sm mb-5">
                  {errorMessage || "O pagamento não foi aprovado. Tente novamente com outro método de pagamento."}
                </p>

                {bookingCode && (
                  <div className="bg-white/5 rounded-xl p-4 mb-5">
                    <p className="text-xs text-gray-500 mb-1">Código da Reserva</p>
                    <p className="text-white font-bold font-mono">{bookingCode}</p>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {bookingId && (
                    <Button
                      onClick={() => navigate(`/pay/${bookingId}`)}
                      className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
                    >
                      Tentar Novamente
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => navigate("/my-bookings")}
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    Ver Minhas Reservas
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/")}
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    Voltar para Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
