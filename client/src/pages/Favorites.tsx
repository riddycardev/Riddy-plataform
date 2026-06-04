/**
 * Favorites Page — /favorites
 * Shows all vehicles saved by the authenticated user
 * Premium design matching the Turo-inspired card style
 */

import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Button } from "@/components/ui/button";
import { MapPin, Heart, Search, Star } from "lucide-react";

// ─── Skeleton card (same dimensions as real card) ────────────────────────────
function FavoriteCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-[#1A2235] border border-white/8 animate-pulse">
      {/* Image placeholder */}
      <div className="w-full aspect-[4/3] bg-white/10" />
      {/* Content placeholder */}
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/8 rounded w-1/2" />
        <div className="h-4 bg-white/10 rounded w-1/3 mt-1" />
      </div>
    </div>
  );
}

// ─── Single favorite card ─────────────────────────────────────────────────────
function FavoriteCard({ item }: { item: { vehicleId: number; vehicle: { id: number; brand: string; model: string; year: number | null; category: string | null; pickupCity: string | null; pickupState: string | null; dailyPrice: number | null; mainImageUrl: string | null } | null } }) {
  const v = item.vehicle;
  if (!v) return null;

  // Clean duplicate brand from model ("Honda Honda City" → "Honda City")
  const cleanModel = v.model.toLowerCase().startsWith(v.brand.toLowerCase())
    ? v.model.trim()
    : `${v.brand} ${v.model}`.trim();

  const displayTitle = cleanModel.length > 22
    ? cleanModel.slice(0, 22) + "…"
    : cleanModel;

  const location = [v.pickupCity, v.pickupState].filter(Boolean).join(", ");

  return (
    <Link href={`/vehicles/${v.id}`}>
      <div className="group rounded-xl overflow-hidden bg-[#1A2235] border border-white/8 hover:border-cyan-500/30 transition-all duration-200 cursor-pointer">
        {/* Image */}
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#0F1929]">
          {v.mainImageUrl ? (
            <img
              src={v.mainImageUrl}
              alt={cleanModel}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-600 text-3xl">🚗</span>
            </div>
          )}

          {/* Favorite button */}
          <div className="absolute top-2 right-2" onClick={(e) => e.preventDefault()}>
            <FavoriteButton vehicleId={v.id} size="sm" />
          </div>

          {/* Category badge */}
          {v.category && (
            <div className="absolute bottom-2 left-2">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white/80 border border-white/10">
                {v.category}
              </span>
            </div>
          )}
        </div>

        {/* Card content */}
        <div className="p-3">
          <p className="text-white text-sm font-semibold leading-tight truncate">{displayTitle}</p>

          <div className="flex items-center gap-1 mt-1">
            {v.year && (
              <span className="text-gray-400 text-xs">{v.year}</span>
            )}
            {v.year && location && (
              <span className="text-gray-600 text-xs">·</span>
            )}
            {location && (
              <span className="text-gray-400 text-xs truncate">{location}</span>
            )}
          </div>

          {v.dailyPrice && (
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-white text-base font-bold">
                R$ {v.dailyPrice.toLocaleString("pt-BR")}
              </span>
              <span className="text-gray-400 text-xs">/dia</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyFavorites() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center mb-5">
        <Heart className="w-10 h-10 text-cyan-400" strokeWidth={1.5} />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">Nenhum favorito ainda</h2>
      <p className="text-gray-400 mb-8 max-w-xs text-sm leading-relaxed">
        Salve os carros que você gostou tocando no coração para encontrá-los facilmente depois.
      </p>
      <Link href="/">
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold px-6">
          <Search className="w-4 h-4 mr-2" />
          Explorar carros
        </Button>
      </Link>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Favorites() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const { data: favorites, isLoading } = trpc.favorite.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Redirect to login if not authenticated
  if (!authLoading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const validFavorites = (favorites ?? []).filter((f) => f.vehicle !== null);

  return (
    <div className="min-h-screen bg-[#0A0F1C] pb-24 lg:pb-0">
      <Header />

      {/* Spacer for fixed header */}
      <div className="h-14 sm:h-16 lg:h-20" />

      <main className="container max-w-2xl mx-auto px-4 py-6">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Favoritos</h1>
          {!isLoading && validFavorites.length > 0 && (
            <p className="text-gray-400 text-sm mt-1">
              {validFavorites.length} {validFavorites.length === 1 ? "veículo salvo" : "veículos salvos"}
            </p>
          )}
        </div>

        {/* Loading skeletons */}
        {(isLoading || authLoading) ? (
          <div className="grid grid-cols-2 gap-2.5 md:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <FavoriteCardSkeleton key={i} />
            ))}
          </div>
        ) : validFavorites.length === 0 ? (
          <EmptyFavorites />
        ) : (
          <div className="grid grid-cols-2 gap-2.5 md:gap-4">
            {validFavorites.map((item) => (
              <FavoriteCard key={item.vehicleId} item={item as any} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
