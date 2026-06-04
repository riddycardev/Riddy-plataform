/**
 * Documents Page
 * User document management for KYC verification - DADOS REAIS
 */

import { useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertCircle,
  Camera,
  CreditCard,
  Home,
  User,
  Loader2
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Document type configuration
const documentConfig: Record<string, { label: string; description: string; icon: typeof CreditCard }> = {
  cnh_front: {
    label: "CNH - Frente",
    description: "Foto da frente da sua Carteira Nacional de Habilitação",
    icon: CreditCard
  },
  cnh_back: {
    label: "CNH - Verso",
    description: "Foto do verso da sua Carteira Nacional de Habilitação",
    icon: CreditCard
  },
  selfie: {
    label: "Selfie com Documento",
    description: "Foto sua segurando a CNH ao lado do rosto",
    icon: Camera
  },
  proof_of_address: {
    label: "Comprovante de Residência",
    description: "Conta de luz, água ou telefone dos últimos 3 meses",
    icon: Home
  },
  facial_recognition: {
    label: "Reconhecimento Facial",
    description: "Verificação facial para maior segurança",
    icon: User
  },
  vehicle_document: {
    label: "Documento do Veículo",
    description: "CRLV ou documento de propriedade do veículo",
    icon: FileText
  },
  insurance: {
    label: "Seguro do Veículo",
    description: "Apólice de seguro válida",
    icon: FileText
  }
};

// Required documents for renters
const requiredDocuments = ["cnh_front", "cnh_back", "selfie", "proof_of_address"];

export default function Documents() {
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingDocTypeRef = useRef<string | null>(null);

  // Fetch real documents from database
  const { data: documents, isLoading } = trpc.user.getDocuments.useQuery();

  const utils = trpc.useUtils();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprovado
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Em Análise
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
            Não Enviado
          </Badge>
        );
    }
  };

  // Calculate verification progress
  const getDocumentStatus = (docType: string) => {
    const doc = documents?.find((d: { documentType: string; status: string }) => d.documentType === docType);
    return doc?.status || "not_uploaded";
  };

  const getDocumentUploadDate = (docType: string) => {
    const doc = documents?.find((d: { documentType: string; createdAt: Date }) => d.documentType === docType);
    return doc?.createdAt;
  };

  const approvedCount = requiredDocuments.filter(type => getDocumentStatus(type) === "approved").length;
  const totalRequired = requiredDocuments.length;
  const verificationProgress = (approvedCount / totalRequired) * 100;

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const docType = pendingDocTypeRef.current;
    // Reset input so same file can be re-selected if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file || !docType) return;

    setUploadError(null);

    // ── Client-side validation ──────────────────────────────────────────────
    const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    if (!ALLOWED.includes(file.type)) {
      setUploadError("Tipo de arquivo não permitido. Use JPG, PNG, WEBP ou PDF.");
      setUploadingType(null);
      return;
    }
    const MAX_MB = 10;
    if (file.size > MAX_MB * 1024 * 1024) {
      setUploadError(`Arquivo muito grande. Máximo: ${MAX_MB}MB. Tamanho: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      setUploadingType(null);
      return;
    }

    setUploadingType(docType);

    try {
      // ── Build multipart form data ─────────────────────────────────────────
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", docType);

      // ── POST to /api/upload/document ──────────────────────────────────────
      const response = await fetch("/api/upload/document", {
        method: "POST",
        credentials: "include", // send session cookie
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Erro ao enviar documento.");
      }

      // ── Invalidate query so list refreshes ────────────────────────────────
      await utils.user.getDocuments.invalidate();
    } catch (err: any) {
      setUploadError(err?.message ?? "Erro ao enviar documento. Tente novamente.");
    } finally {
      setUploadingType(null);
      pendingDocTypeRef.current = null;
    }
  };

  const handleUpload = (docType: string) => {
    pendingDocTypeRef.current = docType;
    fileInputRef.current?.click();
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
      {/* Hidden file input — triggered programmatically by handleUpload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={handleFileSelected}
      />

      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            Meus Documentos
          </h1>
          <p className="text-gray-400">
            Envie seus documentos para verificação e desbloqueie todas as funcionalidades.
          </p>
        </div>

        {/* Upload error banner */}
        {uploadError && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-white font-medium">Erro no upload</p>
              <p className="text-sm text-red-300">{uploadError}</p>
            </div>
            <button
              className="ml-auto text-gray-400 hover:text-white"
              onClick={() => setUploadError(null)}
            >
              ×
            </button>
          </div>
        )}

        {/* Verification Progress */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Progresso da Verificação</h3>
                <p className="text-sm text-gray-400">
                  {approvedCount} de {totalRequired} documentos aprovados
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-cyan-400">{Math.round(verificationProgress)}%</span>
              </div>
            </div>
            <Progress value={verificationProgress} className="h-2" />
            
            {verificationProgress < 100 && (
              <div className="mt-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Verificação Incompleta</p>
                    <p className="text-sm text-gray-400">
                      Complete sua verificação para poder alugar veículos na plataforma.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {verificationProgress === 100 && (
              <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Verificação Completa!</p>
                    <p className="text-sm text-gray-400">
                      Você está verificado e pode alugar qualquer veículo na plataforma.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Documentos Necessários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requiredDocuments.map((docType) => {
                const config = documentConfig[docType];
                const status = getDocumentStatus(docType);
                const uploadDate = getDocumentUploadDate(docType);
                const IconComponent = config?.icon || FileText;
                const isUploading = uploadingType === docType;

                return (
                  <div 
                    key={docType}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{config?.label || docType}</h4>
                        <p className="text-sm text-gray-400">{config?.description || ""}</p>
                        {uploadDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            Enviado em {format(new Date(uploadDate), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(status)}
                      {status === "not_uploaded" && (
                        <Button 
                          className="bg-gradient-to-r from-cyan-500 to-teal-500 text-black"
                          onClick={() => handleUpload(docType)}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          Enviar
                        </Button>
                      )}
                      {status === "rejected" && (
                        <Button 
                          className="bg-gradient-to-r from-cyan-500 to-teal-500 text-black"
                          onClick={() => handleUpload(docType)}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          Reenviar
                        </Button>
                      )}
                      {status === "approved" && (
                        <Button variant="ghost" className="text-gray-400 hover:text-white">
                          Ver
                        </Button>
                      )}
                      {status === "pending" && (
                        <Button variant="ghost" className="text-gray-400 hover:text-white">
                          Ver
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Facial Recognition Section */}
        <Card className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border-cyan-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <Camera className="w-8 h-8 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  Reconhecimento Facial
                </h3>
                <p className="text-gray-400">
                  Complete a verificação facial para aumentar sua segurança e desbloquear reservas instantâneas.
                </p>
              </div>
              <Button className="bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-semibold">
                Iniciar Verificação
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
