/**
 * Utilitários para validação e formatação de cartão de crédito
 */

/**
 * Aplica máscara ao número do cartão: 0000 0000 0000 0000
 */
export const maskCardNumber = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 16);
  return numbers.replace(/(\d{4})/g, '$1 ').trim();
};

/**
 * Aplica máscara à validade: MM/AA
 */
export const maskCardExpiry = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 4);
  if (numbers.length <= 2) return numbers;
  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}`;
};

/**
 * Aplica máscara ao CVV: 000 ou 0000
 */
export const maskCardCVV = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 4);
};

/**
 * Valida número do cartão usando algoritmo de Luhn
 */
export const validateCardNumber = (cardNumber: string): boolean => {
  const numbers = cardNumber.replace(/\D/g, '');
  
  if (numbers.length < 13 || numbers.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = numbers.length - 1; i >= 0; i--) {
    let digit = parseInt(numbers[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Valida data de validade (MM/AA)
 */
export const validateCardExpiry = (expiry: string): boolean => {
  const match = expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;

  const month = parseInt(match[1], 10);
  const year = parseInt(match[2], 10);

  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  // Se ano é menor que ano atual, cartão expirado
  if (year < currentYear) return false;

  // Se ano é igual e mês é menor que mês atual, cartão expirado
  if (year === currentYear && month < currentMonth) return false;

  return true;
};

/**
 * Valida CVV (3 ou 4 dígitos)
 */
export const validateCardCVV = (cvv: string): boolean => {
  const numbers = cvv.replace(/\D/g, '');
  return numbers.length === 3 || numbers.length === 4;
};

/**
 * Valida nome do titular (mínimo 3 caracteres, máximo 26)
 */
export const validateCardholderName = (name: string): boolean => {
  const trimmed = name.trim();
  return trimmed.length >= 3 && trimmed.length <= 26 && /^[a-zA-Z\s]+$/.test(trimmed);
};

/**
 * Detecta tipo de cartão baseado no número
 */
export const detectCardType = (cardNumber: string): 'visa' | 'mastercard' | 'amex' | 'elo' | 'unknown' => {
  const numbers = cardNumber.replace(/\D/g, '');

  if (/^4[0-9]{12}(?:[0-9]{3})?$/.test(numbers)) return 'visa';
  if (/^5[1-5][0-9]{14}$/.test(numbers)) return 'mastercard';
  if (/^3[47][0-9]{13}$/.test(numbers)) return 'amex';
  if (/^(4011|4312|4389|4514|4576|5041|5066|5090|6277|6362|6363|65|6500)[0-9]{12}$/.test(numbers)) return 'elo';

  return 'unknown';
};

/**
 * Retorna mensagem de erro para validação de cartão
 */
export const getCardValidationError = (
  cardNumber: string,
  expiry: string,
  cvv: string,
  name: string
): string | null => {
  if (!cardNumber || !expiry || !cvv || !name) {
    return 'Todos os campos são obrigatórios';
  }

  if (!validateCardNumber(cardNumber)) {
    return 'Número do cartão inválido';
  }

  if (!validateCardExpiry(expiry)) {
    return 'Data de validade inválida ou cartão expirado';
  }

  if (!validateCardCVV(cvv)) {
    return 'CVV deve ter 3 ou 4 dígitos';
  }

  if (!validateCardholderName(name)) {
    return 'Nome do titular inválido';
  }

  return null;
};
