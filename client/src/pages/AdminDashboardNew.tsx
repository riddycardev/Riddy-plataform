/**
 * Admin Dashboard - "Central de Controle"
 * Dashboard exclusivo para Administrador
 * 7 seções: Overview, Documentos, Multas, Usuários, Veículos, Relatórios, Auditoria
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  TrendingUp,
  DollarSign,
  Calendar,
  Lock,
  Zap,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AdminVerificationPanel from "@/pages/AdminVerificationPanel";
import AdminGoals from "@/pages/AdminGoals";
import AdminLevelAnalytics from "@/pages/AdminLevelAnalytics";
import { toast } from "sonner";

export default function AdminDashboardNew() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();

  // Get section from URL params - read directly from location to trigger re-render
  const params = new URLSearchParams(window.location.search);
  const section = params.get("section") || "overview";

  // Force re-render when location changes
  useEffect(() => {
    // This effect runs whenever location changes
  }, [location]);

  // ── Rejection dialog state ────────────────────────────────────────────────────
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingVehicleId, setRejectingVehicleId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch real data
  const { data: stats, isLoading: loadingStats } = trpc.admin.getStats.useQuery();
  const { data: pendingDocuments, isLoading: loadingDocs } = trpc.admin.getPendingDocuments.useQuery();
  const { data: pendingVehicles, isLoading: loadingVehicles } = trpc.admin.getPendingVehicles.useQuery();
  const { data: recentFines, isLoading: loadingFines } = trpc.admin.getPendingFines.useQuery();
  const { data: allUsers, isLoading: loadingUsers } = trpc.admin.getAllUsers.useQuery();

  const utils = trpc.useUtils();

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const reviewDocumentMutation = trpc.admin.reviewDocument.useMutation({
    onSuccess: (_, variables) => {
      utils.admin.getPendingDocuments.invalidate();
      utils.admin.getStats.invalidate();
      if (variables.status === "approved") {
        toast.success("Documento aprovado com sucesso!");
      } else {
        toast.success("Documento rejeitado.");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao processar documento.");
    },
  });

  const approveVehicleMutation = trpc.admin.approveVehicle.useMutation({
    onSuccess: () => {
      utils.admin.getPendingVehicles.invalidate();
      utils.admin.getStats.invalidate();
      toast.success("Veículo aprovado! O proprietário foi notificado.");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao aprovar veículo.");
    },
  });

  const rejectVehicleMutation = trpc.admin.rejectVehicle.useMutation({
    onSuccess: () => {
      utils.admin.getPendingVehicles.invalidate();
      utils.admin.getStats.invalidate();
      setRejectDialogOpen(false);
      setRejectingVehicleId(null);
      setRejectionReason("");
      toast.success("Veículo rejeitado. O proprietário foi notificado.");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao rejeitar veículo.");
    },
  });

  const resolvFineMutation = trpc.admin.resolveFine.useMutation({
    onSuccess: () => {
      utils.admin.getPendingFines.invalidate();
      toast.success("Multa resolvida.");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao resolver multa.");
    },
  });

  // ── Rejection dialog handlers ─────────────────────────────────────────────────
  const openRejectDialog = (vehicleId: number) => {
    setRejectingVehicleId(vehicleId);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (!rejectingVehicleId) return;
    if (!rejectionReason.trim()) {
      toast.error("Por favor, informe o motivo da rejeição.");
      return;
    }
    rejectVehicleMutation.mutate({
      id: rejectingVehicleId,
      reason: rejectionReason.trim(),
    });
  };

  if (!user) {
    return (
      <AdminDashboardLayout activeSection={section}>
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
        </div>
      </AdminDashboardLayout>
    );
  }

  // ==================== OVERVIEW ====================
  if (section === "overview") {
    return (
      <AdminDashboardLayout activeSection={section}>
        {/* Rejection Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="bg-slate-900 border-red-500/30">
            <DialogHeader>
              <DialogTitle className="text-white">Rejeitar Veículo</DialogTitle>
              <DialogDescription className="text-gray-400">
                Informe o motivo da rejeição. O proprietário será notificado.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label className="text-gray-300">Motivo da rejeição *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Documentação incompleta, fotos de baixa qualidade, informações incorretas..."
                className="bg-slate-800 border-red-500/30 text-white placeholder:text-gray-500 min-h-[100px]"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRejectDialogOpen(false)}
                className="text-gray-400 border-gray-600"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmReject}
                disabled={rejectVehicleMutation.isPending || !rejectionReason.trim()}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {rejectVehicleMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Confirmar Rejeição
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Alert Banner */}
        <Card className="mb-8 bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/30">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-white mb-1">Alertas do Sistema</p>
                  <p className="text-sm text-gray-300">
                    {(pendingDocuments?.length || 0) + (pendingVehicles?.length || 0)} itens pendentes de aprovação
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900/50 border-red-500/20">
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{loadingStats ? "..." : stats?.totalUsers || 0}</p>
              <p className="text-xs text-gray-400">Usuários</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-red-500/20">
            <CardContent className="p-4 text-center">
              <Car className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{loadingStats ? "..." : stats?.activeVehicles || 0}</p>
              <p className="text-xs text-gray-400">Veículos Ativos</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-red-500/20">
            <CardContent className="p-4 text-center">
              <FileText className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{loadingStats ? "..." : stats?.pendingDocuments || 0}</p>
              <p className="text-xs text-gray-400">Docs Pendentes</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-red-500/20">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{loadingStats ? "..." : stats?.pendingFines || 0}</p>
              <p className="text-xs text-gray-400">Multas Pendentes</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Vehicles Quick Actions */}
        <Card className="bg-slate-900/50 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-400" />
              Veículos Pendentes de Aprovação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingVehicles ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
              </div>
            ) : pendingVehicles && pendingVehicles.length > 0 ? (
              <div className="space-y-3">
                {pendingVehicles.slice(0, 5).map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-red-500/10 hover:border-red-500/30 transition"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-white">
                        {vehicle.brand} {vehicle.model}
                      </p>
                      <p className="text-sm text-gray-400">{vehicle.licensePlate} • Proprietário ID: {vehicle.hostId}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => approveVehicleMutation.mutate({ id: vehicle.id })}
                        disabled={approveVehicleMutation.isPending}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        {approveVehicleMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        )}
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openRejectDialog(vehicle.id)}
                        disabled={rejectVehicleMutation.isPending}
                        variant="outline"
                        className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">Nenhum veículo pendente</p>
            )}
          </CardContent>
        </Card>
      </AdminDashboardLayout>
    );
  }

  // ==================== DOCUMENTOS ====================
  if (section === "documents") {
    return (
      <AdminDashboardLayout activeSection={section}>
        <Card className="bg-slate-900/50 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-white">Fila de Aprovação de Documentos</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDocs ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
              </div>
            ) : pendingDocuments && pendingDocuments.length > 0 ? (
              <div className="space-y-3">
                {pendingDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 bg-slate-800/50 rounded-lg border border-red-500/10 hover:border-red-500/30 transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-white">Documento #{doc.id}</p>
                        <p className="text-sm text-gray-400">Usuário ID: {doc.userId}</p>
                      </div>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        Pendente
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                        disabled={reviewDocumentMutation.isPending}
                        onClick={() => reviewDocumentMutation.mutate({ id: doc.id, status: "approved" })}
                      >
                        {reviewDocumentMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Aprovar
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 text-red-400 border-red-500/30 hover:bg-red-500/10"
                        disabled={reviewDocumentMutation.isPending}
                        onClick={() => reviewDocumentMutation.mutate({ id: doc.id, status: "rejected", rejectionReason: "Documento inválido ou ilegível" })}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejeitar
                      </Button>
                      {(doc as any).documentUrl && (
                        <Button
                          variant="outline"
                          className="flex-1 text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
                          onClick={() => window.open((doc as any).documentUrl, "_blank")}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">Nenhum documento pendente</p>
            )}
          </CardContent>
        </Card>
      </AdminDashboardLayout>
    );
  }

  // ==================== MULTAS & DISPUTES ====================
  if (section === "fines") {
    return (
      <AdminDashboardLayout activeSection={section}>
        <Card className="bg-slate-900/50 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Multas e Disputes Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingFines ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
              </div>
            ) : recentFines && recentFines.length > 0 ? (
              <div className="space-y-3">
                {recentFines.map((fine) => (
                  <div
                    key={fine.id}
                    className="p-4 bg-slate-800/50 rounded-lg border border-red-500/10 hover:border-red-500/30 transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-white">Multa #{fine.id}</p>
                        <p className="text-sm text-gray-400">Reserva ID: {fine.bookingId}</p>
                      </div>
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                        R$ {fine.amount}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{fine.fineType}</p>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                        disabled={resolvFineMutation.isPending}
                        onClick={() => resolvFineMutation.mutate({ id: fine.id, resolution: "accepted" })}
                      >
                        Confirmar
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10"
                        disabled={resolvFineMutation.isPending}
                        onClick={() => resolvFineMutation.mutate({ id: fine.id, resolution: "waived" })}
                      >
                        Contestar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">Nenhuma multa pendente</p>
            )}
          </CardContent>
        </Card>
      </AdminDashboardLayout>
    );
  }

  // ==================== USUÁRIOS ====================
  if (section === "users") {
    return (
      <AdminDashboardLayout activeSection={section}>
        <Card className="bg-slate-900/50 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-white">Gestão de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
              </div>
            ) : allUsers && allUsers.length > 0 ? (
              <div className="space-y-3">
                {allUsers.slice(0, 10).map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-red-500/10 hover:border-red-500/30 transition"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-white">{u.name}</p>
                      <p className="text-sm text-gray-400">{u.email} • {u.role}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-blue-400 border-blue-500/30">
                        Ver Perfil
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-400 border-red-500/30 hover:bg-red-500/10">
                        <Lock className="w-4 h-4 mr-1" />
                        Suspender
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">Nenhum usuário encontrado</p>
            )}
          </CardContent>
        </Card>
      </AdminDashboardLayout>
    );
  }

  // ==================== VEÍCULOS ====================
  if (section === "vehicles") {
    return (
      <AdminDashboardLayout activeSection={section}>
        {/* Rejection Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="bg-slate-900 border-red-500/30">
            <DialogHeader>
              <DialogTitle className="text-white">Rejeitar Veículo</DialogTitle>
              <DialogDescription className="text-gray-400">
                Informe o motivo da rejeição. O proprietário será notificado com esta mensagem.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label className="text-gray-300">Motivo da rejeição *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Documentação incompleta, fotos de baixa qualidade, informações incorretas..."
                className="bg-slate-800 border-red-500/30 text-white placeholder:text-gray-500 min-h-[100px]"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRejectDialogOpen(false)}
                className="text-gray-400 border-gray-600"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmReject}
                disabled={rejectVehicleMutation.isPending || !rejectionReason.trim()}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {rejectVehicleMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Confirmar Rejeição
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="bg-slate-900/50 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-white">Aprovação de Veículos</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingVehicles ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
              </div>
            ) : pendingVehicles && pendingVehicles.length > 0 ? (
              <div className="space-y-3">
                {pendingVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="p-4 bg-slate-800/50 rounded-lg border border-red-500/10 hover:border-red-500/30 transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                          {(vehicle as any).vehicleType === 'motorcycle' ? (
                            <Bike className="w-5 h-5 text-cyan-400" />
                          ) : (
                            <Car className="w-5 h-5 text-blue-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white">
                              {vehicle.brand} {vehicle.model}
                            </p>
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                              (vehicle as any).vehicleType === 'motorcycle'
                                ? 'bg-cyan-500/20 text-cyan-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {(vehicle as any).vehicleType === 'motorcycle' ? '🏍️ Moto' : '🚗 Carro'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">{vehicle.licensePlate} • Proprietário ID: {vehicle.hostId}</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        {vehicle.year}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => approveVehicleMutation.mutate({ id: vehicle.id })}
                        disabled={approveVehicleMutation.isPending || rejectVehicleMutation.isPending}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                      >
                        {approveVehicleMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        {approveVehicleMutation.isPending ? "Aprovando..." : "Aprovar"}
                      </Button>
                      <Button
                        onClick={() => openRejectDialog(vehicle.id)}
                        disabled={approveVehicleMutation.isPending || rejectVehicleMutation.isPending}
                        variant="outline"
                        className="flex-1 text-red-400 border-red-500/30 hover:bg-red-500/10"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">Nenhum veículo pendente</p>
            )}
          </CardContent>
        </Card>
      </AdminDashboardLayout>
    );
  }

  // ==================== RELATÓRIOS ====================
  if (section === "reports") {
    // Get all payments to calculate platform revenue
    const { data: allPayments, isLoading: loadingPayments } = trpc.payment.getMyPayments.useQuery();

    // Group revenue by month (platform takes a commission from each payment)
    const revenueByMonth: Record<string, number> = {};
    allPayments?.forEach((payment) => {
      if (payment.status === "completed") {
        const monthKey = format(new Date(payment.createdAt), "MMMM yyyy", { locale: ptBR });
        const amount = parseFloat(String(payment.amount) || "0");
        // Platform takes 10% commission
        const commission = amount * 0.10;
        revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + commission;
      }
    });

    // Get last 6 months
    const monthlyRevenue = Object.entries(revenueByMonth)
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .slice(0, 6);

    return (
      <AdminDashboardLayout activeSection={section}>
        <div className="space-y-6">
          <Card className="bg-slate-900/50 border-red-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                Receita da Plataforma (Comissão 10%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPayments ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
                </div>
              ) : monthlyRevenue.length > 0 ? (
                <div className="space-y-3">
                  {monthlyRevenue.map(([month, amount]) => (
                    <div key={month} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-gray-400 capitalize">{month}</span>
                      <span className="text-green-400 font-medium">R$ {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-red-400/50 mx-auto mb-3" />
                  <p className="text-gray-400">Nenhuma receita registrada ainda</p>
                  <p className="text-sm text-gray-500 mt-2">A receita da plataforma aparecerá aqui</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-red-500/20">
            <CardHeader>
              <CardTitle className="text-white">Atividade da Plataforma</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
                    <p className="text-sm text-gray-400 mt-1">Usuários</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-white">{stats?.activeVehicles || 0}</p>
                    <p className="text-sm text-gray-400 mt-1">Veículos Ativos</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-white">{stats?.pendingFines || 0}</p>
                    <p className="text-sm text-gray-400 mt-1">Multas Pendentes</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-white">{stats?.pendingDocuments || 0}</p>
                    <p className="text-sm text-gray-400 mt-1">Docs Pendentes</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminDashboardLayout>
    );
  }

  // ==================== VERIFICAÇÃO DE IDENTIDADE ====================
  if (section === "verification") {
    return (
      <AdminDashboardLayout activeSection={section}>
        <Card className="bg-slate-900/50 border-cyan-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Verificação de Identidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdminVerificationPanel />
          </CardContent>
        </Card>
      </AdminDashboardLayout>
    );
  }

  // ==================== AUDITORIA ====================
  if (section === "audit") {
    return (
      <AdminDashboardLayout activeSection={section}>
        <Card className="bg-slate-900/50 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Log de Auditoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Zap className="w-12 h-12 text-red-400/50 mx-auto mb-3" />
              <p className="text-gray-400 mb-2">Log de auditoria</p>
              <p className="text-sm text-gray-500">Todas as ações de administradores serão registradas aqui</p>
              <p className="text-xs text-gray-600 mt-4">Funcionalidade em desenvolvimento</p>
            </div>
          </CardContent>
        </Card>
      </AdminDashboardLayout>
    );
  }

  if (section === "riddy-care") {
    return <AdminRiddyCareSection />;
  }

  if (section === "goals") {
    return <AdminGoals />;
  }

  if (section === "level-analytics") {
    return <AdminLevelAnalytics />;
  }

  return null;
}

// ─── Painel Riddy Suporte Admin ────────────────────────────────────────────────
function AdminRiddyCareSection() {
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [filterStatus, setFilterStatus] = useState<"open" | "in_progress" | "waiting_user" | "resolved" | "closed" | "all">("open");
  const [filterPriority, setFilterPriority] = useState<"all" | "P0" | "P1" | "P2" | "P3" | "P4">("all");

  const { data: tickets, refetch } = trpc.support.adminListTickets.useQuery({
    status: filterStatus === "all" ? undefined : filterStatus as "open" | "in_progress" | "waiting_user" | "resolved" | "closed",
    priority: filterPriority === "all" ? undefined : filterPriority as "P0" | "P1" | "P2" | "P3" | "P4",
    limit: 50,
  });

  const { data: ticketDetail, refetch: refetchDetail } = trpc.support.getTicket.useQuery(
    { ticketId: selectedTicketId! },
    { enabled: !!selectedTicketId }
  );

  const replyMutation = trpc.support.adminReply.useMutation({
    onSuccess: () => {
      setReplyContent("");
      refetchDetail();
      toast.success("Resposta enviada");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateStatus = trpc.support.adminUpdateTicket.useMutation({
    onSuccess: () => { refetch(); refetchDetail(); toast.success("Status atualizado"); },
    onError: (err) => toast.error(err.message),
  });

  const PRIORITY_COLORS: Record<string, string> = {
    P0: "bg-red-500/20 text-red-400 border-red-500/30",
    P1: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    P2: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    P3: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    P4: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  const PRIORITY_LABELS: Record<string, string> = {
    P0: "Emergência", P1: "Alta", P2: "Média", P3: "Normal", P4: "Baixa",
  };
  const STATUS_LABELS: Record<string, string> = {
    open: "Aberto", in_progress: "Em andamento", waiting_user: "Aguardando usuário",
    resolved: "Resolvido", closed: "Encerrado",
  };

  return (
    <AdminDashboardLayout activeSection="riddy-care">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">🎧</span> Riddy Suporte — Operações
          </h2>
          <Badge variant="secondary">{tickets?.total || 0} tickets</Badge>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          {["all", "open", "in_progress", "waiting_user", "resolved", "closed"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s as "open" | "in_progress" | "waiting_user" | "resolved" | "closed" | "all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === s
                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                  : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
              }`}
            >
              {STATUS_LABELS[s] || "Todos"}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            {["all", "P0", "P1", "P2", "P3"].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p as "all" | "P0" | "P1" | "P2" | "P3" | "P4")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterPriority === p
                    ? "bg-red-500/20 text-red-300 border border-red-500/30"
                    : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                }`}
              >
                {p === "all" ? "Todas" : PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Lista de tickets */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {!tickets || tickets.tickets.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Nenhum ticket encontrado</p>
              </div>
            ) : (
              tickets.tickets.map((t) => (
                <button
                  key={t.ticket.id}
                  onClick={() => setSelectedTicketId(t.ticket.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedTicketId === t.ticket.id
                      ? "bg-red-500/10 border-red-500/30"
                      : "bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white text-xs font-mono">#{t.ticket.ticketNumber}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[t.ticket.priority] || PRIORITY_COLORS.P4}`}>
                          {PRIORITY_LABELS[t.ticket.priority] || t.ticket.priority}
                        </span>
                        {t.ticket.escalatedToHuman && (
                          <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">Humano</span>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm mt-1 truncate">{t.ticket.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {t.ticket.category} · {t.userName || t.userEmail || `#${t.ticket.userId}`} · {new Date(t.ticket.updatedAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{STATUS_LABELS[t.ticket.status] || t.ticket.status}</Badge>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Detalhe do ticket */}
          {selectedTicketId && ticketDetail ? (
            <Card className="bg-slate-900/50 border-red-500/20">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-white text-base">#{ticketDetail.ticket.ticketNumber} — {ticketDetail.ticket.title}</CardTitle>
                    <p className="text-gray-500 text-xs mt-1">{ticketDetail.ticket.category} · Usuário #{ticketDetail.ticket.userId}</p>
                  </div>
                  <div className="flex gap-2">
                    {["in_progress", "resolved", "closed"].map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus.mutate({ ticketId: selectedTicketId, status: s as "open" | "in_progress" | "waiting_user" | "resolved" | "closed" })}
                        className="text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-colors"
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Feed de mensagens */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {ticketDetail.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-xl text-sm ${
                        msg.senderType === "user"
                          ? "bg-white/5 border border-white/10 text-gray-200"
                          : msg.senderType === "ai"
                          ? "bg-blue-500/10 border border-blue-500/20 text-blue-200"
                          : "bg-red-500/10 border border-red-500/20 text-red-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium opacity-70">
                          {msg.senderType === "user" ? "👤 Usuário" : msg.senderType === "ai" ? "🤖 IA" : "🎧 Agente"}
                        </span>
                        <span className="text-xs opacity-40">
                          {new Date(msg.createdAt).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))}
                </div>

                {/* Resposta do agente */}
                <div className="space-y-2">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Escreva sua resposta como agente Riddy Suporte..."
                    rows={3}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none"
                  />
                  <Button
                    onClick={() => replyMutation.mutate({ ticketId: selectedTicketId, content: replyContent })}
                    disabled={!replyContent.trim() || replyMutation.isPending}
                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                  >
                    {replyMutation.isPending ? "Enviando..." : "Enviar resposta"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-600">
              <p>Selecione um ticket para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>
    </AdminDashboardLayout>
  );
}
