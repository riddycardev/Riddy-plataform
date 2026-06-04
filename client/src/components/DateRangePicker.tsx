/**
 * DateRangePicker Component
 * Seletor de datas interativo para reservas
 */

import { useState } from "react";
import { format, addDays, isBefore, isAfter, isSameDay, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  unavailableDates?: Date[];
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  unavailableDates = [],
  minDate = new Date(),
  maxDate = addDays(new Date(), 365),
  className,
}: DateRangePickerProps) {
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);

  const isDateUnavailable = (date: Date) => {
    return unavailableDates.some(unavailable => isSameDay(date, unavailable));
  };

  const isDateDisabled = (date: Date) => {
    const today = startOfDay(new Date());
    if (isBefore(date, today)) return true;
    if (minDate && isBefore(date, startOfDay(minDate))) return true;
    if (maxDate && isAfter(date, startOfDay(maxDate))) return true;
    if (isDateUnavailable(date)) return true;
    return false;
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    onStartDateChange(date);
    setIsStartOpen(false);
    if (date && endDate && isBefore(endDate, date)) {
      onEndDateChange(undefined);
    }
    // Auto-open end date picker
    setTimeout(() => setIsEndOpen(true), 200);
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    onEndDateChange(date);
    setIsEndOpen(false);
  };

  const getDaysBetween = () => {
    if (!startDate || !endDate) return 0;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className={cn("flex gap-2 w-full", className)}>
      {/* Start Date Picker */}
      <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "flex-1 min-w-0 justify-start text-left font-normal bg-white/5 border-white/10 text-white hover:bg-white/10 truncate",
              !startDate && "text-gray-400"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-cyan-400" />
            {startDate ? (
              format(startDate, "dd MMM yyyy", { locale: ptBR })
            ) : (
              <span>Data início</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-[#0F1629] border-white/10" align="start">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={handleStartDateSelect}
            disabled={isDateDisabled}
            initialFocus
            locale={ptBR}
            className="bg-[#0F1629] text-white"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center text-white",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white hover:bg-white/10 rounded",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-cyan-500/20 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-white/10 rounded-md text-white",
              day_selected: "bg-cyan-500 text-black hover:bg-cyan-600 hover:text-black focus:bg-cyan-500 focus:text-black",
              day_today: "bg-white/10 text-cyan-400",
              day_outside: "text-gray-600 opacity-50",
              day_disabled: "text-gray-600 opacity-50 cursor-not-allowed",
              day_range_middle: "aria-selected:bg-cyan-500/20 aria-selected:text-white",
              day_hidden: "invisible",
            }}

          />
          {/* Legend */}
          <div className="p-3 border-t border-white/10">
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-cyan-500" />
                <span>Selecionado</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500/50" />
                <span>Indisponível</span>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* End Date Picker */}
      <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "flex-1 min-w-0 justify-start text-left font-normal bg-white/5 border-white/10 text-white hover:bg-white/10 truncate",
              !endDate && "text-gray-400"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-cyan-400" />
            {endDate ? (
              format(endDate, "dd MMM yyyy", { locale: ptBR })
            ) : (
              <span>Data fim</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-[#0F1629] border-white/10" align="start">
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={handleEndDateSelect}
            disabled={(date) => {
              if (isDateDisabled(date)) return true;
              if (startDate && isBefore(date, startDate)) return true;
              return false;
            }}
            initialFocus
            locale={ptBR}
            defaultMonth={startDate}
            className="bg-[#0F1629] text-white"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center text-white",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white hover:bg-white/10 rounded",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-cyan-500/20 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-white/10 rounded-md text-white",
              day_selected: "bg-cyan-500 text-black hover:bg-cyan-600 hover:text-black focus:bg-cyan-500 focus:text-black",
              day_today: "bg-white/10 text-cyan-400",
              day_outside: "text-gray-600 opacity-50",
              day_disabled: "text-gray-600 opacity-50 cursor-not-allowed",
              day_range_middle: "aria-selected:bg-cyan-500/20 aria-selected:text-white",
              day_hidden: "invisible",
            }}

          />
        </PopoverContent>
      </Popover>

      {/* Days Count Badge */}
      {startDate && endDate && (
        <div className="flex items-center px-3 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg">
          <span className="text-sm font-medium text-cyan-400">
            {getDaysBetween()} {getDaysBetween() === 1 ? 'dia' : 'dias'}
          </span>
        </div>
      )}
    </div>
  );
}
