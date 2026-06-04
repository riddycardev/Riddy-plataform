import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ConfirmDialog";

interface VerificationItem {
  verification: {
    id: number;
    userId: number;
    status: "pending" | "submitted" | "approved" | "rejected" | "blocked";
    attemptCount: number;
    reviewedBy: number | null;
    reviewedAt: Date | null;
    reviewNotes: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  user: {
    id: number;
    name: string | null;
    email: string | null;
    cpf: string | null;
  } | null;
}

interface VerificationQueueProps {
  onVerificationComplete?: () => void;
}

/**
 * Verification Queue Component (FASE 1A: Turo Brasileiro)
 *
 * Admin interface for reviewing pending identity verifications.
 * Shows list of pending verifications with user details and action buttons.
 */
export function VerificationQueue({ onVerificationComplete }: VerificationQueueProps) {
  const [selectedVerificationId, setSelectedVerificationId] = useState<number | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  // Confirm dialogs
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [pendingVerificationId, setPendingVerificationId] = useState<number | null>(null);

  // Get pending verifications
  const { data: verifications, isLoading, refetch } =
    trpc.verification.getDocumentsForReview.useQuery();

  // Approve mutation
  const approveMutation = trpc.verification.approveVerification.useMutation({
    onSuccess: () => {
      setApproving(false);
      setSelectedVerificationId(null);
      setReviewNotes("");
      refetch();
      onVerificationComplete?.();
      toast.success("Verificação aprovada com sucesso!");
    },
    onError: (err) => {
      setApproving(false);
      toast.error(`Erro ao aprovar: ${err.message}`);
    },
  });

  // Reject mutation
  const rejectMutation = trpc.verification.rejectVerification.useMutation({
    onSuccess: () => {
      setRejecting(false);
      setSelectedVerificationId(null);
      setReviewNotes("");
      refetch();
      onVerificationComplete?.();
      toast.success("Verificação rejeitada.");
    },
    onError: (err) => {
      setRejecting(false);
      toast.error(`Erro ao rejeitar: ${err.message}`);
    },
  });

  const handleApprove = (verificationId: number) => {
    setPendingVerificationId(verificationId);
    setApproveConfirmOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (pendingVerificationId === null) return;
    setApproving(true);
    setApproveConfirmOpen(false);
    await approveMutation.mutateAsync({
      verificationId: pendingVerificationId,
      notes: reviewNotes,
    });
  };

  const handleReject = (verificationId: number) => {
    if (!reviewNotes.trim()) {
      toast.error("Por favor, adicione um motivo para a rejeição");
      return;
    }
    setPendingVerificationId(verificationId);
    setRejectConfirmOpen(true);
  };

  const handleConfirmReject = async () => {
    if (pendingVerificationId === null) return;
    setRejecting(true);
    setRejectConfirmOpen(false);
    await rejectMutation.mutateAsync({
      verificationId: pendingVerificationId,
      notes: reviewNotes,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (!verifications || verifications.length === 0) {
    return (
      <Card className="p-8 text-center border-cyan-500/50">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhuma verificação pendente</h3>
        <p className="text-foreground/60">Todas as verificações foram processadas!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Fila de Verificações</h2>
        <span className="bg-cyan-500/20 text-cyan-500 px-3 py-1 rounded-full text-sm font-semibold">
          {verifications.length} pendente{verifications.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-4">
        {verifications.map((item: VerificationItem) => (
          <Card
            key={item.verification.id}
            className={`p-6 border-2 cursor-pointer transition-all ${
              selectedVerificationId === item.verification.id
                ? "border-cyan-500 bg-cyan-500/10"
                : "border-cyan-500/30 hover:border-cyan-500/60"
            }`}
            onClick={() => setSelectedVerificationId(item.verification.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {item.user?.name || "Usuário desconhecido"}
                </h3>
                <p className="text-sm text-foreground/60">{item.user?.email}</p>
                {item.user?.cpf && (
                  <p className="text-sm text-foreground/60">CPF: {item.user.cpf}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-semibold text-yellow-600">
                  Tentativa {item.verification.attemptCount} de 3
                </span>
              </div>
            </div>

            {/* Expanded details */}
            {selectedVerificationId === item.verification.id && (
              <div className="mt-6 pt-6 border-t border-cyan-500/30 space-y-4">
                {/* Documents section */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-500" />
                    Documentos Enviados
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-cyan-500/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info("Visualização de documentos em desenvolvimento");
                      }}
                    >
                      CPF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-cyan-500/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info("Visualização de documentos em desenvolvimento");
                      }}
                    >
                      CNH
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-cyan-500/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info("Visualização de documentos em desenvolvimento");
                      }}
                    >
                      Comprovante
                    </Button>
                  </div>
                </div>

                {/* Review notes */}
                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-cyan-500" />
                    Notas da Análise
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Adicione notas sobre a análise (motivo da rejeição, observações, etc)"
                    className="w-full p-3 border-2 border-cyan-500/50 rounded-lg focus:border-cyan-500 focus:outline-none bg-background text-foreground"
                    rows={3}
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApprove(item.verification.id);
                    }}
                    disabled={approving || rejecting}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  >
                    {approving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Aprovando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Aprovar
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReject(item.verification.id);
                    }}
                    disabled={approving || rejecting}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  >
                    {rejecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Rejeitando...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejeitar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Collapsed view */}
            {selectedVerificationId !== item.verification.id && (
              <div className="text-sm text-foreground/60">
                Enviado em {new Date(item.verification.createdAt).toLocaleDateString("pt-BR")}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Approve confirmation */}
      <ConfirmDialog
        open={approveConfirmOpen}
        onOpenChange={setApproveConfirmOpen}
        title="Aprovar verificação?"
        description="Esta ação aprovará a identidade do usuário e liberará o acesso à plataforma."
        confirmLabel="Aprovar"
        onConfirm={handleConfirmApprove}
      />

      {/* Reject confirmation */}
      <ConfirmDialog
        open={rejectConfirmOpen}
        onOpenChange={setRejectConfirmOpen}
        title="Rejeitar verificação?"
        description="Esta ação rejeitará a verificação e notificará o usuário."
        confirmLabel="Rejeitar"
        confirmVariant="destructive"
        onConfirm={handleConfirmReject}
      />
    </div>
  );
}
