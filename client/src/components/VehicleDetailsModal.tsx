/**
 * Vehicle Details Modal Component
 * Shows complete vehicle information, documents, and owner details for admin review
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Car, 
  FileText, 
  User, 
  MapPin, 
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { trpc } from "@/lib/trpc";

interface VehicleDetailsModalProps {
  vehicle: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (vehicleId: number) => void;
  onReject: (vehicleId: number) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
}

export default function VehicleDetailsModal({
  vehicle,
  open,
  onOpenChange,
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false,
}: VehicleDetailsModalProps) {
  if (!vehicle) return null;
  
  // Fetch complete vehicle details with images
  const { data: vehicleDetails, isLoading: loadingVehicle } = trpc.vehicle.getById.useQuery(
    { id: vehicle.id },
    { enabled: open && !!vehicle.id }
  );
  
  // Fetch owner documents
  const { data: ownerDocuments, isLoading: loadingDocs } = trpc.vehicle.getOwnerDocuments.useQuery(
    { vehicleId: vehicle.id },
    { enabled: open && !!vehicle.id }
  );
  
  // Use vehicleDetails if available, fallback to vehicle prop
  const displayVehicle = vehicleDetails || vehicle;
  
  const cnhDoc = ownerDocuments?.find(doc => doc.documentType === "cnh_front");
  const proofDoc = ownerDocuments?.find(doc => doc.documentType === "proof_of_address");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0A0F1C] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
            <Car className="w-6 h-6 text-cyan-400" />
            {displayVehicle.brand} {displayVehicle.model} {displayVehicle.year}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/5">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="photos">Fotos</TabsTrigger>
            <TabsTrigger value="vehicle-docs">Docs Veículo</TabsTrigger>
            <TabsTrigger value="owner-docs">Docs Proprietário</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6 mt-6">
            {/* Vehicle Info */}
            <div className="bg-white/5 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-cyan-400" />
                Informações do Veículo
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Marca</p>
                  <p className="text-white font-medium">{displayVehicle.brand}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Modelo</p>
                  <p className="text-white font-medium">{displayVehicle.model}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Ano</p>
                  <p className="text-white font-medium">{displayVehicle.year}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Cor</p>
                  <p className="text-white font-medium">{displayVehicle.color || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Placa</p>
                  <p className="text-white font-medium">{displayVehicle.licensePlate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Categoria</p>
                  <Badge className="bg-cyan-500/20 text-cyan-400">
                    {displayVehicle.category}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Diária</p>
                  <p className="text-white font-medium flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    R$ {parseFloat(displayVehicle.dailyPrice || "0").toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <Badge className={
                    displayVehicle.status === "active" 
                      ? "bg-green-500/20 text-green-400"
                      : displayVehicle.status === "pending_approval"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                  }>
                    {displayVehicle.status === "active" ? "Ativo" : displayVehicle.status === "pending_approval" ? "Pendente" : "Inativo"}
                  </Badge>
                </div>
              </div>

              {displayVehicle.description && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Descrição</p>
                  <p className="text-white">{displayVehicle.description}</p>
                </div>
              )}
            </div>

            {/* Location */}
            <div className="bg-white/5 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                Localização
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Cidade</p>
                  <p className="text-white font-medium">{displayVehicle.pickupCity || displayVehicle.city}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Estado</p>
                  <p className="text-white font-medium">{displayVehicle.pickupState || displayVehicle.state}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-400">Endereço de Retirada</p>
                  <p className="text-white font-medium">{displayVehicle.pickupAddress}</p>
                </div>
              </div>
            </div>

            {/* Owner Info */}
            <div className="bg-white/5 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" />
                Proprietário
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Nome</p>
                  <p className="text-white font-medium">{displayVehicle.ownerName || "Não disponível"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Cadastrado em</p>
                  <p className="text-white font-medium flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {displayVehicle.createdAt ? format(new Date(displayVehicle.createdAt), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="space-y-4 mt-6">
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Fotos do Veículo</h3>
              
              {displayVehicle.images && displayVehicle.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {displayVehicle.images.map((image: any, index: number) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-white/10">
                      <img
                              loading="lazy" 
                        src={image.imageUrl} 
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              ) : displayVehicle.mainImageUrl ? (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-white/10">
                  <img
                              loading="lazy" 
                    src={displayVehicle.mainImageUrl} 
                    alt="Foto principal"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">Nenhuma foto disponível</p>
              )}
            </div>
          </TabsContent>

          {/* Vehicle Documents Tab */}
          <TabsContent value="vehicle-docs" className="space-y-4 mt-6">
            <div className="bg-white/5 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                Documentos do Veículo
              </h3>

              {/* CRLV */}
              <div className="border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-medium">CRLV (Documento do Veículo)</p>
                  {displayVehicle.crlvUrl ? (
                    <Badge className="bg-green-500/20 text-green-400">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Enviado
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-400">
                      <XCircle className="w-3 h-3 mr-1" />
                      Não enviado
                    </Badge>
                  )}
                </div>
                {displayVehicle.crlvUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(displayVehicle.crlvUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visualizar CRLV
                  </Button>
                )}
              </div>

              {/* Insurance */}
              <div className="border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-medium">Seguro (Opcional)</p>
                  {displayVehicle.insuranceUrl ? (
                    <Badge className="bg-green-500/20 text-green-400">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Enviado
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-500/20 text-gray-400">
                      Não enviado
                    </Badge>
                  )}
                </div>
                {displayVehicle.insuranceUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(displayVehicle.insuranceUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visualizar Seguro
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Owner Documents Tab */}
          <TabsContent value="owner-docs" className="space-y-4 mt-6">
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-cyan-400" />
                Documentos do Proprietário
              </h3>
              
              {loadingDocs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* CNH */}
                  <div className="border border-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-medium">CNH (Carteira Nacional de Habilitação)</p>
                      {cnhDoc ? (
                        <Badge className="bg-green-500/20 text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Enviado
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/20 text-red-400">
                          <XCircle className="w-3 h-3 mr-1" />
                          Não enviado
                        </Badge>
                      )}
                    </div>
                    {cnhDoc && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(cnhDoc.fileUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Visualizar CNH
                      </Button>
                    )}
                  </div>

                  {/* Proof of Address */}
                  <div className="border border-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-medium">Comprovante de Residência</p>
                      {proofDoc ? (
                        <Badge className="bg-green-500/20 text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Enviado
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/20 text-red-400">
                          <XCircle className="w-3 h-3 mr-1" />
                          Não enviado
                        </Badge>
                      )}
                    </div>
                    {proofDoc && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(proofDoc.fileUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Visualizar Comprovante
                      </Button>
                    )}
                  </div>
                  
                  {!cnhDoc && !proofDoc && (
                    <p className="text-gray-400 text-center py-4">
                      Nenhum documento pessoal enviado
                    </p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        {displayVehicle.status === "pending_approval" && (
          <div className="flex gap-3 pt-4 border-t border-white/10 relative z-[60]">
            <Button
              className="flex-1 bg-green-500 hover:bg-green-600 text-white pointer-events-auto cursor-pointer"
              onClick={() => onApprove(displayVehicle.id)}
              disabled={isApproving || isRejecting}
              type="button"
            >
              {isApproving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Aprovar Veículo
            </Button>
            <Button
              variant="destructive"
              className="flex-1 pointer-events-auto cursor-pointer"
              onClick={() => onReject(displayVehicle.id)}
              disabled={isApproving || isRejecting}
              type="button"
            >
              {isRejecting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Rejeitar Veículo
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
