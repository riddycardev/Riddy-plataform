/**
 * Motorcycle Details Page
 * Full details with gallery, specs, host info, and booking CTA
 * All buttons functional
 */

import { useState, useMemo } from "react";
import { eachDayOfInterval } from "date-fns";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { format, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  MapPin,
  Star,
  Fuel,
  Settings,
  Gauge,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Bike,
  HardHat,
  Check,
  Shield,
  MessageCircle,
  Share2,
  Heart,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DateRangePicker from "@/components/DateRangePicker";
import VehicleCalendar, { BookedPeriod, BlockedPeriod } from "@/components/VehicleCalendar";
import { toast } from "sonner";

const TIPO_LABELS: Record<string, string> = {
  street: "Street", sport: "Sport", naked: "Naked",
  cruiser: "Cruiser", adventure: "Adventure", scooter: "Scooter",
};

const COMBUSTIVEL_LABELS: Record<string, string> = {
  gasolina: "Gasolina", eletrica: "Elétrica",
};

const CAMBIO_LABELS: Record<string, string> = {
  manual: "Manual", automatico: "Automático", cvt: "CVT",
};

const FEATURE_LABELS: Record<string, string> = {
  abs: "ABS", traction_control: "Controle de Tração", riding_modes: "Modos de Condução",
  quickshifter: "Quickshifter", heated_grips: "Punhos Aquecidos", cruise_control: "Piloto Automático",
  led_lights: "Faróis LED", usb_charger: "Carregador USB", side_bags: "Alforjes Laterais",
  top_case: "Baú Traseiro", windshield: "Bolha/Para-brisa", gps: "GPS",
};

export default function MotorcycleDetails() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [withHelmet, setWithHelmet] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  // Fetch user CNH for banner
  const { data: userProfile } = trpc.user.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // CNH banner logic for motorcycles: needs A or AB
  const MOTO_VALID = ["A", "AB"];
  const userCnh = userProfile?.cnhCategory;
  const cnhValidForMoto = userCnh && MOTO_VALID.includes(userCnh);
  const cnhBannerState = !isAuthenticated
    ? null
    : !userCnh
    ? "missing"
    : cnhValidForMoto
    ? "valid"
    : "invalid";

  // Start conversation mutation
  const startConversationMutation = trpc.message.startConversation.useMutation({
    onSuccess: (data) => {
      navigate(`/messages?conversation=${data.conversationId}`);
    },
    onError: (err) => {
      console.error("[Chat] Failed to start conversation:", err);
      setIsStartingChat(false);
    },
  });

  const handleContactHost = () => {
    if (!isAuthenticated) {
      toast.error("Faça login para falar com o proprietário");
      return;
    }
    if (!moto?.hostId) return;
    setIsStartingChat(true);
    startConversationMutation.mutate({
      otherUserId: moto.hostId,
      initialMessage: `Olá! Tenho interesse na sua ${moto.brand} ${moto.model}. Poderia me dar mais informações?`,
    });
  };

  const motorcycleId = parseInt(id || "0");

  const { data: moto, isLoading } = trpc.motorcycle.getById.useQuery(
    { id: motorcycleId },
    { enabled: motorcycleId > 0 }
  );

  const { data: availability } = trpc.vehicle.getAvailability.useQuery(
    { vehicleId: motorcycleId },
    { enabled: motorcycleId > 0 }
  );

  // Reviews are included in the vehicle data from vehicle.getById
  const reviews = (moto as any)?.reviews || [];

  // Price calculation
  const priceCalc = useMemo(() => {
    if (!moto || !startDate || !endDate) return null;
    const days = Math.max(1, differenceInCalendarDays(endDate, startDate));
    const dailyPrice = parseFloat(moto.dailyPrice || "0");
    const helmetFee = withHelmet && moto.specs?.capaceteDisponivel
      ? parseFloat(moto.specs.taxaCapacete || "0") * days
      : 0;
    const subtotal = dailyPrice * days;
    const platformFee = subtotal * 0.1;
    const total = subtotal + helmetFee + platformFee;
    return { days, dailyPrice, helmetFee, platformFee, subtotal, total };
  }, [moto, startDate, endDate, withHelmet]);

  const handleBooking = () => {
    if (!isAuthenticated) {
      toast.error("Faça login para reservar esta moto");
      navigate("/login");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Selecione as datas de retirada e devolução");
      return;
    }
    const params = new URLSearchParams({
      start: format(startDate, "yyyy-MM-dd"),
      end: format(endDate, "yyyy-MM-dd"),
      withHelmet: withHelmet ? "1" : "0",
    });
    navigate(`/booking/${motorcycleId}?${params.toString()}`);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `${moto?.brand} ${moto?.model} - RIDDY`,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado!");
    }
  };

  const allImages = useMemo(() => {
    const imgs: string[] = [];
    if (moto?.mainImageUrl) imgs.push(moto.mainImageUrl);
    if (moto?.images) {
      moto.images.forEach((img: any) => {
        if (img.imageUrl && !imgs.includes(img.imageUrl)) imgs.push(img.imageUrl);
      });
    }
    return imgs;
  }, [moto]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!moto) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
          <h2 className="text-white text-xl font-bold">Moto não encontrada</h2>
          <Button onClick={() => navigate("/motorcycles")} variant="outline" className="border-white/20 text-gray-300">
            Ver outras motos
          </Button>
        </div>
      </div>
    );
  }

  const specs = moto.specs;
  const bookedPeriods: BookedPeriod[] = (availability?.bookedPeriods || []).map((p: any) => ({
    id: p.id || 0,
    startDate: new Date(p.startDate),
    endDate: new Date(p.endDate),
    status: p.status || "confirmed",
  }));
  const blockedPeriods: BlockedPeriod[] = (availability?.blockedPeriods || []).map((p: any) => ({
    id: p.id || 0,
    startDate: new Date(p.startDate),
    endDate: new Date(p.endDate),
    reason: p.reason,
  }));

  // Calculate unavailable dates for DateRangePicker
  const unavailableDates = useMemo(() => {
    const dates: Date[] = [];
    bookedPeriods.forEach((period) => {
      const days = eachDayOfInterval({ start: period.startDate, end: period.endDate });
      dates.push(...days);
    });
    blockedPeriods.forEach((period) => {
      const days = eachDayOfInterval({ start: period.startDate, end: period.endDate });
      dates.push(...days);
    });
    return dates;
  }, [bookedPeriods, blockedPeriods]);

  return (
    <div className="min-h-screen bg-[#0A0F1C]">
      <Header />

      <div className="container max-w-6xl mx-auto px-4 pt-24 pb-16">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/motorcycles")}
          className="text-gray-400 hover:text-white mb-6 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para motos
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <div className="relative rounded-2xl overflow-hidden bg-white/5">
              <div className="aspect-[16/9]">
                {allImages.length > 0 ? (
                  <img
                              loading="lazy"
                    src={allImages[currentImageIndex]}
                    alt={`${moto.brand} ${moto.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Bike className="h-24 w-24 text-gray-700" />
                  </div>
                )}
              </div>

              {/* Navigation arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((i) => (i - 1 + allImages.length) % allImages.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((i) => (i + 1) % allImages.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {allImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === currentImageIndex ? "bg-white w-4" : "bg-white/40"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Thumbnail strip */}
              {allImages.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 flex gap-2 p-3 bg-gradient-to-t from-black/60 to-transparent overflow-x-auto">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                        i === currentImageIndex ? "border-cyan-400" : "border-transparent opacity-60"
                      }`}
                    >
                      <img
                              loading="lazy" src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & Actions */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {specs?.cilindrada && (
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                      {specs.cilindrada}
                    </Badge>
                  )}
                  {specs?.tipoMoto && (
                    <Badge className="bg-white/10 text-gray-300 border-white/10 text-xs">
                      {TIPO_LABELS[specs.tipoMoto] || specs.tipoMoto}
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {moto.brand} {moto.model}
                </h1>
                <p className="text-gray-400 mt-1">{moto.year} · {moto.color}</p>
                <div className="flex items-center gap-1 mt-2 text-gray-400 text-sm">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span>{moto.pickupCity}, {moto.pickupState}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFavorited(!isFavorited)}
                  className="text-gray-400 hover:text-red-400"
                >
                  <Heart className={`h-5 w-5 ${isFavorited ? "fill-red-400 text-red-400" : ""}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="text-gray-400 hover:text-white"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Rating */}
            {moto.rating && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(Number(moto.rating))
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-600"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-white font-semibold">{Number(moto.rating).toFixed(1)}</span>
                <span className="text-gray-400 text-sm">({moto.reviewCount || 0} avaliações)</span>
              </div>
            )}

            <Separator className="bg-white/10" />

            {/* Specs Grid */}
            <div>
              <h2 className="text-white font-semibold text-lg mb-4">Especificações</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {specs?.cilindrada && (
                  <SpecCard icon={<Bike className="h-4 w-4" />} label="Cilindrada" value={specs.cilindrada} />
                )}
                {specs?.tipoMoto && (
                  <SpecCard icon={<Bike className="h-4 w-4" />} label="Tipo" value={TIPO_LABELS[specs.tipoMoto] || specs.tipoMoto} />
                )}
                {specs?.combustivel && (
                  <SpecCard icon={<Fuel className="h-4 w-4" />} label="Combustível" value={COMBUSTIVEL_LABELS[specs.combustivel] || specs.combustivel} />
                )}
                {specs?.cambio && (
                  <SpecCard icon={<Settings className="h-4 w-4" />} label="Câmbio" value={CAMBIO_LABELS[specs.cambio] || specs.cambio} />
                )}
                {specs?.limitKmDiario && (
                  <SpecCard icon={<Gauge className="h-4 w-4" />} label="Limite km/dia" value={`${specs.limitKmDiario} km`} />
                )}
                {moto.extraKmPrice && (
                  <SpecCard icon={<Gauge className="h-4 w-4" />} label="Km extra" value={`R$ ${parseFloat(moto.extraKmPrice).toFixed(2)}/km`} />
                )}
              </div>
            </div>

            {/* Helmet add-on */}
            {specs?.capaceteDisponivel && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <HardHat className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">Capacete disponível</p>
                    <p className="text-gray-400 text-sm">
                      Adicione um capacete por R$ {parseFloat(specs.taxaCapacete || "0").toFixed(2)}/dia
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Features */}
            {moto.features && moto.features.length > 0 && (
              <div>
                <h2 className="text-white font-semibold text-lg mb-4">Equipamentos</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {moto.features.map((feature: string) => (
                    <div key={feature} className="flex items-center gap-2 text-gray-300 text-sm">
                      <Check className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                      {FEATURE_LABELS[feature] || feature}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {moto.description && (
              <div>
                <h2 className="text-white font-semibold text-lg mb-3">Sobre a moto</h2>
                <p className="text-gray-400 leading-relaxed">{moto.description}</p>
              </div>
            )}

            <Separator className="bg-white/10" />

            {/* Host */}
            {moto.host && (
              <div>
                <h2 className="text-white font-semibold text-lg mb-4">Proprietário</h2>
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-cyan-500/30">
                    <AvatarImage src={moto.host.avatarUrl || undefined} />
                    <AvatarFallback className="bg-cyan-500/20 text-cyan-400 text-lg">
                      {moto.host.name?.[0]?.toUpperCase() || "H"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-white font-semibold">{moto.host.name}</p>
                    <p className="text-gray-400 text-sm">Membro desde {moto.host.createdAt ? format(new Date(moto.host.createdAt), "MMMM yyyy", { locale: ptBR }) : "—"}</p>
                    {moto.host.verificationLevel && (
                      <Badge className="mt-1 bg-green-500/20 text-green-400 border-green-500/30 text-xs gap-1">
                        <Shield className="h-3 w-3" />
                        Verificado
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleContactHost}
                    disabled={isStartingChat || startConversationMutation.isPending}
                    className="border-white/20 text-gray-300 hover:bg-white/5 gap-2"
                  >
                    {isStartingChat || startConversationMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageCircle className="h-4 w-4" />
                    )}
                    {isStartingChat || startConversationMutation.isPending ? "Abrindo..." : "Mensagem"}
                  </Button>
                </div>
              </div>
            )}

            <Separator className="bg-white/10" />

            {/* Rules & Policies */}
            <div>
              <h2 className="text-white font-semibold text-lg mb-4">Regras e Políticas</h2>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                {specs?.limitKmDiario && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Limite diário de km</span>
                      <span className="text-white font-medium">{specs.limitKmDiario} km</span>
                    </div>
                    <Separator className="bg-white/10" />
                  </>
                )}
                {moto.extraKmPrice && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Km adicional</span>
                      <span className="text-white font-medium">R$ {parseFloat(moto.extraKmPrice).toFixed(2)}/km</span>
                    </div>
                    <Separator className="bg-white/10" />
                  </>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">CNH obrigatória</span>
                  <span className="text-amber-400 font-medium">Categoria A ou AB</span>
                </div>
                {specs?.capaceteDisponivel !== undefined && (
                  <>
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Capacete disponível</span>
                      <span className={specs.capaceteDisponivel ? "text-green-400" : "text-red-400"}>
                        {specs.capaceteDisponivel ? "Sim" : "Não"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Availability Calendar */}
            <div>
              <h2 className="text-white font-semibold text-lg mb-4">Disponibilidade</h2>
              <VehicleCalendar
                vehicleId={motorcycleId}
                bookedPeriods={bookedPeriods}
                blockedPeriods={blockedPeriods}
                isOwner={false}
                selectedStartDate={startDate || null}
                selectedEndDate={endDate || null}
                onDateSelect={(date) => {
                  if (!startDate || (startDate && endDate)) {
                    setStartDate(date);
                    setEndDate(undefined);
                  } else {
                    if (date > startDate) {
                      setEndDate(date);
                    } else {
                      setEndDate(startDate);
                      setStartDate(date);
                    }
                  }
                }}
              />
            </div>

            {/* Reviews */}
            {reviews && reviews.length > 0 && (
              <div>
                <h2 className="text-white font-semibold text-lg mb-4">Avaliações</h2>
                <div className="space-y-4">
                  {reviews.slice(0, 5).map((review: any) => (
                    <div key={review.id} className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-cyan-500/20 text-cyan-400 text-xs">
                            {review.reviewer?.name?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white text-sm font-medium">{review.reviewer?.name || "Usuário"}</p>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-600"}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      {review.comment && <p className="text-gray-400 text-sm">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-3">

              {/* CNH Banner */}
              {cnhBannerState === "missing" && (
                <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-amber-300 text-sm font-semibold">CNH categoria A obrigatória</p>
                    <p className="text-gray-400 text-xs mt-0.5">Para alugar esta moto você precisa de CNH categoria A ou AB.</p>
                    <button
                      onClick={() => navigate("/profile")}
                      className="text-cyan-400 text-xs underline mt-1 hover:text-cyan-300"
                    >
                      Cadastrar CNH no perfil →
                    </button>
                  </div>
                </div>
              )}
              {cnhBannerState === "invalid" && (
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-red-300 text-sm font-semibold">CNH {userCnh} não válida para motos</p>
                    <p className="text-gray-400 text-xs mt-0.5">É necessário CNH categoria A ou AB para alugar motos.</p>
                    <button
                      onClick={() => navigate("/profile")}
                      className="text-cyan-400 text-xs underline mt-1 hover:text-cyan-300"
                    >
                      Atualizar CNH no perfil →
                    </button>
                  </div>
                </div>
              )}
              {cnhBannerState === "valid" && (
                <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                  <p className="text-green-300 text-sm">CNH {userCnh} — Habilitado para alugar motos</p>
                </div>
              )}

              <Card className="bg-[#0F1629] border-white/10 shadow-xl">
                <CardContent className="p-5 space-y-4">
                  {/* Price */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-cyan-400">
                      R$ {parseFloat(moto.dailyPrice || "0").toFixed(0)}
                    </span>
                    <span className="text-gray-400">/dia</span>
                  </div>

                  {/* Date picker */}
                  <div className="space-y-2">
                    <label className="text-gray-400 text-sm">Período de aluguel</label>
                    <DateRangePicker
                      startDate={startDate}
                      endDate={endDate}
                      onStartDateChange={setStartDate}
                      onEndDateChange={setEndDate}
                      unavailableDates={unavailableDates}
                      minDate={new Date()}
                      className="flex-col w-full [&>*]:w-full"
                    />
                  </div>

                  {/* Helmet option */}
                  {specs?.capaceteDisponivel && (
                    <div
                      onClick={() => setWithHelmet(!withHelmet)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        withHelmet
                          ? "border-amber-500/50 bg-amber-500/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <HardHat className={`h-4 w-4 ${withHelmet ? "text-amber-400" : "text-gray-400"}`} />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${withHelmet ? "text-amber-400" : "text-gray-300"}`}>
                          Adicionar capacete
                        </p>
                        <p className="text-xs text-gray-500">
                          +R$ {parseFloat(specs.taxaCapacete || "0").toFixed(2)}/dia
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                        withHelmet ? "bg-amber-500 border-amber-500" : "border-gray-600"
                      }`}>
                        {withHelmet && <Check className="h-3 w-3 text-black" />}
                      </div>
                    </div>
                  )}

                  {/* Price breakdown */}
                  {priceCalc && (
                    <div className="bg-white/5 rounded-lg p-3 space-y-2 text-sm">
                      <div className="flex justify-between text-gray-400">
                        <span>R$ {priceCalc.dailyPrice.toFixed(0)} × {priceCalc.days} dia{priceCalc.days > 1 ? "s" : ""}</span>
                        <span>R$ {priceCalc.subtotal.toFixed(2)}</span>
                      </div>
                      {priceCalc.helmetFee > 0 && (
                        <div className="flex justify-between text-gray-400">
                          <span>Capacete ({priceCalc.days} dia{priceCalc.days > 1 ? "s" : ""})</span>
                          <span>R$ {priceCalc.helmetFee.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-400">
                        <span>Taxa da plataforma (10%)</span>
                        <span>R$ {priceCalc.platformFee.toFixed(2)}</span>
                      </div>
                      <Separator className="bg-white/10" />
                      <div className="flex justify-between text-white font-semibold">
                        <span>Total</span>
                        <span>R$ {priceCalc.total.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* CNH warning */}
                  <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-amber-300 text-xs">
                      É necessário CNH categoria <strong>A ou AB</strong> para alugar motos.
                    </p>
                  </div>

                  {/* Book button — proteção anti-self-booking */}
                  {user && moto?.hostId === user.id ? (
                    <div className="w-full rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-center">
                      <p className="text-amber-400 text-sm font-semibold">Esta é a sua moto</p>
                      <p className="text-gray-400 text-xs mt-1">Você não pode reservar seu próprio veículo.</p>
                    </div>
                  ) : (
                    <Button
                      onClick={handleBooking}
                      className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-12 text-base"
                    >
                      {!startDate || !endDate ? "Selecione as datas" : "Reservar Moto"}
                    </Button>
                  )}

                  {/* Falar com Proprietário */}
                  {(!user || user.id !== moto?.hostId) && (
                    <Button
                      variant="outline"
                      onClick={handleContactHost}
                      disabled={isStartingChat || startConversationMutation.isPending}
                      className="w-full mt-2 border-white/20 bg-white/5 hover:bg-white/10 text-white font-medium h-11 gap-2"
                    >
                      {isStartingChat || startConversationMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageCircle className="h-4 w-4" />
                      )}
                      {isStartingChat || startConversationMutation.isPending
                        ? "Abrindo conversa..."
                        : "Falar com Proprietário"}
                    </Button>
                  )}

                  <p className="text-center text-gray-500 text-xs">
                    Você não será cobrado agora. Confirme após revisão.
                  </p>

                  {/* Ver perfil do proprietário */}
                  {moto?.hostId && (!user || user.id !== moto.hostId) && (
                    <div className="text-center">
                      <a
                        href={`/hosts/${moto.hostId}`}
                        className="text-cyan-400 hover:text-cyan-300 text-sm underline underline-offset-2 transition-colors"
                      >
                        Ver perfil do proprietário
                      </a>
                    </div>
                  )}

                  {/* Trust badges */}
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                      <Shield className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
                      Seguro incluso até R$ 200.000
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                      <Check className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
                      Cancelamento grátis até 24h antes
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// Helper component
function SpecCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
      <div className="text-cyan-400">{icon}</div>
      <div>
        <p className="text-gray-500 text-xs">{label}</p>
        <p className="text-white text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
