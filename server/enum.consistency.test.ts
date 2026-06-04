/**
 * STEP 9 — Enum Consistency Tests
 * Verifies that:
 * - The cilindrada enum in schema.ts matches the frontend SelectItem values
 * - No frontend SelectItem value would be rejected by the DB enum
 * - All DB enum values are representable in the frontend
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ============================================================
// Extract enum values from schema.ts
// ============================================================

function extractEnumValues(schemaContent: string, enumName: string): string[] {
  // Match: mysqlEnum("enumName", ["val1", "val2", ...]) — may span multiple lines
  const regex = new RegExp(
    `mysqlEnum\\("${enumName}"\\s*,\\s*\\[([^\\]]+)\\]`,
    "s"
  );
  const match = schemaContent.match(regex);
  if (!match) return [];
  const values = match[1].match(/"([^"]+)"/g) || [];
  return values.map((v) => v.replace(/"/g, ""));
}

// ============================================================
// Extract SelectItem values from a TSX file
// ============================================================

function extractSelectItemValues(content: string): string[] {
  const regex = /<SelectItem\s+value="([^"]+)"/g;
  const values: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    values.push(match[1]);
  }
  return values;
}

// ============================================================
// Test: cilindrada enum
// ============================================================

describe("cilindrada enum consistency", () => {
  const schemaPath = path.resolve(__dirname, "../drizzle/schema.ts");
  const addMotorcyclePath = path.resolve(
    __dirname,
    "../client/src/pages/AddMotorcycle.tsx"
  );

  const schemaContent = fs.readFileSync(schemaPath, "utf-8");
  const frontendContent = fs.readFileSync(addMotorcyclePath, "utf-8");

  const schemaValues = extractEnumValues(schemaContent, "cilindrada");
  const frontendValues = extractSelectItemValues(frontendContent).filter(
    (v) => v.endsWith("cc") || v.endsWith("cc+")
  );

  it("schema.ts cilindrada enum has 18 values (expanded from original 4)", () => {
    expect(schemaValues).toHaveLength(18);
  });

  it("schema.ts cilindrada enum contains all 18 expected values", () => {
    const expected = [
      "125cc", "150cc", "160cc", "180cc", "200cc",
      "250cc", "300cc", "350cc", "400cc", "500cc",
      "600cc", "750cc", "800cc", "900cc", "1000cc",
      "1100cc", "1200cc", "1200cc+",
    ];
    expect(schemaValues.sort()).toEqual(expected.sort());
  });

  it("AddMotorcycle.tsx cilindrada SelectItems all exist in schema enum", () => {
    const invalidValues = frontendValues.filter(
      (v) => !schemaValues.includes(v)
    );
    expect(invalidValues).toEqual([]);
  });

  it("schema cilindrada enum covers all frontend cilindrada options", () => {
    const missingFromFrontend = schemaValues.filter(
      (v) => !frontendValues.includes(v)
    );
    expect(missingFromFrontend).toEqual([]);
  });

  it("old 4-value enum values are still present (backward compatibility)", () => {
    const oldValues = ["125cc", "250cc", "600cc", "1200cc+"];
    for (const v of oldValues) {
      expect(schemaValues).toContain(v);
    }
  });
});

// ============================================================
// Test: tipoMoto enum
// ============================================================

describe("tipoMoto enum consistency", () => {
  const schemaPath = path.resolve(__dirname, "../drizzle/schema.ts");
  const addMotorcyclePath = path.resolve(
    __dirname,
    "../client/src/pages/AddMotorcycle.tsx"
  );

  const schemaContent = fs.readFileSync(schemaPath, "utf-8");
  const frontendContent = fs.readFileSync(addMotorcyclePath, "utf-8");

  const schemaValues = extractEnumValues(schemaContent, "tipoMoto");
  const frontendValues = extractSelectItemValues(frontendContent).filter((v) =>
    ["street", "sport", "naked", "cruiser", "adventure", "scooter"].includes(v)
  );

  it("schema.ts tipoMoto enum has 6 values", () => {
    expect(schemaValues).toHaveLength(6);
  });

  it("AddMotorcycle.tsx tipoMoto SelectItems all exist in schema enum", () => {
    const invalidValues = frontendValues.filter(
      (v) => !schemaValues.includes(v)
    );
    expect(invalidValues).toEqual([]);
  });
});

// ============================================================
// Test: document status enum
// ============================================================

describe("document status enum consistency", () => {
  const schemaPath = path.resolve(__dirname, "../drizzle/schema.ts");
  const schemaContent = fs.readFileSync(schemaPath, "utf-8");

  it("userDocuments status enum has pending, approved, rejected", () => {
    // Find the status enum in userDocuments table specifically
    const tableSection = schemaContent.match(
      /userDocuments\s*=\s*mysqlTable[\s\S]*?(?=export const \w)/
    );
    expect(tableSection).not.toBeNull();
    const statusEnum = extractEnumValues(tableSection![0], "status");
    expect(statusEnum).toContain("pending");
    expect(statusEnum).toContain("approved");
    expect(statusEnum).toContain("rejected");
  });

  it("no document is auto-approved (pending is the default)", () => {
    // Check that the status field defaults to 'pending'
    expect(schemaContent).toContain(
      'status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull()'
    );
  });
});
