/**
 * ETAPA 9 — Rate Limiting Module
 *
 * Provides layered rate limiting for all critical endpoints:
 *
 * Endpoint Category        | Limiter           | Window | Max Requests
 * auth.login               | authLimiter        | 15min  | 10
 * auth.signup/signupHost   | signupLimiter      | 1h     | 5
 * vehicle.search           | searchLimiter      | 1min   | 30
 * motorcycle.search        | searchLimiter      | 1min   | 30
 * vehicle.getById/list/.. | publicReadLimiter  | 1min   | 60
 * motorcycle.getById/list | publicReadLimiter  | 1min   | 60
 * payment.* procedures    | paymentLimiter     | 1min   | 10
 * admin.* procedures      | adminLimiter       | 1min   | 60
 * /api/mercadopago/webhook| webhookLimiter     | 1min   | 100
 * /api/upload/*           | uploadLimiter      | 1min   | 20
 * /api/oauth/*            | oauthLimiter       | 1min   | 20
 * All other /api/trpc     | globalTrpcLimiter  | 1min   | 300
 *
 * All limiters use in-memory MemoryStore (appropriate for single-instance).
 * For multi-instance deployments, replace with a Redis store.
 * All limiters are automatically skipped in NODE_ENV=test.
 */

import rateLimit from "express-rate-limit";
import type { Request, Response, NextFunction } from "express";
import logger from "./logger";

// ── Helper: extract tRPC procedure name from request path ────────────────────
export function getTrpcProcedure(req: Request): string {
  return req.path.replace(/^\//, "").split(",")[0];
}

// ── Helper: extract real client IP ───────────────────────────────────────────
export function getClientIp(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

// ── Helper: standard tRPC-compatible 429 response ────────────────────────────
function trpcRateLimitHandler(message: string) {
  return (req: Request, res: Response) => {
    const procedure = getTrpcProcedure(req);
    const ip = getClientIp(req);
    logger.warn(`[RateLimit] Blocked: ${procedure} | IP: ${ip}`);
    res.status(429).json({ error: [{ message, code: "RATE_LIMITED" }] });
  };
}

// ── Auth limiter: 10 attempts per 15 minutes per IP ──────────────────────────
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: trpcRateLimitHandler(
    "Muitas tentativas de autenticação. Tente novamente em 15 minutos."
  ),
  skip: () => process.env.NODE_ENV === "test",
});

// ── Signup limiter: 5 accounts per hour per IP ───────────────────────────────
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: trpcRateLimitHandler(
    "Limite de criação de contas atingido. Tente novamente em 1 hora."
  ),
  skip: () => process.env.NODE_ENV === "test",
});

// ── Search limiter: 30 req / 1 min per IP ─────────────────────────────────────
// Prevents scraping of the entire vehicle catalog
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: (req: Request, res: Response) => {
    const procedure = getTrpcProcedure(req);
    const ip = getClientIp(req);
    logger.warn(`[RateLimit] Search scraping blocked: ${procedure} | IP: ${ip}`);
    res.status(429).json({
      error: [{
        message: "Muitas buscas em pouco tempo. Aguarde 1 minuto antes de buscar novamente.",
        code: "RATE_LIMITED",
      }],
    });
  },
  skip: () => process.env.NODE_ENV === "test",
});

// ── Public read limiter: 60 req / 1 min per IP ───────────────────────────────
// Generous for legitimate browsing, blocks automated scrapers
export const publicReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: trpcRateLimitHandler(
    "Muitas requisições. Aguarde 1 minuto antes de continuar."
  ),
  skip: () => process.env.NODE_ENV === "test",
});

// ── Payment limiter: 10 req / 1 min per IP ───────────────────────────────────
// Prevents payment flooding and card testing attacks
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: (req: Request, res: Response) => {
    const procedure = getTrpcProcedure(req);
    const ip = getClientIp(req);
    logger.warn(`[RateLimit] Payment flooding blocked: ${procedure} | IP: ${ip}`);
    res.status(429).json({
      error: [{
        message: "Muitas tentativas de pagamento. Aguarde 1 minuto antes de tentar novamente.",
        code: "RATE_LIMITED",
      }],
    });
  },
  skip: () => process.env.NODE_ENV === "test",
});

// ── Admin limiter: 60 req / 1 min per IP ─────────────────────────────────────
// Prevents admin panel enumeration and brute force
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: trpcRateLimitHandler(
    "Muitas requisições ao painel administrativo. Aguarde 1 minuto."
  ),
  skip: () => process.env.NODE_ENV === "test",
});

// ── Webhook limiter: 100 req / 1 min per IP ──────────────────────────────────
// Generous for payment processors (MP), blocks DDoS
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: getClientIp,
  message: { error: "Webhook rate limit exceeded.", code: "RATE_LIMITED" },
  skip: () => process.env.NODE_ENV === "test",
});

// ── Global tRPC limiter: 300 requests per minute per IP ──────────────────────
// Fallback for all other tRPC procedures
export const globalTrpcLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Muitas requisições. Tente novamente em instantes.",
    code: "RATE_LIMITED",
  },
  skip: () => process.env.NODE_ENV === "test",
});

// ── OAuth callback limiter: 20 requests per minute per IP ────────────────────
export const oauthLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "Muitas tentativas de autenticação OAuth.",
  skip: () => process.env.NODE_ENV === "test",
});

// ── Upload limiter: 20 uploads per minute per IP ─────────────────────────────
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "Muitos uploads. Tente novamente em instantes.",
  skip: () => process.env.NODE_ENV === "test",
});

// ── Procedure classification sets ────────────────────────────────────────────

const PAYMENT_PROCEDURES = new Set([
  "payment.processBookingPayment",
  "payment.processPixPayment",
  "payment.createCheckoutSession",
  "payment.cancelWithRefund",
  "payment.processAdditionalCharge",
  "payment.createAdditionalCharge",
  "booking.createCheckoutSession",
]);

const SEARCH_PROCEDURES = new Set([
  "vehicle.search",
  "motorcycle.search",
]);

const PUBLIC_READ_PROCEDURES = new Set([
  "vehicle.getById",
  "vehicle.list",
  "vehicle.getGroupedByCity",
  "vehicle.getCities",
  "vehicle.getStates",
  "vehicle.getByState",
  "vehicle.getGroupedByCityInState",
  "vehicle.getAvailability",
  "vehicle.getReviews",
  "motorcycle.getById",
  "motorcycle.list",
  "review.getPlatformStats",
  "review.getPublicReviews",
]);

const ADMIN_PREFIXES = ["admin."];
const SIGNUP_PROCEDURES = new Set(["auth.signup", "auth.signupHost"]);
const LOGIN_PROCEDURES = new Set(["auth.login"]);

// ── Smart tRPC rate limiter middleware ────────────────────────────────────────
// Routes each procedure to its appropriate limiter based on procedure name.
export function trpcAuthRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const procedure = getTrpcProcedure(req);

  if (SIGNUP_PROCEDURES.has(procedure)) return signupLimiter(req, res, next);
  if (LOGIN_PROCEDURES.has(procedure)) return authLimiter(req, res, next);
  if (PAYMENT_PROCEDURES.has(procedure)) return paymentLimiter(req, res, next);
  if (SEARCH_PROCEDURES.has(procedure)) return searchLimiter(req, res, next);
  if (PUBLIC_READ_PROCEDURES.has(procedure)) return publicReadLimiter(req, res, next);
  if (ADMIN_PREFIXES.some((p) => procedure.startsWith(p))) return adminLimiter(req, res, next);

  return globalTrpcLimiter(req, res, next);
}
