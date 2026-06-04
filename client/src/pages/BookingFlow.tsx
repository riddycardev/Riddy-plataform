/**
 * Booking Flow Page - RIDDY
 * Checkout Transparente via Mercado Pago
 * Pagamento 100% dentro da plataforma (sem redirecionamentos)
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Shield,
  CreditCard,
  Check,
  AlertCircle,
  Car,
  Loader2,
  QrCode,
  Copy,
  CheckCircle2,
  RefreshCw,
  Lock,
  FileText,
  Bike,
  HardHat,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RentalContract from "@/components/RentalContract";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import DateInputBR from "@/components/DateInputBR";
import { toast } from "sonner";
import {
  calculateDaysBetween,
  getTodayISO,
  getMaxDateISO,
  isDateRangeValid,
  formatDateBR,
} from "@/lib/dateUtils";

// ============================================================
// Types
// ============================================================

interface BookingData {
  startDate: string;
  endDate: string;
  pickupTime: string;
  returnTime: string;
  protection: string;
  paymentMethod: string;
  // Renter personal data
  renterFullName: string;
  renterEmail: string;
  renterPhone: string;
  // Mercado Pago card data
  cardNumber: string;
  cardExpiry: string;
  cardCVV: string;
  cardholderName: string;
  cpf: string; // CPF do locatário
  useThirdPartyCard: boolean; // cartão de terceiro?
  cardholderCpf: string; // CPF do titular do cartão (se diferente do locatário)
  installments: number;
  // CNH data
  cnhCategory: string;
  cnhNumber: string;
  cnhExpiresAt: string;
  // Address data
  addressZipCode: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
}

interface PixState {
  qrCode: string;
  qrCodeBase64: string;
  expirationDate: string;
  mpPaymentId: string;
  amount: number;
  copied: boolean;
}

// ============================================================
// Mercado Pago SDK helpers (loaded via CDN in index.html)
// ============================================================

// Singleton MP instance — create once, reuse everywhere
let _mpInstance: MercadoPagoInstance | null = null;

function getMPInstance(): MercadoPagoInstance | null {
  if (_mpInstance) return _mpInstance;
  const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
  if (!publicKey) {
    console.warn("[MP] VITE_MP_PUBLIC_KEY not set");
    return null;
  }
  if (typeof window.MercadoPago === "undefined") {
    console.warn("[MP] SDK not loaded yet (window.MercadoPago undefined)");
    return null;
  }
  _mpInstance = new window.MercadoPago(publicKey, { locale: "pt-BR" });
  return _mpInstance;
}

// ============================================================
// Mask helpers
// ============================================================

function maskCardNumber(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function maskExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

function maskCPF(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return digits.slice(0, 3) + "." + digits.slice(3);
  if (digits.length <= 9) return digits.slice(0, 3) + "." + digits.slice(3, 6) + "." + digits.slice(6);
  return digits.slice(0, 3) + "." + digits.slice(3, 6) + "." + digits.slice(6, 9) + "-" + digits.slice(9);
}

// ============================================================
// Steps
// ============================================================

const steps = [
  { id: 1, title: "Dados" },
  { id: 2, title: "Pagamento" },
  { id: 3, title: "Confirmação" },
];

// ============================================================
// Main Component
// ============================================================

export default function BookingFlow() {
  const { vehicleId, bookingId: bookingIdParam } = useParams() as { vehicleId?: string; bookingId?: string };
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);

  // If accessing /pay/:bookingId, we are retrying payment on an existing booking
  const existingBookingId = bookingIdParam ? parseInt(bookingIdParam) : null;

  const { data: verificationStatus } = trpc.verification.getStatus.useQuery();

  // When coming from /pay/:bookingId (retry payment), start at step 2 (payment form)
  // Step 3 is ONLY for post-payment confirmation — never shown without a real payment result
  const [currentStep, setCurrentStep] = useState(existingBookingId ? 2 : 1);
  const [bookingId, setBookingId] = useState<number | null>(existingBookingId);
  // Ref to track bookingId synchronously — React state updates are async so
  // the ref guarantees the correct value is available in callbacks/onSuccess handlers
  const bookingIdRef = useRef<number | null>(existingBookingId);
  const [contractAccepted, setContractAccepted] = useState(false);
  // OTP contract signing states
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpChannel, setOtpChannel] = useState<"sms" | "email" | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const otpCooldownRef = useRef<NodeJS.Timeout | null>(null);
  const [paymentError, setPaymentError] = useState<string>("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentInAnalysis, setPaymentInAnalysis] = useState(false); // true when MP returns in_process
  const [pixState, setPixState] = useState<PixState | null>(null);
  const [isTokenizing, setIsTokenizing] = useState(false);
  const [threeDSState, setThreeDSState] = useState<{ url: string; mpPaymentId: string; bookingId: number } | null>(null);
  const threeDSPollingRef = useRef<NodeJS.Timeout | null>(null);
  const [cardBrand, setCardBrand] = useState<string>("");
  const [installmentOptions, setInstallmentOptions] = useState<Array<{ value: number; label: string; totalWithInterest: number }>>([]); 
  const [mpPaymentMethodId, setMpPaymentMethodId] = useState<string>("");
  const [mpIssuerId, setMpIssuerId] = useState<string>("");
  const pixPollingRef = useRef<NodeJS.Timeout | null>(null);
  const analysisPollingRef = useRef<NodeJS.Timeout | null>(null);
  // Track the bookingId being polled for analysis state
  const [analysisPollBookingId, setAnalysisPollBookingId] = useState<number | null>(null);
  // PIX countdown timer (seconds remaining, starts at 600 = 10 min)
  const [pixTimeLeft, setPixTimeLeft] = useState<number>(600);
  const pixTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Field-level errors for step 1 — shown inline next to each field
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});
  // Garantia Reembolsável — modal "Saiba mais"
  const [showGuaranteeModal, setShowGuaranteeModal] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Read dates from sessionStorage (frozen from VehicleDetails) or fall back to URL params
  const frozenDates = (() => {
    try {
      const stored = sessionStorage.getItem('riddy_booking_dates');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only use frozen dates if they match the current vehicle
        const currentVehicleId = vehicleId ? parseInt(vehicleId) : null;
        if (parsed.vehicleId === currentVehicleId && parsed.startDate && parsed.endDate) {
          return { startDate: parsed.startDate as string, endDate: parsed.endDate as string };
        }
      }
    } catch (_) {}
    return null;
  })();

  const [bookingData, setBookingData] = useState<BookingData>({
    startDate: frozenDates?.startDate || searchParams.get("start") || "",
    endDate: frozenDates?.endDate || searchParams.get("end") || "",
    pickupTime: "10:00",
    returnTime: "10:00",
    protection: "basic",
    paymentMethod: "credit_card",
    renterFullName: "",
    renterEmail: "",
    renterPhone: "",
    cardNumber: "",
    cardExpiry: "",
    cardCVV: "",
    cardholderName: "",
    cpf: "",
    useThirdPartyCard: false,
    cardholderCpf: "",
    installments: 1,
    cnhCategory: "",
    cnhNumber: "",
    cnhExpiresAt: "",
    addressZipCode: "",
    addressStreet: "",
    addressNumber: "",
    addressComplement: "",
    addressNeighborhood: "",
    addressCity: "",
    addressState: "",
  });

  // Fetch existing booking data (for /pay/:bookingId retry flow)
  const { data: existingBooking } = trpc.booking.getById.useQuery(
    { id: existingBookingId! },
    { enabled: !!existingBookingId }
  );

  // Fetch vehicle data - use vehicleId from URL or from existing booking
  const resolvedVehicleId = vehicleId ? parseInt(vehicleId) : (existingBooking?.vehicleId ?? 0);
  const { data: vehicle, isLoading } = trpc.vehicle.getById.useQuery(
    { id: resolvedVehicleId },
    { enabled: resolvedVehicleId > 0 }
  );

  // Fetch user profile to check CNH category for motorcycle bookings
  const { data: userProfile } = trpc.user.getProfile.useQuery();
  const trpcUtils = trpc.useUtils();

  // ============================================================
  // Pricing calculation (must be before MP effects that use pricing)
  // ============================================================

  const pricing = useMemo(() => {
    if (!bookingData.startDate || !bookingData.endDate || !vehicle) return null;
    if (!isDateRangeValid(bookingData.startDate, bookingData.endDate)) return null;

    const days = calculateDaysBetween(bookingData.startDate, bookingData.endDate);
    if (days < 1 || days > 365) return null;

    const dailyPrice = parseFloat(vehicle.dailyPrice || "0");
    const dailyKmLimit = vehicle.dailyKmLimit || 300;
    const extraKmPrice = parseFloat(vehicle.extraKmPrice || "0.50");
    const subtotal = days * dailyPrice;
    const serviceFee = subtotal * 0.12;

    let insuranceFee = 0;
    if (bookingData.protection === "standard") insuranceFee = days * 35;
    else if (bookingData.protection === "premium") insuranceFee = days * 65;

    const total = subtotal + serviceFee + insuranceFee;

    // Garantia Reembolsável — cálculo escalonado por número de dias
    // 1 dia = 2×, 2-3 dias = 3×, 4-6 dias = 4×, 7+ dias = 5× a diária
    const GUARANTEE_MIN = 500;
    const GUARANTEE_MAX = 5000;
    let guaranteeMultiplier: number;
    if (days === 1) guaranteeMultiplier = 2;
    else if (days <= 3) guaranteeMultiplier = 3;
    else if (days <= 6) guaranteeMultiplier = 4;
    else guaranteeMultiplier = 5;
    const guaranteeCalculated = guaranteeMultiplier * dailyPrice;
    // Aplicar ajuste percentual do host se disponível (guaranteeAdjusted é um percentual: 100 = 100% = padrão)
    // Ex: dailyPrice=250, guaranteeMultiplier=5, guaranteeAdjusted=100 → 250*5*(100/100) = R$1.250
    // Ex: dailyPrice=250, guaranteeMultiplier=5, guaranteeAdjusted=40  → 250*5*(40/100)  = R$500
    const hostAdjustmentPct = vehicle.guaranteeAdjusted ? parseFloat(vehicle.guaranteeAdjusted.toString()) : 100;
    const guaranteeRaw = guaranteeCalculated * (hostAdjustmentPct / 100);
    const securityDeposit = Math.min(GUARANTEE_MAX, Math.max(GUARANTEE_MIN, guaranteeRaw));
    // Multiplicador efetivo real: o que o locatário realmente paga em termos de "× diária"
    // Ex: base=5×, ajuste=200% → efetivo=10×; base=5×, ajuste=50% → efetivo=2.5×
    const effectiveMultiplier = parseFloat((guaranteeMultiplier * (hostAdjustmentPct / 100)).toFixed(1));

    // Desconto PIX aplica apenas sobre o aluguel (não sobre a Garantia Reembolsável)
    const pixDiscount = bookingData.paymentMethod === "pix" ? total * 0.05 : 0;
    // Total final inclui Garantia Reembolsável — cobrado integralmente no pagamento
    const finalTotal = total - pixDiscount + securityDeposit;
    return { days, subtotal, serviceFee, insuranceFee, securityDeposit, guaranteeMultiplier, effectiveMultiplier, guaranteeCalculated, total, pixDiscount, finalTotal, dailyKmLimit, extraKmPrice };
  }, [bookingData.startDate, bookingData.endDate, bookingData.protection, bookingData.paymentMethod, vehicle]);

  // Total efetivo considerando juros da parcela selecionada
  const effectiveTotal = useMemo(() => {
    if (!pricing) return null;
    if (bookingData.paymentMethod !== "credit_card" || bookingData.installments <= 1) {
      return pricing.finalTotal;
    }
    const selected = installmentOptions.find(o => o.value === bookingData.installments);
    return selected ? selected.totalWithInterest : pricing.finalTotal;
  }, [pricing, bookingData.paymentMethod, bookingData.installments, installmentOptions]);

  // ============================================================
  // Mercado Pago: detect card brand and installments
  // ============================================================

  // Use state for BIN so effects re-run reactively when it changes
  const [currentBin, setCurrentBin] = useState<string>("");

  // Step 1: Detect card brand when BIN changes (first 6 digits)
  useEffect(() => {
    const digits = bookingData.cardNumber.replace(/\D/g, "");
    if (digits.length < 6) {
      setCardBrand("");
      setMpPaymentMethodId("");
      setInstallmentOptions([]);
      setCurrentBin("");
      return;
    }

    const bin = digits.slice(0, 6);
    if (bin === currentBin) return; // No change
    setCurrentBin(bin);

    const mp = getMPInstance();
    if (!mp) {
      // SDK not loaded yet — still show fallback installments
      return;
    }

    (async () => {
      try {
        const pmData = await mp.getPaymentMethods({ bin });
        const pm = pmData.results?.[0];
        if (pm) {
          setCardBrand(pm.name);
          setMpPaymentMethodId(pm.id);
        }
        // Get issuers
        if (pm?.id) {
          try {
            const issuers = await mp.getIssuers({ paymentMethodId: pm.id, bin });
            if (issuers.issuers?.[0]) setMpIssuerId(issuers.issuers[0].id);
          } catch (_) {}
        }
      } catch (err) {
        console.error("[MP] Card brand detection error:", err);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingData.cardNumber]);

  // Step 2: Generate installment options whenever BIN or pricing changes
  // Uses MP API when available, falls back to manual calculation
  useEffect(() => {
    if (!currentBin || !pricing) return;

    const total = pricing.finalTotal;

    // Build fallback: 1x e 2x sem juros; 3x-12x com juros estimado do MP (~2.99% a.m.)
    const buildFallback = () =>
      Array.from({ length: 12 }, (_, i) => {
        const n = i + 1;
        if (n <= 2) {
          return {
            value: n,
            label: `${n}x de R$ ${(total / n).toFixed(2)} (sem juros)`,
            totalWithInterest: total,
          };
        }
        // Juros compostos mensais estimados do Mercado Pago (~2.99% a.m.)
        const monthlyRate = 0.0299;
        const installmentValue =
          (total * monthlyRate * Math.pow(1 + monthlyRate, n)) /
          (Math.pow(1 + monthlyRate, n) - 1);
        const totalWithInterest = installmentValue * n;
        return {
          value: n,
          label: `${n}x de R$ ${installmentValue.toFixed(2)} (total R$ ${totalWithInterest.toFixed(2)})`,
          totalWithInterest,
        };
      });

    const mp = getMPInstance();
    if (!mp) {
      setInstallmentOptions(buildFallback());
      return;
    }

    (async () => {
      try {
        const installData = await mp.getInstallments({
          amount: total.toFixed(2),
          bin: currentBin,
        });
        const rawData = installData as any;
        let opts: Array<{ value: number; label: string; totalWithInterest: number }> = [];
        if (Array.isArray(rawData) && rawData.length > 0) {
          // Format: [{payer_costs: [{installments, recommended_message, total_amount}]}]
          const payerCosts = rawData[0]?.payer_costs || [];
          opts = payerCosts.map((pc: any) => ({
            value: pc.installments,
            label: pc.recommended_message || `${pc.installments}x`,
            totalWithInterest: pc.total_amount ?? total,
          }));
        } else if (rawData?.installments) {
          // Format: {installments: [{installments, recommended_message, total_amount}]}
          opts = (rawData.installments as any[]).map((i: any) => ({
            value: i.installments,
            label: i.recommended_message || `${i.installments}x`,
            totalWithInterest: i.total_amount ?? total,
           }));
        }
        setInstallmentOptions(opts.length > 0 ? opts : buildFallback());
      } catch (err) {
        console.error("[MP] Installments error:", err);
        setInstallmentOptions(buildFallback());
      }
    })();
  }, [currentBin, pricing?.finalTotal]);

  // ============================================================
  // tRPC mutations
  // ============================================================

  const createBooking = trpc.booking.create.useMutation({
    onSuccess: (data) => {
      setBookingId(data.id);
      bookingIdRef.current = data.id;
    },
    onError: (err) => {
      setPaymentError(err.message || "Erro ao criar reserva");
    },
  });

  const sendContractOtp = trpc.booking.sendContractOtp.useMutation({
    onSuccess: (data) => {
      setOtpSent(true);
      setOtpCode("");
      setOtpCooldown(60);
      if (otpCooldownRef.current) clearInterval(otpCooldownRef.current);
      otpCooldownRef.current = setInterval(() => {
        setOtpCooldown(prev => {
          if (prev <= 1) {
            clearInterval(otpCooldownRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      if (data.fallback) {
        toast.info("SMS indisponível. Código enviado para seu e-mail.");
        setOtpChannel("email");
      } else {
        toast.success(`Código enviado por ${data.channel === "sms" ? "SMS" : "e-mail"}!`);
      }
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao enviar código");
    },
  });

  const verifyContractOtp = trpc.booking.verifyContractOtp.useMutation({
    onSuccess: () => {
      setContractAccepted(true);
      setOtpModalOpen(false);
      toast.success("Contrato assinado com sucesso!");
    },
    onError: (err) => {
      toast.error(err.message || "Código inválido");
    },
  });

  const processCreditCard = trpc.payment.processMPCreditCard.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setPaymentSuccess(true);
        setCurrentStep(3);
        // Clear frozen dates from sessionStorage — booking is confirmed
        sessionStorage.removeItem('riddy_booking_dates');
        // Notify platform owner about confirmed payment
        const confirmedBid = bookingId ?? bookingIdRef.current;
        if (confirmedBid && pricing) {
          notifyPaymentConfirmed.mutate({
            bookingId: confirmedBid,
            amount: pricing.finalTotal,
            paymentMethod: "credit_card",
            installments: bookingData.installments,
          });
        }
      } else if (data.requires3DS && data.threeDSChallengeUrl) {
        // 3DS 2.0 challenge required — open modal with bank authentication iframe
        setThreeDSState({
          url: data.threeDSChallengeUrl,
          mpPaymentId: data.mpPaymentId || "",
          bookingId: bookingId || 0,
        });
        toast.info("🔒 Autenticação bancária necessária. Confirme o pagamento no seu banco.");
        // Start polling for 3DS result
        if (data.mpPaymentId && bookingId) {
          start3DSPolling(data.mpPaymentId, bookingId);
        }
      } else if (data.isProcessing) {
        // Pagamento em análise antifraude — não é erro, aguardar confirmação
        setPaymentInAnalysis(true); // mostrar tela específica de "em análise"
        setCurrentStep(3);
        toast.info("⏳ Pagamento em análise. Verificando automaticamente...");
        // Start polling to detect when webhook updates the booking status
        const pollBid = bookingId ?? bookingIdRef.current;
        if (pollBid) {
          startAnalysisPolling(pollBid);
        }
      } else {
        setPaymentError(data.message || "Pagamento recusado. Verifique os dados do cartão e tente novamente.");
      }
      setIsTokenizing(false);
    },
    onError: (err) => {
      console.error("[RIDDY] processCreditCard.onError:", err.message, err);
      setPaymentError(err.message || "Erro ao processar pagamento");
      setIsTokenizing(false);
    },
  });

  const notifyPaymentConfirmed = trpc.payment.notifyPaymentConfirmed.useMutation();
  const saveCNHToProfile = trpc.user.updateProfile.useMutation();

  const processPix = trpc.payment.processMPPix.useMutation({
    onSuccess: (data) => {
      setPixState({
        qrCode: data.pixQrCode || "",
        qrCodeBase64: data.pixQrCodeBase64 || "",
        expirationDate: data.pixExpirationDate || "",
        mpPaymentId: data.mpPaymentId || "",
        amount: data.amount,
        copied: false,
      });
      setCurrentStep(3);
      // Start polling
      if (data.mpPaymentId) {
        startPixPolling(data.mpPaymentId);
      }
    },
    onError: (err) => {
      setPaymentError(err.message || "Erro ao gerar PIX");
    },
  });

  // Ref to hold the pre-opened window for Checkout Pro
  // We open it synchronously on click to avoid browser popup blockers,
  // then redirect it to the real URL in onSuccess.
  const checkoutProWindowRef = useRef<Window | null>(null);

  const createCheckoutPro = trpc.payment.createMPCheckoutPro.useMutation({
    onSuccess: (data) => {
      if (checkoutProWindowRef.current && !checkoutProWindowRef.current.closed) {
        // Redirect the pre-opened window to the real Checkout Pro URL
        checkoutProWindowRef.current.location.href = data.checkoutUrl;
      } else {
        // Fallback: try opening again (may be blocked by browser)
        const w = window.open(data.checkoutUrl, '_blank');
        if (!w) {
          // If still blocked, show the URL so user can copy it
          toast.error(
            `Popup bloqueado pelo navegador. Acesse manualmente: ${data.checkoutUrl}`,
            { duration: 10000 }
          );
          return;
        }
      }
      checkoutProWindowRef.current = null;
      toast.info("Aba do Mercado Pago aberta. Conclua o pagamento lá e volte aqui.");
    },
    onError: (err) => {
      // Close the pre-opened blank window if the request failed
      if (checkoutProWindowRef.current && !checkoutProWindowRef.current.closed) {
        checkoutProWindowRef.current.close();
      }
      checkoutProWindowRef.current = null;
      toast.error(err.message || "Erro ao abrir Checkout Pro do Mercado Pago");
    },
  });

  // Helper to open Checkout Pro: opens blank window synchronously then fetches URL
  const handleOpenCheckoutPro = () => {
    if (!bookingId) return;
    // Open a blank window NOW (synchronous, trusted user gesture) to avoid popup blockers
    checkoutProWindowRef.current = window.open('', '_blank');
    createCheckoutPro.mutate({ bookingId });
  };

  // PIX status polling
  const checkPixStatus = trpc.payment.checkMPPixStatus.useQuery(
    {
      mpPaymentId: pixState?.mpPaymentId || "",
      bookingId: bookingId || 0,
    },
    {
      enabled: false, // Manual trigger
      refetchInterval: false,
    }
  );

  const startPixPolling = (mpPaymentId: string) => {
    if (pixPollingRef.current) clearInterval(pixPollingRef.current);
    pixPollingRef.current = setInterval(async () => {
      if (!bookingId) return;
      try {
        const result = await checkPixStatus.refetch();
        if (result.data?.isApproved) {
          setPaymentSuccess(true);
          sessionStorage.removeItem('riddy_booking_dates');
          if (pixPollingRef.current) clearInterval(pixPollingRef.current);
        }
      } catch (_) {}
    }, 5000); // Poll every 5 seconds
  };

  // Analysis polling: poll booking payment status every 5s until approved/rejected
  const checkAnalysisStatus = trpc.booking.getPaymentStatus.useQuery(
    { bookingId: analysisPollBookingId ?? 0 },
    {
      enabled: false, // Manual trigger via refetch()
      refetchInterval: false,
    }
  );

  const startAnalysisPolling = useCallback((bid: number) => {
    setAnalysisPollBookingId(bid);
    if (analysisPollingRef.current) clearInterval(analysisPollingRef.current);

    let attempts = 0;
    const MAX_ATTEMPTS = 60; // 5 min max (60 × 5s)

    analysisPollingRef.current = setInterval(async () => {
      attempts++;

      if (attempts >= MAX_ATTEMPTS) {
        console.warn("[RIDDY] Polling análise: timeout atingido");
        clearInterval(analysisPollingRef.current!);
        analysisPollingRef.current = null;
        return;
      }

      try {
        const result = await checkAnalysisStatus.refetch();
        const d = result.data;
        if (!d) return;


        if (d.bookingStatus === "confirmed" || d.paymentStatus === "completed") {
          clearInterval(analysisPollingRef.current!);
          analysisPollingRef.current = null;
          setPaymentInAnalysis(false);
          setPaymentSuccess(true);
          sessionStorage.removeItem('riddy_booking_dates');
          toast.success("✅ Pagamento aprovado! Sua reserva está confirmada.");
        } else if (d.bookingStatus === "payment_failed" || d.paymentStatus === "failed") {
          clearInterval(analysisPollingRef.current!);
          analysisPollingRef.current = null;
          setPaymentInAnalysis(false);
          setPaymentError("Pagamento recusado pelo banco. Tente novamente com outro cartão.");
          toast.error("⚠️ Pagamento recusado.");
        }
        // If still processing/pending, keep polling
      } catch (err) {
        console.error("[RIDDY] Polling análise erro:", err);
      }
    }, 5000); // Poll every 5 seconds
  }, [checkAnalysisStatus]);

  // 3DS polling: poll MP payment status every 5s until approved/rejected
  const start3DSPolling = (mpPaymentId: string, bid: number) => {
    if (threeDSPollingRef.current) clearInterval(threeDSPollingRef.current);
    threeDSPollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/mp/payment-status?mpPaymentId=${mpPaymentId}&bookingId=${bid}`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "approved") {
          if (threeDSPollingRef.current) clearInterval(threeDSPollingRef.current);
          setThreeDSState(null);
          setPaymentSuccess(true);
          setCurrentStep(3);
          sessionStorage.removeItem('riddy_booking_dates');
          toast.success("✅ Pagamento confirmado!");
        } else if (data.status === "rejected" || data.status === "cancelled") {
          if (threeDSPollingRef.current) clearInterval(threeDSPollingRef.current);
          setThreeDSState(null);
          setPaymentError("Pagamento recusado após autenticação bancária. Tente novamente.");
        }
      } catch (_) {}
    }, 5000);
  };

  // Pre-fill CNH data and address from user profile
  useEffect(() => {
    if (userProfile) {
      const p = userProfile as any;
      setBookingData(prev => ({
        ...prev,
        cnhCategory: userProfile.cnhCategory || prev.cnhCategory,
        cnhNumber: userProfile.cnhNumber || prev.cnhNumber,
        cnhExpiresAt: userProfile.cnhExpiresAt
          ? new Date(userProfile.cnhExpiresAt).toISOString().split("T")[0]
          : prev.cnhExpiresAt,
        cpf: p.cpf || prev.cpf,
        renterFullName: userProfile.name || prev.renterFullName,
        renterEmail: userProfile.email || prev.renterEmail,
        renterPhone: p.phone || prev.renterPhone,
        // Pre-fill address from profile if available
        addressZipCode: p.addressZipCode || prev.addressZipCode,
        addressStreet: p.addressStreet || prev.addressStreet,
        addressNumber: p.addressNumber || prev.addressNumber,
        addressComplement: p.addressComplement || prev.addressComplement,
        addressNeighborhood: p.addressNeighborhood || prev.addressNeighborhood,
        addressCity: p.addressCity || prev.addressCity,
        addressState: p.addressState || prev.addressState,
      }));
    }
  }, [userProfile?.id]);

  // Pre-fill form data from existing booking when in /pay/:bookingId flow
  useEffect(() => {
    if (existingBooking) {
      setBookingData(prev => ({
        ...prev,
        cpf: existingBooking.renterCpf || prev.cpf,
        renterFullName: existingBooking.renterFullName || prev.renterFullName,
        renterEmail: existingBooking.renterEmail || prev.renterEmail,
        renterPhone: existingBooking.renterPhone || prev.renterPhone,
        startDate: existingBooking.startDate
          ? new Date(existingBooking.startDate).toISOString().split("T")[0]
          : prev.startDate,
        endDate: existingBooking.endDate
          ? new Date(existingBooking.endDate).toISOString().split("T")[0]
          : prev.endDate,
      }));
    }
  }, [existingBooking]);

  useEffect(() => {
    return () => {
      if (pixPollingRef.current) clearInterval(pixPollingRef.current);
      if (threeDSPollingRef.current) clearInterval(threeDSPollingRef.current);
      if (analysisPollingRef.current) clearInterval(analysisPollingRef.current);
      if (pixTimerRef.current) clearInterval(pixTimerRef.current);
    };
  }, []);

  // Start PIX countdown timer when pixState is set
  useEffect(() => {
    if (!pixState) return;
    // Reset to 10 minutes (600 seconds) whenever a new PIX is generated
    setPixTimeLeft(600);
    if (pixTimerRef.current) clearInterval(pixTimerRef.current);
    pixTimerRef.current = setInterval(() => {
      setPixTimeLeft((prev) => {
        if (prev <= 1) {
          if (pixTimerRef.current) clearInterval(pixTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (pixTimerRef.current) clearInterval(pixTimerRef.current);
    };
  }, [pixState?.mpPaymentId]); // re-run only when a new PIX payment is generated

  // ============================================================
  // Handlers
  // ============================================================

  const handleNext = () => {
    if (currentStep === 1) {
      const errors: Record<string, string> = {};

      if (!bookingData.startDate || !bookingData.endDate) {
        errors.dates = "Selecione as datas de retirada e devolução";
      } else if (!isDateRangeValid(bookingData.startDate, bookingData.endDate)) {
        errors.dates = "Data de devolução deve ser após data de retirada";
      }

      if (!bookingData.renterFullName.trim()) {
        errors.renterFullName = "Informe seu nome completo";
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(bookingData.renterEmail)) {
        errors.renterEmail = "Informe um e-mail válido";
      }
      const phoneDigits = bookingData.renterPhone.replace(/\D/g, "");
      if (phoneDigits.length < 10) {
        errors.renterPhone = "Informe um telefone válido com DDD (ex: 11 99999-9999)";
      }
      const cpfDigits = bookingData.cpf.replace(/\D/g, "");
      if (cpfDigits.length !== 11) {
        errors.cpf = "CPF inválido. Digite os 11 dígitos (ex: 000.000.000-00)";
      }

      // CNH validation — all fields are required. User fills them directly here in the booking form.
      const MOTO_VALID = ["A", "AB"];
      const CAR_VALID = ["AB", "B", "C", "D", "E"];
      const cnhCat = bookingData.cnhCategory;

      if (!cnhCat) {
        errors.cnhCategory = "Selecione a categoria da sua CNH";
      }
      if (!bookingData.cnhNumber || bookingData.cnhNumber.replace(/\D/g, "").length < 9) {
        errors.cnhNumber = "Informe o número de registro da CNH (mínimo 9 dígitos)";
      }
      if (!bookingData.cnhExpiresAt) {
        errors.cnhExpiresAt = "Informe a validade da sua CNH";
      } else {
        const cnhExpiry = new Date(bookingData.cnhExpiresAt);
        if (cnhExpiry < new Date()) {
          errors.cnhExpiresAt = "Sua CNH está vencida. Renove antes de prosseguir.";
        }
      }

      if (cnhCat && !errors.cnhCategory) {
        if (vehicle?.vehicleType === "motorcycle") {
          if (!MOTO_VALID.includes(cnhCat)) {
            errors.cnhCategory = `CNH categoria ${cnhCat} não é válida para motos. É necessário CNH A ou AB.`;
          }
        } else {
          if (!CAR_VALID.includes(cnhCat)) {
            errors.cnhCategory = `CNH categoria ${cnhCat} não é válida para carros. É necessário CNH AB, B, C, D ou E.`;
          }
        }
      }

      // Address validation
      const zipDigits = bookingData.addressZipCode.replace(/\D/g, "");
      if (zipDigits.length !== 8) {
        errors.addressZipCode = "CEP inválido. Digite os 8 dígitos";
      }
      if (!bookingData.addressStreet.trim()) {
        errors.addressStreet = "Informe o logradouro";
      }
      if (!bookingData.addressNumber.trim()) {
        errors.addressNumber = "Informe o número do endereço";
      }
      if (!bookingData.addressNeighborhood.trim()) {
        errors.addressNeighborhood = "Informe o bairro";
      }
      if (!bookingData.addressCity.trim()) {
        errors.addressCity = "Informe a cidade";
      }
      if (!bookingData.addressState.trim()) {
        errors.addressState = "Informe o estado";
      }

      setStep1Errors(errors);

      if (Object.keys(errors).length > 0) {
        // Show the first error as a toast so user knows what to fix
        const firstError = Object.values(errors)[0];
        toast.error(firstError, { duration: 5000 });
        // Scroll to the error banner at the top of step 1
        setTimeout(() => {
          const banner = document.querySelector('[data-step1-error-banner]');
          if (banner) {
            banner.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            const el = document.querySelector('[data-step1-error]');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        return;
      }

      // Save CNH data to user profile in DB for future bookings (fire-and-forget)
      if (cnhCat && bookingData.cnhNumber && bookingData.cnhExpiresAt) {
        saveCNHToProfile.mutate(
          {
            cnhCategory: cnhCat as "A" | "AB" | "B" | "C" | "D" | "E" | "ACC",
            cnhNumber: bookingData.cnhNumber,
            cnhExpiresAt: bookingData.cnhExpiresAt,
          },
          {
            onSuccess: () => {
              // Also update local cache so Profile page reflects new data immediately
              trpcUtils.user.getProfile.invalidate();
            },
          }
        );
      }

      // For FLOW A (new booking): create the booking now so OTP can reference it
      // The booking starts as pending_payment; contract is NOT yet accepted (OTP pending)
      if (!existingBookingId && vehicleId) {
        setIsNavigating(true);
        createBooking.mutateAsync({
          vehicleId: parseInt(vehicleId),
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
          pickupLocation: (vehicle?.pickupCity || "") + ", " + (vehicle?.pickupState || ""),
          protectionLevel: "basic",
          contractAccepted: false, // Will be set to true after OTP verification
          renterFullName: bookingData.renterFullName,
          renterEmail: bookingData.renterEmail,
          renterPhone: bookingData.renterPhone,
          renterCpf: bookingData.cpf,
          renterAddressZipCode: bookingData.addressZipCode,
          renterAddressStreet: bookingData.addressStreet,
          renterAddressNumber: bookingData.addressNumber,
          renterAddressComplement: bookingData.addressComplement,
          renterAddressNeighborhood: bookingData.addressNeighborhood,
          renterAddressCity: bookingData.addressCity,
          renterAddressState: bookingData.addressState,
        }).then((result) => {
          setBookingId(result.id);
          bookingIdRef.current = result.id;
          setCurrentStep(2);
          setIsNavigating(false);
          window.scrollTo({ top: 0, behavior: 'instant' });
        }).catch((err: any) => {
          toast.error(err.message || "Erro ao criar reserva");
          setIsNavigating(false);
        });
        return; // Don't fall through to the generic advance below
      }
    }
    if (currentStep < 3) {
      setIsNavigating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsNavigating(false);
        // Scroll to top when advancing to next step
        window.scrollTo({ top: 0, behavior: 'instant' });
      }, 600);
    }
  };

  const handleBack = () => {
    // When in /pay/:bookingId flow, Voltar on step 2 goes back to My Bookings
    if (existingBookingId && currentStep === 2) {
      navigate("/my-bookings");
      return;
    }
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else navigate(`/vehicle/${vehicleId}`);
  };

  /**
   * Main handler - two distinct flows:
   *
   * FLOW A — New booking (/booking/:vehicleId, no existingBookingId):
   *   Booking was already created when user advanced from Step 1.
   *   Here we only validate card data and process payment.
   *
   * FLOW B — Retry payment (/pay/:bookingId, existingBookingId is set):
   *   The booking already exists and is in pending_payment.
   *   Validates card data, tokenizes via MP SDK, and calls processMPCreditCard.
   */
  const handleConfirm = async () => {
    if (!contractAccepted) {
      toast.error("Você deve aceitar os termos do contrato");
      return;
    }
    setPaymentError("");

    // Resolve the booking ID for both flows
    // FLOW A: booking was created in handleNext (Step 1 → Step 2 transition)
    // FLOW B: existingBookingId from URL param
    const resolvedBookingId = bookingId ?? bookingIdRef.current ?? existingBookingId;

     // ── FLOW A: New booking — booking already created, just process payment ────
    if (!existingBookingId) {
      if (!resolvedBookingId) {
        setPaymentError("Reserva não encontrada. Volte ao passo anterior.");
        return;
      }
      // Validate personal data
      const cpfDigitsA = bookingData.cpf.replace(/\D/g, "");
      if (cpfDigitsA.length !== 11) {
        setPaymentError("CPF inválido. Digite os 11 dígitos.");
        return;
      }
      // Validate card fields before creating the booking
      if (bookingData.paymentMethod === "credit_card") {
        if (!bookingData.cardNumber || bookingData.cardNumber.replace(/\D/g, "").length < 13) {
          setPaymentError("Número do cartão inválido");
          return;
        }
        if (!bookingData.cardExpiry || bookingData.cardExpiry.length < 5) {
          setPaymentError("Data de validade inválida");
          return;
        }
        if (!bookingData.cardCVV || bookingData.cardCVV.length < 3) {
          setPaymentError("CVV inválido");
          return;
        }
        if (!bookingData.cardholderName.trim()) {
          setPaymentError("Nome do titular é obrigatório");
          return;
        }
        if (bookingData.useThirdPartyCard) {
          const holderCpfDigits = bookingData.cardholderCpf.replace(/\D/g, "");
          if (holderCpfDigits.length !== 11) {
            setPaymentError("CPF do titular do cartão inválido. Digite os 11 dígitos.");
            return;
          }
        }
      }
      setIsTokenizing(true);
      try {
        // Booking already created in handleNext — just process payment
        const newBookingId = resolvedBookingId;
        toast.info(`Processando pagamento da reserva #RDY-${String(newBookingId).padStart(6, "0")}...`);
        // Process payment right away (do NOT set isTokenizing(false) here)
        if (bookingData.paymentMethod === "credit_card") {
          await processCreditCardPayment(newBookingId);
        } else if (bookingData.paymentMethod === "pix") {
          processPix.mutate({
            bookingId: newBookingId,
            cpf: cpfDigitsA,
          });
          setIsTokenizing(false);
        } else {
          // Fallback: redirect to booking
          navigate("/my-bookings");
        }
      } catch (err: any) {
        const errMsg = err.message || "Erro ao criar reserva";
        setPaymentError(errMsg);
        toast.error(errMsg);
        setIsTokenizing(false);
      }
      return;
    }

    // ── FLOW B: Process payment on existing approved booking ─────────────────
    const cpfDigits = bookingData.cpf.replace(/\D/g, "");
    if (cpfDigits.length !== 11) {
      setPaymentError("CPF inválido. Digite os 11 dígitos.");
      return;
    }
    // Validate card fields if credit card
    if (bookingData.paymentMethod === "credit_card") {
      if (!bookingData.cardNumber || bookingData.cardNumber.replace(/\D/g, "").length < 13) {
        setPaymentError("Número do cartão inválido");
        return;
      }
      if (!bookingData.cardExpiry || bookingData.cardExpiry.length < 5) {
        setPaymentError("Data de validade inválida");
        return;
      }
      if (!bookingData.cardCVV || bookingData.cardCVV.length < 3) {
        setPaymentError("CVV inválido");
        return;
      }
      if (!bookingData.cardholderName.trim()) {
        setPaymentError("Nome do titular é obrigatório");
        return;
      }
      // Validate cardholder CPF when using third-party card
      if (bookingData.useThirdPartyCard) {
        const holderCpfDigits = bookingData.cardholderCpf.replace(/\D/g, "");
        if (holderCpfDigits.length !== 11) {
          setPaymentError("CPF do titular do cartão inválido. Digite os 11 dígitos.");
          return;
        }
      }
    }
    setIsTokenizing(true);
    // Process payment on the existing booking (already approved by host)
    if (bookingData.paymentMethod === "credit_card") {
      await processCreditCardPayment(existingBookingId);
    } else if (bookingData.paymentMethod === "pix") {
      processPix.mutate({
        bookingId: existingBookingId,
        cpf: cpfDigits,
      });
      setIsTokenizing(false);
    }
  };

  const processCreditCardPayment = async (bid: number) => {
    const mp = getMPInstance();
    if (!mp) {
      setPaymentError("SDK do Mercado Pago não carregado. Recarregue a página.");
      setIsTokenizing(false);
      return;
    }

    try {
      // Tokenize card via MercadoPago.js
      const [month, year] = bookingData.cardExpiry.split("/");
      const fullYear = year?.length === 2 ? "20" + year : year;

      // Use the cardholder's CPF for tokenization (not the renter's CPF)
      // When using a third-party card, the card owner's CPF must be used
      const cpfForToken = bookingData.useThirdPartyCard && bookingData.cardholderCpf
        ? bookingData.cardholderCpf.replace(/\D/g, "")
        : bookingData.cpf.replace(/\D/g, "");

      const token = await mp.createCardToken({
        cardNumber: bookingData.cardNumber.replace(/\D/g, ""),
        cardholderName: bookingData.cardholderName,
        cardExpirationMonth: month,
        cardExpirationYear: fullYear,
        securityCode: bookingData.cardCVV,
        identificationType: "CPF",
        identificationNumber: cpfForToken,
      });

      if (!token?.id) {
        console.error("[RIDDY] createCardToken: token.id ausente — tokenização falhou");
        setPaymentError("Erro ao tokenizar cartão. Verifique os dados.");
        setIsTokenizing(false);
        return;
      }

      // Capture Device ID from MP security script (reduces cc_rejected_high_risk)
      const deviceId = (window as any).MP_DEVICE_SESSION_ID || "";

      // Send token to backend
      // Use cardholder's CPF for the payer when using a third-party card
      const payerCpf = bookingData.useThirdPartyCard && bookingData.cardholderCpf
        ? bookingData.cardholderCpf.replace(/\D/g, "")
        : bookingData.cpf.replace(/\D/g, "");

      // Safety timeout: if the mutation doesn't resolve in 40s, unblock the button
      const safetyTimer = setTimeout(() => {
        setIsTokenizing(false);
        setPaymentError("O pagamento demorou mais que o esperado. Verifique sua conexão e tente novamente.");
      }, 40000);

      processCreditCard.mutate(
        {
          bookingId: bid,
          cardToken: token.id,
          installments: bookingData.installments,
          paymentMethodId: mpPaymentMethodId || "visa",
          issuerId: mpIssuerId || undefined,
          cpf: payerCpf,
          deviceId: deviceId || undefined,
        },
        {
          onSettled: (data, error) => {
            clearTimeout(safetyTimer);
          },
        }
      );
    } catch (err: any) {
      console.error("[RIDDY] processCreditCardPayment ERRO:", err);
      console.error("[RIDDY] err.cause:", err?.cause);
      console.error("[RIDDY] err.message:", err?.message);
      const msg = err?.cause?.[0]?.description || err?.message || "Erro ao processar cartão";
      setPaymentError(msg);
      setIsTokenizing(false);
    }
  };

  const copyPixCode = () => {
    if (!pixState?.qrCode) return;
    navigator.clipboard.writeText(pixState.qrCode);
    setPixState((prev) => prev ? { ...prev, copied: true } : null);
    setTimeout(() => setPixState((prev) => prev ? { ...prev, copied: false } : null), 3000);
  };

  // ============================================================
  // Loading / Not found states
  // ============================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-[#0A0F1C]">
        <Header />
        <main className="pt-20 pb-20">
          <div className="container text-center py-20">
            <Car className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Veículo não encontrado</h1>
            <p className="text-gray-400 mb-6">O veículo que você está procurando não existe ou foi removido.</p>
            <Button onClick={() => navigate("/")} className="bg-cyan-500 text-black">
              Voltar para Home
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Redirect if not verified
  if (verificationStatus && verificationStatus.status !== "approved") {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-yellow-500/50 bg-yellow-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-400">
                <AlertCircle className="w-5 h-5" />
                Verificação Necessária
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                Para fazer uma reserva, você precisa verificar sua identidade primeiro.
              </p>
              <Button onClick={() => navigate("/verify-identity")} className="w-full bg-yellow-500 text-black">
                Verificar Identidade
              </Button>
              <Button onClick={() => navigate("/")} variant="outline" className="w-full border-white/20 text-white">
                Voltar para Home
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="min-h-screen bg-[#0A0F1C]" style={{ cursor: 'url(data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="white" stroke="white" stroke-width="2"/></svg>) 16 16, auto' }}>
      {/* 3DS 2.0 Authentication Modal */}
      {threeDSState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1A2035] rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-cyan-400" />
                <span className="text-white font-semibold">Autenticação Bancária</span>
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-gray-400 text-sm">Aguardando confirmação...</span>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-300 text-sm mb-3">
                Seu banco requer autenticação adicional para aprovar este pagamento. Confirme abaixo:
              </p>
              <iframe
                src={threeDSState.url}
                className="w-full rounded-lg border border-white/10"
                style={{ height: '400px' }}
                title="Autenticação 3DS"
                sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
              />
              <p className="text-gray-500 text-xs mt-3 text-center">
                🔒 Conexão segura. Este é o sistema de autenticação do seu banco.
              </p>
            </div>
          </div>
        </div>
      )}
      <Header />

      <main className="pt-20 pb-20">
        <div className="container max-w-5xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            className="text-gray-400 hover:text-white mb-6"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors ${
                    currentStep >= step.id
                      ? "bg-cyan-500 text-black"
                      : "bg-white/10 text-gray-400"
                  }`}
                >
                  {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                </div>
                <span
                  className={`ml-2 text-sm hidden sm:block ${
                    currentStep >= step.id ? "text-white" : "text-gray-500"
                  }`}
                >
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 sm:w-16 h-0.5 mx-2 ${
                      currentStep > step.id ? "bg-cyan-500" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {/* Step 1: Dates + Personal Data */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Error Summary Banner - shown when validation fails */}
                    {Object.keys(step1Errors).length > 0 && (
                      <div data-step1-error-banner className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-red-300 font-semibold text-sm">Preencha os campos obrigatórios para continuar:</p>
                          <ul className="mt-1 space-y-0.5">
                            {Object.values(step1Errors).map((err, i) => (
                              <li key={i} className="text-red-400 text-xs">• {err}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Dates Card — read-only (frozen from VehicleDetails) */}
                    <Card className="bg-white/5 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-cyan-400" />
                          Datas e Local de Retirada
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Frozen date display — cannot be edited here */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-gray-400 text-xs uppercase tracking-wide">Data de Retirada</Label>
                            <div className="mt-2 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                              <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
                              <span className="text-white font-medium">{formatDateBR(bookingData.startDate) || '—'}</span>
                              <Lock className="w-3 h-3 text-gray-500 ml-auto shrink-0" />
                            </div>
                          </div>
                          <div>
                            <Label className="text-gray-400 text-xs uppercase tracking-wide">Data de Devolução</Label>
                            <div className="mt-2 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                              <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
                              <span className="text-white font-medium">{formatDateBR(bookingData.endDate) || '—'}</span>
                              <Lock className="w-3 h-3 text-gray-500 ml-auto shrink-0" />
                            </div>
                          </div>
                        </div>
                        {/* Duration badge */}
                        {pricing && (
                          <div className="flex items-center gap-2 text-sm text-cyan-400">
                            <Check className="w-4 h-4" />
                            <span>{pricing.days} {pricing.days === 1 ? 'dia' : 'dias'} selecionados</span>
                            <button
                              type="button"
                              onClick={() => {
                                // Navigate back to vehicle details to change dates
                                if (vehicleId) navigate(`/vehicles/${vehicleId}`);
                                else window.history.back();
                              }}
                              className="ml-auto text-gray-400 hover:text-white text-xs underline underline-offset-2 transition-colors"
                            >
                              Alterar datas
                            </button>
                          </div>
                        )}
                        {step1Errors.dates && <p data-step1-error className="text-red-400 text-sm">{step1Errors.dates}</p>}
                        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-cyan-400 mt-0.5" />
                            <div>
                              <p className="text-white font-medium">Local de Retirada</p>
                              <p className="text-gray-400 text-sm mt-1">
                                {vehicle.pickupCity}, {vehicle.pickupState}
                              </p>
                              <p className="text-gray-500 text-xs mt-1">
                                O endereço exato será enviado após a confirmação da reserva.
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Personal Data Card */}
                    <Card className="bg-white/5 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Shield className="w-5 h-5 text-cyan-400" />
                          Seus Dados
                        </CardTitle>
                        <p className="text-gray-400 text-sm">Precisamos de algumas informações básicas para continuar.</p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-gray-400">Nome Completo *</Label>
                          <Input
                            value={bookingData.renterFullName}
                            onChange={(e) => { setBookingData(prev => ({ ...prev, renterFullName: e.target.value })); setStep1Errors(p => ({ ...p, renterFullName: '' })); }}
                            placeholder="Como está no seu documento"
                            className={`mt-2 bg-white/5 border-white/20 text-white placeholder:text-gray-500 ${step1Errors.renterFullName ? 'border-red-500' : ''}`}
                          />
                          {step1Errors.renterFullName && <p data-step1-error className="text-red-400 text-xs mt-1">{step1Errors.renterFullName}</p>}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-gray-400">E-mail *</Label>
                            <Input
                              type="email"
                              value={bookingData.renterEmail}
                              onChange={(e) => { setBookingData(prev => ({ ...prev, renterEmail: e.target.value })); setStep1Errors(p => ({ ...p, renterEmail: '' })); }}
                              placeholder="seu@email.com"
                              className={`mt-2 bg-white/5 border-white/20 text-white placeholder:text-gray-500 ${step1Errors.renterEmail ? 'border-red-500' : ''}`}
                            />
                            {step1Errors.renterEmail && <p data-step1-error className="text-red-400 text-xs mt-1">{step1Errors.renterEmail}</p>}
                          </div>
                          <div>
                            <Label className="text-gray-400">Telefone / WhatsApp *</Label>
                            <Input
                              value={bookingData.renterPhone}
                              onChange={(e) => {
                                const v = e.target.value.replace(/\D/g, "").slice(0, 11);
                                const fmt = v.length <= 2 ? v
                                  : v.length <= 7 ? `(${v.slice(0,2)}) ${v.slice(2)}`
                                  : `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
                                setBookingData(prev => ({ ...prev, renterPhone: fmt }));
                                setStep1Errors(p => ({ ...p, renterPhone: '' }));
                              }}
                              placeholder="(11) 99999-9999"
                              className={`mt-2 bg-white/5 border-white/20 text-white placeholder:text-gray-500 ${step1Errors.renterPhone ? 'border-red-500' : ''}`}
                            />
                            {step1Errors.renterPhone && <p data-step1-error className="text-red-400 text-xs mt-1">{step1Errors.renterPhone}</p>}
                          </div>
                        </div>
                        <div>
                          <Label className="text-gray-400">CPF *</Label>
                          <Input
                            value={bookingData.cpf}
                            onChange={(e) => { setBookingData(prev => ({ ...prev, cpf: maskCPF(e.target.value) })); setStep1Errors(p => ({ ...p, cpf: '' })); }}
                            placeholder="000.000.000-00"
                            className={`mt-2 bg-white/5 border-white/20 text-white placeholder:text-gray-500 ${step1Errors.cpf ? 'border-red-500' : ''}`}
                          />
                          {step1Errors.cpf
                            ? <p data-step1-error className="text-red-400 text-xs mt-1">{step1Errors.cpf}</p>
                            : <p className="text-gray-500 text-xs mt-1">Obrigatório para processamento do pagamento.</p>
                          }
                        </div>
                      </CardContent>
                    </Card>

                    {/* CNH Card - shown for all vehicle types */}
                    <Card className="bg-white/5 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <FileText className="w-5 h-5 text-cyan-400" />
                          Dados da CNH
                        </CardTitle>
                        <p className="text-gray-400 text-sm">
                          {vehicle?.vehicleType === "motorcycle"
                            ? "Obrigatório: CNH categoria A ou AB para motos."
                            : "Obrigatório: CNH categoria AB, B, C, D ou E para carros."}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-gray-400">Categoria da CNH *</Label>
                            <select
                              value={bookingData.cnhCategory}
                              onChange={(e) => { setBookingData(prev => ({ ...prev, cnhCategory: e.target.value })); setStep1Errors(p => ({ ...p, cnhCategory: '' })); }}
                              className={`mt-2 w-full bg-white/5 border text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 ${step1Errors.cnhCategory ? 'border-red-500' : 'border-white/20'}`}
                            >
                              <option value="" className="bg-[#0A0F1C]">Selecione a categoria</option>
                              <option value="A" className="bg-[#0A0F1C]">A - Motos</option>
                              <option value="AB" className="bg-[#0A0F1C]">AB - Motos e Carros</option>
                              <option value="B" className="bg-[#0A0F1C]">B - Carros</option>
                              <option value="C" className="bg-[#0A0F1C]">C - Caminhões</option>
                              <option value="D" className="bg-[#0A0F1C]">D - Ônibus</option>
                              <option value="E" className="bg-[#0A0F1C]">E - Combinação de veículos</option>
                              <option value="ACC" className="bg-[#0A0F1C]">ACC - Ciclomotores</option>
                            </select>
                            {step1Errors.cnhCategory && <p data-step1-error className="text-red-400 text-xs mt-1">{step1Errors.cnhCategory}</p>}
                          </div>
                          <div>
                            <Label className="text-gray-400">Número de Registro *</Label>
                            <Input
                              value={bookingData.cnhNumber}
                              onChange={(e) => { setBookingData(prev => ({ ...prev, cnhNumber: e.target.value.replace(/\D/g, "").slice(0, 11) })); setStep1Errors(p => ({ ...p, cnhNumber: '' })); }}
                              placeholder="00000000000"
                              className={`mt-2 bg-white/5 border-white/20 text-white placeholder:text-gray-500 ${step1Errors.cnhNumber ? 'border-red-500' : ''}`}
                            />
                            {step1Errors.cnhNumber && <p data-step1-error className="text-red-400 text-xs mt-1">{step1Errors.cnhNumber}</p>}
                          </div>
                        </div>
                        <div className="max-w-xs">
                          <Label className="text-gray-400">Validade da CNH *</Label>
                          <Input
                            type="date"
                            value={bookingData.cnhExpiresAt}
                            onChange={(e) => { setBookingData(prev => ({ ...prev, cnhExpiresAt: e.target.value })); setStep1Errors(p => ({ ...p, cnhExpiresAt: '' })); }}
                            className={`mt-2 bg-white/5 border-white/20 text-white ${step1Errors.cnhExpiresAt ? 'border-red-500' : ''}`}
                            min={new Date().toISOString().split("T")[0]}
                          />
                          {step1Errors.cnhExpiresAt && <p data-step1-error className="text-red-400 text-xs mt-1">{step1Errors.cnhExpiresAt}</p>}
                          {bookingData.cnhExpiresAt && (() => {
                            const expiry = new Date(bookingData.cnhExpiresAt);
                            const now = new Date();
                            const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                            if (daysLeft < 0) return (
                              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> CNH vencida. Renove antes de prosseguir.
                              </p>
                            );
                            if (daysLeft <= 30) return (
                              <p className="text-amber-400 text-xs mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> CNH vence em {daysLeft} dia{daysLeft !== 1 ? "s" : ""}. Considere renovar em breve.
                              </p>
                            );
                            return null;
                          })()}
                        </div>
                        <p className="text-gray-500 text-xs">O proprietário poderá solicitar a CNH física no momento da retirada do veículo.</p>
                      </CardContent>
                    </Card>

                    {/* Address Card */}
                    <Card className="bg-white/5 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-cyan-400" />
                          Endereço Residencial
                        </CardTitle>
                        <p className="text-gray-400 text-sm">Necessário para o contrato de locação.</p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* CEP with autocomplete */}
                        <div className="max-w-xs">
                          <Label className="text-gray-400">CEP *</Label>
                          <div className="relative">
                            <Input
                              value={bookingData.addressZipCode}
                              onChange={async (e) => {
                                const raw = e.target.value.replace(/\D/g, "").slice(0, 8);
                                const formatted = raw.length > 5 ? `${raw.slice(0,5)}-${raw.slice(5)}` : raw;
                                setBookingData(prev => ({ ...prev, addressZipCode: formatted }));
                                setStep1Errors(p => ({ ...p, addressZipCode: '' }));
                                if (raw.length === 8) {
                                  try {
                                    const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
                                    const data = await res.json();
                                    if (!data.erro) {
                                      setBookingData(prev => ({
                                        ...prev,
                                        addressStreet: data.logradouro || prev.addressStreet,
                                        addressNeighborhood: data.bairro || prev.addressNeighborhood,
                                        addressCity: data.localidade || prev.addressCity,
                                        addressState: data.uf || prev.addressState,
                                      }));
                                      setStep1Errors(p => ({ ...p, addressStreet: '', addressNeighborhood: '', addressCity: '', addressState: '' }));
                                    } else {
                                      setStep1Errors(p => ({ ...p, addressZipCode: 'CEP não encontrado' }));
                                    }
                                  } catch (_) {}
                                }
                              }}
                              placeholder="00000-000"
                              className={`mt-2 bg-white/5 border-white/20 text-white placeholder:text-gray-500 ${step1Errors.addressZipCode ? 'border-red-500' : ''}`}
                            />
                          </div>
                          {step1Errors.addressZipCode && <p data-step1-error className="text-red-400 text-xs mt-1">{step1Errors.addressZipCode}</p>}
                        </div>

                        {/* Street + Number */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="sm:col-span-2">
                            <Label className="text-gray-400">Logradouro (Rua/Av.) *</Label>
                            <Input
                              value={bookingData.addressStreet}
                              onChange={(e) => { setBookingData(prev => ({ ...prev, addressStreet: e.target.value })); setStep1Errors(p => ({ ...p, addressStreet: '' })); }}
                              placeholder="Rua das Flores"
                              className={`mt-2 bg-white/5 border-white/20 text-white placeholder:text-gray-500 ${step1Errors.addressStreet ? 'border-red-500' : ''}`}
                            />
                            {step1Errors.addressStreet && <p data-step1-error className="text-red-400 text-xs mt-1">{step1Errors.addressStreet}</p>}
                          </div>
                          <div>
                            <Label className="text-gray-400">Número *</Label>
                            <Input
                              value={bookingData.addressNumber}
                              onChange={(e) => { setBookingData(prev => ({ ...prev, addressNumber: e.target.value })); setStep1Errors(p => ({ ...p, addressNumber: '' })); }}
                              placeholder="123"
                              className={`mt-2 bg-white/5 border-white/20 text-white placeholder:text-gray-500 ${step1Errors.addressNumber ? 'border-red-500' : ''}`}
                            />
                            {step1Errors.addressNumber && <p data-step1-error className="text-red-400 text-xs mt-1">{step1Errors.addressNumber}</p>}
                          </div>
                        </div>

                        {/* Complement + Neighborhood */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-gray-400">Complemento <span className="text-gray-500 text-xs">(opcional)</span></Label>
                            <Input
                              value={bookingData.addressComplement}
                              onChange={(e) => setBookingData(prev => ({ ...prev, addressComplement: e.target.value }))}
                              placeholder="Apto 42, Bloco B"
                              className="mt-2 bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                            />
                          </div>
                          <div>
                            <Label className="text-gray-400">Bairro *</Label>
                            <Input
                              value={bookingData.addressNeighborhood}
                              onChange={(e) => { setBookingData(prev => ({ ...prev, addressNeighborhood: e.target.value })); setStep1Errors(p => ({ ...p, addressNeighborhood: '' })); }}
                              placeholder="Centro"
                              className={`mt-2 bg-white/5 border-white/20 text-white placeholder:text-gray-500 ${step1Errors.addressNeighborhood ? 'border-red-500' : ''}`}
                            />
                            {step1Errors.addressNeighborhood && <p data-step1-error className="text-red-400 text-xs mt-1">{step1Errors.addressNeighborhood}</p>}
                          </div>
                        </div>

                        {/* City + State */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="sm:col-span-2">
                            <Label className="text-gray-400">Cidade *</Label>
                            <Input
                              value={bookingData.addressCity}
                              onChange={(e) => { setBookingData(prev => ({ ...prev, addressCity: e.target.value })); setStep1Errors(p => ({ ...p, addressCity: '' })); }}
                              placeholder="São Paulo"
                              className={`mt-2 bg-white/5 border-white/20 text-white placeholder:text-gray-500 ${step1Errors.addressCity ? 'border-red-500' : ''}`}
                            />
                            {step1Errors.addressCity && <p data-step1-error className="text-red-400 text-xs mt-1">{step1Errors.addressCity}</p>}
                          </div>
                          <div>
                            <Label className="text-gray-400">Estado *</Label>
                            <Input
                              value={bookingData.addressState}
                              onChange={(e) => { setBookingData(prev => ({ ...prev, addressState: e.target.value.toUpperCase().slice(0, 2) })); setStep1Errors(p => ({ ...p, addressState: '' })); }}
                              placeholder="SP"
                              maxLength={2}
                              className={`mt-2 bg-white/5 border-white/20 text-white placeholder:text-gray-500 ${step1Errors.addressState ? 'border-red-500' : ''}`}
                            />
                            {step1Errors.addressState && <p data-step1-error className="text-red-400 text-xs mt-1">{step1Errors.addressState}</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Step 2: Payment - Mercado Pago Transparent Checkout */}
                {currentStep === 2 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Card className="bg-white/5 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-cyan-400" />
                          Pagamento Seguro
                          <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                            <Lock className="w-3 h-3" />
                            <span>Mercado Pago</span>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Payment method selector */}
                        <RadioGroup
                          value={bookingData.paymentMethod}
                          onValueChange={(v) => setBookingData(prev => ({ ...prev, paymentMethod: v }))}
                          className="space-y-3"
                        >
                          <div
                            className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                              bookingData.paymentMethod === "credit_card"
                                ? "border-cyan-500 bg-cyan-500/10"
                                : "border-white/10 bg-white/5 hover:bg-white/10"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value="credit_card" id="credit_card" />
                              <Label htmlFor="credit_card" className="text-white font-semibold cursor-pointer flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-cyan-400" />
                                Cartão de Crédito
                              </Label>
                              {cardBrand && (
                                <Badge variant="outline" className="ml-auto border-cyan-500/50 text-cyan-400 text-xs">
                                  {cardBrand}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div
                            className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                              bookingData.paymentMethod === "pix"
                                ? "border-cyan-500 bg-cyan-500/10"
                                : "border-white/10 bg-white/5 hover:bg-white/10"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <RadioGroupItem value="pix" id="pix" />
                                <Label htmlFor="pix" className="text-white font-semibold cursor-pointer flex items-center gap-2">
                                  <QrCode className="w-4 h-4 text-green-400" />
                                  PIX
                                </Label>
                              </div>
                              <span className="text-green-400 text-sm font-medium">5% de desconto</span>
                            </div>
                          </div>
                        </RadioGroup>

                        {/* Checkout Pro alternative — always visible as separator option */}
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#0A0F1C] px-2 text-gray-500">ou pague por</span>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full border-[#009EE3]/50 text-[#009EE3] hover:bg-[#009EE3]/10 hover:text-[#009EE3] font-semibold"
                          onClick={handleOpenCheckoutPro}
                          disabled={createCheckoutPro.isPending || !bookingId}
                        >
                          {createCheckoutPro.isPending ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Aguarde...</>
                          ) : (
                            <>Pagar com Mercado Pago (Checkout Pro)</>
                          )}
                        </Button>
                        <p className="text-xs text-gray-500 text-center -mt-2">
                          Você será redirecionado ao site do Mercado Pago para concluir o pagamento
                        </p>

                        {/* Credit Card Form */}
                        {bookingData.paymentMethod === "credit_card" && (
                          <div className="space-y-4 pt-2 border-t border-white/10">
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Dados criptografados pelo Mercado Pago. Nunca armazenamos seu cartão.
                            </p>

                            <div>
                              <Label className="text-gray-400">Número do Cartão *</Label>
                              <Input
                                placeholder="0000 0000 0000 0000"
                                value={bookingData.cardNumber}
                                onChange={(e) => setBookingData(prev => ({ ...prev, cardNumber: maskCardNumber(e.target.value) }))}
                                maxLength={19}
                                className="bg-white/5 border-white/10 text-white mt-2 font-mono"
                                inputMode="numeric"
                              />
                            </div>

                            <div>
                              <Label className="text-gray-400">Nome no Cartão *</Label>
                              <Input
                                placeholder="Como está impresso no cartão"
                                value={bookingData.cardholderName}
                                onChange={(e) => setBookingData(prev => ({ ...prev, cardholderName: e.target.value.toUpperCase() }))}
                                className="bg-white/5 border-white/10 text-white mt-2 uppercase"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-gray-400">Validade *</Label>
                                <Input
                                  placeholder="MM/AA"
                                  value={bookingData.cardExpiry}
                                  onChange={(e) => setBookingData(prev => ({ ...prev, cardExpiry: maskExpiry(e.target.value) }))}
                                  maxLength={5}
                                  className="bg-white/5 border-white/10 text-white mt-2 font-mono"
                                  inputMode="numeric"
                                />
                              </div>
                              <div>
                                <Label className="text-gray-400">CVV *</Label>
                                <Input
                                  placeholder="123"
                                  value={bookingData.cardCVV}
                                  onChange={(e) => setBookingData(prev => ({ ...prev, cardCVV: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                                  maxLength={4}
                                  className="bg-white/5 border-white/10 text-white mt-2 font-mono"
                                  inputMode="numeric"
                                  type="password"
                                />
                              </div>
                            </div>

                            {/* Installments */}
                            {installmentOptions.length > 0 && (
                              <div>
                                <Label className="text-gray-400">Parcelas</Label>
                                <Select
                                  value={bookingData.installments.toString()}
                                  onValueChange={(v) => setBookingData(prev => ({ ...prev, installments: parseInt(v) }))}
                                >
                                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                                    <SelectValue placeholder="Selecione as parcelas" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {installmentOptions.map((opt) => (
                                      <SelectItem key={opt.value} value={opt.value.toString()}>
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        )}

                        {/* PIX info */}
                        {bookingData.paymentMethod === "pix" && (
                          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <QrCode className="w-5 h-5 text-green-400 mt-0.5" />
                              <div>
                                <p className="text-white font-medium">Pagamento via PIX</p>
                                <p className="text-sm text-gray-400 mt-1">
                                  Após confirmar, um QR Code PIX será gerado. O pagamento é confirmado em segundos e você recebe 5% de desconto.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* CPF field (required for both methods) */}
                        <div>
                          <Label className="text-gray-400">CPF do Locatário *</Label>
                          <Input
                            placeholder="000.000.000-00"
                            value={bookingData.cpf}
                            onChange={(e) => setBookingData(prev => ({ ...prev, cpf: maskCPF(e.target.value) }))}
                            maxLength={14}
                            className="bg-white/5 border-white/10 text-white mt-2 font-mono"
                            inputMode="numeric"
                          />
                          <p className="text-xs text-gray-500 mt-1">CPF de quem está alugando o veículo.</p>
                        </div>

                        {/* Third-party card toggle */}
                        {bookingData.paymentMethod === "credit_card" && (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                            <input
                              type="checkbox"
                              id="useThirdPartyCard"
                              checked={bookingData.useThirdPartyCard}
                              onChange={(e) => setBookingData(prev => ({ ...prev, useThirdPartyCard: e.target.checked, cardholderCpf: "" }))}
                              className="w-4 h-4 accent-cyan-500 cursor-pointer"
                            />
                            <Label htmlFor="useThirdPartyCard" className="text-gray-300 cursor-pointer text-sm">
                              Estou pagando com cartão de outra pessoa
                            </Label>
                          </div>
                        )}

                        {/* CPF do titular do cartão (apenas se cartão de terceiro) */}
                        {bookingData.paymentMethod === "credit_card" && bookingData.useThirdPartyCard && (
                          <div>
                            <Label className="text-gray-400">CPF do Titular do Cartão *</Label>
                            <Input
                              placeholder="000.000.000-00"
                              value={bookingData.cardholderCpf}
                              onChange={(e) => setBookingData(prev => ({ ...prev, cardholderCpf: maskCPF(e.target.value) }))}
                              maxLength={14}
                              className="bg-white/5 border-white/10 text-white mt-2 font-mono"
                              inputMode="numeric"
                            />
                            <p className="text-xs text-gray-500 mt-1">CPF do dono do cartão — necessário para validação antifraude do Mercado Pago.</p>
                          </div>
                        )}

                        {/* Error display */}
                        {paymentError && (
                          <div className="space-y-3">
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                              <p className="text-red-400 text-sm">{paymentError}</p>
                            </div>
                            {/* Checkout Pro fallback when card is rejected */}
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                              <p className="text-white font-semibold text-sm mb-1">Cartão recusado? Tente pelo Mercado Pago</p>
                              <p className="text-gray-400 text-xs mb-3">
                                Pague diretamente no site do Mercado Pago com maior taxa de aprovação — aceita mais cartões, parcelamento e outros métodos.
                              </p>
                              <Button
                                type="button"
                                className="w-full bg-[#009EE3] hover:bg-[#0088c7] text-white font-semibold"
                                onClick={handleOpenCheckoutPro}
                                disabled={createCheckoutPro.isPending || !bookingId}
                              >
                                {createCheckoutPro.isPending ? (
                                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Aguarde...</>
                                ) : (
                                  <>Pagar com Mercado Pago</>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Garantia Reembolsável notice */}
                        {pricing && (
                          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                              <Shield className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-amber-300 font-semibold text-sm">Garantia Reembolsável</p>
                                  <span className="text-amber-300 font-bold text-sm">R$ {pricing.securityDeposit.toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-amber-200/70 leading-relaxed">
                                  {pricing.effectiveMultiplier}× a diária · cobrada no pagamento · devolvida após entrega sem avarias
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setShowGuaranteeModal(true)}
                                  className="text-xs text-amber-400 underline underline-offset-2 mt-1.5 hover:text-amber-300 transition-colors"
                                >
                                  Saiba mais
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Rental contract — must be read before signing */}
                    <div className="mt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-white font-semibold text-base">Contrato de Locação</h3>
                        <span className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded px-2 py-0.5 ml-auto">
                          Leia antes de assinar
                        </span>
                      </div>
                      <RentalContract
                        vehicleModel={`${vehicle?.brand} ${vehicle?.model}`}
                        vehicleYear={vehicle?.year?.toString() || ""}
                        vehicleColor={(vehicle as any)?.color || ""}
                        vehiclePlate={vehicle?.licensePlate || ""}
                        ownerName={(vehicle as any)?.ownerName || "Proprietário"}
                        ownerCpf={(vehicle as any)?.hostCpfCnpj || "[CPF/CNPJ]"}
                        ownerEmail={(vehicle as any)?.ownerEmail || ""}
                        ownerPhone={(vehicle as any)?.ownerPhone || ""}
                        renterName={bookingData.renterFullName || userProfile?.name || "Locatário"}
                        renterCpf={bookingData.cpf || ""}
                        renterCnh={bookingData.cnhNumber || ""}
                        renterCnhCategory={bookingData.cnhCategory || ""}
                        renterCnhExpiry={bookingData.cnhExpiresAt ? new Date(bookingData.cnhExpiresAt).toLocaleDateString("pt-BR") : ""}
                        renterEmail={bookingData.renterEmail || ""}
                        renterPhone={bookingData.renterPhone || ""}
                        startDate={formatDateBR(bookingData.startDate)}
                        endDate={formatDateBR(bookingData.endDate)}
                        dailyRate={`R$ ${vehicle?.dailyPrice}`}
                        totalAmount={pricing ? `R$ ${pricing.finalTotal.toFixed(2)}` : ""}
                        securityDeposit={pricing ? `R$ ${pricing.securityDeposit.toFixed(2)}` : "R$ 500,00"}
                        serviceFee={pricing ? `R$ ${pricing.serviceFee.toFixed(2)}` : "R$ 0,00"}
                        vehicleCity={vehicle?.pickupCity || "São Paulo"}
                        vehicleState={vehicle?.pickupState || "SP"}
                        dailyKmLimit={pricing?.dailyKmLimit || 100}
                        extraKmPrice={pricing?.extraKmPrice || 0.5}
                      />
                    </div>

                    {/* Contract acceptance — OTP signing */}
                    <Card className="bg-cyan-500/10 border-cyan-500/30 mt-4">
                      <CardContent className="p-6">
                        {contractAccepted ? (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center flex-shrink-0">
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                              <p className="text-white font-semibold">Contrato assinado com sucesso</p>
                              <p className="text-sm text-gray-400 mt-0.5">Sua identidade foi verificada e o contrato está assinado eletronicamente.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Shield className="w-5 h-5 text-cyan-400" />
                              </div>
                              <div className="flex-1">
                                <p className="text-white font-semibold text-base">Assinar Contrato de Locação</p>
                                <p className="text-sm text-gray-300 mt-1">
                                  Para confirmar que você leu e aceita os termos, enviaremos um código de verificação para o seu celular ou e-mail.
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              onClick={() => setOtpModalOpen(true)}
                              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
                            >
                              <Lock className="w-4 h-4 mr-2" />
                              Assinar com código de verificação
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Step 3: Three distinct layout states */}
                {currentStep === 3 && (() => {
                  const realBookingId = bookingId ?? bookingIdRef.current;
                  const isProcessing = isTokenizing || processCreditCard.isPending || processPix.isPending;
                  const hasResult = paymentSuccess || paymentInAnalysis || paymentError || pixState;

                  // ── STATE 1: DECISION — large dominant card before payment ──────────────
                  if (!isProcessing && !hasResult) {
                    return (
                      <motion.div
                        key="step3-decision"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Hero decision card */}
                        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                          {/* Vehicle banner */}
                          <div className="relative">
                            {vehicle?.mainImageUrl ? (
                              <img
                                src={vehicle.mainImageUrl}
                                alt={`${vehicle?.brand} ${vehicle?.model}`}
                                className="w-full h-44 object-cover"
                              />
                            ) : (
                              <div className="w-full h-44 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                {vehicle?.vehicleType === "motorcycle" ? (
                                  <Bike className="w-16 h-16 text-gray-600" />
                                ) : (
                                  <Car className="w-16 h-16 text-gray-600" />
                                )}
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className="absolute bottom-4 left-5 right-5">
                              <h2 className="text-2xl font-bold text-white">
                                {vehicle?.brand} {vehicle?.model}
                              </h2>
                              <p className="text-gray-300 text-sm">{vehicle?.year} · {vehicle?.pickupCity}, {vehicle?.pickupState}</p>
                            </div>
                          </div>

                          {/* Reservation details */}
                          <div className="p-6 space-y-5">
                            {/* Dates row */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white/5 rounded-xl p-4">
                                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Retirada</p>
                                <p className="text-white font-semibold">{formatDateBR(bookingData.startDate)}</p>
                                <p className="text-gray-400 text-xs mt-0.5">{bookingData.pickupTime}</p>
                              </div>
                              <div className="bg-white/5 rounded-xl p-4">
                                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Devolução</p>
                                <p className="text-white font-semibold">{formatDateBR(bookingData.endDate)}</p>
                                <p className="text-gray-400 text-xs mt-0.5">{bookingData.returnTime}</p>
                              </div>
                            </div>

                            {/* Price breakdown */}
                            {pricing && (
                              <div className="space-y-2.5">
                                <div className="flex justify-between text-sm text-gray-400">
                                  <span>R$ {parseFloat(vehicle?.dailyPrice || "0").toFixed(0)}/dia × {pricing.days} dias</span>
                                  <span>R$ {pricing.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-400">
                                  <span>Taxa de serviço</span>
                                  <span>R$ {pricing.serviceFee.toFixed(2)}</span>
                                </div>
                                {pricing.insuranceFee > 0 && (
                                  <div className="flex justify-between text-sm text-gray-400">
                                    <span>Proteção</span>
                                    <span>R$ {pricing.insuranceFee.toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-sm text-amber-300">
                                  <span className="flex items-center gap-1">
                                    <Shield className="w-3 h-3" />
                                    Garantia Reembolsável ({pricing.effectiveMultiplier}× diária)
                                  </span>
                                  <span>R$ {pricing.securityDeposit.toFixed(2)}</span>
                                </div>
                                {pricing.pixDiscount > 0 && (
                                  <div className="flex justify-between text-sm text-green-400">
                                    <span>Desconto PIX (5%)</span>
                                    <span>−R$ {pricing.pixDiscount.toFixed(2)}</span>
                                  </div>
                                )}
                                <Separator className="bg-white/10" />
                                {/* Total — dominant visual, includes caução e juros de parcelamento */}
                                <div className="flex justify-between items-center pt-1">
                                  <span className="text-white font-semibold text-lg">Total</span>
                                  <span className="text-3xl font-bold text-cyan-400">
                                    R$ {(effectiveTotal ?? pricing.finalTotal).toFixed(2)}
                                  </span>
                                </div>
                                {effectiveTotal != null && effectiveTotal > pricing.finalTotal && (
                                  <p className="text-xs text-orange-400 text-right">
                                    Inclui juros de parcelamento · sem juros: R$ {pricing.finalTotal.toFixed(2)}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 text-right">
                                  {bookingData.paymentMethod === "credit_card" && bookingData.installments > 1
                                    ? `${bookingData.installments}× de R$ ${((effectiveTotal ?? pricing.finalTotal) / bookingData.installments).toFixed(2)}`
                                    : bookingData.paymentMethod === "pix" ? "Pagamento à vista via PIX" : "Pagamento à vista no cartão"}
                                </p>
                                <p className="text-xs text-amber-300/60 text-right mt-1">
                                  Garantia Reembolsável: R$ {pricing.securityDeposit.toFixed(2)} · devolvida após entrega
                                </p>
                              </div>
                            )}

                            {/* Payment method badge */}
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                              {bookingData.paymentMethod === "pix" ? (
                                <QrCode className="w-4 h-4 text-green-400" />
                              ) : (
                                <CreditCard className="w-4 h-4 text-cyan-400" />
                              )}
                              <span className="text-sm text-gray-300">
                                {bookingData.paymentMethod === "pix" ? "PIX" : `Cartão de crédito${bookingData.cardNumber ? ` ····${bookingData.cardNumber.replace(/\D/g, "").slice(-4)}` : ""}`}
                              </span>
                              <Lock className="w-3 h-3 text-gray-500 ml-auto" />
                              <span className="text-xs text-gray-500">Mercado Pago</span>
                            </div>

                            {/* Contract acceptance indicator */}
                            {contractAccepted ? (
                              <div className="flex items-center gap-2 text-green-400 text-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Contrato de locação aceito</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>Volte e aceite o contrato de locação para continuar</span>
                              </div>
                            )}

                            {/* CTA button — dominant */}
                            <Button
                              className="w-full h-14 text-base font-bold bg-gradient-to-r from-cyan-500 to-teal-500 text-black hover:from-cyan-400 hover:to-teal-400 shadow-lg shadow-cyan-500/20"
                              onClick={handleConfirm}
                              disabled={!contractAccepted || isTokenizing || processCreditCard.isPending || processPix.isPending}
                            >
                              {bookingData.paymentMethod === "pix" ? (
                                <><QrCode className="w-5 h-5 mr-2" />Gerar QR Code PIX</>
                              ) : (
                                <><Lock className="w-5 h-5 mr-2" />Confirmar e Pagar</>
                              )}
                            </Button>

                            <p className="text-center text-xs text-gray-500">
                              🔒 Pagamento processado com segurança pelo Mercado Pago
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  // ── STATE 2: PROCESSING — minimal, clean interface ──────────────────────
                  if (isProcessing && !hasResult) {
                    return (
                      <motion.div
                        key="step3-processing"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                          {/* Spinner */}
                          <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-6">
                            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                          </div>

                          <h2 className="text-xl font-semibold text-white mb-1">
                            {bookingData.paymentMethod === "pix" ? "Gerando PIX..." : "Processando pagamento..."}
                          </h2>
                          <p className="text-gray-500 text-sm mb-8">
                            {bookingData.paymentMethod === "pix"
                              ? "Estamos gerando seu QR Code PIX."
                              : "Aguarde enquanto processamos seu pagamento com segurança."}
                          </p>

                          {/* Booking code — only when available */}
                          {realBookingId && (
                            <div className="inline-flex flex-col items-center bg-white/5 rounded-xl px-6 py-4 mb-6">
                              <p className="text-xs text-gray-500 mb-1">Reserva</p>
                              <p className="text-xl font-mono font-bold text-cyan-400">
                                #RDY-{realBookingId.toString().padStart(6, "0")}
                              </p>
                            </div>
                          )}

                          {/* Minimal vehicle summary */}
                          <div className="flex items-center justify-center gap-3 text-gray-400 text-sm">
                            {vehicle?.vehicleType === "motorcycle" ? (
                              <Bike className="w-4 h-4" />
                            ) : (
                              <Car className="w-4 h-4" />
                            )}
                            <span>{vehicle?.brand} {vehicle?.model} {vehicle?.year}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  // ── STATE 3: RESULT — medium card, one state at a time ─────────────────
                  return (
                    <motion.div
                      key="step3-result"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* PIX QR Code result */}
                      {pixState && !paymentSuccess && (
                        <Card className="bg-white/5 border-white/10">
                          <CardContent className="p-8">
                            <div className="text-center mb-6">
                              <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                                <QrCode className="w-7 h-7 text-green-400" />
                              </div>
                              <h2 className="text-xl font-bold text-white mb-1">QR Code PIX Gerado</h2>
                              <p className="text-green-400 font-bold text-2xl mt-2">
                                R$ {pixState.amount.toFixed(2)}
                              </p>
                              <p className="text-gray-400 text-sm mt-1">Escaneie ou copie o código para pagar</p>
                            </div>

                            {pixState.qrCodeBase64 && (
                              <div className="flex justify-center mb-5">
                                <div className="bg-white p-3 rounded-xl">
                                  <img
                                    src={`data:image/png;base64,${pixState.qrCodeBase64}`}
                                    alt="QR Code PIX"
                                    className="w-44 h-44"
                                  />
                                </div>
                              </div>
                            )}

                            {pixState.qrCode && (
                              <div className="mb-5">
                                <Label className="text-gray-400 text-xs">Código PIX Copia e Cola</Label>
                                <div className="flex gap-2 mt-1.5">
                                  <Input
                                    value={pixState.qrCode}
                                    readOnly
                                    className="bg-white/5 border-white/10 text-gray-300 text-xs font-mono"
                                  />
                                  <Button
                                    variant="outline"
                                    className="border-white/20 text-white hover:bg-white/10 shrink-0"
                                    onClick={copyPixCode}
                                  >
                                    {pixState.copied ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Countdown timer */}
                            {(() => {
                              const mins = Math.floor(pixTimeLeft / 60);
                              const secs = pixTimeLeft % 60;
                              const pct = (pixTimeLeft / 600) * 100;
                              const isUrgent = pixTimeLeft <= 120; // last 2 minutes
                              const isExpired = pixTimeLeft === 0;
                              return (
                                <div className={`rounded-xl p-4 border ${
                                  isExpired
                                    ? "bg-red-500/10 border-red-500/30"
                                    : isUrgent
                                    ? "bg-orange-500/10 border-orange-500/30"
                                    : "bg-yellow-500/10 border-yellow-500/30"
                                }`}>
                                  {isExpired ? (
                                    <div className="text-center">
                                      <p className="text-red-400 font-semibold text-sm">PIX expirado</p>
                                      <p className="text-gray-500 text-xs mt-1">Gere um novo QR Code para pagar</p>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-yellow-400" />
                                          <span className={`text-sm font-medium ${
                                            isUrgent ? "text-orange-400" : "text-yellow-400"
                                          }`}>Aguardando pagamento</span>
                                        </div>
                                        <span className={`text-lg font-mono font-bold ${
                                          isUrgent ? "text-orange-400" : "text-yellow-300"
                                        }`}>
                                          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                                        </span>
                                      </div>
                                      {/* Progress bar */}
                                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all duration-1000 ${
                                            isUrgent ? "bg-orange-400" : "bg-yellow-400"
                                          }`}
                                          style={{ width: `${pct}%` }}
                                        />
                                      </div>
                                      <p className="text-xs text-gray-500 mt-2 text-center">
                                        {isUrgent ? "⚠️ Pague agora antes de expirar" : "O QR Code expira em breve — não feche esta página"}
                                      </p>
                                    </>
                                  )}
                                </div>
                              );
                            })()}
                          </CardContent>
                        </Card>
                      )}

                      {/* Success */}
                      {paymentSuccess && (
                        <Card className="bg-green-500/10 border-green-500/30">
                          <CardContent className="p-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-5">
                              <CheckCircle2 className="w-8 h-8 text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-1">Pagamento Aprovado!</h2>
                            <p className="text-gray-400 text-sm mb-5">Seu pagamento foi confirmado com sucesso.</p>

                            <div className="bg-white/5 rounded-xl p-4 mb-5">
                              <p className="text-xs text-gray-500 mb-1">Código da Reserva</p>
                              <p className="text-2xl font-mono font-bold text-cyan-400">
                                #RDY-{(bookingId ?? bookingIdRef.current)?.toString().padStart(6, "0") || "000000"}
                              </p>
                            </div>

                            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mb-5 text-left">
                              <p className="text-white font-semibold mb-2 flex items-center gap-2 text-sm">
                                <Shield className="w-4 h-4 text-cyan-400" />
                                Último passo: verificação de identidade
                              </p>
                              <p className="text-gray-400 text-xs">
                                Foto da CNH + selfie — leva menos de 2 minutos.
                              </p>
                            </div>

                            <Button
                              className="bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-semibold w-full"
                              onClick={() => navigate(`/verify/${bookingId}`)}
                            >
                              Verificar Identidade Agora
                            </Button>
                          </CardContent>
                        </Card>
                      )}

                      {/* In analysis */}
                      {paymentInAnalysis && (
                        <Card className="bg-blue-500/10 border-blue-500/30">
                          <CardContent className="p-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-5">
                              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-1">Pagamento em Análise</h2>
                            <p className="text-gray-400 text-sm mb-3">
                              Seu banco está analisando o pagamento. Verificando automaticamente...
                            </p>

                            {/* Polling indicator */}
                            <div className="flex items-center justify-center gap-2 text-xs text-blue-400 mb-5">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Atualizando a cada 5 segundos</span>
                            </div>

                            <div className="bg-white/5 rounded-xl p-4 mb-5">
                              <p className="text-xs text-gray-500 mb-1">Código da Reserva</p>
                              <p className="text-2xl font-mono font-bold text-cyan-400">
                                #RDY-{(bookingId ?? bookingIdRef.current)?.toString().padStart(6, "0") || "000000"}
                              </p>
                            </div>

                            <p className="text-xs text-gray-500 mb-4">
                              A tela será atualizada automaticamente quando o banco confirmar.
                              Não feche esta página.
                            </p>

                            <Button
                              variant="outline"
                              className="border-white/20 text-white hover:bg-white/10 w-full"
                              onClick={() => navigate("/my-bookings")}
                            >
                              Ver Minhas Reservas
                            </Button>
                          </CardContent>
                        </Card>
                      )}

                      {/* Error */}
                      {!pixState && !paymentSuccess && !paymentInAnalysis && paymentError && (
                        <Card className="bg-red-500/10 border-red-500/30">
                          <CardContent className="p-8 text-center">
                            <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-5">
                              <AlertCircle className="w-7 h-7 text-red-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Pagamento não aprovado</h2>
                            <p className="text-red-300 text-sm mb-6">{paymentError}</p>
                            <div className="space-y-3">
                              <Button
                                className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-semibold"
                                onClick={() => { setPaymentError(""); setCurrentStep(2); }}
                              >
                                Tentar Novamente
                              </Button>
                              {realBookingId && (
                                <Button
                                  variant="outline"
                                  className="w-full border-white/20 text-white hover:bg-white/10"
                                  onClick={handleOpenCheckoutPro}
                                  disabled={createCheckoutPro.isPending || !bookingId}
                                >
                                  {createCheckoutPro.isPending ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Aguarde...</>
                                  ) : (
                                    <>Pagar via Mercado Pago</>
                                  )}
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Pending (no error, no success yet — fallback) */}
                      {!pixState && !paymentSuccess && !paymentInAnalysis && !paymentError && realBookingId && (
                        <Card className="bg-yellow-500/10 border-yellow-500/30">
                          <CardContent className="p-8 text-center">
                            <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-5">
                              <CreditCard className="w-7 h-7 text-yellow-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-1">Pagamento em Processamento</h2>
                            <p className="text-gray-400 text-sm mb-5">Aguardando confirmação do pagamento.</p>
                            <div className="bg-white/5 rounded-xl p-4 mb-5">
                              <p className="text-xs text-gray-500 mb-1">Código da Reserva</p>
                              <p className="text-2xl font-mono font-bold text-cyan-400">
                                #RDY-{realBookingId.toString().padStart(6, "0")}
                              </p>
                            </div>
                            <Button
                              className="bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-semibold w-full"
                              onClick={() => navigate("/my-bookings")}
                            >
                              Ver Minhas Reservas
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </motion.div>
                  );
                })()}
              </AnimatePresence>

              {/* Navigation Buttons */}
              {/* Step 1 & 2: show Voltar + Continuar/Confirmar */}
              {/* Step 3 decision: only show Voltar (Confirmar is embedded in the decision card) */}
              {/* Step 3 processing/result: hide all nav buttons */}
              {(() => {
                const isProcessingNav = isTokenizing || processCreditCard.isPending || processPix.isPending;
                const hasResultNav = paymentSuccess || paymentInAnalysis || paymentError || pixState;
                // Hide all nav when processing or result shown
                if (isProcessingNav || hasResultNav) return null;
                // Step 3 decision: only show Voltar
                if (currentStep === 3) {
                  return (
                    <div className="flex mt-6">
                      <Button
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={handleBack}
                      >
                        Voltar
                      </Button>
                    </div>
                  );
                }
                // Step 1 & 2: show both buttons
                if (currentStep < 3) {
                  return (
                    <div className="flex justify-between mt-6">
                      <Button
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={handleBack}
                      >
                        Voltar
                      </Button>
                      <Button
                        className="bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-semibold min-w-[130px]"
                        onClick={(currentStep === 2 && !!existingBookingId) ? handleConfirm : handleNext}
                        disabled={
                          isNavigating ||
                          (currentStep === 1 && !pricing) ||
                          ((currentStep === 2 && !!existingBookingId) && !contractAccepted)
                        }
                      >
                        {isNavigating ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Aguarde...</>
                        ) : (currentStep === 2 && !!existingBookingId)
                          ? (bookingData.paymentMethod === "pix" ? "Gerar QR Code PIX" : "Confirmar e Pagar")
                          : "Continuar"}
                      </Button>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Sidebar - Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-6">
                    <div className="flex gap-4 mb-6">
                      {vehicle.mainImageUrl ? (
                        <img
                          src={vehicle.mainImageUrl}
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          className="w-24 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-24 h-16 bg-gray-800 rounded-lg flex items-center justify-center">
                          {vehicle.vehicleType === "motorcycle" ? (
                            <Bike className="w-8 h-8 text-gray-600" />
                          ) : (
                            <Car className="w-8 h-8 text-gray-600" />
                          )}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-white">
                          {vehicle.brand} {vehicle.model}
                        </h3>
                        <p className="text-sm text-gray-400">{vehicle.year}</p>
                        <p className="text-sm text-gray-400">
                          {vehicle.pickupCity}, {vehicle.pickupState}
                        </p>
                      </div>
                    </div>

                    {/* CNH warning for motorcycles */}
                    {vehicle.vehicleType === "motorcycle" && (
                      <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
                        <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-amber-300 text-xs">
                          Necessário CNH categoria <strong>A ou AB</strong> para alugar esta moto.
                        </p>
                      </div>
                    )}

                    {pricing ? (
                      <>
                        <Separator className="bg-white/10 mb-4" />
                        <div className="space-y-3">
                          <div className="flex justify-between text-gray-400">
                            <span>
                              R$ {parseFloat(vehicle.dailyPrice || "0").toFixed(0)} x {pricing.days} dias
                            </span>
                            <span>R$ {pricing.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-cyan-400 text-sm">
                            <span>Limite de Km</span>
                            <span>
                              {pricing.dailyKmLimit} km/dia · R$ {pricing.extraKmPrice}/km extra
                            </span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>Taxa de serviço</span>
                            <span>R$ {pricing.serviceFee.toFixed(2)}</span>
                          </div>
                          {pricing.insuranceFee > 0 && (
                            <div className="flex justify-between text-gray-400">
                              <span>Proteção</span>
                              <span>R$ {pricing.insuranceFee.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-amber-300 text-sm">
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Garantia Reembolsável ({pricing.effectiveMultiplier}× diária)
                            </span>
                            <span>R$ {pricing.securityDeposit.toFixed(2)}</span>
                          </div>
                          {pricing.pixDiscount > 0 && (
                            <div className="flex justify-between text-green-400">
                              <span>Desconto PIX (5%)</span>
                              <span>-R$ {pricing.pixDiscount.toFixed(2)}</span>
                            </div>
                          )}
                          <Separator className="bg-white/10" />
                          <div className="flex justify-between text-white font-semibold text-lg">
                            <span>Total</span>
                            <span>R$ {(effectiveTotal ?? pricing.finalTotal).toFixed(2)}</span>
                          </div>
                          {effectiveTotal != null && effectiveTotal > pricing.finalTotal && (
                            <p className="text-xs text-orange-400 mt-1">
                              Inclui juros · sem juros: R$ {pricing.finalTotal.toFixed(2)}
                            </p>
                          )}
                          {bookingData.paymentMethod === "credit_card" && bookingData.installments > 1 && (
                            <p className="text-xs text-gray-400 mt-1">
                              {bookingData.installments}× de R$ {((effectiveTotal ?? pricing.finalTotal) / bookingData.installments).toFixed(2)}
                            </p>
                          )}
                          <p className="text-xs text-amber-300/60 mt-1">Garantia Reembolsável · devolvida após entrega sem avarias</p>
                        </div>
                      </>
                    ) : (
                      <p className="text-center text-gray-400 py-4">
                        Selecione as datas para ver o preço
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        {/* OTP Contract Signing Modal */}
        <Dialog open={otpModalOpen} onOpenChange={(open) => {
          if (!open) {
            setOtpModalOpen(false);
            setOtpChannel(null);
            setOtpCode("");
            setOtpSent(false);
          }
        }}>
          <DialogContent className="max-w-md bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white text-xl flex items-center gap-2">
                <Lock className="w-5 h-5 text-cyan-400" />
                Assinar Contrato
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-2">
              {!otpSent ? (
                <>
                  <p className="text-gray-300 text-sm">
                    Escolha como deseja receber o código de verificação de 6 dígitos:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setOtpChannel("sms")}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        otpChannel === "sms"
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-white/10 bg-white/5 hover:border-white/30"
                      }`}
                    >
                      <div className="text-2xl mb-2">📱</div>
                      <p className="text-white font-semibold text-sm">SMS</p>
                      <p className="text-gray-400 text-xs mt-1">
                        {bookingData.renterPhone
                          ? bookingData.renterPhone.replace(/(\d{2})(\d{2})(\d{4})(\d{4})/, "($2) $3-$4").slice(0, -2) + "**"
                          : "Celular cadastrado"}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOtpChannel("email")}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        otpChannel === "email"
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-white/10 bg-white/5 hover:border-white/30"
                      }`}
                    >
                      <div className="text-2xl mb-2">✉️</div>
                      <p className="text-white font-semibold text-sm">E-mail</p>
                      <p className="text-gray-400 text-xs mt-1">
                        {bookingData.renterEmail
                          ? bookingData.renterEmail.replace(/(.{2}).+(@.+)/, "$1***$2")
                          : "E-mail cadastrado"}
                      </p>
                    </button>
                  </div>
                  <Button
                    type="button"
                    disabled={!otpChannel || sendContractOtp.isPending || !(bookingId ?? bookingIdRef.current ?? existingBookingId)}
                    onClick={() => {
                      const bid = bookingId ?? bookingIdRef.current ?? existingBookingId;
                      if (!otpChannel || !bid) return;
                      sendContractOtp.mutate({ bookingId: bid, channel: otpChannel });
                    }}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
                  >
                    {sendContractOtp.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</>
                    ) : (
                      <><Lock className="w-4 h-4 mr-2" />Enviar código</>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 text-center">
                    <p className="text-cyan-300 text-sm">
                      Código enviado por {otpChannel === "sms" ? "SMS" : "e-mail"}.
                      Válido por 10 minutos.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300 text-sm">Digite o código de 6 dígitos</Label>
                    <Input
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="bg-white/5 border-white/20 text-white text-center text-2xl tracking-[0.5em] font-mono"
                      maxLength={6}
                      autoFocus
                      onKeyDown={(e) => {
                        const bid = bookingId ?? bookingIdRef.current ?? existingBookingId;
                        if (e.key === "Enter" && otpCode.length === 6 && bid) {
                          verifyContractOtp.mutate({ bookingId: bid, code: otpCode });
                        }
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    disabled={otpCode.length !== 6 || verifyContractOtp.isPending || !(bookingId ?? bookingIdRef.current ?? existingBookingId)}
                    onClick={() => {
                      const bid = bookingId ?? bookingIdRef.current ?? existingBookingId;
                      if (!bid) return;
                      verifyContractOtp.mutate({ bookingId: bid, code: otpCode });
                    }}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
                  >
                    {verifyContractOtp.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verificando...</>
                    ) : (
                      <><CheckCircle2 className="w-4 h-4 mr-2" />Confirmar assinatura</>
                    )}
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      disabled={otpCooldown > 0 || sendContractOtp.isPending || !(bookingId ?? bookingIdRef.current ?? existingBookingId)}
                      onClick={() => {
                        const bid = bookingId ?? bookingIdRef.current ?? existingBookingId;
                        if (!otpChannel || !bid) return;
                        sendContractOtp.mutate({ bookingId: bid, channel: otpChannel });
                      }}
                      className="text-sm text-gray-400 hover:text-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {otpCooldown > 0
                        ? `Reenviar código em ${otpCooldown}s`
                        : "Não recebi o código — reenviar"}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpChannel(null); setOtpCode(""); }}
                    className="w-full text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Trocar canal de envio
                  </button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Garantia Reembolsável — Modal "Saiba mais" */}
        <Dialog open={showGuaranteeModal} onOpenChange={setShowGuaranteeModal}>
          <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-amber-300 text-xl flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Garantia Reembolsável
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm text-gray-300">
              <div>
                <h4 className="font-semibold text-white mb-2">O que é?</h4>
                <p className="leading-relaxed">
                  A Garantia Reembolsável é um valor pré-autorizado no seu cartão de crédito para proteger o proprietário do veículo contra danos, multas de tráfego ou não devolução. Este valor é <strong>100% reembolsado</strong> após a entrega do veículo em bom estado.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Como é calculada?</h4>
                <p className="leading-relaxed mb-3">
                  O valor varia conforme o número de dias de locação:
                </p>
                <ul className="space-y-1 text-xs bg-slate-800/50 p-3 rounded border border-slate-700">
                  <li><strong>1 dia:</strong> 2× a diária</li>
                  <li><strong>2-3 dias:</strong> 3× a diária</li>
                  <li><strong>4-6 dias:</strong> 4× a diária</li>
                  <li><strong>7+ dias:</strong> 5× a diária</li>
                  <li className="text-amber-300 pt-1 border-t border-slate-600 mt-1"><strong>Limites:</strong> Mínimo R$ 500 | Máximo R$ 5.000</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Quando é devolvida?</h4>
                <p className="leading-relaxed">
                  Após a devolução do veículo, o proprietário valida o estado do carro. Se estiver sem avarias, a garantia é automaticamente devolvida à sua conta em até 7 dias úteis.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">E se houver danos?</h4>
                <p className="leading-relaxed">
                  Se o veículo for devolvido com danos, multas de tráfego ou não for devolvido, o proprietário pode reter parte ou a totalidade da garantia para cobrir os custos. Você será notificado e terá direito a contestar.
                </p>
              </div>
              <div className="bg-cyan-500/10 border border-cyan-500/30 p-3 rounded">
                <p className="text-xs text-cyan-300">
                  <strong>💡 Dica:</strong> Fotografe o veículo antes de sair e na devolução. Isso protege ambos os lados em caso de dúvidas.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </main>

      <Footer />
    </div>
  );
}
