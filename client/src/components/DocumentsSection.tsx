/**
 * DocumentsSection - Seção de documentos do Host Dashboard
 * Extraído como componente separado para evitar hooks condicionais
 */

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DocumentsSection() {
  const { data: hostDocuments, isLoading: loadingDocuments } =
    trpc.vehicle.getHostDocuments.useQuery();

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      crlv: "CRLV",
      insurance: "Seguro",
      inspection_report: "Laudo de Vistoria",
      ownership_proof: "Comprovante de Propriedade",
      maintenance_history: "Histórico de Manutenção",
    };
    return labels[type] || type;
  };

  const getStatusBadge = (expiresAt: Date | null, status: string) => {
    if (status === "rejected") {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejeitado</Badge>
      );
    }
    if (status === "pending") {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendente</Badge>
      );
    }
    if (!expiresAt) {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Válido</Badge>
      );
    }

    const now = new Date();
    const expires = new Date(expiresAt);
    const daysUntilExpiry = Math.floor(
      (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Vencido</Badge>
      );
    } else if (daysUntilExpiry < 30) {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Vencendo</Badge>
      );
    } else {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Válido</Badge>
      );
    }
  };

  return (
    <Card className="bg-slate-900/50 border-emerald-500/20">
      <CardHeader>
        <CardTitle className="text-white">Documentos dos Veículos</CardTitle>
      </CardHeader>
      <CardContent>
        {loadingDocuments ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          </div>
        ) : hostDocuments && hostDocuments.length > 0 ? (
          <div className="space-y-3">
            {hostDocuments.map((doc) => (
              <div
                key={doc.id}
                className="p-4 bg-slate-800/50 rounded-lg border border-emerald-500/10 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-white">
                    {getDocumentTypeLabel(doc.documentType)} - {doc.vehicleBrand} {doc.vehicleModel}
                  </p>
                  <p className="text-sm text-gray-400">Placa: {doc.vehicleLicensePlate}</p>
                  {doc.expiresAt && (
                    <p className="text-sm text-gray-400">
                      Vencimento:{" "}
                      {format(new Date(doc.expiresAt), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  )}
                </div>
                {getStatusBadge(doc.expiresAt, doc.status)}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-emerald-400/50 mx-auto mb-3" />
            <p className="text-gray-400">Nenhum documento cadastrado</p>
            <p className="text-sm text-gray-500 mt-2">
              Faça upload dos documentos dos seus veículos
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
