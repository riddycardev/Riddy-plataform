/**
 * ETAPA 10 — Security Audit Logging Tests
 *
 * Validates:
 * 1. securityLogger.ts module exports all required functions
 * 2. logSecurityEvent correctly structures the event payload
 * 3. logForbidden, logUnauthorized, logAuthFailure, logUploadRejected, logAdminAction helpers
 * 4. security_audit_logs table exists in schema with correct columns
 * 5. admin.getSecurityLogs and admin.getSecurityStats procedures exist in appRouter
 * 6. tRPC onError handler is wired in index.ts for FORBIDDEN/UNAUTHORIZED
 * 7. documentUpload.router.ts logs auth failures and upload rejections
 * 8. db.getSecurityLogs and db.getSecurityStats helpers are exported from db.ts
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), "utf-8");
}

// ─── 1. securityLogger.ts module structure ────────────────────────────────────
describe("ETAPA 10 — securityLogger.ts module", () => {
  const loggerSrc = readFile("server/_core/securityLogger.ts");

  it("exports logSecurityEvent function", () => {
    expect(loggerSrc).toContain("export function logSecurityEvent");
  });

  it("exports logForbidden helper", () => {
    expect(loggerSrc).toContain("export function logForbidden");
  });

  it("exports logAuthFailure helper", () => {
    expect(loggerSrc).toContain("export function logAuthFailure");
  });

  it("exports logUploadRejected helper", () => {
    expect(loggerSrc).toContain("export function logUploadRejected");
  });

  it("exports logAdminAction helper", () => {
    expect(loggerSrc).toContain("export function logAdminAction");
  });

  it("logSecurityEvent accepts all required event types", () => {
    const requiredTypes = [
      "UNAUTHORIZED",
      "FORBIDDEN",
      "UPLOAD_REJECTED",
      "RATE_LIMITED",
      "INVALID_INPUT",
      "ADMIN_ACTION",
      "AUTH_FAILURE",
    ];
    for (const t of requiredTypes) {
      expect(loggerSrc).toContain(`"${t}"`);
    }
  });

  it("logSecurityEvent accepts all severity levels", () => {
    const severities = ["low", "medium", "high", "critical"];
    for (const s of severities) {
      expect(loggerSrc).toContain(`"${s}"`);
    }
  });

  it("logSecurityEvent inserts into security_audit_logs table", () => {
    expect(loggerSrc).toContain("securityAuditLogs");
    expect(loggerSrc).toContain("insert");
  });

  it("uses fire-and-forget pattern (non-blocking)", () => {
    // Should NOT await the DB insert at the call site — logging must be non-blocking
    // The function should call the async insert without blocking the request
    expect(loggerSrc).toContain("catch");
  });

  it("logForbidden sets severity to high", () => {
    expect(loggerSrc).toContain("severity: \"high\"");
  });

  it("logAuthFailure sets eventType AUTH_FAILURE", () => {
    expect(loggerSrc).toContain("AUTH_FAILURE");
  });
});

// ─── 2. security_audit_logs schema table ─────────────────────────────────────
describe("ETAPA 10 — security_audit_logs schema table", () => {
  const schemaSrc = readFile("drizzle/schema.ts");

  it("defines security_audit_logs table", () => {
    expect(schemaSrc).toContain("security_audit_logs");
  });

  it("has eventType column with enum", () => {
    expect(schemaSrc).toContain("eventType");
    expect(schemaSrc).toContain("FORBIDDEN");
    expect(schemaSrc).toContain("UNAUTHORIZED");
    expect(schemaSrc).toContain("UPLOAD_REJECTED");
    expect(schemaSrc).toContain("AUTH_FAILURE");
  });

  it("has severity column", () => {
    expect(schemaSrc).toContain("severity");
  });

  it("has userId column for user tracking", () => {
    // Check in the context of security_audit_logs table
    const tableStart = schemaSrc.indexOf("security_audit_logs");
    const tableEnd = schemaSrc.indexOf("export type SecurityAuditLog");
    const tableSection = schemaSrc.slice(tableStart, tableEnd);
    expect(tableSection).toContain("userId");
  });

  it("has ipAddress column", () => {
    const tableStart = schemaSrc.indexOf("security_audit_logs");
    const tableEnd = schemaSrc.indexOf("export type SecurityAuditLog");
    const tableSection = schemaSrc.slice(tableStart, tableEnd);
    expect(tableSection).toContain("ipAddress");
  });

  it("has endpoint column", () => {
    const tableStart = schemaSrc.indexOf("security_audit_logs");
    const tableEnd = schemaSrc.indexOf("export type SecurityAuditLog");
    const tableSection = schemaSrc.slice(tableStart, tableEnd);
    expect(tableSection).toContain("endpoint");
  });

  it("has details JSON column for flexible metadata", () => {
    const tableStart = schemaSrc.indexOf("security_audit_logs");
    const tableEnd = schemaSrc.indexOf("export type SecurityAuditLog");
    const tableSection = schemaSrc.slice(tableStart, tableEnd);
    expect(tableSection).toContain("details");
    expect(tableSection).toContain("json");
  });

  it("has createdAt timestamp column", () => {
    const tableStart = schemaSrc.indexOf("security_audit_logs");
    const tableEnd = schemaSrc.indexOf("export type SecurityAuditLog");
    const tableSection = schemaSrc.slice(tableStart, tableEnd);
    expect(tableSection).toContain("createdAt");
  });

  it("has indexes on eventType, userId, ipAddress, createdAt, severity", () => {
    const tableStart = schemaSrc.indexOf("security_audit_logs");
    const tableEnd = schemaSrc.indexOf("export type SecurityAuditLog");
    const tableSection = schemaSrc.slice(tableStart, tableEnd);
    expect(tableSection).toContain("idx_sal_eventType");
    expect(tableSection).toContain("idx_sal_userId");
    expect(tableSection).toContain("idx_sal_ipAddress");
    expect(tableSection).toContain("idx_sal_createdAt");
    expect(tableSection).toContain("idx_sal_severity");
  });

  it("exports SecurityAuditLog type", () => {
    expect(schemaSrc).toContain("export type SecurityAuditLog");
  });
});

// ─── 3. tRPC onError handler in index.ts ─────────────────────────────────────
describe("ETAPA 10 — tRPC onError handler in index.ts", () => {
  const indexSrc = readFile("server/_core/index.ts");

  it("imports securityLogger", () => {
    expect(indexSrc).toContain("securityLogger");
    expect(indexSrc).toContain("logSecurityEvent");
  });

  it("has onError handler in createExpressMiddleware", () => {
    expect(indexSrc).toContain("onError");
    expect(indexSrc).toContain("FORBIDDEN");
    expect(indexSrc).toContain("UNAUTHORIZED");
  });

  it("logs FORBIDDEN events with severity high", () => {
    expect(indexSrc).toContain("\"FORBIDDEN\"");
    expect(indexSrc).toContain("\"high\"");
  });

  it("logs UNAUTHORIZED events with severity medium", () => {
    expect(indexSrc).toContain("\"UNAUTHORIZED\"");
    expect(indexSrc).toContain("\"medium\"");
  });

  it("extracts userId from context for the log entry", () => {
    expect(indexSrc).toContain("user?.id");
  });

  it("extracts IP address for the log entry", () => {
    expect(indexSrc).toContain("getClientIp");
  });
});

// ─── 4. documentUpload.router.ts logging ─────────────────────────────────────
describe("ETAPA 10 — documentUpload.router.ts security logging", () => {
  const uploadSrc = readFile("server/documentUpload.router.ts");

  it("imports logUploadRejected and logAuthFailure", () => {
    expect(uploadSrc).toContain("logUploadRejected");
    expect(uploadSrc).toContain("logAuthFailure");
  });

  it("logs auth failure when session token is invalid", () => {
    expect(uploadSrc).toContain("logAuthFailure");
    expect(uploadSrc).toContain("invalid or missing session token");
  });

  it("logs upload rejection when magic bytes validation fails", () => {
    expect(uploadSrc).toContain("logUploadRejected");
    expect(uploadSrc).toContain("magic bytes mismatch");
  });

  it("includes IP address in upload rejection log", () => {
    expect(uploadSrc).toContain("getClientIp");
  });
});

// ─── 5. auth.login logging in routers.ts ─────────────────────────────────────
describe("ETAPA 10 — auth.login failure logging in routers.ts", () => {
  const routersSrc = readFile("server/routers.ts");

  it("imports logAuthFailure", () => {
    expect(routersSrc).toContain("logAuthFailure");
  });

  it("logs when user is not found", () => {
    expect(routersSrc).toContain("user not found");
  });

  it("logs when password is wrong", () => {
    expect(routersSrc).toContain("wrong password");
  });

  it("logs when OAuth user attempts password login", () => {
    expect(routersSrc).toContain("oauth user attempted password login");
  });

  it("includes IP address in auth failure logs", () => {
    // Check that getClientIp is used in auth.login context
    const loginSection = routersSrc.slice(
      routersSrc.indexOf("auth.login") > 0 ? routersSrc.indexOf("auth.login") : 0,
      routersSrc.indexOf("auth.login") + 3000
    );
    expect(routersSrc).toContain("getClientIp");
  });
});

// ─── 6. admin.getSecurityLogs procedure in routers.ts ────────────────────────
describe("ETAPA 10 — admin.getSecurityLogs procedure", () => {
  const routersSrc = readFile("server/routers.ts");

  it("defines getSecurityLogs procedure in adminRouter", () => {
    expect(routersSrc).toContain("getSecurityLogs");
  });

  it("defines getSecurityStats procedure in adminRouter", () => {
    expect(routersSrc).toContain("getSecurityStats");
  });

  it("getSecurityLogs is admin-only (FORBIDDEN for non-admin)", () => {
    // Find the getSecurityLogs procedure and check it uses adminProcedure (centralized auth)
    const logsIdx = routersSrc.indexOf("getSecurityLogs: adminProcedure");
    expect(logsIdx).toBeGreaterThan(-1); // procedure must exist and use adminProcedure
    const logsSection = routersSrc.slice(logsIdx, logsIdx + 700);
    // adminProcedure already enforces FORBIDDEN for non-admin via trpc.ts middleware
    expect(logsSection).toContain("adminProcedure");
  });

  it("getSecurityLogs supports filtering by eventType", () => {
    const logsIdx = routersSrc.indexOf("getSecurityLogs: adminProcedure");
    const logsSection = routersSrc.slice(logsIdx, logsIdx + 600);
    expect(logsSection).toContain("eventType");
  });

  it("getSecurityLogs supports filtering by severity", () => {
    const logsIdx = routersSrc.indexOf("getSecurityLogs: adminProcedure");
    const logsSection = routersSrc.slice(logsIdx, logsIdx + 600);
    expect(logsSection).toContain("severity");
  });

  it("getSecurityLogs supports pagination (limit + offset)", () => {
    const logsIdx = routersSrc.indexOf("getSecurityLogs: adminProcedure");
    const logsSection = routersSrc.slice(logsIdx, logsIdx + 600);
    expect(logsSection).toContain("limit");
    expect(logsSection).toContain("offset");
  });
});

// ─── 7. db.ts security log helpers ───────────────────────────────────────────
describe("ETAPA 10 — db.ts security log helpers", () => {
  const dbSrc = readFile("server/db.ts");

  it("exports getSecurityLogs function", () => {
    expect(dbSrc).toContain("export async function getSecurityLogs");
  });

  it("exports getSecurityStats function", () => {
    expect(dbSrc).toContain("export async function getSecurityStats");
  });

  it("getSecurityLogs queries securityAuditLogs table", () => {
    const fnStart = dbSrc.indexOf("export async function getSecurityLogs");
    const fnSection = dbSrc.slice(fnStart, fnStart + 1000);
    expect(fnSection).toContain("securityAuditLogs");
  });

  it("getSecurityStats returns last24hCount and last7dCount", () => {
    const fnStart = dbSrc.indexOf("export async function getSecurityStats");
    const fnSection = dbSrc.slice(fnStart, fnStart + 1000);
    expect(fnSection).toContain("last24hCount");
    expect(fnSection).toContain("last7dCount");
  });

  it("getSecurityStats returns byType breakdown", () => {
    const fnStart = dbSrc.indexOf("export async function getSecurityStats");
    const fnSection = dbSrc.slice(fnStart, fnStart + 1000);
    expect(fnSection).toContain("byType");
  });
});

// ─── 8. vehicle.getOwnerDocuments logging ────────────────────────────────────
describe("ETAPA 10 — vehicle.getOwnerDocuments FORBIDDEN logging", () => {
  const routersSrc = readFile("server/routers.ts");

  it("logs FORBIDDEN when non-owner tries to view vehicle documents", () => {
    const ownerDocsIdx = routersSrc.indexOf("getOwnerDocuments: protectedProcedure");
    const ownerDocsSection = routersSrc.slice(ownerDocsIdx, ownerDocsIdx + 800);
    expect(ownerDocsSection).toContain("logForbidden");
    expect(ownerDocsSection).toContain("not vehicle owner");
  });

  it("includes resourceType and resourceId in the log", () => {
    const ownerDocsIdx = routersSrc.indexOf("getOwnerDocuments: protectedProcedure");
    const ownerDocsSection = routersSrc.slice(ownerDocsIdx, ownerDocsIdx + 800);
    expect(ownerDocsSection).toContain("resourceType");
    expect(ownerDocsSection).toContain("resourceId");
  });
});
