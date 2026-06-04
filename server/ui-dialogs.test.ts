/**
 * STEP 8 — UI Dialogs Tests
 * Verifies that:
 * - No native alert()/confirm()/prompt() calls exist in the codebase
 * - ConfirmDialog component is used for all confirmation flows
 * - Toast notifications are used for error/success messages
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ============================================================
// Helper: scan files for forbidden patterns
// ============================================================

function scanDirectory(dir: string, extensions: string[]): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.includes("node_modules") && !entry.name.startsWith(".")) {
      files.push(...scanDirectory(fullPath, extensions));
    } else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

const CLIENT_SRC = path.resolve(__dirname, "../client/src");

describe("No native browser dialogs in frontend code", () => {
  it("should have no window.alert() calls", () => {
    const files = scanDirectory(CLIENT_SRC, [".tsx", ".ts"]);
    const violations: string[] = [];

    for (const file of files) {
      // Skip test files and the ConfirmDialog component itself (it's the replacement)
      if (file.includes(".test.") || file.includes("ConfirmDialog")) continue;
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");
      lines.forEach((line, idx) => {
        // Match alert( but not in comments
        if (/\balert\(/.test(line) && !line.trim().startsWith("//") && !line.trim().startsWith("*")) {
          violations.push(`${path.relative(CLIENT_SRC, file)}:${idx + 1}: ${line.trim()}`);
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it("should have no window.confirm() or bare confirm() calls", () => {
    const files = scanDirectory(CLIENT_SRC, [".tsx", ".ts"]);
    const violations: string[] = [];

    for (const file of files) {
      if (file.includes(".test.") || file.includes("ConfirmDialog")) continue;
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");
      lines.forEach((line, idx) => {
        if (/\bconfirm\(/.test(line) && !line.trim().startsWith("//") && !line.trim().startsWith("*")) {
          violations.push(`${path.relative(CLIENT_SRC, file)}:${idx + 1}: ${line.trim()}`);
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it("should have no window.prompt() calls", () => {
    const files = scanDirectory(CLIENT_SRC, [".tsx", ".ts"]);
    const violations: string[] = [];

    for (const file of files) {
      if (file.includes(".test.") || file.includes("ConfirmDialog")) continue;
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");
      lines.forEach((line, idx) => {
        if (/\bprompt\(/.test(line) && !line.trim().startsWith("//") && !line.trim().startsWith("*")) {
          violations.push(`${path.relative(CLIENT_SRC, file)}:${idx + 1}: ${line.trim()}`);
        }
      });
    }

    expect(violations).toEqual([]);
  });
});

// ============================================================
// Verify ConfirmDialog component exists and has correct API
// ============================================================

describe("ConfirmDialog component", () => {
  const confirmDialogPath = path.resolve(CLIENT_SRC, "components/ConfirmDialog.tsx");

  it("ConfirmDialog.tsx file exists", () => {
    expect(fs.existsSync(confirmDialogPath)).toBe(true);
  });

  it("ConfirmDialog exports a default function", () => {
    const content = fs.readFileSync(confirmDialogPath, "utf-8");
    expect(content).toContain("export default function ConfirmDialog");
  });

  it("ConfirmDialog accepts open, onOpenChange, title, onConfirm props", () => {
    const content = fs.readFileSync(confirmDialogPath, "utf-8");
    expect(content).toContain("open:");
    expect(content).toContain("onOpenChange:");
    expect(content).toContain("title:");
    expect(content).toContain("onConfirm:");
  });

  it("ConfirmDialog supports destructive variant", () => {
    const content = fs.readFileSync(confirmDialogPath, "utf-8");
    expect(content).toContain("destructive");
  });

  it("ConfirmDialog uses AlertDialog from Radix UI", () => {
    const content = fs.readFileSync(confirmDialogPath, "utf-8");
    expect(content).toContain("AlertDialog");
    expect(content).toContain("alert-dialog");
  });
});

// ============================================================
// Verify toast is used for error messages in key files
// ============================================================

describe("Toast notifications for errors", () => {
  it("BookingFlow.tsx uses toast for validation errors", () => {
    const filePath = path.resolve(CLIENT_SRC, "pages/BookingFlow.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("toast.error");
    expect(content).not.toMatch(/\balert\(/);
  });

  it("VerificationQueue.tsx uses toast for errors", () => {
    const filePath = path.resolve(CLIENT_SRC, "components/VerificationQueue.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("toast.error");
    expect(content).not.toMatch(/\balert\(/);
  });

  it("AdminDashboard.tsx uses toast for errors", () => {
    const filePath = path.resolve(CLIENT_SRC, "pages/AdminDashboard.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("toast.error");
    expect(content).not.toMatch(/\balert\(/);
  });

  it("HostDashboardNew.tsx uses ConfirmDialog for delete", () => {
    const filePath = path.resolve(CLIENT_SRC, "pages/HostDashboardNew.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("ConfirmDialog");
    expect(content).not.toMatch(/window\.confirm\(/);
  });

  it("MyBookings.tsx uses ConfirmDialog for cancellation", () => {
    const filePath = path.resolve(CLIENT_SRC, "pages/MyBookings.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("ConfirmDialog");
    expect(content).not.toMatch(/\bconfirm\(/);
  });
});
