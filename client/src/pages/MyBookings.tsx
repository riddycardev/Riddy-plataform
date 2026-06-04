/**
 * My Bookings Page
 * List of user's bookings with status and actions
 * Uses real data from database
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  MapPin, 
  MessageCircle,
  Star,
  Clock,
  Car,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Booking = {
  id: number;
  vehicleId: number;
  renterId: number;
  hostId: number;
  startDate: Date;
  endDate: Date;
  pickupLocation: string;
  status: string;
  totalAmount: string;
  createdAt: Date;
};

/** Skeleton de card de reserva — exibido enquanto dados carregam */
function BookingCardSkeleton() {
  return (
    <Card className="bg-white/5 border-white/10 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="w-full sm:w-48 h-32 sm:h-auto bg-white/5 animate-pulse" />
          <div className="flex-1 p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-24 bg-white/8 rounded animate-pulse" />
              </div>
              <div className="space-y-1 text-right">
                <div className="h-5 w-20 bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-16 bg-white/8 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-3 w-28 bg-white/8 rounded animate-pulse" />
              <div className="h-3 w-24 bg-white/8 rounded animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-24 bg-white/10 rounded animate-pulse" />
              <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyBookings() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<number | null>(null);

  // Fetch real data from database
  // placeholderData: keepPreviousData → mantém dados anteriores enquanto re-busca
  const { data: myBookings, isLoading } = trpc.booking.getMyBookings.useQuery(undefined, {
    placeholderData: (prev) => prev,
  });

  // Cancel booking mutation
  const cancelBooking = trpc.booking.updateStatus.useMutation({
    onSuccess: () => {
      trpc.useUtils().booking.getMyBookings.invalidate();
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Confirmado</Badge>;
      case "pending_host_approval":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Aguardando aprovação do proprietário</Badge>;
      case "pending_payment":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Aguardando pagamento</Badge>;
      case "payment_failed":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Pagamento recusado</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendente</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Em Andamento</Badge>;
      case "completed":
        return <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Concluído</Badge>;
      case "cancelled_by_renter":
      case "cancelled_by_host":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const upcomingBookings = myBookings?.filter(b => 
    ["confirmed", "pending", "pending_host_approval", "pending_payment", "payment_failed", "in_progress"].includes(b.status)
  ) || [];
  const pastBookings = myBookings?.filter(b => 
    ["completed", "cancelled_by_renter", "cancelled_by_host"].includes(b.status)
  ) || [];

  const handleCancelBooking = (bookingId: number) => {
    setBookingToCancel(bookingId);
    setCancelConfirmOpen(true);
  };

  const handleConfirmCancel = () => {
    if (bookingToCancel !== null) {
      cancelBooking.mutate({ id: bookingToCancel, status: "cancelled_by_renter" });
    }
    setCancelConfirmOpen(false);
    setBookingToCancel(null);
  };

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card className="bg-white/5 border-white/10 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="w-full sm:w-48 h-32 sm:h-auto bg-gray-800 flex items-center justify-center">
            <Car className="w-12 h-12 text-gray-600" />
          </div>
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white">Reserva #{booking.id}</h3>
                  {getStatusBadge(booking.status)}
                </div>
                <p className="text-sm text-gray-400">Veículo #{booking.vehicleId}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-white">
                  R$ {parseFloat(String(booking.totalAmount) || "0").toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-gray-500">RDY-{booking.id.toString().padStart(6, "0")}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(new Date(booking.startDate), "dd MMM", { locale: ptBR })} - {format(new Date(booking.endDate), "dd MMM yyyy", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{booking.pickupLocation}</span>
              </div>
            </div>

            <div className="flex gap-2">
              {booking.status === "confirmed" && (
                <>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-white/20 text-white hover:bg-white/10"
                    onClick={() => navigate("/messages")}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Mensagem
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                    onClick={() => handleCancelBooking(booking.id)}
                    disabled={cancelBooking.isPending}
                  >
                    Cancelar
                  </Button>
                </>
              )}
              {(booking.status === "pending" || booking.status === "pending_host_approval") && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                  onClick={() => handleCancelBooking(booking.id)}
                  disabled={cancelBooking.isPending}
                >
                  Cancelar
                </Button>
              )}
              {(booking.status === "pending_payment" || booking.status === "payment_failed") && (
                <Button
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  onClick={() => navigate(`/pay/${booking.id}`)}
                >
                  {booking.status === "payment_failed" ? "Tentar Novamente" : "Realizar Pagamento"}
                </Button>
              )}
              {booking.status === "completed" && (
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 text-black"
                  onClick={() => navigate(`/bookings/${booking.id}/review`)}
                >
                  <Star className="w-4 h-4 mr-2" />
                  Avaliar
                </Button>
              )}
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-cyan-400 hover:bg-cyan-500/20"
                onClick={() => navigate(`/bookings/${booking.id}`)}
              >
                Ver Detalhes
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            Minhas Reservas
          </h1>
          <p className="text-gray-400">
            Gerencie suas reservas atuais e veja seu histórico de viagens.
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger 
              value="upcoming" 
              className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
            >
              <Clock className="w-4 h-4 mr-2" />
              Próximas {!isLoading && `(${upcomingBookings.length})`}
            </TabsTrigger>
            <TabsTrigger 
              value="past" 
              className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black"
            >
              <Car className="w-4 h-4 mr-2" />
              Histórico {!isLoading && `(${pastBookings.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {isLoading ? (
              /* Skeleton inline — não bloqueia a UI inteira */
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <BookingCardSkeleton key={i} />)}
              </div>
            ) : upcomingBookings.length > 0 ? (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking as unknown as Booking} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Nenhuma reserva ativa</h3>
                <p className="text-gray-400 mb-6">Você não tem reservas ativas no momento.</p>
                <Button 
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 text-black"
                  onClick={() => navigate("/cars")}
                >
                  Explorar Veículos
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => <BookingCardSkeleton key={i} />)}
              </div>
            ) : pastBookings.length > 0 ? (
              <div className="space-y-4">
                {pastBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking as unknown as Booking} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <Car className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Nenhuma viagem concluída</h3>
                <p className="text-gray-400">Seu histórico de viagens aparecerá aqui.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <ConfirmDialog
          open={cancelConfirmOpen}
          onOpenChange={setCancelConfirmOpen}
          title="Cancelar Reserva"
          description="Tem certeza que deseja cancelar esta reserva? Esta ação não pode ser desfeita."
          confirmLabel="Sim, cancelar"
          cancelLabel="Não, manter"
          onConfirm={handleConfirmCancel}
        />
      </div>
    </DashboardLayout>
  );
}
