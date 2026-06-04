/**
 * User Dashboard - "Meu Garage"
 * Dashboard exclusivo para Usuário/Locatário
 * 7 seções: Overview, Viagens, Favoritos, Avaliações, Carteira, Notificações, Perfil
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { useUserMode } from "@/contexts/UserModeContext";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import UserDashboardLayout from "@/components/UserDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  Calendar,
  MapPin,
  Star,
  DollarSign,
  Clock,
  ArrowRight,
  Loader2,
  Heart,
  AlertCircle,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";

export default function UserDashboard() {
  const { user } = useAuth();
  const { mode } = useUserMode();
  const [location, navigate] = useLocation();

  // Get section from URL params - read directly from location to trigger re-render
  const params = new URLSearchParams(window.location.search);
  const section = params.get("section") || "overview";

  // Force re-render when location changes
  useEffect(() => {
    // This effect runs whenever location changes
  }, [location]);

  // Redirecionar para o dashboard correto se o modo não for locatário
  // /dashboard é exclusivo do perfil de locatário (modo renter)
  useEffect(() => {
    if (mode === "host") {
      navigate("/host", { replace: true });
    } else if (mode === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [mode, navigate]);

  // Fetch real data
  const { data: myBookings, isLoading: loadingBookings } = trpc.booking.getMyBookings.useQuery();
  const { data: conversations, isLoading: loadingMessages } = trpc.message.getConversations.useQuery();
  const { data: favorites, isLoading: loadingFavorites } = trpc.favorite.list.useQuery();
  const { data: myReviews, isLoading: loadingReviews } = trpc.review.getMyReviews.useQuery();
  const utils = trpc.useUtils();
  const removeFavoriteMutation = trpc.favorite.remove.useMutation({
    onSuccess: () => {
      utils.favorite.list.invalidate();
    },
  });

  if (!user) {
    return (
      <UserDashboardLayout activeSection={section}>
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      </UserDashboardLayout>
    );
  }

  // ==================== OVERVIEW ====================
  if (section === "overview") {
    const upcomingBookings = myBookings?.filter(
      (b) => b.status === "confirmed" || b.status === "pending" || b.status === "in_progress"
    ) || [];
    const completedBookings = myBookings?.filter((b) => b.status === "completed") || [];
    const totalSpent = completedBookings.reduce(
      (acc, b) => acc + parseFloat(String(b.totalAmount) || "0"),
      0
    );

    const nextBooking = upcomingBookings[0];

    return (
      <UserDashboardLayout activeSection={section}>
        {/* Hero - Próxima Viagem */}
        {nextBooking ? (
          <Card className="mb-8 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border-cyan-500/30">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-cyan-400 font-medium mb-2">PRÓXIMA VIAGEM</p>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Veículo #{nextBooking.vehicleId}
                  </h2>
                  <div className="flex items-center gap-4 text-gray-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      <span>{format(new Date(nextBooking.startDate), "dd MMM yyyy", { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      <span>{nextBooking.pickupLocation}</span>
                    </div>
                  </div>
                </div>
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
                  Ver Detalhes
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8 bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-cyan-500/20">
            <CardContent className="p-6 text-center">
              <Car className="w-12 h-12 text-cyan-400/50 mx-auto mb-3" />
              <p className="text-gray-400">Nenhuma viagem agendada</p>
              <Button
                onClick={() => navigate("/search")}
                className="mt-4 bg-cyan-500 hover:bg-cyan-600"
              >
                Procurar Veículos
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900/50 border-cyan-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Viagens Realizadas</p>
                  <p className="text-2xl font-bold text-white">{completedBookings.length}</p>
                </div>
                <Car className="w-8 h-8 text-cyan-400/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-cyan-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Próximas Viagens</p>
                  <p className="text-2xl font-bold text-white">{upcomingBookings.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-cyan-400/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-cyan-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Gastos Totais</p>
                  <p className="text-2xl font-bold text-white">R$ {totalSpent.toLocaleString("pt-BR")}</p>
                </div>
                <DollarSign className="w-8 h-8 text-cyan-400/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-cyan-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Avaliação</p>
                  <div className="flex items-center gap-1">
                    <p className="text-2xl font-bold text-white">
                      {myReviews && myReviews.length > 0
                        ? (myReviews.reduce((acc: number, r: any) => acc + r.rating, 0) / myReviews.length).toFixed(1)
                        : "—"}
                    </p>
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  </div>
                </div>
                <Star className="w-8 h-8 text-yellow-400/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Viagens Recentes */}
        <Card className="bg-slate-900/50 border-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-cyan-400" />
              Viagens Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBookings ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              </div>
            ) : upcomingBookings.length > 0 ? (
              <div className="space-y-3">
                {upcomingBookings.slice(0, 3).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-cyan-500/10 hover:border-cyan-500/30 transition"
                  >
                    <div>
                      <p className="font-medium text-white">
                        Veículo #{booking.vehicleId}
                      </p>
                      <p className="text-sm text-gray-400">
                        {format(new Date(booking.startDate), "dd MMM", { locale: ptBR })} -{" "}
                        {format(new Date(booking.endDate), "dd MMM", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                      {booking.status === "confirmed" && "Confirmado"}
                      {booking.status === "pending" && "Pendente"}
                      {booking.status === "in_progress" && "Em Andamento"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Car className="w-12 h-12 text-cyan-400/30 mx-auto mb-3" />
                <p className="text-gray-400 mb-3">Você ainda não tem viagens agendadas</p>
                <Button
                  onClick={() => navigate("/search")}
                  className="bg-cyan-500 hover:bg-cyan-600"
                >
                  Procurar Veículos
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </UserDashboardLayout>
    );
  }

  // ==================== VIAGENS ====================
  if (section === "trips") {
    return (
      <UserDashboardLayout activeSection={section}>
        <Card className="bg-slate-900/50 border-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-white">Todas as Viagens</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBookings ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              </div>
            ) : myBookings && myBookings.length > 0 ? (
              <div className="space-y-3">
                {myBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 bg-slate-800/50 rounded-lg border border-cyan-500/10 hover:border-cyan-500/30 transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-white">
                          Veículo #{booking.vehicleId}
                        </p>
                        <p className="text-sm text-gray-400">ID: {booking.vehicleId}</p>
                      </div>
                      <Badge
                        className={
                          booking.status === "completed"
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                        }
                      >
                        {booking.status === "completed" && "Concluída"}
                        {booking.status === "confirmed" && "Confirmada"}
                        {booking.status === "pending" && "Pendente"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-400">
                      <div>
                        <p className="text-xs text-gray-500">Data</p>
                        <p>
                          {format(new Date(booking.startDate), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Local</p>
                        <p>{booking.pickupLocation}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Dias</p>
                        <p>
                          {Math.ceil(
                            (new Date(booking.endDate).getTime() -
                              new Date(booking.startDate).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="text-cyan-400 font-medium">R$ {booking.totalAmount}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Car className="w-12 h-12 text-cyan-400/30 mx-auto mb-3" />
                <p className="text-gray-400 mb-3">Você ainda não realizou nenhuma viagem</p>
                <Button
                  onClick={() => navigate("/search")}
                  className="bg-cyan-500 hover:bg-cyan-600"
                >
                  Explorar Veículos
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </UserDashboardLayout>
    );
  }

  // ==================== FAVORITOS ====================
  if (section === "favorites") {
    return (
      <UserDashboardLayout activeSection={section}>
        <Card className="bg-slate-900/50 border-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-400" />
              Veículos Favoritos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingFavorites ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              </div>
            ) : favorites && favorites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map((fav: any) => (
                  <div
                    key={fav.id}
                    className="p-4 bg-slate-800/50 rounded-lg border border-cyan-500/10 hover:border-cyan-500/30 transition group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-medium text-white mb-1">
                          {fav.vehicle?.brand} {fav.vehicle?.model}
                        </p>
                        <p className="text-sm text-gray-400">
                          {fav.vehicle?.year} • {fav.vehicle?.category}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFavoriteMutation.mutate({ vehicleId: fav.vehicleId })}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span>{fav.vehicle?.pickupCity}</span>
                      </div>
                      <p className="text-cyan-400 font-medium">
                        R$ {fav.vehicle?.dailyPrice}/dia
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/vehicle/${fav.vehicleId}`)}
                      className="w-full mt-3 bg-cyan-500 hover:bg-cyan-600 text-white"
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Heart className="w-12 h-12 text-red-400/30 mx-auto mb-3" />
                <p className="text-gray-400 mb-3">Você ainda não tem veículos favoritos</p>
                <p className="text-sm text-gray-500 mb-4">Salve seus veículos preferidos para acessá-los rapidamente</p>
                <Button
                  onClick={() => navigate("/search")}
                  className="bg-cyan-500 hover:bg-cyan-600"
                >
                  Explorar Veículos
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </UserDashboardLayout>
    );
  }

  // ==================== AVALIAÇÕES ====================
  if (section === "reviews") {
    // Calculate average rating
    const avgRating = myReviews && myReviews.length > 0
      ? (myReviews.reduce((acc: number, r: any) => acc + r.rating, 0) / myReviews.length).toFixed(1)
      : "0.0";

    return (
      <UserDashboardLayout activeSection={section}>
        <Card className="bg-slate-900/50 border-cyan-500/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Minhas Avaliações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingReviews ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              </div>
            ) : (
              <>
                <div className="text-center py-8 border-b border-cyan-500/10 mb-6">
                  <div className="flex justify-center mb-4">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-8 h-8 ${
                            i < Math.floor(parseFloat(avgRating))
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white mb-2">{avgRating} de 5.0</p>
                  <p className="text-gray-400">Baseado em {myReviews?.length || 0} avaliações</p>
                </div>

                {myReviews && myReviews.length > 0 ? (
                  <div className="space-y-4">
                    {myReviews.map((review: any) => (
                      <div
                        key={review.id}
                        className="p-4 bg-slate-800/50 rounded-lg border border-cyan-500/10"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-600"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">
                            {format(new Date(review.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-gray-300 text-sm">{review.comment}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Reserva #{review.bookingId}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-400">Você ainda não recebeu avaliações</p>
                    <p className="text-sm text-gray-500 mt-2">Complete viagens para receber avaliações de proprietários</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </UserDashboardLayout>
    );
  }

  // ==================== CARTEIRA ====================
  if (section === "wallet") {
    const { data: myPayments, isLoading: loadingPayments } = trpc.payment.getMyPayments.useQuery();
    
    // Removed: totalBalance calculation - only showing payment history now
    
    const getPaymentStatusBadge = (status: string) => {
      const badges: Record<string, React.ReactElement> = {
        pending: <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendente</Badge>,
        completed: <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Concluído</Badge>,
        failed: <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Falhou</Badge>,
        refunded: <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Reembolsado</Badge>,
      };
      return badges[status] || <Badge>{status}</Badge>;
    };
    
    return (
      <UserDashboardLayout activeSection={section}>
        <div className="space-y-6">
          {/* Histórico de Pagamentos */}
          <Card className="bg-slate-900/50 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-white">Histórico de Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPayments ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                </div>
              ) : myPayments && myPayments.length > 0 ? (
                <div className="space-y-3">
                  {myPayments.map((payment) => (
                    <div key={payment.id} className="p-4 bg-slate-800/50 rounded-lg border border-cyan-500/10 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">
                          {payment.paymentMethod === "credit_card" ? "Cartão de Crédito" : 
                           payment.paymentMethod === "debit_card" ? "Cartão de Débito" : 
                           payment.paymentMethod === "pix" ? "PIX" : payment.paymentMethod}
                        </p>
                        <p className="text-sm text-gray-400">
                          Reserva #{payment.bookingId}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(payment.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-medium text-white">
                          R$ {parseFloat(String(payment.amount) || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                        {getPaymentStatusBadge(payment.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-cyan-400/50 mx-auto mb-3" />
                  <p className="text-gray-400">Nenhuma transação realizada</p>
                  <p className="text-sm text-gray-500 mt-2">Seu histórico de pagamentos aparecerá aqui</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </UserDashboardLayout>
    );
  }

  // ==================== NOTIFICAÇÕES ====================
  if (section === "notifications") {
    return (
      <UserDashboardLayout activeSection={section}>
        <Card className="bg-slate-900/50 border-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-white">Notificações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 bg-slate-800/50 rounded-lg border border-cyan-500/10 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-white">Reserva Confirmada</p>
                  <p className="text-sm text-gray-400">Sua reserva foi confirmada pelo proprietário</p>
                  <p className="text-xs text-gray-500 mt-1">Há 2 dias</p>
                </div>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-lg border border-cyan-500/10 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-white">Documentação Pendente</p>
                  <p className="text-sm text-gray-400">Complete sua verificação de identidade</p>
                  <p className="text-xs text-gray-500 mt-1">Há 5 dias</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </UserDashboardLayout>
    );
  }

  // ==================== PERFIL ====================
  if (section === "profile") {
    return (
      <UserDashboardLayout activeSection={section}>
        <div className="space-y-6">
          {/* Dados Pessoais */}
          <Card className="bg-slate-900/50 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-white">Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Nome</p>
                  <p className="text-white font-medium">{user.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Email</p>
                  <p className="text-white font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Telefone</p>
                  <p className="text-white font-medium">{user.phone || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">CPF</p>
                  <p className="text-white font-medium">{user.cpf || "Não informado"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verificações */}
          <Card className="bg-slate-900/50 border-cyan-500/20">
            <CardHeader>
              <CardTitle className="text-white">Status de Verificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div>
                  <p className="font-medium text-white">Identidade</p>
                  <p className="text-sm text-gray-400">CNH ou RG</p>
                </div>
                {user.cnhVerified ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    ✓ Verificado
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    Pendente
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div>
                  <p className="font-medium text-white">Endereço</p>
                  <p className="text-sm text-gray-400">Comprovante de residência</p>
                </div>
                {user.addressVerified ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    ✓ Verificado
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    Pendente
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </UserDashboardLayout>
    );
  }

  return null;
}
