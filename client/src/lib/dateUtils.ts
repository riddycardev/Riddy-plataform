/**
 * Utilitários para manipulação de datas no padrão brasileiro (dd/mm/aaaa)
 * Centraliza toda a lógica de formatação e validação de datas
 */

import { format, parse, parseISO, isValid, isBefore, isAfter, isSameDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata uma data para o padrão brasileiro: dd/mm/aaaa
 * @param date - Data a ser formatada (Date ou string ISO)
 * @returns String no formato dd/mm/aaaa
 */
export const formatDateBR = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  try {
    let dateObj: Date;
    if (typeof date === 'string') {
      // Use parseISO for YYYY-MM-DD strings to avoid UTC offset bug
      dateObj = date.includes('T') ? new Date(date) : parseISO(date);
    } else {
      dateObj = date;
    }
    if (!isValid(dateObj)) return '';
    return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return '';
  }
};

/**
 * Formata uma data para exibição curta: dd/mm
 * @param date - Data a ser formatada
 * @returns String no formato dd/mm
 */
export const formatDateShortBR = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) return '';
    return format(dateObj, 'dd/MM', { locale: ptBR });
  } catch {
    return '';
  }
};

/**
 * Formata uma data com dia da semana: dd/mm/aaaa (ddd)
 * @param date - Data a ser formatada
 * @returns String no formato dd/mm/aaaa (ddd)
 */
export const formatDateWithDayBR = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) return '';
    return format(dateObj, "dd/MM/yyyy (eee)", { locale: ptBR });
  } catch {
    return '';
  }
};

/**
 * Formata uma data para exibição longa: dd de mês de aaaa
 * @param date - Data a ser formatada
 * @returns String no formato dd de mês de aaaa
 */
export const formatDateLongBR = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) return '';
    return format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return '';
  }
};

/**
 * Formata data e hora: dd/mm/aaaa HH:mm
 * @param date - Data a ser formatada
 * @returns String no formato dd/mm/aaaa HH:mm
 */
export const formatDateTimeBR = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) return '';
    return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: ptBR });
  } catch {
    return '';
  }
};

/**
 * Converte string no formato dd/mm/aaaa para Date (ISO 8601)
 * @param dateString - String no formato dd/mm/aaaa
 * @returns Data em formato ISO (yyyy-mm-dd) ou string vazia se inválida
 */
export const parseDateBR = (dateString: string): string => {
  if (!dateString || dateString.length !== 10) return '';
  
  try {
    const parsed = parse(dateString, 'dd/MM/yyyy', new Date());
    if (!isValid(parsed)) return '';
    
    // Retorna em formato ISO (yyyy-mm-dd) para usar em <input type="date" />
    return format(parsed, 'yyyy-MM-dd');
  } catch {
    return '';
  }
};

/**
 * Converte string ISO (yyyy-mm-dd) para formato brasileiro (dd/mm/aaaa)
 * @param isoString - String no formato yyyy-mm-dd ou ISO completo
 * @returns String no formato dd/mm/aaaa
 */
export const isoToBR = (isoString: string | null | undefined): string => {
  if (!isoString) return '';
  
  try {
    // Use parseISO for YYYY-MM-DD strings to avoid UTC offset bug.
    // new Date('2026-05-18') interprets as UTC midnight → UTC-4 shows 17/05.
    // parseISO('2026-05-18') treats as local date → shows 18/05 correctly.
    const dateObj = isoString.includes('T') ? new Date(isoString) : parseISO(isoString);
    if (!isValid(dateObj)) return '';
    return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return '';
  }
};

/**
 * Converte formato brasileiro (dd/mm/aaaa) para ISO (yyyy-mm-dd)
 * @param brString - String no formato dd/mm/aaaa
 * @returns String no formato yyyy-mm-dd
 */
export const brToISO = (brString: string): string => {
  if (!brString || brString.length !== 10) return '';
  
  try {
    const parsed = parse(brString, 'dd/MM/yyyy', new Date());
    if (!isValid(parsed)) return '';
    return format(parsed, 'yyyy-MM-dd');
  } catch {
    return '';
  }
};

/**
 * Valida se uma string está no formato dd/mm/aaaa
 * @param dateString - String a validar
 * @returns true se válida, false caso contrário
 */
export const isValidDateFormatBR = (dateString: string): boolean => {
  if (!dateString || dateString.length !== 10) return false;
  
  // Verifica padrão dd/mm/aaaa
  const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/\d{4}$/;
  if (!regex.test(dateString)) return false;
  
  // Valida se é uma data real
  try {
    const parsed = parse(dateString, 'dd/MM/yyyy', new Date());
    return isValid(parsed);
  } catch {
    return false;
  }
};

/**
 * Valida se uma data é válida e não está no passado
 * @param dateString - String no formato dd/mm/aaaa ou yyyy-mm-dd
 * @returns true se válida e não no passado, false caso contrário
 */
export const isDateNotInPast = (dateString: string): boolean => {
  if (!dateString) return false;
  
  try {
    let dateObj: Date;
    
    if (dateString.includes('-')) {
      // Formato ISO (yyyy-mm-dd)
      dateObj = new Date(dateString + 'T00:00:00');
    } else {
      // Formato brasileiro (dd/mm/aaaa)
      dateObj = parse(dateString, 'dd/MM/yyyy', new Date());
    }
    
    if (!isValid(dateObj)) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return isAfter(dateObj, today) || isSameDay(dateObj, today);
  } catch {
    return false;
  }
};

/**
 * Valida se data de fim é posterior à data de início
 * @param startDate - Data de início (dd/mm/aaaa ou yyyy-mm-dd)
 * @param endDate - Data de fim (dd/mm/aaaa ou yyyy-mm-dd)
 * @returns true se endDate > startDate, false caso contrário
 */
export const isDateRangeValid = (startDate: string, endDate: string): boolean => {
  if (!startDate || !endDate) return false;
  
  try {
    let startObj: Date;
    let endObj: Date;
    
    // Parse data de início
    if (startDate.includes('-')) {
      startObj = new Date(startDate + 'T00:00:00');
    } else {
      startObj = parse(startDate, 'dd/MM/yyyy', new Date());
    }
    
    // Parse data de fim
    if (endDate.includes('-')) {
      endObj = new Date(endDate + 'T00:00:00');
    } else {
      endObj = parse(endDate, 'dd/MM/yyyy', new Date());
    }
    
    if (!isValid(startObj) || !isValid(endObj)) return false;
    
    return isAfter(endObj, startObj);
  } catch {
    return false;
  }
};

/**
 * Calcula número de dias entre duas datas
 * @param startDate - Data de início (dd/mm/aaaa ou yyyy-mm-dd)
 * @param endDate - Data de fim (dd/mm/aaaa ou yyyy-mm-dd)
 * @returns Número de dias (mínimo 1)
 */
export const calculateDaysBetween = (startDate: string, endDate: string): number => {
  if (!startDate || !endDate) return 0;
  
  try {
    let startObj: Date;
    let endObj: Date;
    
    // Parse data de início
    if (startDate.includes('-')) {
      startObj = new Date(startDate + 'T00:00:00');
    } else {
      startObj = parse(startDate, 'dd/MM/yyyy', new Date());
    }
    
    // Parse data de fim
    if (endDate.includes('-')) {
      endObj = new Date(endDate + 'T00:00:00');
    } else {
      endObj = parse(endDate, 'dd/MM/yyyy', new Date());
    }
    
    if (!isValid(startObj) || !isValid(endObj)) return 0;
    
    const diffTime = Math.abs(endObj.getTime() - startObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(1, diffDays); // Mínimo 1 dia
  } catch {
    return 0;
  }
};

/**
 * Valida se data está dentro de um intervalo
 * @param date - Data a validar (dd/mm/aaaa ou yyyy-mm-dd)
 * @param minDate - Data mínima (dd/mm/aaaa ou yyyy-mm-dd)
 * @param maxDate - Data máxima (dd/mm/aaaa ou yyyy-mm-dd)
 * @returns true se data está dentro do intervalo
 */
export const isDateInRange = (date: string, minDate: string, maxDate: string): boolean => {
  if (!date || !minDate || !maxDate) return false;
  
  try {
    let dateObj: Date;
    let minObj: Date;
    let maxObj: Date;
    
    // Parse data
    if (date.includes('-')) {
      dateObj = new Date(date + 'T00:00:00');
    } else {
      dateObj = parse(date, 'dd/MM/yyyy', new Date());
    }
    
    // Parse data mínima
    if (minDate.includes('-')) {
      minObj = new Date(minDate + 'T00:00:00');
    } else {
      minObj = parse(minDate, 'dd/MM/yyyy', new Date());
    }
    
    // Parse data máxima
    if (maxDate.includes('-')) {
      maxObj = new Date(maxDate + 'T00:00:00');
    } else {
      maxObj = parse(maxDate, 'dd/MM/yyyy', new Date());
    }
    
    if (!isValid(dateObj) || !isValid(minObj) || !isValid(maxObj)) return false;
    
    return (isAfter(dateObj, minObj) || isSameDay(dateObj, minObj)) && 
           (isBefore(dateObj, maxObj) || isSameDay(dateObj, maxObj));
  } catch {
    return false;
  }
};

/**
 * Retorna data de hoje em formato brasileiro
 * @returns String no formato dd/mm/aaaa
 */
export const getTodayBR = (): string => {
  return format(new Date(), 'dd/MM/yyyy', { locale: ptBR });
};

/**
 * Retorna data de hoje em formato ISO
 * @returns String no formato yyyy-mm-dd
 */
export const getTodayISO = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

/**
 * Retorna data de amanhã em formato ISO
 * @returns String no formato yyyy-mm-dd
 */
export const getTomorrowISO = (): string => {
  return format(addDays(new Date(), 1), 'yyyy-MM-dd');
};

/**
 * Retorna data máxima (365 dias a partir de hoje) em formato ISO
 * @returns String no formato yyyy-mm-dd
 */
export const getMaxDateISO = (): string => {
  return format(addDays(new Date(), 365), 'yyyy-MM-dd');
};
