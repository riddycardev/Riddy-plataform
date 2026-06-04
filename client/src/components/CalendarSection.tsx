/**
 * CalendarSection - Seção de calendário do Host Dashboard
 * Extraído como componente separado para evitar hooks condicionais
 *
 * Bug fixes:
 * 1. Primeiro veículo não carregava: useState inicializa antes de myVehicles chegar.
 *    Solução: useEffect que seta o primeiro veículo quando myVehicles é carregado.
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import VehicleCalendar from "@/components/VehicleCalendar";

interface Vehicle {
  id: number;
  brand: string;
  model: string;
  licensePlate: string;
}

interface CalendarSectionProps {
  myVehicles: Vehicle[] | undefined;
  loadingVehicles: boolean;
}

export default function CalendarSection({ myVehicles, loadingVehicles }: CalendarSectionProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  // Fix bug #1: quando myVehicles chega (assíncrono), seleciona o primeiro veículo automaticamente
  useEffect(() => {
    if (myVehicles && myVehicles.length > 0 && selectedVehicleId === null) {
      setSelectedVehicleId(myVehicles[0].id);
    }
  }, [myVehicles, selectedVehicleId]);

  const { data: availability, isLoading: loadingAvailability, refetch: refetchAvailability } =
    trpc.vehicle.getAvailability.useQuery(
      { vehicleId: selectedVehicleId! },
      { enabled: !!selectedVehicleId }
    );

  const blockDatesMutation = trpc.vehicle.blockDates.useMutation({
    onSuccess: () => {
      refetchAvailability();
      toast.success("Datas bloqueadas com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao bloquear datas", { description: error.message });
    },
  });

  const unblockDatesMutation = trpc.vehicle.unblockDates.useMutation({
    onSuccess: () => {
      refetchAvailability();
      toast.success("Datas desbloqueadas com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao desbloquear datas", { description: error.message });
    },
  });

  const handleBlockDates = (startDate: Date, endDate: Date) => {
    if (!selectedVehicleId) return;
    // startDate and endDate are already UTC midnight (set by VehicleCalendar.handleConfirmBlock)
    blockDatesMutation.mutate({
      vehicleId: selectedVehicleId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  };

  const handleUnblockDates = (blockId: number) => {
    if (!selectedVehicleId) return;
    const blockedPeriod = availability?.blockedPeriods.find((p) => p.id === blockId);
    if (!blockedPeriod) return;

    unblockDatesMutation.mutate({
      vehicleId: selectedVehicleId,
      startDate: new Date(blockedPeriod.startDate).toISOString(),
      endDate: new Date(blockedPeriod.endDate).toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Vehicle selector — mostra sempre se há mais de 1 veículo */}
      {myVehicles && myVehicles.length > 1 && (
        <Card className="bg-slate-900/50 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-400">Selecione o veículo:</label>
              <select
                value={selectedVehicleId ?? ""}
                onChange={(e) => setSelectedVehicleId(Number(e.target.value))}
                className="flex-1 bg-slate-800 border border-emerald-500/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                style={{ fontSize: 16 }}
              >
                {myVehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar */}
      {loadingVehicles ? (
        <Card className="bg-slate-900/50 border-emerald-500/20">
          <CardContent className="p-12">
            <div className="flex justify-center">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
          </CardContent>
        </Card>
      ) : myVehicles && myVehicles.length > 0 && selectedVehicleId ? (
        <VehicleCalendar
          vehicleId={selectedVehicleId}
          bookedPeriods={availability?.bookedPeriods || []}
          blockedPeriods={availability?.blockedPeriods || []}
          onBlockDates={handleBlockDates}
          onUnblockDates={handleUnblockDates}
          isOwner={true}
          isLoadingAvailability={loadingAvailability}
        />
      ) : (
        <Card className="bg-slate-900/50 border-emerald-500/20">
          <CardContent className="p-12">
            <div className="text-center">
              <Calendar className="w-12 h-12 text-emerald-400/50 mx-auto mb-3" />
              <p className="text-gray-400">Nenhum veículo cadastrado</p>
              <p className="text-sm text-gray-500 mt-2">
                Cadastre um veículo para gerenciar disponibilidade
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
