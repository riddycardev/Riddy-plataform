/**
 * Admin Verification Panel
 * Painel completo de revisão de documentos de proprietários e veículos
 * - Aba 1: Veículos pendentes (com CRLV, fotos, dados do proprietário)
 * - Aba 2: Proprietários com documentos pendentes (CNH, comprovante)
 */

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  FileText,
  User,
  Car,
  Loader2,
  Eye,
  ChevronLeft,
  ImageIcon,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DOC_LABELS: Record<string, string> = {
  cnh_front: "CNH – Frente",
  cnh_back: "CNH – Verso",
  rg_front: "RG – Frente",
  rg_back: "RG – Verso",
  cpf: "CPF",
  selfie: "Selfie",
  proof_of_address: "Comprovante de Residência",
  facial_recognition: "Reconhecimento Facial",
  crlv: "CRLV",
  insurance: "Seguro",
  inspection_report: "Laudo de Vistoria",
  ownership_proof: "Comprovante de Propriedade",
  maintenance_history: "Histórico de Manutenção",
};

function statusBadge(status?: string | null) {
  if (status === "approved")
    return <Badge className="bg-green-600 text-white">Aprovado</Badge>;
  if (status === "rejected")
    return <Badge variant="destructive">Rejeitado</Badge>;
  return <Badge variant="secondary">Pendente</Badge>;
}

function isPdf(url?: string | null) {
  return url?.toLowerCase().includes(".pdf") || url?.includes("application/pdf");
}

function DocumentViewer({ url, label }: { url: string; label: string }) {
  if (isPdf(url)) {
    return (
      <div className="bg-slate-700/50 rounded-lg p-4 flex flex-col items-center gap-3">
        <FileText className="w-12 h-12 text-cyan-400" />
        <p className="text-white text-sm font-medium">{label}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm underline"
        >
          <Eye className="w-4 h-4" />
          Abrir PDF
        </a>
      </div>
    );
  }
  return (
    <div className="rounded-lg overflow-hidden border border-slate-600">
      <img
                              loading="lazy"
        src={url}
        alt={label}
        className="w-full object-contain max-h-64 bg-slate-900"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='120'%3E%3Crect fill='%23334155' width='200' height='120'/%3E%3Ctext fill='%2394a3b8' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='14'%3EImagem indisponível%3C/text%3E%3C/svg%3E";
        }}
      />
      <div className="bg-slate-800 px-3 py-2 flex justify-between items-center">
        <span className="text-slate-300 text-xs">{label}</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300"
        >
          <Eye className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

// ─── Vehicle Verification Panel ───────────────────────────────────────────────

function VehicleVerificationTab() {
  const utils = trpc.useUtils();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const { data: pendingVehicles, isLoading } =
    trpc.admin.getPendingVehiclesForVerification.useQuery();

  const { data: details, isLoading: detailsLoading } =
    trpc.admin.getVehicleVerificationDetails.useQuery(
      { vehicleId: selectedId! },
      { enabled: !!selectedId }
    );

  const approve = trpc.admin.approveVehicleVerification.useMutation({
    onSuccess: () => {
      toast.success("Veículo aprovado com sucesso!");
      utils.admin.getPendingVehiclesForVerification.invalidate();
      setSelectedId(null);
      setAdminNotes("");
    },
    onError: (e) => toast.error(e.message || "Erro ao aprovar veículo"),
  });

  const reject = trpc.admin.rejectVehicleVerification.useMutation({
    onSuccess: () => {
      toast.success("Veículo rejeitado");
      utils.admin.getPendingVehiclesForVerification.invalidate();
      setSelectedId(null);
      setRejectReason("");
      setAdminNotes("");
      setShowRejectDialog(false);
    },
    onError: (e) => toast.error(e.message || "Erro ao rejeitar veículo"),
  });

  const selected = pendingVehicles?.find((v) => v.vehicle.id === selectedId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: vehicle list */}
      <div className="lg:col-span-1">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-cyan-400" />
              Veículos Pendentes
            </CardTitle>
            <CardDescription>
              {pendingVehicles?.length ?? 0} aguardando revisão
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              </div>
            ) : !pendingVehicles?.length ? (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-500" />
                <p>Nenhum veículo pendente</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {pendingVehicles.map((v) => (
                  <button
                    key={v.vehicle.id}
                    onClick={() => setSelectedId(v.vehicle.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedId === v.vehicle.id
                        ? "bg-cyan-500/20 border-cyan-500"
                        : "bg-slate-700/50 border-slate-600 hover:border-slate-500"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {v.images?.[0]?.imageUrl ? (
                        <img
                              loading="lazy"
                          src={v.images[0].imageUrl}
                          alt=""
                          className="w-12 h-10 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-10 rounded bg-slate-600 flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm truncate">
                          {v.vehicle.brand} {v.vehicle.model} {v.vehicle.year}
                        </p>
                        <p className="text-xs text-slate-400">
                          {v.vehicle.licensePlate}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {v.owner.name}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right: detail panel */}
      <div className="lg:col-span-2 space-y-4">
        {!selectedId ? (
          <Card className="bg-slate-800/50 border-slate-700 h-64 flex items-center justify-center">
            <CardContent>
              <p className="text-slate-400 text-center">
                Selecione um veículo para revisar
              </p>
            </CardContent>
          </Card>
        ) : detailsLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        ) : details ? (
          <>
            <Tabs defaultValue="vehicle">
              <TabsList className="grid w-full grid-cols-3 bg-slate-700">
                <TabsTrigger value="vehicle">Veículo</TabsTrigger>
                <TabsTrigger value="crlv">
                  CRLV{" "}
                  {details.vehicle.crlvUrl ? (
                    <span className="ml-1 text-green-400">✓</span>
                  ) : (
                    <span className="ml-1 text-red-400">✗</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="owner">
                  Proprietário{" "}
                  {(details as any).ownerDocuments?.length > 0 ? (
                    <span className="ml-1 text-green-400">
                      ({(details as any).ownerDocuments.length})
                    </span>
                  ) : null}
                </TabsTrigger>
              </TabsList>

              {/* Vehicle info tab */}
              <TabsContent value="vehicle">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">
                      {details.vehicle.brand} {details.vehicle.model}{" "}
                      {details.vehicle.year}
                    </CardTitle>
                    <CardDescription>
                      Placa: {details.vehicle.licensePlate} · {details.vehicle.color}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Vehicle photos */}
                    {(details as any).images?.length > 0 && (
                      <div>
                        <p className="text-slate-400 text-sm mb-2">
                          Fotos do veículo (
                          {(details as any).images.length})
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {(details as any).images.slice(0, 6).map((img: any) => (
                            <a
                              key={img.id}
                              href={img.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                              loading="lazy"
                                src={img.imageUrl}
                                alt=""
                                className="w-full h-20 object-cover rounded border border-slate-600 hover:border-cyan-400 transition-colors"
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Vehicle details grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        ["Categoria", details.vehicle.category],
                        ["Preço/Dia", `R$ ${details.vehicle.dailyPrice}`],
                        ["Cidade", details.vehicle.pickupCity],
                        ["Estado", details.vehicle.pickupState],
                        ["Combustível", details.vehicle.fuelType],
                        ["Transmissão", details.vehicle.transmission],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="bg-slate-700/50 p-3 rounded"
                        >
                          <p className="text-slate-400 text-xs">{label}</p>
                          <p className="text-white text-sm font-medium">
                            {value || "—"}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Owner info */}
                    <div className="bg-slate-700/50 p-4 rounded border border-slate-600">
                      <p className="text-slate-400 text-xs mb-2 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Proprietário
                      </p>
                      <p className="text-white font-semibold">
                        {details.owner.name}
                      </p>
                      <p className="text-slate-400 text-sm">
                        {details.owner.email}
                      </p>
                      {details.owner.phone && (
                        <p className="text-slate-400 text-sm">
                          {details.owner.phone}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* CRLV tab */}
              <TabsContent value="crlv">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Documentos do Veículo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* CRLV from vehicles table */}
                    {details.vehicle.crlvUrl ? (
                      <div className="border border-slate-600 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-white font-semibold">
                            CRLV (Certificado de Registro)
                          </h3>
                          {statusBadge(details.verification?.crlvStatus)}
                        </div>
                        <DocumentViewer
                          url={details.vehicle.crlvUrl}
                          label="CRLV"
                        />
                        {details.vehicle.crlvOwnerName && (
                          <p className="text-slate-400 text-sm mt-2">
                            <strong className="text-white">Nome no CRLV:</strong>{" "}
                            {details.vehicle.crlvOwnerName}
                          </p>
                        )}
                        {/* Name match check */}
                        {details.vehicle.crlvOwnerName && details.owner.name && (
                          <div
                            className={`mt-2 p-2 rounded text-sm flex items-center gap-2 ${
                              details.vehicle.crlvOwnerName
                                .toLowerCase()
                                .includes(
                                  details.owner.name.split(" ")[0].toLowerCase()
                                )
                                ? "bg-green-900/30 text-green-400"
                                : "bg-red-900/30 text-red-400"
                            }`}
                          >
                            {details.vehicle.crlvOwnerName
                              .toLowerCase()
                              .includes(
                                details.owner.name.split(" ")[0].toLowerCase()
                              ) ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                Nome coincide com o proprietário
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-4 h-4" />
                                Nome no CRLV não coincide com o proprietário
                                cadastrado
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-yellow-500" />
                        <p>CRLV não enviado</p>
                      </div>
                    )}

                    {/* Additional vehicle documents from vehicle_documents table */}
                    {(details as any).vehicleDocuments?.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="border border-slate-600 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-white font-semibold">
                            {DOC_LABELS[doc.documentType] || doc.documentType}
                          </h3>
                          {statusBadge(doc.status)}
                        </div>
                        <DocumentViewer
                          url={doc.fileUrl}
                          label={DOC_LABELS[doc.documentType] || doc.documentType}
                        />
                        {doc.rejectionReason && (
                          <p className="text-red-400 text-sm mt-2">
                            <strong>Motivo:</strong> {doc.rejectionReason}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Owner documents tab */}
              <TabsContent value="owner">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Documentos Pessoais – {details.owner.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(details as any).ownerDocuments?.length > 0 ? (
                      (details as any).ownerDocuments.map((doc: any) => (
                        <OwnerDocCard
                          key={doc.id}
                          doc={doc}
                          adminId={details.owner.id}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-yellow-500" />
                        <p>Proprietário ainda não enviou documentos pessoais</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action buttons */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">
                  Decisão Final
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Notas internas do administrador (opcional)..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  rows={2}
                />
                <div className="flex gap-3">
                  <Button
                    onClick={() =>
                      approve.mutate({
                        vehicleId: selectedId!,
                        notes: adminNotes,
                      })
                    }
                    disabled={approve.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {approve.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Aprovar Veículo
                  </Button>
                  <Button
                    onClick={() => setShowRejectDialog(true)}
                    disabled={reject.isPending}
                    variant="destructive"
                    className="flex-1"
                  >
                    {reject.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Rejeitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Reject dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Rejeitar Veículo</DialogTitle>
            <DialogDescription>
              Informe o motivo para o proprietário
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Ex: CRLV ilegível, nome não coincide, fotos insuficientes..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              className="border-slate-600 text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || reject.isPending}
              onClick={() =>
                reject.mutate({
                  vehicleId: selectedId!,
                  rejectionReason: rejectReason,
                  notes: adminNotes,
                })
              }
            >
              {reject.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Owner Document Card ──────────────────────────────────────────────────────

function OwnerDocCard({ doc, adminId }: { doc: any; adminId: number }) {
  const utils = trpc.useUtils();
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  const approve = trpc.admin.approveUserDocument.useMutation({
    onSuccess: () => {
      toast.success(`${DOC_LABELS[doc.documentType] || doc.documentType} aprovado`);
      utils.admin.getVehicleVerificationDetails.invalidate();
      utils.admin.getPendingOwnerVerifications.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const reject = trpc.admin.rejectUserDocument.useMutation({
    onSuccess: () => {
      toast.success("Documento rejeitado");
      utils.admin.getVehicleVerificationDetails.invalidate();
      utils.admin.getPendingOwnerVerifications.invalidate();
      setShowReject(false);
      setRejectReason("");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="border border-slate-600 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">
          {DOC_LABELS[doc.documentType] || doc.documentType}
        </h3>
        {statusBadge(doc.status)}
      </div>

      <DocumentViewer
        url={doc.fileUrl}
        label={DOC_LABELS[doc.documentType] || doc.documentType}
      />

      {doc.rejectionReason && (
        <p className="text-red-400 text-sm">
          <strong>Motivo:</strong> {doc.rejectionReason}
        </p>
      )}

      {/* Per-document actions */}
      {doc.status !== "approved" && (
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={approve.isPending}
            onClick={() => approve.mutate({ docId: doc.id })}
          >
            {approve.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3 h-3 mr-1" />
            )}
            Aprovar
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={reject.isPending}
            onClick={() => setShowReject(true)}
          >
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitar
          </Button>
        </div>
      )}

      {showReject && (
        <div className="space-y-2">
          <Textarea
            placeholder="Motivo da rejeição..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white text-sm"
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              disabled={!rejectReason.trim() || reject.isPending}
              onClick={() =>
                reject.mutate({ docId: doc.id, reason: rejectReason })
              }
            >
              Confirmar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300"
              onClick={() => setShowReject(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bookings Tab ───────────────────────────────────────────────────────────

const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending_payment: "Aguard. Pagamento",
  pending: "Pendente",
  awaiting_verification: "Aguard. Verificação",
  pending_host_approval: "Aguard. Aprovação",
  confirmed: "Confirmada",
  in_progress: "Em Andamento",
  completed: "Concluída",
  cancelled_by_renter: "Cancelada (Loc.)",
  cancelled_by_host: "Cancelada (Anf.)",
  disputed: "Em Disputa",
  rejected_verification: "Verificação Rejeitada",
};

const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  awaiting_verification: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  pending_host_approval: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
  in_progress: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  completed: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  cancelled_by_renter: "bg-red-500/20 text-red-400 border-red-500/30",
  cancelled_by_host: "bg-red-500/20 text-red-400 border-red-500/30",
  disputed: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  rejected_verification: "bg-red-500/20 text-red-400 border-red-500/30",
};

const VERIFICATION_STATUS_LABELS: Record<string, string> = {
  locked: "Bloqueada",
  awaiting_upload: "Aguard. Envio",
  pending_review: "Em Análise",
  approved: "Aprovada",
  rejected: "Rejeitada",
};

function BookingsTab() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [imageModal, setImageModal] = useState<{ url: string; label: string } | null>(null);

  const { data: bookings, isLoading, refetch, error } = trpc.booking.adminList.useQuery(
    filterStatus === "all" ? {} : { status: filterStatus },
    { refetchOnWindowFocus: false }
  );

  if (error) {
    return (
      <Card className="bg-red-500/10 border-red-500/20">
        <CardContent className="pt-6">
          <p className="text-red-400">Erro ao carregar reservas: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  const selected = bookings?.find((b) => b.booking.id === selectedId);

  const filterOptions = [
    { value: "all", label: "Todas" },
    { value: "pending_payment", label: "Aguard. Pagamento" },
    { value: "awaiting_verification", label: "Aguard. Verificação" },
    { value: "confirmed", label: "Confirmadas" },
    { value: "in_progress", label: "Em Andamento" },
    { value: "completed", label: "Concluídas" },
    { value: "cancelled_by_renter", label: "Canceladas" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: list */}
      <div className="lg:col-span-1">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Todas as Reservas
            </CardTitle>
            <CardDescription className="text-slate-400">
              {bookings?.length ?? 0} reserva(s) encontrada(s)
            </CardDescription>
            {/* Filters */}
            <div className="flex flex-wrap gap-1 mt-2">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setFilterStatus(opt.value); setSelectedId(null); }}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    filterStatus === opt.value
                      ? "bg-cyan-500 text-black"
                      : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400 mt-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Atualizar
            </button>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
            {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /></div>}
            {!isLoading && (!bookings || bookings.length === 0) && (
              <p className="text-slate-400 text-sm text-center py-8">Nenhuma reserva encontrada.</p>
            )}
            {bookings?.map((item) => (
              <button
                key={item.booking.id}
                onClick={() => setSelectedId(item.booking.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedId === item.booking.id
                    ? "bg-cyan-500/20 border-cyan-500/50"
                    : "bg-slate-700/50 border-slate-600 hover:bg-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-sm font-semibold">
                    #RDY-{String(item.booking.id).padStart(6, "0")}
                  </span>
                  <Badge className={`text-xs ${BOOKING_STATUS_COLORS[item.booking.status] ?? "bg-slate-500/20 text-slate-300"}`}>
                    {BOOKING_STATUS_LABELS[item.booking.status] ?? item.booking.status}
                  </Badge>
                </div>
                <p className="text-slate-300 text-xs truncate">{item.renter?.name || item.booking.renterFullName || "—"}</p>
                <p className="text-slate-400 text-xs">
                  {item.vehicle?.brand} {item.vehicle?.model} {item.vehicle?.year}
                </p>
                <p className="text-slate-400 text-xs">
                  {new Date(item.booking.startDate).toLocaleDateString("pt-BR")} → {new Date(item.booking.endDate).toLocaleDateString("pt-BR")}
                </p>
                <p className="text-cyan-400 text-xs font-medium">
                  R$ {parseFloat(item.booking.totalAmount || "0").toFixed(2)}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Right: details */}
      <div className="lg:col-span-2">
        {!selected ? (
          <div className="flex items-center justify-center h-64 text-slate-500">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Selecione uma reserva para ver os detalhes</p>
            </div>
          </div>
        ) : (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">
                    Reserva #RDY-{String(selected.booking.id).padStart(6, "0")}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Criada em {new Date(selected.booking.createdAt).toLocaleString("pt-BR")}
                  </CardDescription>
                </div>
                <Badge className={`${BOOKING_STATUS_COLORS[selected.booking.status] ?? "bg-slate-500/20 text-slate-300"}`}>
                  {BOOKING_STATUS_LABELS[selected.booking.status] ?? selected.booking.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Vehicle + Renter + Booking + Verification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vehicle */}
                <div className="bg-slate-700/50 rounded-lg p-3 space-y-1">
                  <p className="text-cyan-400 text-xs font-semibold uppercase tracking-wide flex items-center gap-1">
                    <Car className="w-3 h-3" /> Veículo
                  </p>
                  {selected.vehicle ? (
                    <>
                      <p className="text-white text-sm font-medium">{selected.vehicle.brand} {selected.vehicle.model} {selected.vehicle.year}</p>
                      <p className="text-slate-400 text-xs">Placa: {selected.vehicle.licensePlate}</p>
                      <p className="text-slate-400 text-xs">{selected.vehicle.pickupCity}, {selected.vehicle.pickupState}</p>
                      <p className="text-slate-400 text-xs capitalize">Tipo: {selected.vehicle.vehicleType}</p>
                    </>
                  ) : (
                    <p className="text-slate-400 text-xs">ID: {selected.booking.vehicleId}</p>
                  )}
                </div>
                {/* Renter */}
                <div className="bg-slate-700/50 rounded-lg p-3 space-y-1">
                  <p className="text-cyan-400 text-xs font-semibold uppercase tracking-wide flex items-center gap-1">
                    <User className="w-3 h-3" /> Locatário
                  </p>
                  <p className="text-white text-sm font-medium">{selected.renter?.name || selected.booking.renterFullName || "—"}</p>
                  <p className="text-slate-400 text-xs">{selected.renter?.email || selected.booking.renterEmail || "—"}</p>
                  <p className="text-slate-400 text-xs">Tel: {selected.renter?.phone || selected.booking.renterPhone || "—"}</p>
                  <p className="text-slate-400 text-xs">CPF: {selected.renter?.cpf || selected.booking.renterCpf || "—"}</p>
                </div>
                {/* Booking Financials */}
                <div className="bg-slate-700/50 rounded-lg p-3 space-y-1">
                  <p className="text-cyan-400 text-xs font-semibold uppercase tracking-wide">Valores</p>
                  <p className="text-white text-sm">
                    {new Date(selected.booking.startDate).toLocaleDateString("pt-BR")} → {new Date(selected.booking.endDate).toLocaleDateString("pt-BR")}
                  </p>
                  <p className="text-slate-400 text-xs">{selected.booking.totalDays} dia(s)</p>
                  <p className="text-slate-400 text-xs">Diária: R$ {parseFloat(selected.booking.dailyRate || "0").toFixed(2)}</p>
                  {selected.booking.serviceFee && parseFloat(selected.booking.serviceFee) > 0 && (
                    <p className="text-slate-400 text-xs">Taxa de serviço: R$ {parseFloat(selected.booking.serviceFee).toFixed(2)}</p>
                  )}
                  {selected.booking.insuranceFee && parseFloat(selected.booking.insuranceFee) > 0 && (
                    <p className="text-slate-400 text-xs">Seguro: R$ {parseFloat(selected.booking.insuranceFee).toFixed(2)}</p>
                  )}
                  {selected.booking.deliveryFee && parseFloat(selected.booking.deliveryFee) > 0 && (
                    <p className="text-slate-400 text-xs">Entrega: R$ {parseFloat(selected.booking.deliveryFee).toFixed(2)}</p>
                  )}
                  <p className="text-cyan-400 text-sm font-semibold">Total: R$ {parseFloat(selected.booking.totalAmount || "0").toFixed(2)}</p>
                </div>
                {/* Verification Status */}
                <div className="bg-slate-700/50 rounded-lg p-3 space-y-1">
                  <p className="text-cyan-400 text-xs font-semibold uppercase tracking-wide">Verificação</p>
                  <p className="text-white text-sm">
                    Status: {VERIFICATION_STATUS_LABELS[selected.booking.verificationStatus ?? ""] ?? selected.booking.verificationStatus ?? "—"}
                  </p>
                  {selected.verification ? (
                    <>
                      <p className="text-slate-400 text-xs">Envios: {selected.verification.submissionCount}</p>
                      {selected.verification.lastSubmittedAt && (
                        <p className="text-slate-400 text-xs">Último envio: {new Date(selected.verification.lastSubmittedAt).toLocaleString("pt-BR")}</p>
                      )}
                      {selected.verification.reviewedAt && (
                        <p className="text-slate-400 text-xs">Revisado em: {new Date(selected.verification.reviewedAt).toLocaleString("pt-BR")}</p>
                      )}
                      {selected.verification.rejectionReason && (
                        <p className="text-red-400 text-xs">Motivo: {selected.verification.rejectionReason}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-slate-400 text-xs">Nenhum documento enviado</p>
                  )}
                </div>
              </div>

              {/* Vehicle Image */}
              {selected.vehicle?.mainImageUrl && (
                <div>
                  <p className="text-slate-400 text-sm mb-2 flex items-center gap-1">
                    <Car className="w-4 h-4" /> Foto do Veículo
                  </p>
                  <img
                              loading="lazy"
                    src={selected.vehicle.mainImageUrl}
                    alt="Veículo"
                    className="w-full max-h-48 object-cover rounded-lg border border-slate-600"
                  />
                </div>
              )}

              {/* Verification Documents */}
              {selected.verification && (selected.verification.cnhImageUrl || selected.verification.selfieImageUrl) && (
                <div>
                  <p className="text-slate-400 text-sm mb-3 flex items-center gap-1">
                    <FileText className="w-4 h-4" /> Documentos Enviados
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {selected.verification.cnhImageUrl && (
                      <div>
                        <p className="text-slate-400 text-xs mb-1">CNH</p>
                        <a href={selected.verification.cnhImageUrl} target="_blank" rel="noopener noreferrer">
                          <img
                              loading="lazy"
                            src={selected.verification.cnhImageUrl}
                            alt="CNH"
                            className="w-full rounded-lg object-cover aspect-video border border-slate-600 hover:opacity-80 transition-opacity cursor-pointer"
                          />
                        </a>
                      </div>
                    )}
                    {selected.verification.selfieImageUrl && (
                      <div>
                        <p className="text-slate-400 text-xs mb-1">Selfie + CNH</p>
                        <a href={selected.verification.selfieImageUrl} target="_blank" rel="noopener noreferrer">
                          <img
                              loading="lazy"
                            src={selected.verification.selfieImageUrl}
                            alt="Selfie"
                            className="w-full rounded-lg object-cover aspect-video border border-slate-600 hover:opacity-80 transition-opacity cursor-pointer"
                          />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selected.booking.renterNotes && (
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-cyan-400 text-xs font-semibold uppercase tracking-wide mb-1">Observações do Locatário</p>
                  <p className="text-slate-300 text-sm">{selected.booking.renterNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Renter (Booking) Verifications Tab ─────────────────────────────────────

function RenterVerificationsTab() {
  const utils = trpc.useUtils();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"pending_review" | "approved" | "rejected">("pending_review");

  const { data: verifications, isLoading } = trpc.bookingVerification.adminList.useQuery({ status: filterStatus });

  const selected = verifications?.find((v) => v.verification.id === selectedId);

  const approve = trpc.bookingVerification.adminApprove.useMutation({
    onSuccess: () => {
      toast.success("Verificação aprovada! Reserva confirmada.");
      utils.bookingVerification.adminList.invalidate();
      setSelectedId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const reject = trpc.bookingVerification.adminReject.useMutation({
    onSuccess: () => {
      toast.success("Verificação rejeitada.");
      utils.bookingVerification.adminList.invalidate();
      setSelectedId(null);
      setShowRejectDialog(false);
      setRejectReason("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const statusColors: Record<string, string> = {
    pending_review: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    approved: "bg-green-500/20 text-green-400 border-green-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const statusLabels: Record<string, string> = {
    pending_review: "Em Análise",
    approved: "Aprovado",
    rejected: "Rejeitado",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: list */}
      <div className="lg:col-span-1">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              Verificações de Locatários
            </CardTitle>
            <CardDescription className="text-slate-400">
              CNH + Selfie enviados após pagamento
            </CardDescription>
            {/* Filter */}
            <div className="flex gap-1 mt-2">
              {(["pending_review", "approved", "rejected"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    filterStatus === s
                      ? "bg-cyan-500 text-black"
                      : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                  }`}
                >
                  {statusLabels[s]}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
            {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /></div>}
            {!isLoading && (!verifications || verifications.length === 0) && (
              <p className="text-slate-400 text-sm text-center py-8">Nenhuma verificação {statusLabels[filterStatus].toLowerCase()}.</p>
            )}
            {verifications?.map((v) => (
              <button
                key={v.verification.id}
                onClick={() => setSelectedId(v.verification.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedId === v.verification.id
                    ? "bg-cyan-500/20 border-cyan-500/50"
                    : "bg-slate-700/50 border-slate-600 hover:bg-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-sm font-semibold">
                    #RDY-{String(v.verification.bookingId).padStart(6, "0")}
                  </span>
                  <Badge className={`text-xs ${statusColors[v.verification.status]}`}>{statusLabels[v.verification.status]}</Badge>
                </div>
                <p className="text-slate-400 text-xs">
                  {new Date(v.verification.lastSubmittedAt || v.verification.createdAt).toLocaleDateString("pt-BR")}
                </p>
                {v.booking.renterFullName && (
                  <p className="text-slate-300 text-xs mt-1 truncate">{v.booking.renterFullName}</p>
                )}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Right: detail */}
      <div className="lg:col-span-2">
        {!selected ? (
          <Card className="bg-slate-800/50 border-slate-700 h-full flex items-center justify-center">
            <CardContent className="text-center py-16">
              <Eye className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Selecione uma verificação para revisar</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">
                    Reserva #RDY-{String(selected.verification.bookingId).padStart(6, "0")}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {selected.booking.renterFullName && <span className="block">{selected.booking.renterFullName}</span>}
                    Enviado em {new Date(selected.verification.lastSubmittedAt || selected.verification.createdAt).toLocaleString("pt-BR")}
                  </CardDescription>
                </div>
                <Badge className={statusColors[selected.verification.status]}>{statusLabels[selected.verification.status]}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Booking + Vehicle + Renter Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vehicle Info */}
                <div className="bg-slate-700/50 rounded-lg p-3 space-y-1">
                  <p className="text-cyan-400 text-xs font-semibold uppercase tracking-wide flex items-center gap-1">
                    <Car className="w-3 h-3" /> Veículo
                  </p>
                  {selected.vehicle ? (
                    <>
                      <p className="text-white text-sm font-medium">{selected.vehicle.brand} {selected.vehicle.model} {selected.vehicle.year}</p>
                      <p className="text-slate-400 text-xs">Placa: {selected.vehicle.licensePlate}</p>
                      <p className="text-slate-400 text-xs">{selected.vehicle.pickupCity}, {selected.vehicle.pickupState}</p>
                    </>
                  ) : (
                    <p className="text-slate-400 text-xs">Veículo ID: {selected.booking.vehicleId}</p>
                  )}
                </div>
                {/* Renter Info */}
                <div className="bg-slate-700/50 rounded-lg p-3 space-y-1">
                  <p className="text-cyan-400 text-xs font-semibold uppercase tracking-wide flex items-center gap-1">
                    <User className="w-3 h-3" /> Locatário
                  </p>
                  <p className="text-white text-sm font-medium">{selected.renter?.name || selected.booking.renterFullName || '—'}</p>
                  <p className="text-slate-400 text-xs">{selected.renter?.email || selected.booking.renterEmail || '—'}</p>
                  <p className="text-slate-400 text-xs">Tel: {selected.renter?.phone || selected.booking.renterPhone || '—'}</p>
                  <p className="text-slate-400 text-xs">CPF: {selected.renter?.cpf || selected.booking.renterCpf || '—'}</p>
                </div>
                {/* Booking Info */}
                <div className="bg-slate-700/50 rounded-lg p-3 space-y-1">
                  <p className="text-cyan-400 text-xs font-semibold uppercase tracking-wide">Reserva</p>
                  <p className="text-white text-sm">
                    {new Date(selected.booking.startDate).toLocaleDateString('pt-BR')} → {new Date(selected.booking.endDate).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-slate-400 text-xs">Total: R$ {parseFloat(selected.booking.totalAmount || '0').toFixed(2)}</p>
                  <p className="text-slate-400 text-xs">Status: {selected.booking.verificationStatus}</p>
                </div>
                {/* Submission Info */}
                <div className="bg-slate-700/50 rounded-lg p-3 space-y-1">
                  <p className="text-cyan-400 text-xs font-semibold uppercase tracking-wide">Envio</p>
                  <p className="text-white text-sm">{new Date(selected.verification.lastSubmittedAt || selected.verification.createdAt).toLocaleString('pt-BR')}</p>
                  <p className="text-slate-400 text-xs">Tentativa #{selected.verification.submissionCount}</p>
                </div>
              </div>

              {/* Images */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm mb-2 flex items-center gap-1">
                    <FileText className="w-4 h-4" /> CNH
                  </p>
                  {selected.verification.cnhImageUrl ? (
                    <a href={selected.verification.cnhImageUrl} target="_blank" rel="noopener noreferrer">
                      <img
                              loading="lazy" src={selected.verification.cnhImageUrl} alt="CNH" className="w-full rounded-lg object-cover aspect-video border border-slate-600 hover:opacity-80 transition-opacity" />
                    </a>
                  ) : (
                    <div className="w-full aspect-video rounded-lg bg-slate-700 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-slate-500" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-2 flex items-center gap-1">
                    <User className="w-4 h-4" /> Selfie + CNH
                  </p>
                  {selected.verification.selfieImageUrl ? (
                    <a href={selected.verification.selfieImageUrl} target="_blank" rel="noopener noreferrer">
                      <img
                              loading="lazy" src={selected.verification.selfieImageUrl} alt="Selfie" className="w-full rounded-lg object-cover aspect-video border border-slate-600 hover:opacity-80 transition-opacity" />
                    </a>
                  ) : (
                    <div className="w-full aspect-video rounded-lg bg-slate-700 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-slate-500" />
                    </div>
                  )}
                </div>
              </div>

              {selected.verification.rejectionReason && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm">
                    <strong>Motivo da rejeição:</strong> {selected.verification.rejectionReason}
                  </p>
                </div>
              )}

              {/* Actions */}
              {selected.verification.status === "pending_review" && (
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    disabled={approve.isPending}
                    onClick={() => approve.mutate({ bookingId: selected.verification.bookingId })}
                  >
                    {approve.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Aprovar
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setShowRejectDialog(true)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeitar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Rejeitar Verificação</DialogTitle>
            <DialogDescription className="text-slate-400">
              Informe o motivo para que o locatário possa corrigir e reenviar.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Ex: Foto da CNH está borrada, CNH não visível na selfie..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" className="border-slate-600 text-slate-300" onClick={() => setShowRejectDialog(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || reject.isPending}
              onClick={() => selected && reject.mutate({ bookingId: selected.verification.bookingId, rejectionReason: rejectReason })}
            >
              {reject.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Owner Verifications Tab ──────────────────────────────────────────────────

function OwnerVerificationsTab() {
  const utils = trpc.useUtils();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const { data: pendingOwners, isLoading } =
    trpc.admin.getPendingOwnerVerifications.useQuery();

  const selected = pendingOwners?.find((o) => o.user.id === selectedUserId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: owner list */}
      <div className="lg:col-span-1">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              Proprietários Pendentes
            </CardTitle>
            <CardDescription>
              {pendingOwners?.length ?? 0} com documentos pendentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              </div>
            ) : !pendingOwners?.length ? (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-500" />
                <p>Nenhum proprietário pendente</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {pendingOwners.map((o) => (
                  <button
                    key={o.user.id}
                    onClick={() => setSelectedUserId(o.user.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedUserId === o.user.id
                        ? "bg-cyan-500/20 border-cyan-500"
                        : "bg-slate-700/50 border-slate-600 hover:border-slate-500"
                    }`}
                  >
                    <p className="font-semibold text-white text-sm">
                      {o.user.name}
                    </p>
                    <p className="text-xs text-slate-400">{o.user.email}</p>
                    <p className="text-xs text-cyan-400 mt-1">
                      {o.documents.length} documento(s) pendente(s)
                    </p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right: documents */}
      <div className="lg:col-span-2">
        {!selectedUserId ? (
          <Card className="bg-slate-800/50 border-slate-700 h-64 flex items-center justify-center">
            <CardContent>
              <p className="text-slate-400 text-center">
                Selecione um proprietário para revisar
              </p>
            </CardContent>
          </Card>
        ) : selected ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">
                {selected.user.name}
              </CardTitle>
              <CardDescription>{selected.user.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selected.documents.map((doc) => (
                <OwnerDocCard key={doc.id} doc={doc} adminId={selected.user.id} />
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminVerificationPanel() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-6">
            <p className="text-red-400">
              Acesso negado. Apenas administradores podem acessar este painel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-1">
            Painel de Verificação
          </h1>
          <p className="text-slate-400">
            Revise documentos de proprietários e veículos antes de publicar
          </p>
        </div>

        {/* Main tabs */}
        <Tabs defaultValue="bookings">
          <TabsList className="grid w-full max-w-3xl grid-cols-4 bg-slate-700 mb-6">
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Reservas
            </TabsTrigger>
            <TabsTrigger value="renters" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Locatários
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              Veículos
            </TabsTrigger>
            <TabsTrigger value="owners" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Proprietários
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <BookingsTab />
          </TabsContent>

          <TabsContent value="renters">
            <RenterVerificationsTab />
          </TabsContent>

          <TabsContent value="vehicles">
            <VehicleVerificationTab />
          </TabsContent>

          <TabsContent value="owners">
            <OwnerVerificationsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
