import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, Mail, ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Página de Recibos - Lista de pagamentos e cancelamentos
 */
export default function Receipts() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedReceiptId, setExpandedReceiptId] = useState<number | null>(null);
  
  const itemsPerPage = 10;
  const offset = (currentPage - 1) * itemsPerPage;
  
  // Buscar recibos do usuário
  const { data: receipts, isLoading, error } = trpc.receipt.getReceipts.useQuery(
    {
      limit: itemsPerPage,
      offset,
    },
    // Com staleTime:Infinity, isAuthenticated já é true imediatamente do cache.
    // Não bloquear por authLoading: ProtectedRoute já garante que o usuário está autenticado.
    { enabled: isAuthenticated }
  );
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Você precisa estar autenticado para visualizar seus recibos.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Meus Recibos</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie seus recibos de pagamentos e cancelamentos
          </p>
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin w-6 h-6 mr-2" />
            <span>Carregando recibos...</span>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">
                Erro ao carregar recibos: {error.message}
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Empty State */}
        {!isLoading && (!receipts || receipts.length === 0) && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-muted-foreground mb-4">
                Você ainda não tem recibos
              </p>
              <p className="text-sm text-muted-foreground">
                Seus recibos de pagamentos e cancelamentos aparecerão aqui
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Receipts List */}
        {!isLoading && receipts && receipts.length > 0 && (
          <div className="space-y-4">
            {receipts.map((receipt) => (
              <ReceiptCard
                key={receipt.id}
                receipt={receipt}
                isExpanded={expandedReceiptId === receipt.id}
                onToggleExpand={() =>
                  setExpandedReceiptId(
                    expandedReceiptId === receipt.id ? null : receipt.id
                  )
                }
              />
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {!isLoading && receipts && receipts.length > 0 && (
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {currentPage}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!receipts || receipts.length < itemsPerPage}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Componente para exibir um recibo individual
 */
function ReceiptCard({
  receipt,
  isExpanded,
  onToggleExpand,
}: {
  receipt: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const resendMutation = trpc.receipt.resendByEmail.useMutation();
  const downloadPdfMutation = trpc.receipt.downloadPdf.useMutation();
  
  const handleResendEmail = async () => {
    try {
      await resendMutation.mutateAsync({ receiptId: receipt.id });
      toast.success('Recibo reenviado por email!');
    } catch (error) {
      toast.error('Erro ao reenviar recibo');
    }
  };

  const handleDownloadPdf = async () => {
    try {
      toast.info('Gerando PDF...');
      const result = await downloadPdfMutation.mutateAsync({ receiptId: receipt.id });
      if (result.pdfUrl) {
        window.open(result.pdfUrl, '_blank');
        toast.success('PDF aberto em nova aba');
      }
    } catch (error) {
      toast.error('Erro ao gerar PDF do recibo');
    }
  };
  
  const typeLabel = receipt.type === "payment" ? "Pagamento" : "Cancelamento";
  const typeColor = receipt.type === "payment" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  
  return (
    <Card className="overflow-hidden">
      {/* Summary Row */}
      <button
        onClick={onToggleExpand}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold px-2 py-1 rounded ${typeColor}`}>
                {typeLabel}
              </span>
              <span className="text-sm font-mono text-muted-foreground">
                #{receipt.receiptNumber}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date(receipt.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">
              {formatCurrency(parseFloat(receipt.amount))}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>
      
      {/* Expanded Details */}
      {isExpanded && (
        <CardContent className="border-t pt-4">
          <div className="space-y-4">
            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Valor
                </p>
                <p className="text-lg font-semibold">
                  {formatCurrency(parseFloat(receipt.amount))}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Tipo
                </p>
                <p className="text-sm">{typeLabel}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Data
                </p>
                <p className="text-sm">
                  {new Date(receipt.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Recibo
                </p>
                <p className="text-sm font-mono">{receipt.receiptNumber}</p>
              </div>
            </div>
            
            {/* Description */}
            {receipt.description && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Descrição
                </p>
                <p className="text-sm">{receipt.description}</p>
              </div>
            )}
            
            {/* Refund Info (if cancellation) */}
            {receipt.type === "cancellation" && receipt.refundAmount && (
              <div className="bg-muted p-3 rounded">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Reembolso
                </p>
                <p className="text-sm font-semibold">
                  {formatCurrency(parseFloat(receipt.refundAmount))}
                </p>
                {receipt.refundReason && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {receipt.refundReason}
                  </p>
                )}
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={handleResendEmail}
                disabled={resendMutation.isPending}
              >
                <Mail className="w-4 h-4 mr-2" />
                {resendMutation.isPending ? "Enviando..." : "Reenviar por Email"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={downloadPdfMutation.isPending}
              >
                {downloadPdfMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {downloadPdfMutation.isPending ? "Gerando PDF..." : "Download PDF"}
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
