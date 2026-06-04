/**
 * Componente de input de data com máscara e validação no padrão brasileiro
 * Formato: dd/mm/aaaa
 */

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Calendar } from 'lucide-react';
import { 
  formatDateBR, 
  isValidDateFormatBR, 
  parseDateBR,
  isDateNotInPast,
  isDateInRange
} from '@/lib/dateUtils';

interface DateInputBRProps {
  label?: string;
  value: string; // Formato ISO (yyyy-mm-dd) ou vazio
  onChange: (value: string) => void; // Retorna formato ISO (yyyy-mm-dd)
  placeholder?: string;
  minDate?: string; // Formato ISO (yyyy-mm-dd)
  maxDate?: string; // Formato ISO (yyyy-mm-dd)
  disabled?: boolean;
  error?: string;
  required?: boolean;
  className?: string;
  disabledDates?: string[]; // Array de datas ISO desabilitadas
  showCalendar?: boolean;
}

export default function DateInputBR({
  label,
  value,
  onChange,
  placeholder = "dd/mm/aaaa",
  minDate,
  maxDate,
  disabled = false,
  error,
  required = false,
  className = "",
  disabledDates = [],
  showCalendar = false,
}: DateInputBRProps) {
  const [displayValue, setDisplayValue] = useState(formatDateBR(value));
  const [internalError, setInternalError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Atualiza display quando value muda externamente
  useEffect(() => {
    setDisplayValue(formatDateBR(value));
  }, [value]);

  /**
   * Aplica máscara ao input: dd/mm/aaaa
   */
  const applyMask = (input: string): string => {
    // Remove tudo que não é número
    const numbers = input.replace(/\D/g, '');
    
    if (numbers.length === 0) return '';
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  };

  /**
   * Valida a data e retorna mensagem de erro se houver
   */
  const validateDate = (dateStr: string): string => {
    if (!dateStr) {
      return required ? "Data é obrigatória" : "";
    }

    // Valida formato
    if (!isValidDateFormatBR(dateStr)) {
      return "Formato inválido. Use dd/mm/aaaa";
    }

    // Converte para ISO para comparações
    const isoDate = parseDateBR(dateStr);

    // Valida se não está no passado
    if (!isDateNotInPast(isoDate)) {
      return "Data não pode ser no passado";
    }

    // Valida intervalo
    if (minDate && maxDate) {
      if (!isDateInRange(isoDate, minDate, maxDate)) {
        return `Data deve estar entre ${formatDateBR(minDate)} e ${formatDateBR(maxDate)}`;
      }
    } else if (minDate) {
      const minDateObj = new Date(minDate);
      const selectedDateObj = new Date(isoDate);
      if (selectedDateObj < minDateObj) {
        return `Data deve ser a partir de ${formatDateBR(minDate)}`;
      }
    } else if (maxDate) {
      const maxDateObj = new Date(maxDate);
      const selectedDateObj = new Date(isoDate);
      if (selectedDateObj > maxDateObj) {
        return `Data deve ser até ${formatDateBR(maxDate)}`;
      }
    }

    // Valida datas desabilitadas
    if (disabledDates.includes(isoDate)) {
      return "Esta data não está disponível";
    }

    return "";
  };

  /**
   * Manipula mudanças no input
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const masked = applyMask(input);
    setDisplayValue(masked);

    // Se completou o formato dd/mm/aaaa, valida e converte
    if (masked.length === 10) {
      const validationError = validateDate(masked);
      setInternalError(validationError);

      if (!validationError) {
        const isoDate = parseDateBR(masked);
        onChange(isoDate);
      }
    } else {
      setInternalError("");
    }
  };

  /**
   * Manipula blur (saída do input)
   */
  const handleBlur = () => {
    if (displayValue && displayValue.length === 10) {
      const validationError = validateDate(displayValue);
      setInternalError(validationError);

      if (!validationError) {
        const isoDate = parseDateBR(displayValue);
        onChange(isoDate);
      }
    } else if (displayValue && displayValue.length < 10) {
      setInternalError("Data incompleta");
    }
  };

  /**
   * Manipula tecla Enter
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  const finalError = error || internalError;
  const isError = !!finalError;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label className={`text-sm font-medium ${isError ? 'text-red-500' : 'text-gray-700'}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            placeholder={placeholder}
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            maxLength={10}
            className={`pl-10 ${
              isError
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-cyan-500 focus:ring-cyan-500'
            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
          />
        </div>

        {/* Ícone de erro */}
        {isError && (
          <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500" />
        )}
      </div>

      {/* Mensagem de erro */}
      {finalError && (
        <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
          <AlertCircle className="w-4 h-4" />
          <span>{finalError}</span>
        </div>
      )}

      {/* Dica de formato */}
      {!finalError && !displayValue && (
        <p className="text-xs text-gray-500 mt-1">
          Formato: dd/mm/aaaa (ex: 25/03/2026)
        </p>
      )}
    </div>
  );
}
