/**
 * Admin Dashboard Page
 * Administrative panel for platform management - DADOS REAIS
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSearch } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import VehicleDetailsModal from "@/components/VehicleDetailsModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Car, 
  Bike,
  FileText, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Shield,
  Loader2,
  Calendar,
  DollarSign
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminDashboard() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const sectionParam = searchParams.get('section');
  const [activeTab, setActiveTab] = useState(sectionParam || "overview");
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [vehicleToReject, setVehicleToReject] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Fetch real admin statistics
  const { data: stats, isLoading: loadingStats } = trpc.admin.getStats.useQuery();
  const { data: pendingDocuments, isLoading: loadingDocs } = trpc.admin.getPendingDocuments.useQuery();
  const { data: pendingVehicles, isLoading: loadingVehicles } = trpc.admin.getPendingVehicles.useQuery();
  const { data: recentFines, isLoading: loadingFines } = trpc.admin.getPendingFines.useQuery();
  const { data: allUsers, isLoading: loadingUsers } = trpc.admin.getAllUsers.useQuery();
  const { data: allVehicles, isLoading: loadingAllVehicles } = trpc.admin.getPendingVehicles.useQuery();

  // Queries
  const { data: allBookings, isLoading: loadingBookings } = trpc.booking.adminList.useQuery();

  // Mutations
  const reviewDocMutation = trpc.admin.reviewDocument.useMutation();
  const approveVehicleMutation = trpc.admin.approveVehicle.useMutation();
  const rejectVehicleMutation = trpc.admin.rejectVehicle.useMutation();
  const isLoading = loadingStats || loadingDocs || loadingVehicles || loadingFines;

  // Calculate stats from real data
  const adminStats = [
    { 
      label: "Usuários Totais", 
      value: stats?.totalUsers?.toString() || "0", 
      icon: Users, 
      trend: "" 
    },
    { 
      label: "Veículos Ativos", 
      value: stats?.activeVehicles?.toString() || "0", 
      icon: Car, 
      trend: "" 
    },
    { 
      label: "Documentos Pendentes", 
      value: pendingDocuments?.length?.toString() || "0", 
      icon: FileText, 
      trend: "" 
    },
    { 
      label: "Reservas Ativas", 
      value: "0", 
      icon: Calendar, 
      trend: "" 
    }
  ];

  const handleApproveDocument = async (docId: number) => {
    try {
      await reviewDocMutation.mutateAsync({ id: docId, status: "approved" });
    } catch (error) {
      console.error("Failed to approve document:", error);
    }
  };

  const handleRejectDocument = async (docId: number) => {
    try {
      await reviewDocMutation.mutateAsync({ id: docId, status: "rejected" });
    } catch (error) {
      console.error("Failed to reject document:", error);
    }
  };

  const handleApproveVehicle = async (vehicleId: number) => {
    try {
      await approveVehicleMutation.mutateAsync({ id: vehicleId });
      toast.success("Veículo aprovado com sucesso!");
      utils.admin.getPendingVehicles.invalidate();
      utils.admin.getStats.invalidate();
    } catch (error: any) {
      console.error("Failed to approve vehicle:", error);
      toast.error(`Erro ao aprovar veículo: ${error.message || "Erro desconhecido"}`);
    }
  };

  const handleRejectVehicle = (vehicleId: number) => {
    setVehicleToReject(vehicleId);
    setRejectReason("");
    setRejectConfirmOpen(true);
  };

  const handleConfirmRejectVehicle = async () => {
    if (vehicleToReject === null) return;
    if (!rejectReason.trim()) {
      toast.error("Motivo da rejeição é obrigatório.");
      return;
    }
    try {
      await rejectVehicleMutation.mutateAsync({ id: vehicleToReject, reason: rejectReason.trim() });
      toast.success("Veículo rejeitado.");
      setRejectConfirmOpen(false);
      setVehicleToReject(null);
      utils.admin.getPendingVehicles.invalidate();
      utils.admin.getStats.invalidate();
    } catch (error: any) {
      console.error("Failed to reject vehicle:", error);
      toast.error(`Erro ao rejeitar veículo: ${error.message || "Erro desconhecido"}`);
    }
  };
  
  const handleViewVehicleDetails = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-display font-bold text-white">
                Painel Administrativo
              </h1>
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </Badge>
            </div>
            <p className="text-gray-400">
              Gerencie usuários, veículos, documentos e disputas da plataforma.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {adminStats.map((stat, index) => (
            <Card key={index} className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  {stat.trend && (
                    <span className={`text-sm font-medium ${stat.trend.startsWith("+") ? "text-green-400" : stat.trend.startsWith("-") ? "text-red-400" : "text-gray-400"}`}>
                      {stat.trend}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black">
              Documentos
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black">
              Veículos
            </TabsTrigger>
            <TabsTrigger value="fines" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black">
              Multas
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black">
              Usuários
            </TabsTrigger>
            <TabsTrigger value="bookings" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black">
              Reservas
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Pending Documents */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-yellow-400" />
                    Documentos Pendentes ({pendingDocuments?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingDocuments && pendingDocuments.length > 0 ? (
                    <div className="space-y-3">
                      {pendingDocuments.slice(0, 5).map((doc: any) => (
                        <div 
                          key={doc.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                        >
                          <div>
                            <p className="font-medium text-white">{doc.userName || "Usuário"}</p>
                            <p className="text-sm text-gray-400">
                              {doc.documentType} • {doc.createdAt ? format(new Date(doc.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : ""}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" className="text-cyan-400 hover:bg-cyan-500/20">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              className="bg-green-500 hover:bg-green-600 text-white"
                              onClick={() => handleApproveDocument(doc.id)}
                              disabled={reviewDocMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                              onClick={() => handleRejectDocument(doc.id)}
                              disabled={reviewDocMutation.isPending}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-4">
                      Nenhum documento pendente de revisão
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Pending Vehicles */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Car className="w-5 h-5 text-blue-400" />
                    Veículos Aguardando Aprovação ({pendingVehicles?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingVehicles && pendingVehicles.length > 0 ? (
                    <div className="space-y-3">
                      {pendingVehicles.slice(0, 5).map((vehicle: any) => (
                        <div 
                          key={vehicle.id}
                          className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all"
                        >
                          {/* Vehicle Thumbnail */}
                          <div className="w-24 h-16 rounded-lg bg-white/10 overflow-hidden flex-shrink-0 relative">
                            {vehicle.mainImageUrl ? (
                              <img
                              loading="lazy" 
                                src={vehicle.mainImageUrl} 
                                alt={`${vehicle.brand} ${vehicle.model}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                {vehicle.vehicleType === 'motorcycle' ? (
                                  <Bike className="w-8 h-8 text-cyan-400" />
                                ) : (
                                  <Car className="w-8 h-8 text-gray-500" />
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Vehicle Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-white text-lg truncate">
                                {vehicle.brand} {vehicle.model} {vehicle.year}
                              </p>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                                vehicle.vehicleType === 'motorcycle'
                                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              }`}>
                                {vehicle.vehicleType === 'motorcycle' ? '🏍️ Moto' : '🚗 Carro'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 truncate">
                              {vehicle.ownerName || "Proprietário"} • {vehicle.licensePlate || "Sem placa"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Cadastrado em: {vehicle.createdAt ? format(new Date(vehicle.createdAt), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}
                            </p>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                            <Button 
                              size="sm" 
                              className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                              onClick={() => handleViewVehicleDetails(vehicle)}
                              style={{ display: 'flex', minWidth: '80px' }}
                              data-testid="btn-ver-veiculo"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                            <Button 
                              size="sm" 
                              className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20"
                              onClick={() => handleApproveVehicle(vehicle.id)}
                              disabled={approveVehicleMutation.isPending || rejectVehicleMutation.isPending}
                            >
                              {approveVehicleMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Aprovar
                                </>
                              )}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              className="flex-1 sm:flex-none shadow-lg shadow-red-500/20"
                              onClick={() => handleRejectVehicle(vehicle.id)}
                              disabled={approveVehicleMutation.isPending || rejectVehicleMutation.isPending}
                            >
                              {rejectVehicleMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <>
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Rejeitar
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-4">
                      Nenhum veículo aguardando aprovação
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Fines */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  Multas Recentes ({recentFines?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentFines && recentFines.length > 0 ? (
                  <div className="space-y-3">
                    {recentFines.slice(0, 5).map((fine: any) => (
                      <div 
                        key={fine.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium text-white">Reserva #{fine.bookingId}</p>
                            <p className="text-sm text-gray-400">{fine.fineType} • {fine.userName || "Usuário"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-bold text-white">R$ {parseFloat(fine.amount || "0").toFixed(2)}</p>
                          <Badge className={
                            fine.status === "pending" 
                              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              : fine.status === "disputed"
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : "bg-green-500/20 text-green-400 border-green-500/30"
                          }>
                            {fine.status === "pending" ? "Pendente" : fine.status === "disputed" ? "Disputada" : "Paga"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">
                    Nenhuma multa registrada
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Gestão de Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingDocuments && pendingDocuments.length > 0 ? (
                  <div className="space-y-3">
                    {pendingDocuments.map((doc: any) => (
                      <div 
                        key={doc.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-white/5"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-yellow-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{doc.userName || "Usuário"}</p>
                            <p className="text-sm text-gray-400">
                              {doc.documentType} • {doc.createdAt ? format(new Date(doc.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="text-cyan-400 hover:bg-cyan-500/20">
                            <Eye className="w-4 h-4 mr-2" />
                            Ver
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-green-500 hover:bg-green-600 text-white"
                            onClick={() => handleApproveDocument(doc.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Aprovar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                            onClick={() => handleRejectDocument(doc.id)}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    Nenhum documento pendente de revisão
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles" className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Gestão de Veículos</CardTitle>
              </CardHeader>
              <CardContent>
                {allVehicles && allVehicles.length > 0 ? (
                  <div className="space-y-3">
                    {allVehicles.map((vehicle: any) => (
                      <div 
                        key={vehicle.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-white/5"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-12 rounded-lg bg-white/10 overflow-hidden">
                            {vehicle.mainImageUrl ? (
                              <img
                              loading="lazy" src={vehicle.mainImageUrl} alt={vehicle.model} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                {vehicle.vehicleType === 'motorcycle' ? (
                                  <Bike className="w-6 h-6 text-cyan-400" />
                                ) : (
                                  <Car className="w-6 h-6 text-gray-500" />
                                )}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white">
                                {vehicle.brand} {vehicle.model} {vehicle.year}
                              </p>
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                vehicle.vehicleType === 'motorcycle'
                                  ? 'bg-cyan-500/20 text-cyan-400'
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {vehicle.vehicleType === 'motorcycle' ? '🏍️ Moto' : '🚗 Carro'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400">
                              {vehicle.pickupCity}, {vehicle.pickupState} • R$ {parseFloat(vehicle.dailyPrice || "0").toFixed(2)}/dia
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={
                            vehicle.status === "approved" 
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : vehicle.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              : "bg-red-500/20 text-red-400 border-red-500/30"
                          }>
                            {vehicle.status === "approved" ? "Aprovado" : vehicle.status === "pending" ? "Pendente" : "Rejeitado"}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-cyan-400 hover:bg-cyan-500/20"
                            onClick={() => handleViewVehicleDetails(vehicle)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    Nenhum veículo cadastrado na plataforma
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fines Tab */}
          <TabsContent value="fines" className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Gestão de Multas e Disputas</CardTitle>
              </CardHeader>
              <CardContent>
                {recentFines && recentFines.length > 0 ? (
                  <div className="space-y-3">
                    {recentFines.map((fine: any) => (
                      <div 
                        key={fine.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-white/5"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-orange-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">Reserva #{fine.bookingId}</p>
                            <p className="text-sm text-gray-400">
                              {fine.fineType} • {fine.userName || "Usuário"} • {fine.createdAt ? format(new Date(fine.createdAt), "dd/MM/yyyy", { locale: ptBR }) : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-bold text-white text-lg">R$ {parseFloat(fine.amount || "0").toFixed(2)}</p>
                          <Badge className={
                            fine.status === "pending" 
                              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              : fine.status === "disputed"
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : "bg-green-500/20 text-green-400 border-green-500/30"
                          }>
                            {fine.status === "pending" ? "Pendente" : fine.status === "disputed" ? "Disputada" : "Paga"}
                          </Badge>
                          <Button size="sm" variant="ghost" className="text-cyan-400 hover:bg-cyan-500/20">
                            Detalhes
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    Nenhuma multa registrada
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Gestão de Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                {allUsers && allUsers.length > 0 ? (
                  <div className="space-y-3">
                    {allUsers.map((u: any) => (
                      <div 
                        key={u.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-white/5"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 flex-shrink-0 rounded-full bg-cyan-500/20 flex items-center justify-center overflow-hidden">
                            {u.avatarUrl ? (
                              <img
                              loading="lazy" src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              <Users className="w-6 h-6 text-cyan-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{u.name || "Usuário"}</p>
                            <p className="text-sm text-gray-400 truncate">
                              {u.email}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              • {u.role === "admin" ? "Admin" : "host" in u && u.host ? "host" : "user"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={
                            u.kycStatus === "approved" 
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : u.kycStatus === "pending"
                              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                          }>
                            {u.kycStatus === "approved" ? "Verificado" : u.kycStatus === "pending" ? "Pendente" : "Não verificado"}
                          </Badge>
                          <Button size="sm" variant="ghost" className="text-cyan-400 hover:bg-cyan-500/20">
                            Ver Perfil
                          </Button>
                          <Button size="sm" variant="destructive" className="text-red-400 hover:bg-red-500/20">
                            Suspender
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    Nenhum usuário cadastrado
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  Todas as Reservas ({allBookings?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingBookings ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  </div>
                ) : allBookings && allBookings.length > 0 ? (
                  <div className="space-y-3">
                    {allBookings.map((booking: any) => (
                      <div
                        key={booking.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-white/5"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-white">Reserva #{booking.id}</p>
                            <Badge className={
                              booking.status === 'confirmed' || booking.status === 'active'
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : booking.status === 'pending_payment' || booking.status === 'pending_approval'
                                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                : booking.status === 'completed'
                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                            }>
                              {booking.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">
                            {booking.vehicleName || 'Veículo'} • {booking.renterFullName || 'Locatário'}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {booking.startDate ? format(new Date(booking.startDate), "dd/MM/yyyy", { locale: ptBR }) : ''}
                            {' → '}
                            {booking.endDate ? format(new Date(booking.endDate), "dd/MM/yyyy", { locale: ptBR }) : ''}
                            {' • R$ '}{parseFloat(booking.totalAmount || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {booking.contractPdfUrl ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-cyan-400 hover:bg-cyan-500/20"
                              onClick={() => window.open(booking.contractPdfUrl, '_blank')}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Contrato
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-500">Sem contrato</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">Nenhuma reserva encontrada</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Vehicle Details Modal */}
      <VehicleDetailsModal
        vehicle={selectedVehicle}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onApprove={handleApproveVehicle}
        onReject={handleRejectVehicle}
        isApproving={approveVehicleMutation.isPending}
        isRejecting={rejectVehicleMutation.isPending}
      />

      {/* Reject Vehicle Dialog */}
      <ConfirmDialog
        open={rejectConfirmOpen}
        onOpenChange={(open) => {
          setRejectConfirmOpen(open);
          if (!open) setRejectReason("");
        }}
        title="Rejeitar veículo?"
        description={
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Esta ação notificará o proprietário. Informe o motivo:</p>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px]"
              placeholder="Motivo da rejeição (obrigatório)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
        }
        confirmLabel="Rejeitar"
        confirmVariant="destructive"
        onConfirm={handleConfirmRejectVehicle}
      />
    </DashboardLayout>
  );
}
