/**
 * Host Dashboard - "Minha Frota"
 * Dashboard exclusivo para Proprietário
 * 7 seções: Overview, Veículos, Reservas Pendentes, Calendário, Avaliações, Documentos, Relatórios
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { useUserMode } from "@/contexts/UserModeContext";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import HostDashboardLayout from "@/components/HostDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Car,
  TrendingUp,
  Calendar,
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Plus,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  Bike,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import VehicleCalendar from "@/components/VehicleCalendar";
import CalendarSection from "@/components/CalendarSection";
import ReviewsSection from "@/components/ReviewsSection";
import DocumentsSection from "@/components/DocumentsSection";
import ConfirmDialog from "@/components/ConfirmDialog";
import RentalContract from "@/components/RentalContract";

export default function HostDashboardNew() {
  const { user } = useAuth();
  const { mode } = useUserMode();
  const utils = trpc.useUtils();
  const [location, navigate] = useLocation();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<number | null>(null);

  // Contract approval modal state
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [contractModalBooking, setContractModalBooking] = useState<any>(null);
  const [contractAccepted, setContractAccepted] = useState(false);

  // Get section from URL params - read directly from location to trigger re-render
  const params = new URLSearchParams(window.location.search);
  const section = params.get("section") || "overview";

  // Force re-render when location changes
  useEffect(() => {
    // This effect runs whenever location changes
  }, [location]);

  // Redirecionar para /dashboard se o usuário está no modo locatário
  // /host é exclusivo do perfil de anfitrião (modo host)
  useEffect(() => {
    if (mode === "renter") {
      navigate("/dashboard", { replace: true });
    }
  }, [mode, navigate]);

  // Fetch real data
  const { data: myVehicles, isLoading: loadingVehicles } = trpc.vehicle.getMyVehicles.useQuery();
  const { data: hostBookings, isLoading: loadingBookings } = trpc.booking.getHostBookings.useQuery();
  // Fetch reviews unconditionally (used in overview and reviews sections)
  const { data: hostReviewsData } = trpc.review.getHostReviews.useQuery();
  
  // Mutations
  const approveBookingMutation = trpc.booking.approveForPayment.useMutation({
    onSuccess: () => {
      toast.success("Reserva aprovada! O locatário será notificado para realizar o pagamento.");
      setContractModalOpen(false);
      setContractModalBooking(null);
      setContractAccepted(false);
      utils.booking.getHostBookings.invalidate();
      utils.vehicle.getMyVehicles.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao aprovar reserva");
    },
  });

  // Open contract modal before approving
  const openContractModal = (booking: any) => {
    setContractModalBooking(booking);
    setContractAccepted(false);
    setContractModalOpen(true);
  };

  // Confirm approval after reading contract
  const handleConfirmApproval = () => {
    if (!contractModalBooking) return;
    approveBookingMutation.mutate({
      id: contractModalBooking.id,
      hostUserAgent: navigator.userAgent,
    });
  };
  
  const rejectBookingMutation = trpc.booking.rejectBooking.useMutation({
    onSuccess: () => {
      toast.success("Reserva rejeitada.");
      utils.booking.getHostBookings.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao rejeitar reserva");
    },
  });
  
  const deleteVehicleMutation = trpc.vehicle.deleteVehicle.useMutation({
    onSuccess: () => {
      toast.success("Veículo deletado com sucesso!");
      utils.vehicle.getMyVehicles.invalidate();
      utils.booking.getHostBookings.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar veículo");
    },
  });
  
  const handleDeleteVehicle = (vehicleId: number) => {
    setVehicleToDelete(vehicleId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (vehicleToDelete !== null) {
      deleteVehicleMutation.mutate({ id: vehicleToDelete });
    }
    setDeleteConfirmOpen(false);
    setVehicleToDelete(null);
  };

  if (!user) {
    return (
      <HostDashboardLayout activeSection={section}>
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      </HostDashboardLayout>
    );
  }

  // ==================== OVERVIEW ====================
  if (section === "overview") {
    const pendingBookings = hostBookings?.filter((b) => b.status === "pending_host_approval") || [];
    const confirmedBookings = hostBookings?.filter((b) => b.status === "confirmed") || [];
    const completedBookings = hostBookings?.filter((b) => b.status === "completed") || [];
    
    const totalEarnings = completedBookings.reduce(
      (acc, b) => acc + parseFloat(String(b.totalAmount) || "0"),
      0
    );

    const occupancyRate = myVehicles && myVehicles.length > 0
      ? Math.round((confirmedBookings.length / (myVehicles.length * 30)) * 100)
      : 0;

    const overviewReviews = hostReviewsData;
    const overviewAvgRating = overviewReviews && overviewReviews.length > 0
      ? (overviewReviews.reduce((acc, r) => acc + r.rating, 0) / overviewReviews.length).toFixed(1)
      : null;

    return (
      <HostDashboardLayout activeSection={section}>
        {/* Contract Approval Modal */}
        <Dialog open={contractModalOpen} onOpenChange={(open) => {
          if (!open) { setContractModalOpen(false); setContractAccepted(false); }
        }}>
          <DialogContent className="max-w-3xl bg-slate-900 border-emerald-500/30 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Contrato de Locação — Leitura Obrigatória
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh] pr-4">
              {contractModalBooking && (
                <div className="text-sm">
                  <RentalContract
                    vehicleModel={contractModalBooking.vehicleName || 'Veículo'}
                    vehicleYear={String(contractModalBooking.vehicleYear || '')}
                    vehiclePlate={contractModalBooking.vehiclePlate || ''}
                    vehicleColor={contractModalBooking.vehicleColor || ''}
                    vehicleCity={contractModalBooking.vehicleCity || ''}
                    vehicleState={contractModalBooking.vehicleState || ''}
                    startDate={contractModalBooking.startDate ? new Date(contractModalBooking.startDate).toLocaleDateString('pt-BR') : ''}
                    endDate={contractModalBooking.endDate ? new Date(contractModalBooking.endDate).toLocaleDateString('pt-BR') : ''}
                    dailyRate={contractModalBooking.dailyRate || '0'}
                    serviceFee={contractModalBooking.serviceFee || '0'}
                    securityDeposit={contractModalBooking.securityDeposit || '0'}
                    totalAmount={contractModalBooking.totalAmount || '0'}
                    dailyKmLimit={contractModalBooking.kmLimitPerDay || 200}
                    extraKmPrice={parseFloat(contractModalBooking.kmExtraPrice || '0.5')}
                    renterName={contractModalBooking.renterFullName || 'Locatário'}
                    renterCpf={contractModalBooking.renterCpf || ''}
                    renterCnh={contractModalBooking.renterCnhNumber || ''}
                    renterCnhCategory={contractModalBooking.renterCnhCategory || ''}
                    renterEmail={contractModalBooking.renterEmail || ''}
                    renterPhone={contractModalBooking.renterPhone || ''}
                    ownerName={user?.name || ''}
                    ownerCpf={user?.cpf || ''}
                    ownerPhone={user?.phone || ''}
                    ownerEmail={user?.email || ''}
                  />
                </div>
              )}
            </ScrollArea>
            <DialogFooter className="flex-col gap-3 sm:flex-col">
              <div className="flex items-start gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <Checkbox
                  id="host-contract-accept"
                  checked={contractAccepted}
                  onCheckedChange={(v) => setContractAccepted(!!v)}
                  className="mt-0.5 border-emerald-500 data-[state=checked]:bg-emerald-500"
                />
                <label htmlFor="host-contract-accept" className="text-sm text-gray-300 cursor-pointer leading-relaxed">
                  Li e aceito integralmente os termos deste Contrato de Locação. Estou ciente de que este aceite
                  eletrônico possui validade jurídica conforme a MP 2.200-2/2001 e o Marco Civil da Internet.
                </label>
              </div>
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1 border-slate-600 text-gray-400"
                  onClick={() => { setContractModalOpen(false); setContractAccepted(false); }}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50"
                  disabled={!contractAccepted || approveBookingMutation.isPending}
                  onClick={handleConfirmApproval}
                >
                  {approveBookingMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Aprovando...</>
                  ) : (
                    <><ShieldCheck className="w-4 h-4 mr-2" />Confirmar Aprovação</>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Hero - Ganhos */}
        <Card className="mb-8 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/30">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-emerald-400 font-medium mb-2">GANHOS TOTAIS</p>
                <h2 className="text-4xl font-bold text-white mb-2">
                  R$ {totalEarnings.toLocaleString("pt-BR")}
                </h2>
                <p className="text-gray-400">
                  {completedBookings.length} viagens completadas
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">+12% este mês</span>
                </div>
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                  Ver Relatório
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900/50 border-emerald-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Veículos Ativos</p>
                  <p className="text-2xl font-bold text-white">{myVehicles?.length || 0}</p>
                </div>
                <Car className="w-8 h-8 text-emerald-400/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-emerald-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Reservas Pendentes</p>
                  <p className="text-2xl font-bold text-white">{pendingBookings.length}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-emerald-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Taxa de Ocupação</p>
                  <p className="text-2xl font-bold text-white">{occupancyRate}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-emerald-400/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-emerald-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Avaliação Média</p>
                  <p className="text-2xl font-bold text-white">{overviewAvgRating ?? "—"}</p>
                </div>
                <Users className="w-8 h-8 text-emerald-400/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reservas Pendentes */}
        <Card className="bg-slate-900/50 border-emerald-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                Reservas Pendentes de Aprovação
              </span>
              <span className="text-lg text-yellow-400">{pendingBookings.length}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBookings ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              </div>
            ) : pendingBookings.length > 0 ? (
              <div className="space-y-3">
                {pendingBookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-emerald-500/10 hover:border-emerald-500/30 transition"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-white">
                        Veículo #{booking.vehicleId}
                      </p>
                      <p className="text-sm text-gray-400">
                        {format(new Date(booking.startDate), "dd MMM", { locale: ptBR })} -{" "}
                        {format(new Date(booking.endDate), "dd MMM", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                        onClick={() => approveBookingMutation.mutate({ id: booking.id })}
                        disabled={approveBookingMutation.isPending}
                      >
                        {approveBookingMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Aprovar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                        onClick={() => rejectBookingMutation.mutate({ id: booking.id })}
                        disabled={rejectBookingMutation.isPending}
                      >
                        {rejectBookingMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Rejeitar"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">Nenhuma reserva pendente</p>
            )}
          </CardContent>
        </Card>
      </HostDashboardLayout>
    );
  }

  // ==================== MEUS VEÍCULOS ====================
  if (section === "vehicles") {
    const cars = myVehicles?.filter((v: any) => v.vehicleType !== "motorcycle") || [];
    const motorcycles = myVehicles?.filter((v: any) => v.vehicleType === "motorcycle") || [];

    return (
      <HostDashboardLayout activeSection={section}>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-2xl font-bold text-white">Minha Frota</h2>
            <div className="flex gap-2">
              <Button 
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={() => navigate('/host/add-vehicle')}
              >
                <Car className="w-4 h-4 mr-2" />
                Adicionar Carro
              </Button>
              <Button 
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
                onClick={() => navigate('/host/add-motorcycle')}
              >
                <Bike className="w-4 h-4 mr-2" />
                Adicionar Moto
              </Button>
            </div>
          </div>

          {loadingVehicles ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          ) : (
            <>
              {/* Carros */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Car className="h-5 w-5 text-emerald-400" />
                  Carros ({cars.length})
                </h3>
                {cars.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cars.map((vehicle: any) => (
                      <VehicleCard
                        key={vehicle.id}
                        vehicle={vehicle}
                        onView={() => navigate(`/vehicles/${vehicle.id}`)}
                        onEdit={() => navigate(`/host/vehicles/${vehicle.id}/edit`)}
                        onDelete={() => handleDeleteVehicle(vehicle.id)}
                        iconColor="emerald"
                        icon={<Car className="w-16 h-16 text-emerald-400/30" />}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="bg-slate-900/50 border-emerald-500/20">
                    <CardContent className="p-8 text-center">
                      <Car className="w-10 h-10 text-emerald-400/50 mx-auto mb-3" />
                      <p className="text-gray-400 mb-4">Nenhum carro cadastrado</p>
                      <Button
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                        onClick={() => navigate('/host/add-vehicle')}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Carro
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Motos */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Bike className="h-5 w-5 text-cyan-400" />
                  Motos ({motorcycles.length})
                </h3>
                {motorcycles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {motorcycles.map((vehicle: any) => (
                      <VehicleCard
                        key={vehicle.id}
                        vehicle={vehicle}
                        onView={() => navigate(`/motorcycles/${vehicle.id}`)}
                        onEdit={() => navigate(`/host/vehicles/${vehicle.id}/edit`)}
                        onDelete={() => handleDeleteVehicle(vehicle.id)}
                        iconColor="cyan"
                        icon={<Bike className="w-16 h-16 text-cyan-400/30" />}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="bg-slate-900/50 border-cyan-500/20">
                    <CardContent className="p-8 text-center">
                      <Bike className="w-10 h-10 text-cyan-400/50 mx-auto mb-3" />
                      <p className="text-gray-400 mb-4">Nenhuma moto cadastrada</p>
                      <Button
                        className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
                        onClick={() => navigate('/host/add-motorcycle')}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Moto
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </div>
        {/* Delete confirmation dialog */}
        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="Deletar veículo?"
          description="Esta ação não pode ser desfeita. O veículo será permanentemente removido."
          confirmLabel="Deletar"
          confirmVariant="destructive"
          onConfirm={handleConfirmDelete}
        />
      </HostDashboardLayout>
    );
  }

  // ==================== RESERVAS PENDENTES ====================
  if (section === "bookings") {
    const pendingBookings = hostBookings?.filter((b) => b.status === "pending_host_approval") || [];
    
    return (
      <HostDashboardLayout activeSection={section}>
        <Card className="bg-slate-900/50 border-emerald-500/20">
          <CardHeader>
            <CardTitle className="text-white">Reservas Pendentes de Aprovação</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBookings ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              </div>
            ) : pendingBookings.length > 0 ? (
              <div className="space-y-3">
                {pendingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 bg-slate-800/50 rounded-lg border border-emerald-500/10 hover:border-emerald-500/30 transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-white">Veículo #{booking.vehicleId}</p>
                        <p className="text-sm text-gray-400">ID Reserva: {booking.id}</p>
                      </div>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        Aguardando sua aprovação
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-400 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Data Início</p>
                        <p>{format(new Date(booking.startDate), "dd/MM/yyyy", { locale: ptBR })}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Data Fim</p>
                        <p>{format(new Date(booking.endDate), "dd/MM/yyyy", { locale: ptBR })}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Local Retirada</p>
                        <p>{booking.pickupLocation}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Valor Total</p>
                        <p className="text-emerald-400 font-medium">R$ {booking.totalAmount}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={() => openContractModal(booking)}
                        disabled={approveBookingMutation.isPending}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Ler Contrato e Aprovar
                      </Button>
                      <Button
                        onClick={() => rejectBookingMutation.mutate({ id: booking.id })}
                        disabled={rejectBookingMutation.isPending}
                        variant="outline"
                        className="flex-1 text-red-400 border-red-500/30 hover:bg-red-500/10"
                      >
                        {rejectBookingMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          "Rejeitar Pedido"
                        )}
                      </Button>
                      {booking.contractPdfUrl && (
                        <Button
                          variant="outline"
                          className="text-purple-400 border-purple-500/30 hover:bg-purple-500/10"
                          onClick={() => {
                            window.open(booking.contractPdfUrl!, '_blank');
                            toast.success('Contrato aberto em nova aba');
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Ver Contrato PDF
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
             ) : (
              <p className="text-gray-400 text-center py-8">Nenhuma reserva pendente de aprovação</p>
            )}
          </CardContent>
        </Card>

        {/* Todas as Reservas */}
        <Card className="bg-slate-900/50 border-slate-700/50 mt-6">
          <CardHeader>
            <CardTitle className="text-white">Todas as Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBookings ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              </div>
            ) : hostBookings && hostBookings.length > 0 ? (
              <div className="space-y-3">
                {hostBookings.map((booking) => {
                  const statusLabels: Record<string, { label: string; color: string }> = {
                    pending_host_approval: { label: "Aguardando aprovação", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
                    pending_payment: { label: "Aguardando pagamento", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
                    payment_failed: { label: "Pagamento recusado", color: "bg-red-500/20 text-red-400 border-red-500/30" },
                    confirmed: { label: "Confirmado", color: "bg-green-500/20 text-green-400 border-green-500/30" },
                    in_progress: { label: "Em andamento", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
                    completed: { label: "Concluído", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
                    cancelled_by_renter: { label: "Cancelado pelo locatário", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
                    cancelled_by_host: { label: "Cancelado por você", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
                    pending: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
                  };
                  const statusInfo = statusLabels[booking.status] || { label: booking.status, color: "bg-gray-500/20 text-gray-400" };
                  return (
                    <div
                      key={booking.id}
                      className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/30 hover:border-slate-600/50 transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-white">Veículo #{booking.vehicleId}</p>
                          <p className="text-xs text-gray-500">Reserva #RDY-{String(booking.id).padStart(6, '0')}</p>
                        </div>
                        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-400">
                        <div>
                          <p className="text-xs text-gray-500">Início</p>
                          <p>{format(new Date(booking.startDate), "dd/MM/yyyy", { locale: ptBR })}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Fim</p>
                          <p>{format(new Date(booking.endDate), "dd/MM/yyyy", { locale: ptBR })}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Locatário ID</p>
                          <p>#{booking.renterId}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Valor Total</p>
                          <p className="text-emerald-400 font-medium">R$ {booking.totalAmount}</p>
                        </div>
                      </div>
                      {booking.contractPdfUrl && (
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-purple-400 border-purple-500/30 hover:bg-purple-500/10"
                            onClick={() => {
                              window.open(booking.contractPdfUrl!, '_blank');
                              toast.success('Contrato aberto em nova aba');
                            }}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Ver Contrato PDF
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">Nenhuma reserva encontrada</p>
            )}
          </CardContent>
        </Card>
      </HostDashboardLayout>
    );
  }
  // ==================== CALENDÁRIO ====================
  if (section === "calendar") {
    return (
      <HostDashboardLayout activeSection={section}>
        <CalendarSection myVehicles={myVehicles} loadingVehicles={loadingVehicles} />
      </HostDashboardLayout>
    );
  }

  // ==================== AVALIAÇÕES ====================
  if (section === "reviews") {
    return (
      <HostDashboardLayout activeSection={section}>
        <ReviewsSection />
      </HostDashboardLayout>
    );
  }

  // ==================== DOCUMENTOS ====================
  if (section === "documents") {
    return (
      <HostDashboardLayout activeSection={section}>
        <DocumentsSection />
      </HostDashboardLayout>
    );
  }

  // ==================== RELATÓRIOS ====================
  if (section === "reports") {
    const completedBookings = hostBookings?.filter((b) => b.status === "completed") || [];
    const confirmedBookings = hostBookings?.filter((b) => b.status === "confirmed") || [];
    
    // Group earnings by month
    const earningsByMonth: Record<string, number> = {};
    completedBookings.forEach((booking) => {
      const monthKey = format(new Date(booking.createdAt), "MMMM yyyy", { locale: ptBR });
      const amount = parseFloat(String(booking.totalAmount) || "0");
      earningsByMonth[monthKey] = (earningsByMonth[monthKey] || 0) + amount;
    });
    
    // Get last 6 months
    const monthlyEarnings = Object.entries(earningsByMonth)
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .slice(0, 6);
    
    // Calculate occupancy rate
    const totalVehicles = myVehicles?.length || 0;
    const totalPossibleDays = totalVehicles * 30; // Last 30 days
    const totalBookedDays = confirmedBookings.reduce((acc, b) => {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return acc + days;
    }, 0);
    const occupancyRate = totalPossibleDays > 0 ? Math.round((totalBookedDays / totalPossibleDays) * 100) : 0;
    
    return (
      <HostDashboardLayout activeSection={section}>
        <div className="space-y-6">
          <Card className="bg-slate-900/50 border-emerald-500/20">
            <CardHeader>
              <CardTitle className="text-white">Ganhos Mensais</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingBookings ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                </div>
              ) : monthlyEarnings.length > 0 ? (
                <div className="space-y-3">
                  {monthlyEarnings.map(([month, amount]) => (
                    <div key={month} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-gray-400 capitalize">{month}</span>
                      <span className="text-emerald-400 font-medium">R$ {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-emerald-400/50 mx-auto mb-3" />
                  <p className="text-gray-400">Nenhum ganho registrado ainda</p>
                  <p className="text-sm text-gray-500 mt-2">Seus ganhos aparecerão aqui após viagens completadas</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-emerald-500/20">
            <CardHeader>
              <CardTitle className="text-white">Taxa de Ocupação</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingVehicles || loadingBookings ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                </div>
              ) : totalVehicles > 0 ? (
                <div className="text-center py-8">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="10"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="10"
                        strokeDasharray={`${occupancyRate * 2.51} 251.2`}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">{occupancyRate}%</span>
                    </div>
                  </div>
                  <p className="text-gray-400">Taxa de ocupação nos últimos 30 dias</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {totalBookedDays} de {totalPossibleDays} dias reservados
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-emerald-400/50 mx-auto mb-3" />
                  <p className="text-gray-400">Cadastre veículos para ver a taxa de ocupação</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </HostDashboardLayout>
    );
  }

  return null;
}

// ==================== VEHICLE CARD COMPONENT ====================
interface VehicleCardProps {
  vehicle: any;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  iconColor: "emerald" | "cyan";
  icon: React.ReactNode;
}

function VehicleCard({ vehicle, onView, onEdit, onDelete, iconColor, icon }: VehicleCardProps) {
  const borderColor = iconColor === "emerald" ? "border-emerald-500/20" : "border-cyan-500/20";
  const badgeBg = iconColor === "emerald" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
  const viewBtnColor = iconColor === "emerald" ? "text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10" : "text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10";

  return (
    <Card className={`bg-slate-900/50 ${borderColor} overflow-hidden`}>
      <div className={`h-40 bg-gradient-to-br ${iconColor === "emerald" ? "from-emerald-500/20" : "from-cyan-500/20"} to-slate-800/50 flex items-center justify-center relative`}>
        {vehicle.mainImageUrl ? (
          <img
                              loading="lazy" src={vehicle.mainImageUrl} alt={`${vehicle.brand} ${vehicle.model}`} className="w-full h-full object-cover" />
        ) : (
          icon
        )}
      </div>
      <CardContent className="p-4">
        <p className="font-medium text-white mb-1">
          {vehicle.brand} {vehicle.model}
        </p>
        <p className="text-sm text-gray-400 mb-3">{vehicle.year} · {vehicle.licensePlate}</p>
        <Badge className={`${badgeBg} mb-3`}>
          {vehicle.status === "active" ? "Ativo" : "Inativo"}
        </Badge>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className={`flex-1 ${viewBtnColor}`}
            onClick={onView}
          >
            <Eye className="w-4 h-4 mr-1" />
            Ver
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
            onClick={onEdit}
          >
            <Edit className="w-4 h-4 mr-1" />
            Editar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-400 border-red-500/30 hover:bg-red-500/10"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
