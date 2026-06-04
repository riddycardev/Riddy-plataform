/**
 * ETAPA 13 — Proteção CSRF (Cross-Site Request Forgery)
 *
 * Padrão: Double Submit Cookie (Signed)
 * ─────────────────────────────────────────────────────
 * 1. GET /api/csrf-token  → gera token = HMAC-SHA256(randomBytes, JWT_SECRET)
 *    e o define em dois lugares:
 *      a) Cookie  `_csrf`  (httpOnly: false, SameSite: none, Secure)  ← lido pelo JS
 *      b) Resposta JSON    { csrfToken: "..." }
 *
 * 2. Mutations sensíveis → cliente envia o token no header `x-csrf-token`
 *
 * 3. Middleware `csrfMiddleware` compara:
 *      header `x-csrf-token`  ===  cookie `_csrf`
 *    e valida a assinatura HMAC para garantir que o token não foi forjado.
 *
 * Por que Double Submit Cookie funciona:
 *   - Um atacante cross-origin não pode ler cookies do domínio alvo (SOP)
 *   - Portanto não pode copiar o valor do cookie `_csrf` para o header
 *   - A assinatura HMAC previne que o atacante gere tokens válidos sem o segredo
 *
 * Referências:
 *   - OWASP CSRF Prevention Cheat Sheet
 *   - https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
 */

import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { Request, Response } from "express";
import { TRPCError } from "@trpc/server";
import { trpcInstance } from "./trpc";

// ─── Configuração ────────────────────────────────────────────────────────────

const CSRF_COOKIE_NAME = "_csrf";
const CSRF_HEADER_NAME = "x-csrf-token";
const TOKEN_BYTES = 32; // 256 bits de entropia
const TOKEN_TTL_MS = 4 * 60 * 60 * 1000; // 4 horas

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set — cannot generate CSRF tokens");
  return secret;
}

// ─── Geração de token ────────────────────────────────────────────────────────

/**
 * Gera um token CSRF assinado com HMAC-SHA256.
 * Formato: `<timestamp>.<random>.<hmac>`
 */
export function generateCsrfToken(): string {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(TOKEN_BYTES).toString("hex");
  const payload = `${timestamp}.${random}`;
  const hmac = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${hmac}`;
}

// ─── Validação de token ──────────────────────────────────────────────────────

/**
 * Verifica se um token CSRF é válido:
 * 1. Estrutura correta (3 partes separadas por ponto)
 * 2. Assinatura HMAC válida
 * 3. Não expirado (dentro do TTL)
 */
export function isValidCsrfToken(token: string): boolean {
  if (!token || typeof token !== "string") return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [timestamp, random, receivedHmac] = parts;
  const payload = `${timestamp}.${random}`;

  // Verificar assinatura
  const expectedHmac = createHmac("sha256", getSecret()).update(payload).digest("hex");
  try {
    const expected = Buffer.from(expectedHmac, "hex");
    const received = Buffer.from(receivedHmac, "hex");
    if (expected.length !== received.length) return false;
    if (!timingSafeEqual(expected, received)) return false;
  } catch {
    return false;
  }

  // Verificar expiração
  const issuedAt = parseInt(timestamp, 36);
  if (isNaN(issuedAt)) return false;
  if (Date.now() - issuedAt > TOKEN_TTL_MS) return false;

  return true;
}

// ─── Express route handler ───────────────────────────────────────────────────

/**
 * GET /api/csrf-token
 * Gera um novo token CSRF, define o cookie e retorna o token no body.
 */
export function csrfTokenHandler(req: Request, res: Response): void {
  const token = generateCsrfToken();

  const isSecure =
    req.protocol === "https" ||
    req.headers["x-forwarded-proto"] === "https";

  // Cookie legível pelo JavaScript (httpOnly: false) para que o frontend possa lê-lo.
  // SameSite=None requer Secure=true (HTTPS). Em HTTP (dev), usar SameSite=Lax.
  // Sem isso, browsers modernos descartam o cookie silenciosamente.
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // DEVE ser false — JS precisa ler este cookie
    sameSite: isSecure ? "none" : "lax",
    secure: isSecure,
    path: "/",
    maxAge: TOKEN_TTL_MS,
  });

  res.json({ csrfToken: token });
}

// ─── tRPC middleware ─────────────────────────────────────────────────────────

/**
 * Middleware tRPC para verificar o token CSRF.
 * Usa trpcInstance.middleware para compatibilidade total de tipos com tRPC 11.
 *
 * Uso em procedures sensíveis:
 * ```ts
 * processBookingPayment: protectedProcedure
 *   .use(csrfMiddleware)
 *   .input(...)
 *   .mutation(...)
 * ```
 */
export const csrfMiddleware = trpcInstance.middleware(async ({ ctx, next }) => {
  const req = ctx.req;

  // Obter token do header
  const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;

  // Obter token do cookie
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.[CSRF_COOKIE_NAME];

  // Ambos devem existir
  if (!headerToken || !cookieToken) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Token CSRF ausente. Recarregue a página e tente novamente.",
    });
  }

  // Comparação timing-safe entre header e cookie
  if (headerToken.length !== cookieToken.length) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Token CSRF inválido (10013).",
    });
  }

  try {
    const headerBuf = Buffer.from(headerToken, "utf8");
    const cookieBuf = Buffer.from(cookieToken, "utf8");
    if (!timingSafeEqual(headerBuf, cookieBuf)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Token CSRF inválido (10013).",
      });
    }
  } catch (err) {
    if (err instanceof TRPCError) throw err;
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Token CSRF inválido (10013).",
    });
  }

  // Validar assinatura e expiração
  if (!isValidCsrfToken(headerToken)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Token CSRF expirado ou inválido. Recarregue a página.",
    });
  }

  return next();
});

// ─── Constantes exportadas ───────────────────────────────────────────────────

/** Nome do cookie CSRF — para uso no frontend */
export const CSRF_COOKIE = CSRF_COOKIE_NAME;

/** Nome do header CSRF — para uso no frontend */
export const CSRF_HEADER = CSRF_HEADER_NAME;

/** TTL do token em milissegundos */
export const CSRF_TTL_MS = TOKEN_TTL_MS;
