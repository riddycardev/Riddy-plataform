/**
 * ETAPA 10 — Security Audit Logger
 *
 * Provides a centralized, non-blocking helper to persist security events
 * into the `security_audit_logs` table.
 *
 * Design principles:
 * - Fire-and-forget: logging NEVER throws or blocks the request lifecycle.
 *   Errors are swallowed and written to the application logger only.
 * - Async: all DB writes are awaited internally but the caller does not need to await.
 * - Typed: event types and severity levels are enforced via TypeScript enums.
 * - Minimal overhead: one INSERT per event, no transactions.
 *
 * Usage:
 *   import { logSecurityEvent } from "./_core/securityLogger";
 *
 *   // In a tRPC procedure:
 *   logSecurityEvent({
 *     eventType: "FORBIDDEN",
 *     severity: "high",
 *     userId: ctx.user.id,
 *     endpoint: "booking.getById",
 *     ipAddress: getClientIp(ctx.req),
 *     userAgent: ctx.req.headers["user-agent"],
 *     details: { resourceType: "booking", resourceId: input.id, reason: "not owner" },
 *     statusCode: 403,
 *   });
 *
 *   // In Express middleware:
 *   logSecurityEvent({
 *     eventType: "UPLOAD_REJECTED",
 *     severity: "medium",
 *     endpoint: "/api/upload/document",
 *     ipAddress: req.ip ?? "unknown",
 *     details: { reason: "invalid MIME type", detectedMime: "application/x-executable" },
 *     statusCode: 400,
 *   });
 */

import { getDb } from "../db";
import { securityAuditLogs } from "../../drizzle/schema";
import logger from "./logger";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type SecurityEventType =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "UPLOAD_REJECTED"
  | "RATE_LIMITED"
  | "INVALID_INPUT"
  | "ADMIN_ACTION"
  | "AUTH_FAILURE";

export type SecuritySeverity = "low" | "medium" | "high" | "critical";

export interface SecurityEventPayload {
  /** Classification of the security event */
  eventType: SecurityEventType;
  /** Severity level — defaults to "medium" */
  severity?: SecuritySeverity;
  /** Authenticated user ID, if available */
  userId?: number | null;
  /** Procedure name or HTTP path where the event occurred */
  endpoint: string;
  /** HTTP method (GET, POST, etc.) */
  method?: string;
  /** Client IP address */
  ipAddress: string;
  /** User-Agent header */
  userAgent?: string;
  /** Structured details about the event */
  details?: Record<string, unknown>;
  /** HTTP status code returned to the client */
  statusCode?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core logger function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Persist a security event to the database.
 * This function is fire-and-forget — it never throws.
 * Call it without await in hot paths.
 */
export function logSecurityEvent(payload: SecurityEventPayload): void {
  // Skip in test environment to avoid polluting the test DB
  if (process.env.NODE_ENV === "test") return;

  const {
    eventType,
    severity = "medium",
    userId,
    endpoint,
    method,
    ipAddress,
    userAgent,
    details,
    statusCode,
  } = payload;

  // Fire and forget — do not await
  (async () => {
    try {
      const db = await getDb();
      if (!db) return; // DB not available (e.g., test environment without DB)
      await db.insert(securityAuditLogs).values({
        eventType,
        severity,
        userId: userId ?? null,
        endpoint,
        method: method ?? null,
        ipAddress,
        userAgent: userAgent ? userAgent.substring(0, 512) : null,
        details: details ?? null,
        statusCode: statusCode ?? null,
      });
    } catch (err) {
      // Never let logging failures propagate to the request
      logger.error("[SecurityLogger] Failed to persist security event:", {
        eventType,
        endpoint,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  })();
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience wrappers
// ─────────────────────────────────────────────────────────────────────────────

/** Log a FORBIDDEN event (ownership check failed — IDOR attempt) */
export function logForbidden(opts: {
  userId: number;
  endpoint: string;
  ipAddress: string;
  userAgent?: string;
  resourceType: string;
  resourceId: number | string;
  reason?: string;
}): void {
  logSecurityEvent({
    eventType: "FORBIDDEN",
    severity: "high",
    userId: opts.userId,
    endpoint: opts.endpoint,
    ipAddress: opts.ipAddress,
    userAgent: opts.userAgent,
    details: {
      resourceType: opts.resourceType,
      resourceId: opts.resourceId,
      reason: opts.reason ?? "ownership check failed",
    },
    statusCode: 403,
  });
}

/** Log an UNAUTHORIZED event (unauthenticated access to protected endpoint) */
export function logUnauthorized(opts: {
  endpoint: string;
  ipAddress: string;
  userAgent?: string;
  reason?: string;
}): void {
  logSecurityEvent({
    eventType: "UNAUTHORIZED",
    severity: "medium",
    endpoint: opts.endpoint,
    ipAddress: opts.ipAddress,
    userAgent: opts.userAgent,
    details: { reason: opts.reason ?? "no valid session" },
    statusCode: 401,
  });
}

/** Log an UPLOAD_REJECTED event (magic bytes / MIME / size validation failed) */
export function logUploadRejected(opts: {
  userId?: number | null;
  endpoint: string;
  ipAddress: string;
  userAgent?: string;
  reason: string;
  detectedMime?: string;
  declaredMime?: string;
  fileSize?: number;
  context?: string;
}): void {
  logSecurityEvent({
    eventType: "UPLOAD_REJECTED",
    severity: "medium",
    userId: opts.userId,
    endpoint: opts.endpoint,
    ipAddress: opts.ipAddress,
    userAgent: opts.userAgent,
    details: {
      reason: opts.reason,
      detectedMime: opts.detectedMime,
      declaredMime: opts.declaredMime,
      fileSize: opts.fileSize,
      context: opts.context,
    },
    statusCode: 400,
  });
}

/** Log an ADMIN_ACTION event (privileged operation performed) */
export function logAdminAction(opts: {
  userId: number;
  endpoint: string;
  ipAddress: string;
  userAgent?: string;
  action: string;
  targetType: string;
  targetId: number | string;
  result?: string;
}): void {
  logSecurityEvent({
    eventType: "ADMIN_ACTION",
    severity: "low",
    userId: opts.userId,
    endpoint: opts.endpoint,
    ipAddress: opts.ipAddress,
    userAgent: opts.userAgent,
    details: {
      action: opts.action,
      targetType: opts.targetType,
      targetId: opts.targetId,
      result: opts.result,
    },
    statusCode: 200,
  });
}

/** Log an AUTH_FAILURE event (login attempt with wrong credentials) */
export function logAuthFailure(opts: {
  endpoint: string;
  ipAddress: string;
  userAgent?: string;
  reason?: string;
  attemptedIdentifier?: string;
}): void {
  logSecurityEvent({
    eventType: "AUTH_FAILURE",
    severity: "high",
    endpoint: opts.endpoint,
    ipAddress: opts.ipAddress,
    userAgent: opts.userAgent,
    details: {
      reason: opts.reason ?? "invalid credentials",
      // Truncate identifier to avoid storing full email in logs
      attemptedIdentifier: opts.attemptedIdentifier
        ? opts.attemptedIdentifier.substring(0, 50)
        : undefined,
    },
    statusCode: 401,
  });
}
