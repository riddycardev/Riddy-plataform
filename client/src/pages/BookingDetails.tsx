/**
 * Booking Details Page - RIDDY
 * Exibe todos os detalhes de uma reserva específica
 * Rota: /bookings/:id
 */

import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Car,
  CreditCard,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  QrCode,
  Receipt,
  Phone,
  MessageCircle,
  RefreshCw,
  Download,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ============================================================
// Status helpers
// ============================================================

function getStatusBadge(status: string) {
  switch (status) {
    case "confirmed":
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Confirmado</Badge>;
    case "pending":
    case "pending_payment":
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Aguardando Pagamento</Badge>;
    case "in_progress":
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Em Andamento</Badge>;
    case "completed":
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Concluído</Badge>;
    case "cancelled_by_renter":
    case "cancelled_by_host":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Cancelado</Badge>;
    case "disputed":
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Em Disputa</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getPaymentStatusBadge(status: string) {
  switch (status) {
    case "approved":
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Aprovado</Badge>;
    case "pending":
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendente</Badge>;
    case "rejected":
    case "cancelled":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Recusado</Badge>;
    case "refunded":
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Reembolsado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getPaymentMethodLabel(method: string) {
  switch (method) {
    case "credit_card":
      return "Cartão de Crédito";
    case "debit_card":
      return "Cartão de Débito";
    case "pix":
      return "PIX";
    case "bank_transfer":
      return "Transferência Bancária";
    default:
      return method;
  }
}

function getPaymentMethodIcon(method: string) {
  if (method === "pix") return <QrCode className="w-4 h-4" />;
  return <CreditCard className="w-4 h-4" />;
}

// ============================================================
// Main Component
// ============================================================

export default function BookingDetails() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const bookingId = parseInt(id || "0");

  const { data, isLoading, error, refetch } = trpc.booking.getById.useQuery(
    { id: bookingId },
    { enabled: !!bookingId && bookingId > 0 }
  );

  const cancelWithRefund = trpc.payment.cancelWithRefund.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      setShowCancelDialog(false);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao cancelar reserva");
    },
  });

  // Calculate refund preview based on hours until start
  function getRefundPreview(startDate: Date | string) {
    const now = new Date();
    const start = new Date(startDate);
    const hoursUntilStart = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilStart >= 48) return { pct: 100, label: "Reembolso total (100%)" };
    if (hoursUntilStart >= 24) return { pct: 50, label: "Reembolso parcial (50%)" };
    return { pct: 0, label: "Sem reembolso (menos de 24h)" };
  }

  // ============================================================
  // Loading / Error states
  // ============================================================

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Reserva não encontrada</h2>
          <p className="text-gray-400 mb-6">
            {error?.message || "A reserva que você está procurando não existe ou você não tem permissão para acessá-la."}
          </p>
          <Button
            className="bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-semibold"
            onClick={() => navigate("/my-bookings")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Minhas Reservas
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const booking = data;
  const vehicle = data.vehicle;
  const payments = data.payments || [];
  const fines = data.fines || [];

  const mainPayment = payments[0];

  // ============================================================
  // Render
  // ============================================================

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            className="text-gray-400 hover:text-white"
            onClick={() => navigate("/my-bookings")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Reserva #{booking.id.toString().padStart(6, "0")}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Criada em{" "}
              {format(new Date(booking.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <div className="ml-auto">{getStatusBadge(booking.status)}</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Info */}
            {vehicle && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Car className="w-5 h-5 text-cyan-400" />
                    Veículo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {vehicle.mainImageUrl ? (
                      <img
                        src={vehicle.mainImageUrl}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="w-32 h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-32 h-24 bg-gray-800 rounded-lg flex items-center justify-center">
                        <Car className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">
                        {vehicle.brand} {vehicle.model} {vehicle.year}
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">
                        {vehicle.color} · {vehicle.transmission} · {vehicle.fuelType}
                      </p>
                      <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {vehicle.pickupCity}, {vehicle.pickupState}
                      </p>
                      <p className="text-cyan-400 text-sm mt-2 font-medium">
                        Placa: {vehicle.licensePlate || "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Booking Dates */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  Período da Locação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Retirada</p>
                    <p className="text-white font-semibold">
                      {format(new Date(booking.startDate), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {booking.pickupLocation}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Devolução</p>
                    <p className="text-white font-semibold">
                      {format(new Date(booking.endDate), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {booking.returnLocation || booking.pickupLocation}
                    </p>
                  </div>
                </div>

                <Separator className="bg-white/10 my-4" />

                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm">
                    Duração: <span className="text-white font-medium">{booking.totalDays} dia{booking.totalDays !== 1 ? "s" : ""}</span>
                  </span>
                </div>

                {booking.dailyKmLimit && (
                  <div className="flex items-center gap-2 text-gray-400 mt-2">
                    <Car className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm">
                      Limite de km:{" "}
                      <span className="text-white font-medium">
                        {booking.dailyKmLimit} km/dia · R$ {parseFloat(booking.extraKmPrice || "0").toFixed(2)}/km extra
                      </span>
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Info */}
            {mainPayment && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-cyan-400" />
                    Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400">
                      {getPaymentMethodIcon(mainPayment.paymentMethod)}
                      <span>{getPaymentMethodLabel(mainPayment.paymentMethod)}</span>
                    </div>
                    {getPaymentStatusBadge(mainPayment.status)}
                  </div>

                  {mainPayment.mpPaymentId && mainPayment.paymentMethod === "credit_card" && (
                    <p className="text-gray-400 text-sm">
                      Pagamento processado via Mercado Pago
                    </p>
                  )}

                  {mainPayment.mpPaymentId && (
                    <p className="text-gray-500 text-xs font-mono">
                      ID Mercado Pago: {mainPayment.mpPaymentId}
                    </p>
                  )}

                  {mainPayment.processedAt && (
                    <p className="text-gray-400 text-sm flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-400" />
                      Processado em{" "}
                      {format(new Date(mainPayment.processedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Fines (if any) */}
            {fines.length > 0 && (
              <Card className="bg-orange-500/10 border-orange-500/30">
                <CardHeader>
                  <CardTitle className="text-orange-400 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Multas e Cobranças Adicionais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {fines.map((fine: any) => (
                    <div key={fine.id} className="flex justify-between items-center">
                      <div>
                        <p className="text-white text-sm font-medium">{fine.description}</p>
                        <p className="text-gray-400 text-xs">{fine.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-orange-400 font-semibold">R$ {parseFloat(fine.amount).toFixed(2)}</p>
                        <Badge
                          variant="outline"
                          className={
                            fine.status === "paid"
                              ? "border-green-500/50 text-green-400 text-xs"
                              : "border-orange-500/50 text-orange-400 text-xs"
                          }
                        >
                          {fine.status === "paid" ? "Pago" : "Pendente"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Price Summary */}
          <div className="space-y-6">
            {/* Price Breakdown */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-base">Resumo do Valor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-gray-400 text-sm">
                  <span>
                    R$ {parseFloat(booking.dailyRate).toFixed(0)} x {booking.totalDays} dias
                  </span>
                  <span>R$ {parseFloat(booking.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-sm">
                  <span>Taxa de serviço</span>
                  <span>R$ {parseFloat(booking.serviceFee).toFixed(2)}</span>
                </div>
                {parseFloat(booking.insuranceFee) > 0 && (
                  <div className="flex justify-between text-gray-400 text-sm">
                    <span>Proteção</span>
                    <span>R$ {parseFloat(booking.insuranceFee).toFixed(2)}</span>
                  </div>
                )}
                {parseFloat(booking.discountAmount) > 0 && (
                  <div className="flex justify-between text-green-400 text-sm">
                    <span>Desconto</span>
                    <span>-R$ {parseFloat(booking.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                {parseFloat(booking.extraKmCharge) > 0 && (
                  <div className="flex justify-between text-orange-400 text-sm">
                    <span>Km excedente</span>
                    <span>+R$ {parseFloat(booking.extraKmCharge).toFixed(2)}</span>
                  </div>
                )}
                {parseFloat(booking.lateReturnCharge) > 0 && (
                  <div className="flex justify-between text-orange-400 text-sm">
                    <span>Atraso na devolução</span>
                    <span>+R$ {parseFloat(booking.lateReturnCharge).toFixed(2)}</span>
                  </div>
                )}
                <Separator className="bg-white/10" />
                <div className="flex justify-between text-white font-semibold">
                  <span>Total</span>
                  <span>R$ {parseFloat(booking.totalAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-sm">
                  <span>Caução</span>
                  <span>R$ {parseFloat(booking.securityDeposit).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Protection Level */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-white text-sm font-medium">Proteção Contratada</p>
                    <p className="text-gray-400 text-xs capitalize">
                      {parseFloat(booking.insuranceFee) === 0
                        ? "Básica (sem cobertura adicional)"
                        : parseFloat(booking.insuranceFee) / booking.totalDays <= 40
                        ? "Padrão"
                        : "Premium"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              {/* Download Contract Button */}
              {booking.contractPdfUrl && (
                <Button
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold"
                  onClick={() => {
                    if (booking.contractPdfUrl) {
                      window.open(booking.contractPdfUrl, '_blank');
                      toast.success('Contrato aberto em nova aba');
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Contrato
                </Button>
              )}
              
              <Button
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-semibold"
                onClick={() => navigate("/messages")}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Mensagens
              </Button>

              {["pending_payment", "pending", "confirmed", "pending_host_approval"].includes(booking.status) && (() => {
                const refundPreview = getRefundPreview(booking.startDate);
                return (
                  <Button
                    variant="outline"
                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancelar Reserva
                  </Button>
                );
              })()}

              {booking.status === "completed" && (
                <Button
                  variant="outline"
                  className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  onClick={() => navigate(`/bookings/${booking.id}/review`)}
                >
                  Avaliar Experiência
                </Button>
              )}
            </div>

            {/* Cancellation Policy Card */}
            {["pending_payment", "pending", "confirmed", "pending_host_approval"].includes(booking.status) && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-cyan-400" />
                    Política de Cancelamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-gray-400">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                    <span>Mais de 48h antes: reembolso total</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
                    <span>Entre 24h e 48h: reembolso de 50%</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                    <span>Menos de 24h: sem reembolso</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Booking Code */}
            <Card className="bg-cyan-500/10 border-cyan-500/30">
              <CardContent className="p-4 text-center">
                <p className="text-gray-400 text-xs mb-1">Código da Reserva</p>
                <p className="text-2xl font-mono font-bold text-cyan-400">
                  #RDY-{booking.id.toString().padStart(6, "0")}
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Use este código para suporte
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Cancel Booking Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="bg-[#0D1526] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Cancelar Reserva</DialogTitle>
            <DialogDescription className="text-gray-400">
              Tem certeza que deseja cancelar a reserva #{booking.id.toString().padStart(6, "0")}?
            </DialogDescription>
          </DialogHeader>

          {/* Refund Preview */}
          {(() => {
            const preview = getRefundPreview(booking.startDate);
            const mainPmt = payments.find((p) => p.mpPaymentId && p.status === "completed");
            const paidAmount = mainPmt ? parseFloat(mainPmt.amount) : 0;
            const refundValue = paidAmount * (preview.pct / 100);
            return (
              <div className={`rounded-lg p-4 border ${
                preview.pct === 100
                  ? "bg-green-500/10 border-green-500/30"
                  : preview.pct === 50
                  ? "bg-yellow-500/10 border-yellow-500/30"
                  : "bg-red-500/10 border-red-500/30"
              }`}>
                <p className="text-sm font-medium text-white mb-1">{preview.label}</p>
                {paidAmount > 0 && (
                  <p className="text-xs text-gray-400">
                    {preview.pct > 0
                      ? `Você receberá R$ ${refundValue.toFixed(2)} em 3-5 dias úteis.`
                      : "Nenhum valor será reembolsado conforme a política."}
                  </p>
                )}
              </div>
            );
          })()}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="border-white/20 text-gray-400"
              onClick={() => setShowCancelDialog(false)}
              disabled={cancelWithRefund.isPending}
            >
              Manter Reserva
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => cancelWithRefund.mutate({ bookingId: booking.id })}
              disabled={cancelWithRefund.isPending}
            >
              {cancelWithRefund.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Cancelando...</>
              ) : (
                <><XCircle className="w-4 h-4 mr-2" /> Confirmar Cancelamento</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
