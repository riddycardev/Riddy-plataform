/**
 * Payments Page
 * Histórico de pagamentos e transações do usuário - DADOS REAIS
 */

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  Receipt, 
  Download, 
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Loader2,
  Wallet
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
    case "paid":
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" /> Pago</Badge>;
    case "pending":
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
    case "failed":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> Falhou</Badge>;
    case "refunded":
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><ArrowDownLeft className="w-3 h-3 mr-1" /> Reembolsado</Badge>;
    case "disputed":
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30"><AlertTriangle className="w-3 h-3 mr-1" /> Em disputa</Badge>;
    case "cancelled":
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30"><XCircle className="w-3 h-3 mr-1" /> Cancelado</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case "booking_payment":
    case "rental":
      return <CreditCard className="w-5 h-5 text-cyan-400" />;
    case "security_deposit":
    case "deposit":
      return <Receipt className="w-5 h-5 text-blue-400" />;
    case "extra_charges":
    case "extra_km":
    case "fuel":
    case "cleaning":
    case "damage":
      return <ArrowUpRight className="w-5 h-5 text-orange-400" />;
    case "refund":
      return <ArrowDownLeft className="w-5 h-5 text-green-400" />;
    case "fine":
    case "late_return":
    case "traffic_violation":
      return <AlertTriangle className="w-5 h-5 text-red-400" />;
    default:
      return <Receipt className="w-5 h-5 text-gray-400" />;
  }
}

function getPaymentTypeLabel(type: string) {
  const labels: Record<string, string> = {
    rental: "Aluguel",
    deposit: "Caução",
    extra_km: "Km Excedente",
    fuel: "Combustível",
    cleaning: "Limpeza",
    damage: "Danos",
    late_fee: "Taxa de Atraso",
    refund: "Reembolso",
    platform_fee: "Taxa da Plataforma",
    host_payout: "Pagamento ao Anfitrião",
  };
  return labels[type] || type;
}

function getFineTypeLabel(type: string) {
  const labels: Record<string, string> = {
    late_return: "Devolução Atrasada",
    traffic_violation: "Multa de Trânsito",
    damage: "Danos ao Veículo",
    cleaning: "Limpeza Extra",
    fuel: "Combustível",
    other: "Outro",
  };
  return labels[type] || type;
}

export default function Payments() {
  const [activeTab, setActiveTab] = useState("all");

  // Fetch real data from database
  const { data: payments, isLoading: loadingPayments } = trpc.payment.getMyPayments.useQuery();
  const { data: fines, isLoading: loadingFines } = trpc.fine.getMyFines.useQuery();

  const isLoading = loadingPayments || loadingFines;

  // Calculate totals from real data
  const totalSpent = payments?.reduce((acc, p) => {
    if (p.status === "completed" || p.status === "processing") {
      return acc + parseFloat(p.amount || "0");
    }
    return acc;
  }, 0) || 0;

  const totalPending = (payments?.filter(p => p.status === "pending").reduce((acc, p) => acc + parseFloat(p.amount || "0"), 0) || 0) +
    (fines?.filter(f => f.status === "pending").reduce((acc, f) => acc + parseFloat(f.amount || "0"), 0) || 0);

  const activeFines = fines?.filter(f => f.status === "pending" || f.status === "disputed").length || 0;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const hasPayments = payments && payments.length > 0;
  const hasFines = fines && fines.length > 0;
  const hasData = hasPayments || hasFines;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Pagamentos</h1>
            <p className="text-gray-400">Gerencie seus pagamentos e multas</p>
          </div>
          {hasData && (
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Gasto</p>
                  <p className="text-2xl font-bold text-white">R$ {totalSpent.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Pendente</p>
                  <p className={`text-2xl font-bold ${totalPending > 0 ? 'text-yellow-400' : 'text-white'}`}>
                    R$ {totalPending.toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Multas Ativas</p>
                  <p className={`text-2xl font-bold ${activeFines > 0 ? 'text-red-400' : 'text-white'}`}>
                    {activeFines}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Empty State */}
        {!hasData && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Nenhum pagamento ainda</h3>
              <p className="text-gray-400 mb-6">
                Seus pagamentos e transações aparecerão aqui após fazer sua primeira reserva.
              </p>
              <Button 
                className="bg-gradient-to-r from-cyan-500 to-teal-500 text-black"
                onClick={() => window.location.href = "/"}
              >
                Explorar Veículos
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        {hasData && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between">
              <TabsList className="bg-white/5">
                <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black">
                  Todos
                </TabsTrigger>
                <TabsTrigger value="payments" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black">
                  Pagamentos
                </TabsTrigger>
                <TabsTrigger value="fines" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black">
                  Multas
                </TabsTrigger>
              </TabsList>
              <Button variant="ghost" size="sm" className="text-gray-400">
                <Filter className="w-4 h-4 mr-2" />
                Filtrar
              </Button>
            </div>

            <TabsContent value="all" className="mt-4">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-0">
                  <div className="divide-y divide-white/10">
                    {/* Payments */}
                    {payments?.map((payment) => (
                      <div key={`payment-${payment.id}`} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                            {getTypeIcon(payment.paymentType)}
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {getPaymentTypeLabel(payment.paymentType)}
                            </p>
                            <p className="text-sm text-gray-400">
                              {format(new Date(payment.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                              {payment.bookingId && ` • Reserva #${payment.bookingId}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {getStatusBadge(payment.status)}
                          <span className={`font-semibold ${payment.paymentType === 'refund' ? 'text-green-400' : 'text-white'}`}>
                            {payment.paymentType === 'refund' ? '+' : '-'} R$ {parseFloat(payment.amount || "0").toFixed(2)}
                          </span>
                          {payment.status === "pending" && (
                            <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-black">
                              Pagar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Fines */}
                    {fines?.map((fine) => (
                      <div key={`fine-${fine.id}`} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {getFineTypeLabel(fine.fineType)}
                              {fine.description && ` - ${fine.description}`}
                            </p>
                            <p className="text-sm text-gray-400">
                              {fine.dueDate && `Vence: ${format(new Date(fine.dueDate), "dd/MM/yyyy", { locale: ptBR })}`}
                              {fine.bookingId && ` • Reserva #${fine.bookingId}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {getStatusBadge(fine.status)}
                          <span className="font-semibold text-red-400">
                            R$ {parseFloat(fine.amount || "0").toFixed(2)}
                          </span>
                          {fine.status === "pending" && (
                            <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-black">
                              Pagar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="mt-4">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-0">
                  {hasPayments ? (
                    <div className="divide-y divide-white/10">
                      {payments?.map((payment) => (
                        <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                              {getTypeIcon(payment.paymentType)}
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {getPaymentTypeLabel(payment.paymentType)}
                              </p>
                              <p className="text-sm text-gray-400">
                                {format(new Date(payment.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                {payment.bookingId && ` • Reserva #${payment.bookingId}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {getStatusBadge(payment.status)}
                            <span className={`font-semibold ${payment.paymentType === 'refund' ? 'text-green-400' : 'text-white'}`}>
                              {payment.paymentType === 'refund' ? '+' : '-'} R$ {parseFloat(payment.amount || "0").toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-400">
                      Nenhum pagamento encontrado
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fines" className="mt-4">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Multas e Cobranças Adicionais
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {hasFines ? (
                    <div className="divide-y divide-white/10">
                      {fines?.map((fine) => (
                        <div key={fine.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                              <AlertTriangle className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {getFineTypeLabel(fine.fineType)}
                                {fine.description && ` - ${fine.description}`}
                              </p>
                              <p className="text-sm text-gray-400">
                                {fine.dueDate && `Vence: ${format(new Date(fine.dueDate), "dd/MM/yyyy", { locale: ptBR })}`}
                                {fine.bookingId && ` • Reserva #${fine.bookingId}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {getStatusBadge(fine.status)}
                            <span className="font-semibold text-red-400">
                              R$ {parseFloat(fine.amount || "0").toFixed(2)}
                            </span>
                            <div className="flex gap-2">
                              {fine.status === "pending" && (
                                <>
                                  <Button size="sm" variant="outline" className="border-white/10 text-white hover:bg-white/5">
                                    Contestar
                                  </Button>
                                  <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-black">
                                    Pagar
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-400">
                      Nenhuma multa encontrada
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
