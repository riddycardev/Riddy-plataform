/**
 * ETAPA 3 — Security Headers Tests
 *
 * Verifies that helmet is correctly configured and all required
 * security headers are present on HTTP responses.
 *
 * Tests make real HTTP requests to the running dev server (localhost:3000).
 */

import { describe, it, expect, beforeAll } from "vitest";
import http from "http";

// ── Helper: fetch headers from the running server ────────────────────────────

function getHeaders(path: string = "/"): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "localhost", port: 3000, path, method: "HEAD" },
      (res) => {
        const headers: Record<string, string> = {};
        for (const [key, value] of Object.entries(res.headers)) {
          if (typeof value === "string") headers[key.toLowerCase()] = value;
          else if (Array.isArray(value)) headers[key.toLowerCase()] = value.join(", ");
        }
        resolve(headers);
      }
    );
    req.on("error", reject);
    req.end();
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ETAPA 3 — Security Headers: helmet is active", () => {
  let headers: Record<string, string>;

  beforeAll(async () => {
    headers = await getHeaders("/");
  }, 10_000);

  it("removes X-Powered-By header (technology fingerprinting prevention)", () => {
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  it("sets X-Frame-Options: DENY (clickjacking protection)", () => {
    expect(headers["x-frame-options"]).toBe("DENY");
  });

  it("sets X-Content-Type-Options: nosniff (MIME sniffing prevention)", () => {
    expect(headers["x-content-type-options"]).toBe("nosniff");
  });

  it("sets Referrer-Policy: strict-origin-when-cross-origin", () => {
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });

  it("sets Cross-Origin-Opener-Policy: same-origin", () => {
    expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
  });

  it("sets Cross-Origin-Resource-Policy: same-origin", () => {
    expect(headers["cross-origin-resource-policy"]).toBe("same-origin");
  });

  it("sets X-DNS-Prefetch-Control: off", () => {
    expect(headers["x-dns-prefetch-control"]).toBe("off");
  });

  it("sets X-Permitted-Cross-Domain-Policies: none", () => {
    expect(headers["x-permitted-cross-domain-policies"]).toBe("none");
  });
});

describe("ETAPA 3 — Content-Security-Policy: directives are correct", () => {
  let csp: string;

  beforeAll(async () => {
    const headers = await getHeaders("/");
    csp = headers["content-security-policy"] ?? "";
  }, 10_000);

  it("CSP header is present", () => {
    expect(csp.length).toBeGreaterThan(0);
  });

  it("default-src is 'self' (restricts unknown sources)", () => {
    expect(csp).toContain("default-src 'self'");
  });

  it("object-src is 'none' (blocks Flash/plugins)", () => {
    expect(csp).toContain("object-src 'none'");
  });

  it("base-uri is 'self' (prevents base tag hijacking)", () => {
    expect(csp).toContain("base-uri 'self'");
  });

  it("form-action is 'self' (prevents form hijacking)", () => {
    expect(csp).toContain("form-action 'self'");
  });

  it("allows Google Maps scripts (required for location features)", () => {
    expect(csp).toContain("https://maps.googleapis.com");
  });

  it("allows Google Fonts (required for typography)", () => {
    expect(csp).toContain("https://fonts.googleapis.com");
  });
});

// ── Static analysis: verify helmet is imported and configured in index.ts ────

describe("ETAPA 3 — Static analysis: helmet is in server code", () => {
  const { readFileSync } = require("fs");
  const { resolve } = require("path");
  const ROOT = resolve(__dirname, "..");
  const indexSrc = readFileSync(resolve(ROOT, "server/_core/index.ts"), "utf-8");

  it("imports helmet", () => {
    expect(indexSrc).toContain("import helmet from \"helmet\"");
  });

  it("calls app.use(helmet(...))", () => {
    expect(indexSrc).toContain("app.use(");
    expect(indexSrc).toContain("helmet({");
  });

  it("disables X-Powered-By at Express app level", () => {
    expect(indexSrc).toContain("app.disable(\"x-powered-by\")");
  });

  it("helmet is applied BEFORE route registrations", () => {
    const helmetIdx = indexSrc.indexOf("app.use(\n    helmet(");
  });

  it("HSTS is enabled in production only (not in development)", () => {
    expect(indexSrc).toContain("hsts: IS_PRODUCTION");
    expect(indexSrc).toContain("? { maxAge: 31536000, includeSubDomains: true, preload: true }");
    expect(indexSrc).toContain(": false");
  });
});
