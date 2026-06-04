/**
 * Host Public Profile Page — /hosts/:id
 * Shows host info, active vehicles, and reviews
 * Design: consistent with dark premium aesthetic of the platform
 */

import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star,
  Shield,
  CheckCircle,
  Car,
  MapPin,
  Calendar,
  MessageCircle,
  ChevronRight,
  User,
} from "lucide-react";

const categoryLabels: Record<string, string> = {
  popular: "Econômico",
  sedan: "Sedan",
  suv: "SUV",
  luxury: "Luxo",
  electric: "Elétrico",
  sport: "Esportivo",
  motorcycle: "Moto",
};

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const stars = Math.round(rating);
  const iconClass = size === "md" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${iconClass} ${i <= stars ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`}
        />
      ))}
    </div>
  );
}

function HostProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#0A0F1C]">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          <Skeleton className="w-32 h-32 rounded-full bg-white/10 shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-48 bg-white/10" />
            <Skeleton className="h-4 w-64 bg-white/10" />
            <Skeleton className="h-16 w-full bg-white/10" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 bg-white/10 rounded-xl" />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function HostProfile() {
  const params = useParams<{ id: string }>();
  const hostId = parseInt(params.id || "0", 10);

  const { data, isLoading, error } = trpc.host.getPublicProfile.useQuery(
    { hostId },
    { enabled: hostId > 0 }
  );

  if (isLoading) return <HostProfileSkeleton />;

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0A0F1C]">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-24 text-center">
          <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Host não encontrado</h1>
          <p className="text-gray-400 mb-6">Este perfil não existe ou foi removido.</p>
          <Link href="/cars">
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
              Ver veículos disponíveis
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { host, vehicles, reviews } = data;
  const avgRating = host.averageRating ? parseFloat(String(host.averageRating)) : null;
  const memberYear = host.memberSince ? new Date(host.memberSince).getFullYear() : null;
  const isVerified = host.kycStatus === "approved" || host.verificationLevel !== "basic";

  return (
    <div className="min-h-screen bg-[#0A0F1C]">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* ─── Hero: Avatar + Info ─── */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Avatar */}
          <div className="shrink-0">
            <div className="relative w-32 h-32">
              {host.avatarUrl ? (
                <img
                  src={host.avatarUrl}
                  alt={host.name || "Host"}
                  className="w-32 h-32 rounded-full object-cover border-4 border-cyan-500/30"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-4 border-cyan-500/30 flex items-center justify-center">
                  <span className="text-4xl font-bold text-cyan-400">
                    {(host.name || "H").charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full p-1">
                  <CheckCircle className="w-4 h-4 text-black" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{host.name || "Anfitrião"}</h1>
              {isVerified && (
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Verificado
                </Badge>
              )}
              {host.cnhVerified && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  CNH Verificada
                </Badge>
              )}
            </div>

            {/* Location & Member since */}
            <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm mb-4">
              {(host.addressCity || host.addressState) && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {[host.addressCity, host.addressState].filter(Boolean).join(", ")}
                </span>
              )}
              {memberYear && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Membro desde {memberYear}
                </span>
              )}
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 mb-4">
              {avgRating !== null && (
                <div className="text-center">
                  <div className="flex items-center gap-1 mb-1">
                    <StarRating rating={avgRating} size="sm" />
                    <span className="text-white font-semibold ml-1">{avgRating.toFixed(1)}</span>
                  </div>
                  <p className="text-gray-500 text-xs">Avaliação</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-white font-bold text-xl">{host.totalTripsAsHost}</p>
                <p className="text-gray-500 text-xs">Viagens como host</p>
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-xl">{vehicles.length}</p>
                <p className="text-gray-500 text-xs">Veículos ativos</p>
              </div>
              {reviews.length > 0 && (
                <div className="text-center">
                  <p className="text-white font-bold text-xl">{reviews.length}</p>
                  <p className="text-gray-500 text-xs">Avaliações</p>
                </div>
              )}
            </div>

            {/* Bio */}
            {host.bio && (
              <p className="text-gray-300 text-sm leading-relaxed max-w-xl">{host.bio}</p>
            )}
          </div>
        </div>

        {/* ─── Vehicles ─── */}
        {vehicles.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Car className="w-5 h-5 text-cyan-400" />
              Veículos disponíveis
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {vehicles.map((vehicle) => (
                <Link key={vehicle.id} href={`/vehicle/${vehicle.id}`}>
                  <Card className="bg-white/5 border-white/10 hover:border-cyan-500/40 transition-all cursor-pointer group overflow-hidden">
                    {/* Vehicle image */}
                    <div className="relative h-40 overflow-hidden">
                      {vehicle.mainImageUrl ? (
                        <img
                          src={vehicle.mainImageUrl}
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                          <Car className="w-12 h-12 text-gray-600" />
                        </div>
                      )}
                      {vehicle.category && (
                        <Badge className="absolute top-2 left-2 bg-black/60 text-white border-0 text-xs">
                          {categoryLabels[vehicle.category] || vehicle.category}
                        </Badge>
                      )}
                    </div>

                    <CardContent className="p-4">
                      <h3 className="text-white font-semibold text-sm mb-1">
                        {vehicle.brand} {vehicle.model} {vehicle.year}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-gray-400 text-xs">
                          <MapPin className="w-3 h-3" />
                          {vehicle.pickupCity}
                        </div>
                        <div className="text-right">
                          <span className="text-cyan-400 font-bold text-sm">
                            R$ {parseFloat(vehicle.dailyPrice).toFixed(0)}
                          </span>
                          <span className="text-gray-500 text-xs">/dia</span>
                        </div>
                      </div>
                      {vehicle.averageRating && (
                        <div className="flex items-center gap-1 mt-2">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-white text-xs">{parseFloat(vehicle.averageRating).toFixed(1)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ─── Reviews ─── */}
        {reviews.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              Avaliações ({reviews.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((review) => (
                <Card key={review.id} className="bg-white/5 border-white/10">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center shrink-0">
                          <span className="text-cyan-400 font-semibold text-sm">
                            {(review.reviewerName || "U").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{review.reviewerName}</p>
                          <p className="text-gray-500 text-xs">
                            {review.createdAt
                              ? new Date(review.createdAt).toLocaleDateString("pt-BR", {
                                  month: "long",
                                  year: "numeric",
                                })
                              : ""}
                          </p>
                        </div>
                      </div>
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                    {review.comment && (
                      <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ─── Empty state ─── */}
        {vehicles.length === 0 && reviews.length === 0 && (
          <div className="text-center py-16">
            <Car className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Este host ainda não tem veículos ou avaliações.</p>
          </div>
        )}

        {/* ─── CTA: Message host ─── */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold">Tem alguma dúvida?</p>
            <p className="text-gray-400 text-sm">Entre em contato com {host.name?.split(" ")[0] || "o host"} antes de reservar.</p>
          </div>
          <Link href={vehicles.length > 0 ? `/vehicle/${vehicles[0].id}` : "/cars"}>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Ver veículos
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
