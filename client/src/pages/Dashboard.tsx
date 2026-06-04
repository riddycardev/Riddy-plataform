/**
 * User Dashboard Page
 * Main dashboard for renters showing bookings, stats, and quick actions
 * Uses real data from database
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Car, 
  Calendar, 
  CreditCard, 
  MessageCircle, 
  Star,
  Clock,
  MapPin,
  ArrowRight,
  Loader2
} from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Fetch real data from database
  const { data: myBookings, isLoading: loadingBookings } = trpc.booking.getMyBookings.useQuery();
  const { data: conversations, isLoading: loadingMessages } = trpc.message.getConversations.useQuery();

  // Filter bookings
  const upcomingBookings = myBookings?.filter(b => 
    b.status === "confirmed" || b.status === "pending" || b.status === "in_progress"
  ) || [];
  const completedBookings = myBookings?.filter(b => b.status === "completed") || [];

  // Calculate stats
  const totalSpent = completedBookings.reduce((acc, b) => acc + parseFloat(String(b.totalAmount) || "0"), 0);
  const unreadMessages = conversations?.filter(c => c.lastMessage && !c.lastMessage.isRead && c.lastMessage.senderId !== user?.id).length || 0;
  const nextBooking = upcomingBookings.length > 0 
    ? format(new Date(upcomingBookings[0].startDate), "dd MMM", { locale: ptBR })
    : "-";

  const stats = [
    { label: "Viagens Realizadas", value: completedBookings.length.toString(), icon: Car },
    { label: "Próxima Reserva", value: nextBooking, icon: Calendar },
    { label: "Gastos Totais", value: `R$ ${totalSpent.toLocaleString("pt-BR")}`, icon: CreditCard },
    { label: "Mensagens", value: unreadMessages.toString(), icon: MessageCircle }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Confirmado</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendente</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Em Andamento</Badge>;
      case "completed":
        return <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Concluído</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loadingBookings || loadingMessages) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            Olá, {user?.name?.split(" ")[0] || "Usuário"}! 👋
          </h1>
          <p className="text-gray-400">
            Bem-vindo ao seu painel. Aqui você pode gerenciar suas reservas e viagens.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm text-gray-400">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upcoming Bookings */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Próximas Reservas ({upcomingBookings.length})</CardTitle>
            <Button 
              variant="ghost" 
              className="text-cyan-400 hover:text-cyan-300"
              onClick={() => navigate("/my-bookings")}
            >
              Ver Todas
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length > 0 ? (
              <div className="space-y-4">
                {upcomingBookings.slice(0, 3).map((booking) => (
                  <div 
                    key={booking.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => navigate(`/bookings/${booking.id}`)}
                  >
                    <div className="w-24 h-16 bg-gray-800 rounded-lg flex items-center justify-center">
                      <Car className="w-8 h-8 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">Reserva #{booking.id}</h3>
                        {getStatusBadge(booking.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {format(new Date(booking.startDate), "dd MMM", { locale: ptBR })} - {format(new Date(booking.endDate), "dd MMM", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{booking.pickupLocation}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">
                        R$ {parseFloat(String(booking.totalAmount) || "0").toLocaleString("pt-BR")}
                      </p>
                      <p className="text-sm text-gray-400">Total</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Car className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Você não tem reservas futuras</p>
                <Button 
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 text-black"
                  onClick={() => navigate("/")}
                >
                  Explorar Carros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Trips & Quick Actions */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Trips */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Viagens Recentes ({completedBookings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {completedBookings.length > 0 ? (
                <div className="space-y-4">
                  {completedBookings.slice(0, 3).map((trip) => (
                    <div 
                      key={trip.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/5"
                    >
                      <div>
                        <h4 className="font-medium text-white">Reserva #{trip.id}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>
                            {format(new Date(trip.startDate), "dd MMM", { locale: ptBR })} - {format(new Date(trip.endDate), "dd MMM yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-cyan-400 font-bold">
                          R$ {parseFloat(String(trip.totalAmount) || "0").toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Car className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Nenhuma viagem concluída ainda</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto py-6 flex-col gap-2 border-white/20 text-white hover:bg-white/10"
                  onClick={() => navigate("/")}
                >
                  <Car className="w-6 h-6 text-cyan-400" />
                  <span>Buscar Carros</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-6 flex-col gap-2 border-white/20 text-white hover:bg-white/10"
                  onClick={() => navigate("/my-bookings")}
                >
                  <Calendar className="w-6 h-6 text-cyan-400" />
                  <span>Minhas Reservas</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-6 flex-col gap-2 border-white/20 text-white hover:bg-white/10"
                  onClick={() => navigate("/messages")}
                >
                  <MessageCircle className="w-6 h-6 text-cyan-400" />
                  <span>Mensagens</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-6 flex-col gap-2 border-white/20 text-white hover:bg-white/10"
                  onClick={() => navigate("/payments")}
                >
                  <CreditCard className="w-6 h-6 text-cyan-400" />
                  <span>Pagamentos</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
