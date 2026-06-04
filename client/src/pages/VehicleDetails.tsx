/**
 * Vehicle Details Page
 * Shows complete information about a vehicle with booking functionality
 */

import { useState, useMemo, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { format, addDays, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  MapPin, 
  Star, 
  Shield, 
  Fuel, 
  Users, 
  Gauge,
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Loader2,
  FileText,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VehicleCalendar, { BookedPeriod, BlockedPeriod } from "@/components/VehicleCalendar";
import DateRangePicker from "@/components/DateRangePicker";
import VehicleOwnerChat from "@/components/VehicleOwnerChat";

// Category labels
const categoryLabels: Record<string, string> = {
  popular: "Popular",
  sedan: "Sedan",
  suv: "SUV",
  luxury: "Luxo",
  electric: "Elétrico",
  sport: "Esportivo",
  pickup: "Pickup"
};

// Fuel type labels
const fuelLabels: Record<string, string> = {
  gasoline: "Gasolina",
  ethanol: "Etanol",
  flex: "Flex",
  diesel: "Diesel",
  electric: "Elétrico",
  hybrid: "Híbrido"
};

// Transmission labels
const transmissionLabels: Record<string, string> = {
  automatic: "Automático",
  manual: "Manual"
};

// Feature labels
const featureLabels: Record<string, string> = {
  air_conditioning: "Ar Condicionado",
  bluetooth: "Bluetooth",
  gps: "GPS",
  backup_camera: "Câmera de Ré",
  parking_sensors: "Sensores de Estacionamento",
  cruise_control: "Piloto Automático",
  leather_seats: "Bancos de Couro",
  sunroof: "Teto Solar",
  usb_charger: "Carregador USB",
  child_seat: "Cadeirinha Infantil",
  roof_rack: "Rack de Teto",
  tow_hitch: "Engate de Reboque"
};

// Default placeholder for vehicles without photos
const PLACEHOLDER_IMAGE = "/images/car-luxury.png";

export default function VehicleDetails() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [showOwnerChat, setShowOwnerChat] = useState(false);

  // Fetch user CNH for banner
  const { data: userProfile } = trpc.user.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // CNH banner logic for cars: needs AB, B, C, D, E
  const CAR_VALID = ["AB", "B", "C", "D", "E"];
  const userCnh = userProfile?.cnhCategory;
  const cnhValidForCar = userCnh && CAR_VALID.includes(userCnh);
  const cnhBannerState = !isAuthenticated
    ? null // not logged in, no banner
    : !userCnh
    ? "missing" // no CNH registered
    : cnhValidForCar
    ? "valid" // valid for cars
    : "invalid"; // has CNH but wrong category (e.g. A or ACC)

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
      window.location.href = getLoginUrl();
      return;
    }
    if (!vehicle?.hostId) return;
    setIsStartingChat(true);
    startConversationMutation.mutate({
      otherUserId: vehicle.hostId,
      initialMessage: `Olá! Tenho interesse no seu ${vehicle.brand} ${vehicle.model}. Poderia me dar mais informações?`,
    });
  };

  // Fetch vehicle data
  const { data: vehicle, isLoading, error } = trpc.vehicle.getById.useQuery(
    { id: parseInt(id || "0") },
    { enabled: !!id }
  );

  // Fetch availability data
  const { data: availability } = trpc.vehicle.getAvailability.useQuery(
    { vehicleId: parseInt(id || "0") },
    { enabled: !!id }
  );

  // Transform availability data for calendar
  const bookedPeriods: BookedPeriod[] = (availability?.bookedPeriods || []).map(p => ({
    id: p.id,
    startDate: new Date(p.startDate),
    endDate: new Date(p.endDate),
    status: p.status as BookedPeriod["status"],
  }));

  const blockedPeriods: BlockedPeriod[] = (availability?.blockedPeriods || []).map(p => ({
    id: p.id,
    startDate: new Date(p.startDate),
    endDate: new Date(p.endDate),
  }));

  // Calculate unavailable dates for DateRangePicker
  const unavailableDates = useMemo(() => {
    const dates: Date[] = [];
    
    // Add all booked dates
    bookedPeriods.forEach(period => {
      const days = eachDayOfInterval({ start: period.startDate, end: period.endDate });
      dates.push(...days);
    });
    
    // Add all blocked dates
    blockedPeriods.forEach(period => {
      const days = eachDayOfInterval({ start: period.startDate, end: period.endDate });
      dates.push(...days);
    });
    
    return dates;
  }, [bookedPeriods, blockedPeriods]);

  // Images from vehicle or defaults
  const images = useMemo(() => {
    if (vehicle?.images && vehicle.images.length > 0) {
      return vehicle.images.map((img: any) => img.imageUrl);
    }
    if (vehicle?.mainImageUrl) {
      return [vehicle.mainImageUrl];
    }
    return [PLACEHOLDER_IMAGE];
  }, [vehicle]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const calculateTotal = () => {
    if (!startDate || !endDate || !vehicle) return null;
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return null;
    
    const dailyPrice = parseFloat(vehicle.dailyPrice);
    const subtotal = days * dailyPrice;
    const serviceFee = subtotal * 0.12;
    const insurance = days * 35;
    const total = subtotal + serviceFee + insurance;
    
    return { days, subtotal, serviceFee, insurance, total };
  };

  const pricing = calculateTotal();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  // Error state
  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-[#0A0F1C]">
        <Header />
        <main className="pt-20 container">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-white mb-4">Veículo não encontrado</h1>
            <p className="text-gray-400 mb-8">O veículo que você está procurando não existe ou foi removido.</p>
            <Button onClick={() => navigate("/search")} className="bg-cyan-500 text-black">
              Voltar para Busca
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Parse features
  const features = Array.isArray(vehicle.features) 
    ? vehicle.features.map((f: string) => featureLabels[f as string] || f)
    : [];

  return (
    <div className="min-h-screen bg-[#0A0F1C]">
      <Header />
      
      <main className="pt-20">
        {/* Back Button */}
        <div className="container py-4">
          <Button 
            variant="ghost" 
            className="text-gray-400 hover:text-white"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        {/* Image Gallery */}
        <section className="container mb-8">
          <div className="relative rounded-2xl overflow-hidden aspect-[16/9] md:aspect-[21/9] bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A]">
            <motion.img
              key={currentImageIndex}
              src={images[currentImageIndex]}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="w-full h-full object-contain"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            
            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Image Indicators */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentImageIndex ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
              </button>
              <button className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="container pb-20">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Title & Basic Info */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
                      {vehicle.brand} {vehicle.model} {vehicle.year}
                    </h1>
                    <div className="flex items-center gap-4 text-gray-400">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{vehicle.pickupCity}, {vehicle.pickupState}</span>
                      </div>
                      {vehicle.averageRating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-white font-semibold">{vehicle.averageRating}</span>
                          <span>({vehicle.totalTrips} viagens)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                    {categoryLabels[vehicle.category] || vehicle.category}
                  </Badge>
                </div>
              </div>

              {/* Specs */}
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    <div className="text-center">
                      <Users className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                      <p className="text-white font-semibold">{vehicle.seats}</p>
                      <p className="text-gray-500 text-sm">Lugares</p>
                    </div>
                    <div className="text-center">
                      <Gauge className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                      <p className="text-white font-semibold">{transmissionLabels[vehicle.transmission] || vehicle.transmission}</p>
                      <p className="text-gray-500 text-sm">Câmbio</p>
                    </div>
                    <div className="text-center">
                      <Fuel className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                      <p className="text-white font-semibold">{fuelLabels[vehicle.fuelType] || vehicle.fuelType}</p>
                      <p className="text-gray-500 text-sm">Combustível</p>
                    </div>
                    <div className="text-center">
                      <Shield className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                      <p className="text-white font-semibold">{vehicle.engineSize || "N/A"}</p>
                      <p className="text-gray-500 text-sm">Motor</p>
                    </div>
                    <div className="text-center">
                      <CalendarIcon className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                      <p className="text-white font-semibold">{vehicle.doors}</p>
                      <p className="text-gray-500 text-sm">Portas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Features */}
              {features.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Recursos</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {features.map((feature: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-gray-300">
                        <Check className="w-4 h-4 text-cyan-400" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rules */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Regras e Políticas</h2>
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Limite diário de km</span>
                      <span className="text-white font-semibold">{vehicle.dailyKmLimit} km</span>
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between">
                      <span className="text-gray-400">Km adicional</span>
                      <span className="text-white font-semibold">R$ {parseFloat(vehicle.extraKmPrice).toFixed(2)}/km</span>
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between">
                      <span className="text-gray-400">Mínimo de dias</span>
                      <span className="text-white font-semibold">{vehicle.minRentalDays} dia(s)</span>
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between">
                      <span className="text-gray-400">Máximo de dias</span>
                      <span className="text-white font-semibold">{vehicle.maxRentalDays} dias</span>
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fumar permitido</span>
                      <span className={vehicle.smokingAllowed ? "text-green-400" : "text-red-400"}>
                        {vehicle.smokingAllowed ? "Sim" : "Não"}
                      </span>
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between">
                      <span className="text-gray-400">Pets permitidos</span>
                      <span className={vehicle.petsAllowed ? "text-green-400" : "text-red-400"}>
                        {vehicle.petsAllowed ? "Sim" : "Não"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Availability Calendar */}
              <div id="date-picker-section">
                <h2 className="text-xl font-semibold text-white mb-4">Disponibilidade</h2>
                <VehicleCalendar
                  vehicleId={vehicle.id}
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
              {vehicle.reviews && vehicle.reviews.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Avaliações ({vehicle.reviews.length})
                  </h2>
                  <div className="space-y-4">
                    {vehicle.reviews.map((review: any) => (
                      <Card key={review.id} className="bg-white/5 border-white/10">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar>
                              <AvatarFallback className="bg-cyan-500/20 text-cyan-400">
                                {review.reviewerName?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-white">{review.reviewerName || "Usuário"}</h4>
                                <span className="text-sm text-gray-500">
                                  {new Date(review.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 mb-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating
                                        ? "text-yellow-500 fill-yellow-500"
                                        : "text-gray-600"
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className="text-gray-400">{review.comment}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
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
                      <p className="text-amber-300 text-sm font-semibold">CNH obrigatória</p>
                      <p className="text-gray-400 text-xs mt-0.5">Para alugar este carro você precisa de CNH categoria AB, B, C, D ou E.</p>
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
                  <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-yellow-300 text-sm font-semibold">Sua CNH cadastrada (categoria {userCnh}) não é válida para carros</p>
                      <p className="text-gray-400 text-xs mt-0.5">Você poderá informar uma CNH diferente diretamente no próximo passo da reserva.</p>
                    </div>
                  </div>
                )}
                {cnhBannerState === "valid" && (
                  <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    <p className="text-green-300 text-sm">CNH {userCnh} — Habilitado para alugar carros</p>
                  </div>
                )}

                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-6">
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-3xl font-bold text-white">
                        R$ {parseFloat(vehicle.dailyPrice).toFixed(0)}
                      </span>
                      <span className="text-gray-400">/dia</span>
                    </div>

                    {/* Date Selection */}
                    <div className="mb-6">
                      <label className="block text-sm text-gray-400 mb-3">Selecione as datas</label>
                      <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        onStartDateChange={setStartDate}
                        onEndDateChange={setEndDate}
                        unavailableDates={unavailableDates}
                        className="flex-col w-full [&>*]:w-full"
                      />
                    </div>

                    {/* Pricing Breakdown */}
                    {pricing && (
                      <div className="space-y-3 mb-6 pb-6 border-b border-white/10">
                        <div className="flex justify-between text-gray-400">
                          <span>R$ {parseFloat(vehicle.dailyPrice).toFixed(0)} x {pricing.days} dias</span>
                          <span>R$ {pricing.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Taxa de serviço</span>
                          <span>R$ {pricing.serviceFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Seguro</span>
                          <span>R$ {pricing.insurance.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-white font-semibold text-lg pt-3 border-t border-white/10">
                          <span>Total</span>
                          <span>R$ {pricing.total.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    {/* Proteção anti-self-booking: anfitrião não pode reservar o próprio veículo */}
                    {user && vehicle.hostId === user.id ? (
                      <div className="w-full rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-center">
                        <p className="text-amber-400 text-sm font-semibold">Este é o seu veículo</p>
                        <p className="text-gray-400 text-xs mt-1">Você não pode reservar seu próprio veículo.</p>
                      </div>
                    ) : (
                      <Button 
                        className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-black font-semibold py-6"
                        onClick={() => {
                          const start = startDate ? format(startDate, 'yyyy-MM-dd') : '';
                          const end = endDate ? format(endDate, 'yyyy-MM-dd') : '';
                          // Save dates to sessionStorage to freeze them in BookingFlow
                          if (start && end) {
                            sessionStorage.setItem('riddy_booking_dates', JSON.stringify({
                              startDate: start,
                              endDate: end,
                              vehicleId: vehicle.id,
                              lockedAt: new Date().toISOString(),
                            }));
                          }
                          navigate(`/booking/${vehicle.id}?start=${start}&end=${end}`);
                        }}
                      >
                        {pricing ? "Reservar Agora" : "Selecione as Datas"}
                      </Button>
                    )}

                    {/* Botão chat direto com Lumi — contexto do veículo */}
                    {(!user || user.id !== vehicle.hostId) && (
                      <button
                        onClick={() => setShowOwnerChat(true)}
                        className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 hover:bg-white/5 transition-colors text-gray-300 hover:text-white text-sm"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Falar com o proprietário
                      </button>
                    )}

                    {/* Ver perfil do proprietário */}
                    {vehicle.hostId && (!user || user.id !== vehicle.hostId) && (
                      <div className="text-center mt-3">
                        <a
                          href={`/hosts/${vehicle.hostId}`}
                          className="text-cyan-400 hover:text-cyan-300 text-sm underline underline-offset-2 transition-colors"
                        >
                          Ver perfil do proprietário
                        </a>
                      </div>
                    )}

                    <p className="text-center text-sm text-gray-500 mt-4">
                      Você não será cobrado ainda
                    </p>

                    {/* Trust Signals */}
                    <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <Shield className="w-5 h-5 text-cyan-400" />
                        <span>Seguro incluso até R$ 200.000</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <Check className="w-5 h-5 text-cyan-400" />
                        <span>Cancelamento grátis até 24h antes</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Mobile Sticky CTA Bar (hidden on lg+) ─── */}
      {vehicle && (
        <div className="fixed bottom-16 left-0 right-0 z-40 lg:hidden bg-[#0A0F1C]/95 backdrop-blur-md border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-lg leading-tight">
                R$ {parseFloat(vehicle.dailyPrice).toFixed(0)}
                <span className="text-gray-400 text-sm font-normal">/dia</span>
              </p>
              {pricing ? (
                <p className="text-cyan-400 text-xs">
                  Total {pricing.days} {pricing.days === 1 ? 'dia' : 'dias'}: R$ {pricing.total.toFixed(0)}
                </p>
              ) : (
                <p className="text-gray-500 text-xs">Selecione as datas</p>
              )}
            </div>
            {/* Botão chat com proprietário — ícone compacto glassmorphism */}
            {(!user || user.id !== vehicle.hostId) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowOwnerChat(true)}
                    aria-label="Falar com o proprietário"
                    className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <MessageCircle className="w-5 h-5 text-cyan-400" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-[#0D1526]/95 border border-white/10 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-md"
                >
                  Falar com o proprietário
                </TooltipContent>
              </Tooltip>
            )}
            <Button
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-black font-bold px-6 h-11 shrink-0"
              onClick={() => {
                if (!pricing) {
                  const el = document.getElementById('date-picker-section');
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                  const start = startDate ? format(startDate, 'yyyy-MM-dd') : '';
                  const end = endDate ? format(endDate, 'yyyy-MM-dd') : '';
                  // Save dates to sessionStorage to freeze them in BookingFlow
                  if (start && end) {
                    sessionStorage.setItem('riddy_booking_dates', JSON.stringify({
                      startDate: start,
                      endDate: end,
                      vehicleId: vehicle.id,
                      lockedAt: new Date().toISOString(),
                    }));
                  }
                  navigate(`/booking/${vehicle.id}?start=${start}&end=${end}`);
                }
              }}
            >
              {pricing ? 'Reservar Agora' : 'Escolher Datas'}
            </Button>
          </div>
        </div>
      )}
      {/* Spacer so content isn't hidden behind sticky bar on mobile */}
      <div className="h-20 lg:hidden" />

      {/* VehicleOwnerChat drawer */}
      {vehicle && (
        <VehicleOwnerChat
          vehicleId={vehicle.id}
          vehicleName={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
          isOpen={showOwnerChat}
          onClose={() => setShowOwnerChat(false)}
        />
      )}

      <Footer />
    </div>
  );
}
