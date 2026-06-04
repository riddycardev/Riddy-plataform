/**
 * RIDDY Featured Cars Section - Filtrada por Estado
 * Layout split: carrosséis à esquerda + mapa com pins à direita
 */

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  MapPin,
  Car,
  Loader2,
  ChevronDown,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { FavoriteButton } from "@/components/FavoriteButton";
import { VehicleCardSkeleton } from "@/components/VehicleCardSkeleton";
import { trpc } from "@/lib/trpc";
import { useUserState, BRAZIL_STATES } from "@/hooks/useUserState";

interface Vehicle {
  id: number;
  brand: string;
  model: string;
  year: number;
  mainImageUrl: string | null;
  averageRating?: string | null;
  totalTrips?: number | null;
  dailyPrice: string;
  pickupCity: string | null;
  pickupState?: string | null;
  pickupAddress?: string | null;
  pickupLatitude?: string | null;
  pickupLongitude?: string | null;
  category: string;
}

// ─── VehicleCard ────────────────────────────────────────────────────────────
function VehicleCard({ vehicle, highlighted = false }: { vehicle: Vehicle; highlighted?: boolean }) {
  const rating = vehicle.averageRating ? parseFloat(vehicle.averageRating) : 0;
  const trips = vehicle.totalTrips || 0;
  const price = parseFloat(vehicle.dailyPrice);

  // Clean duplicate brand in model name (e.g. "Honda Honda city" -> "Honda city")
  const brandLower = vehicle.brand.toLowerCase();
  const modelTrimmed = vehicle.model.trim();
  const modelLower = modelTrimmed.toLowerCase();
  const rawTitle = modelLower.startsWith(brandLower)
    ? modelTrimmed
    : `${vehicle.brand} ${modelTrimmed}`;
  const displayTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);

  return (
    <Link href={`/vehicles/${vehicle.id}`}>
      <motion.div
        whileHover={{ y: -3, scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className={`w-[calc(50vw-24px)] sm:w-[220px] md:w-[240px] lg:w-[260px] max-w-[260px] group cursor-pointer flex-shrink-0 rounded-xl overflow-hidden bg-[#1A2235] border border-white/8 hover:border-cyan-500/30 transition-all duration-200 shadow-md hover:shadow-cyan-500/10 ${
          highlighted ? "ring-2 ring-cyan-500/60" : ""
        }`}
      >
        {/* Image - 4:3 premium crop */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A]">
          {vehicle.mainImageUrl ? (
            <img
              src={vehicle.mainImageUrl}
              alt={displayTitle}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Car className="w-10 h-10 text-gray-600" />
            </div>
          )}
          {/* Favorite button */}
          <div className="absolute top-2 right-2">
            <FavoriteButton vehicleId={vehicle.id} size="sm" />
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="font-bold text-white text-sm leading-tight truncate mb-1">
            {displayTitle}
          </h3>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-gray-400 text-xs">{vehicle.year}</span>
            {rating > 0 ? (
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-gray-300 text-xs font-medium">{rating.toFixed(1)}</span>
                {trips > 0 && (
                  <span className="text-gray-500 text-[10px]">({trips})</span>
                )}
              </div>
            ) : (
              <span className="text-cyan-600 text-[10px] font-medium">Novo</span>
            )}
          </div>
          <div className="flex items-baseline gap-1 pt-2 border-t border-white/8">
            <span className="text-white font-bold text-base">R$ {price.toFixed(0)}</span>
            <span className="text-gray-500 text-xs">/dia</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
// ─── VehicleCarousel ─────────────────────────────────────────────────────────
function VehicleCarousel({
  title,
  vehicles,
  cityLink,
  highlightedId,
}: {
  title: string;
  vehicles: Vehicle[];
  cityLink?: string;
  highlightedId?: number | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -280 : 280,
      behavior: "smooth",
    });
  };

  if (vehicles.length === 0) return null;

  return (
    <div className="mb-8 sm:mb-10 md:mb-12">
      <div className="flex items-center justify-between mb-4 sm:mb-6 px-4 sm:px-0">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white">
            {title}
          </h2>
          {cityLink && (
            <Link href={cityLink}>
              <span className="text-cyan-400 hover:text-cyan-300 text-sm hidden sm:inline">
                Ver todos →
              </span>
            </Link>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("left")}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-white/10 bg-white/5 hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("right")}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-white/10 bg-white/5 hover:bg-white/10"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:-mx-0 sm:px-0 snap-x snap-mandatory scroll-pl-4 sm:scroll-pl-0"
      >
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="snap-start">
            <VehicleCard vehicle={vehicle} highlighted={vehicle.id === highlightedId} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── StatePicker ─────────────────────────────────────────────────────────────
function StatePicker({
  currentCode,
  availableStates,
  onSelect,
}: {
  currentCode: string | null;
  availableStates: { code: string; name: string; vehicleCount: number }[];
  onSelect: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const currentName = currentCode ? BRAZIL_STATES[currentCode] : null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm transition-colors"
      >
        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
        <span>{currentName ?? "Selecionar estado"}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute left-0 top-full mt-2 z-50 bg-[#1E293B] border border-white/10 rounded-xl shadow-2xl w-64 max-h-72 overflow-y-auto"
          >
            {availableStates.length === 0 ? (
              <p className="text-gray-400 text-sm p-4 text-center">
                Nenhum estado com carros disponíveis
              </p>
            ) : (
              availableStates.map((s) => (
                <button
                  key={s.code}
                  onClick={() => {
                    onSelect(s.code);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 text-left transition-colors ${
                    s.code === currentCode ? "text-cyan-400" : "text-white"
                  }`}
                >
                  <span className="text-sm">{s.name}</span>
                  <span className="text-xs text-gray-400">
                    {s.vehicleCount} carro{s.vehicleCount !== 1 ? "s" : ""}
                  </span>
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
function EmptyState({ stateName }: { stateName?: string }) {
  return (
    <div className="text-center py-16">
      <Car className="w-16 h-16 text-gray-600 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">
        {stateName
          ? `Nenhum carro disponível em ${stateName}`
          : "Nenhum veículo cadastrado ainda"}
      </h3>
      <p className="text-gray-400 mb-6">
        {stateName
          ? "Seja o primeiro anfitrião neste estado!"
          : "Seja o primeiro a anunciar seu carro na RIDDY!"}
      </p>
      <Link href="/signup/host">
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
          Anunciar meu carro
        </Button>
      </Link>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FeaturedCarsSection() {
  const { userState, loading: stateLoading, setManualState } = useUserState();
  const [highlightedVehicleId, setHighlightedVehicleId] = useState<number | null>(null);

  // Buscar estados disponíveis
  const statesQuery = trpc.vehicle.getStates.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  // Buscar carros agrupados por cidade no estado do usuário (top 2 cidades)
  const vehiclesQuery = trpc.vehicle.getGroupedByCityInState.useQuery(
    { state: userState?.code ?? "SP", limit: 10, maxCities: 2 },
    {
      enabled: !stateLoading,
      staleTime: 2 * 60 * 1000,
    }
  );

  const availableStates = statesQuery.data ?? [];
  const cities = vehiclesQuery.data?.cities ?? [];
  const vehiclesByCity = vehiclesQuery.data?.vehiclesByCity ?? {};
  const hasVehicles =
    cities.length > 0 && Object.values(vehiclesByCity).some((v) => v.length > 0);

  const isLoading = stateLoading || vehiclesQuery.isLoading;;

  return (
    <section className="py-8 sm:py-10 md:py-12 lg:py-16 bg-[#0A0F1C]">
      <div className="container px-0 sm:px-4 md:px-6">
        {/* Header com seletor de estado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8 px-4 sm:px-0">
          <div>
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white">
              Carros disponíveis
              {userState && (
                <span className="text-cyan-400"> em {userState.name}</span>
              )}
            </h2>
            <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
              {userState?.source === "ip" ? (
                <>
                  <Navigation className="w-3 h-3" />
                  Detectado automaticamente · Principais cidades do estado
                </>
              ) : (
                <>
                  <MapPin className="w-3 h-3" />
                  Exibindo as principais cidades do estado
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <StatePicker
              currentCode={userState?.code ?? null}
              availableStates={availableStates}
              onSelect={setManualState}
            />
          </div>
        </div>

        {/* Conteúdo */}
        {isLoading ? (
          <div className="space-y-8">
            {/* Skeleton for 2 city groups */}
            {[0, 1].map((g) => (
              <div key={g}>
                <div className="h-6 w-40 rounded-md bg-[#1A2235] mb-4 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/8 before:to-transparent" />
                <div className="flex gap-3 overflow-hidden">
                  <VehicleCardSkeleton count={3} variant="carousel" />
                </div>
              </div>
            ))}
          </div>
        ) : !userState ? (
          <div className="text-center py-16">
            <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-4">
              Selecione seu estado para ver carros disponíveis
            </p>
            <StatePicker
              currentCode={null}
              availableStates={availableStates}
              onSelect={setManualState}
            />
          </div>
        ) : !hasVehicles ? (
          <EmptyState stateName={userState.name} />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={userState.code}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-6"
            >
              {/* Carousels — full width */}
              <div className="flex-1 min-w-0">
                {cities.map((city) => {
                  const cityVehicles = vehiclesByCity[city] ?? [];
                  if (cityVehicles.length === 0) return null;
                  return (
                    <VehicleCarousel
                      key={city}
                      title={`Carros em ${city}`}
                      vehicles={cityVehicles as Vehicle[]}
                      cityLink={`/search?city=${encodeURIComponent(city)}&state=${userState.code}`}
                      highlightedId={highlightedVehicleId}
                    />
                  );
                })}
              </div>


            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}
