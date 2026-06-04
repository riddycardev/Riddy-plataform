/**
 * OCR Module
 * Extract text and data from document images using Tesseract.js
 */

import { createWorker } from 'tesseract.js';

interface CNHData {
  name: string | null;
  cpf: string | null;
  birthDate: string | null;
  expirationDate: string | null;
  cnhNumber: string | null;
  rawText: string;
}

/**
 * Extract data from CNH (Brazilian Driver's License) image
 * @param imageBuffer - Image buffer or base64 string
 * @returns Extracted CNH data
 */
export async function extractCNHData(imageBuffer: Buffer | string): Promise<CNHData> {
  const worker = await createWorker('por'); // Portuguese language
  
  try {
    // Convert base64 to buffer if needed
    let buffer = imageBuffer;
    if (typeof imageBuffer === 'string') {
      // Remove base64 prefix if present
      const base64Data = imageBuffer.includes(',') 
        ? imageBuffer.split(',')[1] 
        : imageBuffer;
      buffer = Buffer.from(base64Data, 'base64');
    }
    
    // Perform OCR
    const { data: { text } } = await worker.recognize(buffer);
    
    // Extract specific fields using regex patterns
    const cnhData: CNHData = {
      name: extractName(text),
      cpf: extractCPF(text),
      birthDate: extractBirthDate(text),
      expirationDate: extractExpirationDate(text),
      cnhNumber: extractCNHNumber(text),
      rawText: text,
    };
    
    return cnhData;
  } finally {
    await worker.terminate();
  }
}

/**
 * Extract name from OCR text
 * CNH usually has "Nome" or "NOME" label before the name
 */
function extractName(text: string): string | null {
  // Pattern: Nome/NOME followed by the actual name
  const namePattern = /(?:nome|NOME)[:\s]+([A-ZÀ-Ú\s]+)/i;
  const match = text.match(namePattern);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // Fallback: Try to find a line with all caps that looks like a name
  const lines = text.split('\n');
  for (const line of lines) {
    if (/^[A-ZÀ-Ú\s]{10,}$/.test(line.trim())) {
      return line.trim();
    }
  }
  
  return null;
}

/**
 * Extract CPF from OCR text
 * CPF format: XXX.XXX.XXX-XX or XXXXXXXXXXX
 */
function extractCPF(text: string): string | null {
  // Pattern: CPF with dots and dash
  const cpfPattern = /(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/;
  const match = text.match(cpfPattern);
  
  if (match && match[1]) {
    // Normalize CPF (remove dots and dash)
    return match[1].replace(/[.\-]/g, '');
  }
  
  return null;
}

/**
 * Extract birth date from OCR text
 * Common formats: DD/MM/YYYY, DD-MM-YYYY, DDMMYYYY
 */
function extractBirthDate(text: string): string | null {
  // Look for "Data de Nascimento" or "Nascimento" label
  const birthPattern = /(?:nascimento|NASCIMENTO|data\s+de\s+nascimento)[:\s]+(\d{2}[\/\-]?\d{2}[\/\-]?\d{4})/i;
  const match = text.match(birthPattern);
  
  if (match && match[1]) {
    return normalizeDate(match[1]);
  }
  
  return null;
}

/**
 * Extract expiration date from OCR text
 * Common formats: DD/MM/YYYY, DD-MM-YYYY, DDMMYYYY
 */
function extractExpirationDate(text: string): string | null {
  // Look for "Validade" or "Vencimento" label
  const expirationPattern = /(?:validade|VALIDADE|vencimento|VENCIMENTO)[:\s]+(\d{2}[\/\-]?\d{2}[\/\-]?\d{4})/i;
  const match = text.match(expirationPattern);
  
  if (match && match[1]) {
    return normalizeDate(match[1]);
  }
  
  return null;
}

/**
 * Extract CNH number from OCR text
 * CNH number is usually 11 digits
 */
function extractCNHNumber(text: string): string | null {
  // Look for "Registro" or "N°" label followed by 11 digits
  const cnhPattern = /(?:registro|REGISTRO|n[°º]|N[°º])[:\s]+(\d{11})/i;
  const match = text.match(cnhPattern);
  
  if (match && match[1]) {
    return match[1];
  }
  
  // Fallback: Find any 11-digit number
  const digitPattern = /\b(\d{11})\b/;
  const digitMatch = text.match(digitPattern);
  
  if (digitMatch && digitMatch[1]) {
    return digitMatch[1];
  }
  
  return null;
}

/**
 * Normalize date to DD/MM/YYYY format
 */
function normalizeDate(date: string): string {
  // Remove any non-digit characters except /
  const cleaned = date.replace(/[^\d\/]/g, '');
  
  // If already in DD/MM/YYYY format, return as is
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
    return cleaned;
  }
  
  // If in DDMMYYYY format, add slashes
  if (/^\d{8}$/.test(cleaned)) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
  }
  
  return cleaned;
}

/**
 * Validate if extracted name matches the user's registered name
 * @param extractedName - Name extracted from CNH
 * @param registeredName - User's registered name
 * @returns true if names match (fuzzy matching)
 */
export function validateNameMatch(extractedName: string, registeredName: string): boolean {
  if (!extractedName || !registeredName) return false;
  
  // Normalize both names (remove accents, lowercase, trim)
  const normalize = (str: string) => 
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  
  const normalizedExtracted = normalize(extractedName);
  const normalizedRegistered = normalize(registeredName);
  
  // Exact match
  if (normalizedExtracted === normalizedRegistered) {
    return true;
  }
  
  // Check if registered name is contained in extracted name
  // (CNH might have full name while user registered with abbreviated name)
  if (normalizedExtracted.includes(normalizedRegistered)) {
    return true;
  }
  
  // Check if all words in registered name appear in extracted name
  const registeredWords = normalizedRegistered.split(/\s+/);
  const extractedWords = normalizedExtracted.split(/\s+/);
  
  const allWordsMatch = registeredWords.every(word => 
    extractedWords.some(extractedWord => extractedWord.includes(word) || word.includes(extractedWord))
  );
  
  return allWordsMatch;
}
