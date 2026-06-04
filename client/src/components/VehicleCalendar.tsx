/**
 * Vehicle Availability Calendar Component
 *
 * Fluxo do anfitrião:
 * 1. Clique numa data disponível → inicia seleção (highlight azul)
 * 2. Clique noutra data → define o range (highlight amarelo)
 * 3. Botão "Bloquear X dias" aparece na barra inferior → confirma o bloqueio
 * 4. Clique numa data bloqueada (amarela) → seleciona para desbloquear → botão "Desbloquear"
 *
 * Timezone fix:
 * - Todas as comparações usam dia UTC (toUtcDay) para evitar drift de fuso horário.
 * - O backend armazena datas como midnight UTC; o frontend usa datas locais.
 *   Comparar com startOfDay() (local) causava o bug onde o último dia não aparecia bloqueado.
 */

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Lock,
  Unlock,
  Info,
  Loader2,
  X,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export interface BookedPeriod {
  id: number;
  startDate: Date;
  endDate: Date;
  status:
    | "pending_payment"
    | "payment_failed"
    | "pending"
    | "awaiting_verification"
    | "pending_host_approval"
    | "confirmed"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "cancelled_by_renter"
    | "cancelled_by_host"
    | "disputed"
    | "rejected_verification";
  renterName?: string;
}

export interface BlockedPeriod {
  id: number;
  startDate: Date;
  endDate: Date;
  reason?: string;
}

interface VehicleCalendarProps {
  vehicleId: number;
  bookedPeriods: BookedPeriod[];
  blockedPeriods?: BlockedPeriod[];
  onBlockDates?: (startDate: Date, endDate: Date) => void;
  onUnblockDates?: (blockId: number) => void;
  isOwner?: boolean;
  onDateSelect?: (date: Date) => void;
  selectedStartDate?: Date | null;
  selectedEndDate?: Date | null;
  minDate?: Date;
  isLoadingAvailability?: boolean;
}

// ─── UTC day helpers ────────────────────────────────────────────────────────
// Convert any Date to a plain integer representing the UTC calendar day.
// e.g. 2026-05-24T00:00:00Z  →  20260524
//      2026-05-24T03:00:00Z  →  20260524  (Brazil UTC-3, same UTC day)
//      2026-05-23T21:00:00Z  →  20260523  (would be wrong with local startOfDay)
const toUtcDay = (d: Date): number => {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return y * 10000 + m * 100 + day;
};

// Convert a calendar-grid Date (local midnight) to its UTC day integer.
// date-fns eachDayOfInterval creates dates at local midnight, so we use
// getFullYear/getMonth/getDate (local) to get the visual day the user sees.
const toLocalDay = (d: Date): number => {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return y * 10000 + m * 100 + day;
};

// Is a calendar-grid date (local) within a period whose boundaries are UTC midnight?
const isDateInPeriod = (calDate: Date, period: { startDate: Date; endDate: Date }): boolean => {
  const calDay = toLocalDay(calDate);
  const startDay = toUtcDay(new Date(period.startDate));
  const endDay = toUtcDay(new Date(period.endDate));
  return calDay >= startDay && calDay <= endDay;
};

// Is a calendar-grid date strictly in the past (before today local)?
const isPast = (d: Date, minDate: Date): boolean => {
  return toLocalDay(d) < toLocalDay(minDate);
};
// ────────────────────────────────────────────────────────────────────────────

export default function VehicleCalendar({
  vehicleId,
  bookedPeriods,
  blockedPeriods = [],
  onBlockDates,
  onUnblockDates,
  isOwner = false,
  onDateSelect,
  selectedStartDate,
  selectedEndDate,
  minDate = new Date(),
  isLoadingAvailability = false,
}: VehicleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selStart, setSelStart] = useState<Date | null>(null);
  const [selEnd, setSelEnd] = useState<Date | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  // Generate days for the current month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDay = monthStart.getDay();
    const paddingDays: (Date | null)[] = Array(startDay).fill(null);
    return [...paddingDays, ...days];
  }, [currentMonth]);

  const getBookingForDate = (date: Date): BookedPeriod | null =>
    bookedPeriods.find((p) => isDateInPeriod(date, p)) || null;

  const getBlockForDate = (date: Date): BlockedPeriod | null =>
    blockedPeriods.find((p) => isDateInPeriod(date, p)) || null;

  // Determine the visual status of a calendar day
  const getDateStatus = (
    date: Date
  ): "booked" | "blocked" | "available" | "past" | "selected" | "renter-selected" => {
    if (isPast(date, minDate)) return "past";

    // Renter date-picker selection
    if (!isOwner) {
      if (selectedStartDate && selectedEndDate) {
        if (toLocalDay(date) >= toLocalDay(selectedStartDate) && toLocalDay(date) <= toLocalDay(selectedEndDate))
          return "renter-selected";
      } else if (selectedStartDate && isSameDay(date, selectedStartDate)) {
        return "renter-selected";
      }
    }

    const booking = getBookingForDate(date);
    if (booking && booking.status !== "cancelled" && booking.status !== "cancelled_by_renter" && booking.status !== "cancelled_by_host") return "booked";

    const block = getBlockForDate(date);
    if (block) return "blocked";

    // Owner selection highlight
    if (isOwner && selStart) {
      const anchor = selEnd ?? hoveredDate;
      if (anchor) {
        const lo = toLocalDay(selStart) <= toLocalDay(anchor) ? selStart : anchor;
        const hi = toLocalDay(selStart) <= toLocalDay(anchor) ? anchor : selStart;
        if (toLocalDay(date) >= toLocalDay(lo) && toLocalDay(date) <= toLocalDay(hi))
          return "selected";
      } else if (isSameDay(date, selStart)) {
        return "selected";
      }
    }

    return "available";
  };

  // Count days in the current owner selection
  const selectionDayCount = useMemo(() => {
    if (!selStart || !selEnd) return selStart ? 1 : 0;
    const lo = toLocalDay(selStart) <= toLocalDay(selEnd) ? selStart : selEnd;
    const hi = toLocalDay(selStart) <= toLocalDay(selEnd) ? selEnd : selStart;
    const loDay = toLocalDay(lo);
    const hiDay = toLocalDay(hi);
    // Simple count using local day integers (works for same month; for cross-month use date diff)
    const loDate = new Date(lo.getFullYear(), lo.getMonth(), lo.getDate());
    const hiDate = new Date(hi.getFullYear(), hi.getMonth(), hi.getDate());
    return Math.round((hiDate.getTime() - loDate.getTime()) / 86400000) + 1;
  }, [selStart, selEnd]);

  const handleDateClick = (date: Date) => {
    const status = getDateStatus(date);
    if (status === "past") return;

    if (!isOwner) {
      if (status !== "booked" && status !== "blocked") onDateSelect?.(date);
      return;
    }

    // Owner mode
    if (status === "booked") return; // can't select booked dates

    if (status === "blocked") {
      // Toggle blocked date into selection for unblocking
      const block = getBlockForDate(date);
      if (block) onUnblockDates?.(block.id);
      return;
    }

    // Available / selected: build range
    if (!selStart) {
      setSelStart(date);
      setSelEnd(null);
    } else if (!selEnd) {
      if (isSameDay(date, selStart)) {
        // Single day confirmed
        setSelEnd(date);
      } else {
        setSelEnd(date);
      }
    } else {
      // Reset and start new selection
      setSelStart(date);
      setSelEnd(null);
    }
  };

  const handleConfirmBlock = () => {
    if (!selStart) return;
    const end = selEnd ?? selStart;
    const lo = toLocalDay(selStart) <= toLocalDay(end) ? selStart : end;
    const hi = toLocalDay(selStart) <= toLocalDay(end) ? end : selStart;
    // Send as UTC midnight strings to avoid timezone issues
    const toUtcMidnight = (d: Date) =>
      new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString();
    onBlockDates?.(new Date(toUtcMidnight(lo)), new Date(toUtcMidnight(hi)));
    setSelStart(null);
    setSelEnd(null);
  };

  const handleCancelSelection = () => {
    setSelStart(null);
    setSelEnd(null);
  };

  const getDateClasses = (date: Date): string => {
    const status = getDateStatus(date);
    const base =
      "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all relative select-none";

    switch (status) {
      case "past":
        return `${base} text-gray-600 cursor-not-allowed opacity-40`;
      case "booked":
        return `${base} bg-red-500/20 text-red-400 border border-red-500/30 cursor-not-allowed`;
      case "blocked":
        return `${base} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 ${
          isOwner ? "cursor-pointer hover:bg-red-500/30 hover:border-red-500/50 hover:text-red-300" : "cursor-not-allowed"
        }`;
      case "selected":
        return `${base} bg-cyan-500/30 text-cyan-200 border border-cyan-500/60 cursor-pointer`;
      case "renter-selected":
        return `${base} bg-cyan-500 text-black font-bold cursor-pointer`;
      case "available":
      default:
        return `${base} bg-white/5 text-white border border-transparent ${
          isOwner
            ? "cursor-pointer hover:bg-cyan-500/20 hover:border-cyan-500/40 active:scale-95"
            : "cursor-pointer hover:bg-cyan-500/20 hover:border-cyan-500/50"
        }`;
    }
  };

  // Highlight the anchor (first click) with a stronger style
  const isAnchor = (date: Date) =>
    isOwner && selStart && isSameDay(date, selStart);

  const getTooltipContent = (date: Date): string | null => {
    const booking = getBookingForDate(date);
    if (booking) {
      const statusText: Record<string, string> = {
        pending_payment: "Pagamento Pendente",
        pending: "Pendente",
        awaiting_verification: "Aguardando Verificação",
        pending_host_approval: "Aguardando Aprovação",
        confirmed: "Confirmada",
        in_progress: "Em andamento",
        completed: "Concluída",
        cancelled: "Cancelada",
        cancelled_by_renter: "Cancelada pelo Locatário",
        cancelled_by_host: "Cancelada pelo Proprietário",
        disputed: "Em Disputa",
        rejected_verification: "Verificação Rejeitada",
      };
      const label = statusText[booking.status] ?? booking.status;
      return isOwner && booking.renterName ? `Reserva ${label} — ${booking.renterName}` : `Reserva ${label}`;
    }
    const block = getBlockForDate(date);
    if (block) {
      const reason = block.reason ?? "Bloqueado pelo proprietário";
      return isOwner ? `${reason} — Toque para desbloquear` : reason;
    }
    return null;
  };

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Disponibilidade
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="text-gray-400 hover:text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="text-white font-medium min-w-[140px] text-center">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="text-gray-400 hover:text-white hover:bg-white/10"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoadingAvailability ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="w-10 h-8 flex items-center justify-center text-xs font-medium text-gray-400"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (!day) return <div key={`empty-${index}`} className="w-10 h-10" />;
                const tooltip = getTooltipContent(day);
                const anchor = isAnchor(day);
                return (
                  <div
                    key={day.toISOString()}
                    className="relative group"
                    onMouseEnter={() => setHoveredDate(day)}
                    onMouseLeave={() => setHoveredDate(null)}
                  >
                    <div
                      className={`${getDateClasses(day)}${anchor ? " ring-2 ring-cyan-400 font-bold" : ""}`}
                      onClick={() => handleDateClick(day)}
                    >
                      {format(day, "d")}
                      {isToday(day) && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400" />
                      )}
                    </div>
                    {/* Tooltip — desktop only */}
                    {tooltip && hoveredDate && isSameDay(hoveredDate, day) && (
                      <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 border border-white/20 rounded-lg text-xs text-white whitespace-nowrap z-50 shadow-lg">
                        {tooltip}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-white/5 border border-white/20" />
                <span className="text-xs text-gray-400">Disponível</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30" />
                <span className="text-xs text-gray-400">Reservado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500/30" />
                <span className="text-xs text-gray-400">Bloqueado</span>
              </div>
              {isOwner && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-cyan-500/30 border border-cyan-500/60" />
                  <span className="text-xs text-gray-400">Selecionado</span>
                </div>
              )}
            </div>

            {/* Owner action bar */}
            {isOwner && (
              <div className="mt-4 pt-4 border-t border-white/10">
                {selStart ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-cyan-300 flex items-center gap-2">
                      <Lock className="w-4 h-4 shrink-0" />
                      {selEnd
                        ? `${selectionDayCount} dia${selectionDayCount > 1 ? "s" : ""} selecionado${selectionDayCount > 1 ? "s" : ""}`
                        : `${format(selStart, "dd/MM")} — selecione a data final`}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelSelection}
                        className="text-gray-400 hover:text-white text-xs px-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      {(selEnd || selStart) && (
                        <Button
                          size="sm"
                          onClick={handleConfirmBlock}
                          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold text-xs"
                        >
                          <Lock className="w-3 h-3 mr-1" />
                          Bloquear{selectionDayCount > 1 ? ` ${selectionDayCount} dias` : ""}
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>
                      Toque nas datas <span className="text-white">disponíveis</span> para selecionar •{" "}
                      <span className="text-yellow-400">Amarelo</span> = toque para desbloquear
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Booking summary */}
        {!isLoadingAvailability && bookedPeriods.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <h4 className="text-sm font-medium text-white mb-3">Próximas Reservas</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {bookedPeriods
                .filter(
                  (p) =>
                    p.status !== "cancelled" &&
                    p.status !== "cancelled_by_renter" &&
                    p.status !== "cancelled_by_host" &&
                    new Date(p.endDate) >= new Date()
                )
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .slice(0, 5)
                .map((period) => (
                  <div
                    key={period.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          period.status === "confirmed"
                            ? "bg-green-400"
                            : period.status === "in_progress"
                            ? "bg-blue-400"
                            : "bg-yellow-400"
                        }`}
                      />
                      <span className="text-sm text-white">
                        {format(new Date(period.startDate), "dd/MM")} —{" "}
                        {format(new Date(period.endDate), "dd/MM")}
                      </span>
                    </div>
                    <Badge
                      className={`text-xs ${
                        period.status === "confirmed"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : period.status === "in_progress"
                          ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                      }`}
                    >
                      {period.status === "confirmed"
                        ? "Confirmada"
                        : period.status === "in_progress"
                        ? "Em andamento"
                        : period.status === "pending"
                        ? "Pendente"
                        : period.status}
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
