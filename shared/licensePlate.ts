/**
 * ETAPA 12 — Validação de Placa Veicular Brasileira
 *
 * Suporta dois formatos oficiais:
 *
 * 1. Formato MERCOSUL (desde 2018):  ABC1D23
 *    - 3 letras + 1 dígito + 1 letra + 2 dígitos
 *    - Regex: /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/
 *
 * 2. Formato antigo (até 2018):       ABC-1234 ou ABC1234
 *    - 3 letras + 4 dígitos (hífen opcional)
 *    - Regex: /^[A-Z]{3}-?[0-9]{4}$/
 *
 * Normalização:
 * - Remove espaços, hífens e converte para maiúsculas antes de validar
 * - Armazena sempre no formato canônico sem hífen (ABC1234 ou ABC1D23)
 *
 * Referências:
 * - Resolução CONTRAN nº 729/2018 (MERCOSUL)
 * - Código de Trânsito Brasileiro, Art. 115
 */

/** Regex para placa MERCOSUL: ABC1D23 */
export const MERCOSUL_REGEX = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

/** Regex para placa antiga: ABC1234 (sem hífen, já normalizado) */
export const OLD_FORMAT_REGEX = /^[A-Z]{3}[0-9]{4}$/;

/**
 * Normaliza uma placa: remove espaços, hífens e converte para maiúsculas.
 * Exemplo: "abc-1234" → "ABC1234", "abc 1d23" → "ABC1D23"
 */
export function normalizePlate(raw: string): string {
  return raw.toUpperCase().replace(/[\s\-]/g, "");
}

/**
 * Verifica se uma string é uma placa brasileira válida (MERCOSUL ou formato antigo).
 * A entrada é normalizada automaticamente antes da validação.
 *
 * @param raw - Placa bruta (ex: "ABC-1234", "abc1d23", "ABC 1D23")
 * @returns true se a placa for válida
 */
export function isValidBrazilianPlate(raw: string): boolean {
  if (!raw || typeof raw !== "string") return false;
  const normalized = normalizePlate(raw);
  return MERCOSUL_REGEX.test(normalized) || OLD_FORMAT_REGEX.test(normalized);
}

/**
 * Detecta o formato da placa.
 * @returns "mercosul" | "old" | "invalid"
 */
export function detectPlateFormat(raw: string): "mercosul" | "old" | "invalid" {
  if (!raw || typeof raw !== "string") return "invalid";
  const normalized = normalizePlate(raw);
  if (MERCOSUL_REGEX.test(normalized)) return "mercosul";
  if (OLD_FORMAT_REGEX.test(normalized)) return "old";
  return "invalid";
}

/**
 * Mensagem de erro padrão para placas inválidas.
 */
export const INVALID_PLATE_MESSAGE =
  "Placa inválida. Use o formato MERCOSUL (ABC1D23) ou o formato antigo (ABC1234 ou ABC-1234).";

/**
 * Zod refinement para uso em schemas de validação.
 * Uso: z.string().refine(isValidBrazilianPlate, INVALID_PLATE_MESSAGE)
 */
export const zodPlateRefinement = {
  check: isValidBrazilianPlate,
  message: INVALID_PLATE_MESSAGE,
} as const;
