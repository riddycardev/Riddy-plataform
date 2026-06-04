/**
 * STEP 10 — Code Quality Tests
 * Verifies:
 * - No console.log with sensitive data in production code
 * - Dead code files have been removed
 * - No native alert()/confirm() calls
 */

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();

// Simple recursive file finder (no external glob dependency)
function findFiles(dir: string, pattern: RegExp, ignore: RegExp[] = []): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const relPath = fullPath.replace(ROOT + "/", "");
      if (ignore.some(r => r.test(relPath))) continue;
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        results.push(...findFiles(fullPath, pattern, ignore));
      } else if (pattern.test(entry)) {
        results.push(relPath);
      }
    }
  } catch {}
  return results;
}

// Helper: read file safely
function readFile(relPath: string): string {
  return readFileSync(join(ROOT, relPath), "utf-8");
}

// ============================================================
// Test: No console.log in production client code
// ============================================================

describe("No console.log in production client code", () => {
  it("BookingFlow.tsx has no debug console.log statements", () => {
    const content = readFile("client/src/pages/BookingFlow.tsx");
    const debugLogs = content.match(/console\.log\(/g) || [];
    expect(debugLogs.length).toBe(0);
  });

  it("RentalContract.tsx has no sensitive console.log (props logging)", () => {
    const content = readFile("client/src/components/RentalContract.tsx");
    expect(content).not.toContain('console.log("RentalContract props"');
  });

  it("AdminDashboard.tsx has no debug console.log for button clicks", () => {
    const content = readFile("client/src/pages/AdminDashboard.tsx");
    expect(content).not.toContain("console.log('Botão Ver clicado!'");
  });

  it("oauth-config.ts has no verbose console.log for environment detection", () => {
    const content = readFile("client/src/lib/oauth-config.ts");
    const debugLogs = (content.match(/console\.log\(/g) || []).length;
    expect(debugLogs).toBe(0);
  });

  it("const.ts has no orphaned console.log arguments", () => {
    const content = readFile("client/src/const.ts");
    expect(content).not.toContain("    appId,\n    redirectUri,");
    expect(content).not.toContain("console.log");
  });
});

// ============================================================
// Test: Dead code files removed (A6)
// ============================================================

describe("Dead code files removed (A6)", () => {
  it("Signup.tsx (unused, no route) has been removed", () => {
    expect(existsSync(join(ROOT, "client/src/pages/Signup.tsx"))).toBe(false);
  });

  it("SearchResults.tsx (unused, no route) has been removed", () => {
    expect(existsSync(join(ROOT, "client/src/pages/SearchResults.tsx"))).toBe(false);
  });

  it("HostDashboard.tsx (old, replaced by HostDashboardNew.tsx) has been removed", () => {
    expect(existsSync(join(ROOT, "client/src/pages/HostDashboard.tsx"))).toBe(false);
  });

  it("HostDashboardNew.tsx still exists (the active version)", () => {
    expect(existsSync(join(ROOT, "client/src/pages/HostDashboardNew.tsx"))).toBe(true);
  });
});

// ============================================================

// ============================================================
// Test: No native alert()/confirm() in key client files
// ============================================================

describe("No native alert()/confirm() in client code (A9)", () => {
  const keyFiles = [
    "client/src/pages/BookingFlow.tsx",
    "client/src/pages/AdminDashboard.tsx",
    "client/src/pages/HostDashboardNew.tsx",
    "client/src/pages/MyBookings.tsx",
    "client/src/components/VerificationQueue.tsx",
    "client/src/pages/AddVehicle.tsx",
  ];

  it("no key file uses window.alert()", () => {
    const filesWithAlert = keyFiles.filter((f) => {
      if (!existsSync(join(ROOT, f))) return false;
      const content = readFile(f);
      return /window\.alert\(/.test(content);
    });
    expect(filesWithAlert).toEqual([]);
  });

  it("no key file uses window.confirm()", () => {
    const filesWithConfirm = keyFiles.filter((f) => {
      if (!existsSync(join(ROOT, f))) return false;
      const content = readFile(f);
      return /window\.confirm\(/.test(content);
    });
    expect(filesWithConfirm).toEqual([]);
  });

  it("ConfirmDialog component exists as replacement", () => {
    expect(
      existsSync(join(ROOT, "client/src/components/ConfirmDialog.tsx"))
    ).toBe(true);
  });
});
