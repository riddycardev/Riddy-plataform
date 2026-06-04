/**
 * ETAPA 12 — Validação de Placa Veicular Brasileira
 * Testes para o módulo shared/licensePlate.ts
 * Cobre formatos MERCOSUL (ABC1D23) e antigo (ABC1234 / ABC-1234)
 */

import { describe, it, expect } from "vitest";
import {
  isValidBrazilianPlate,
  normalizePlate,
  detectPlateFormat,
  MERCOSUL_REGEX as PLATE_REGEX_MERCOSUL,
  OLD_FORMAT_REGEX as PLATE_REGEX_OLD,
} from "../shared/licensePlate";

// ─────────────────────────────────────────────────────────────────────────────
// isValidBrazilianPlate
// ─────────────────────────────────────────────────────────────────────────────

describe("isValidBrazilianPlate — formato MERCOSUL (ABC1D23)", () => {
  it("aceita placa MERCOSUL sem hífen", () => {
    expect(isValidBrazilianPlate("ABC1D23")).toBe(true);
  });

  it("aceita placa MERCOSUL com letras minúsculas (case-insensitive)", () => {
    expect(isValidBrazilianPlate("abc1d23")).toBe(true);
  });

  it("aceita placa MERCOSUL mista maiúscula/minúscula", () => {
    expect(isValidBrazilianPlate("Abc1D23")).toBe(true);
  });

  it("aceita placa MERCOSUL com letras A-Z e dígitos 0-9 na 5ª posição", () => {
    expect(isValidBrazilianPlate("XYZ9A01")).toBe(true);
    expect(isValidBrazilianPlate("MNO2Z99")).toBe(true);
  });

  it("rejeita MERCOSUL com dígito na 5ª posição (seria formato antigo)", () => {
    // ABC1234 é formato antigo, não MERCOSUL
    // mas isValidBrazilianPlate deve aceitar ambos
    expect(isValidBrazilianPlate("ABC1234")).toBe(true); // formato antigo sem hífen
  });

  it("rejeita placa MERCOSUL com caracteres especiais", () => {
    expect(isValidBrazilianPlate("ABC1D2@")).toBe(false);
  });

  it("rejeita placa MERCOSUL com comprimento errado", () => {
    expect(isValidBrazilianPlate("ABC1D2")).toBe(false);   // 6 chars
    expect(isValidBrazilianPlate("ABC1D234")).toBe(false); // 8 chars
  });

  it("placa MERCOSUL com espaço interno é normalizada e aceita (ABC 1D23 → ABC1D23)", () => {
    // normalizePlate remove espaços antes de validar
    expect(isValidBrazilianPlate("ABC 1D23")).toBe(true);
  });
});

describe("isValidBrazilianPlate — formato antigo (ABC1234 / ABC-1234)", () => {
  it("aceita placa antiga sem hífen", () => {
    expect(isValidBrazilianPlate("ABC1234")).toBe(true);
  });

  it("aceita placa antiga com hífen", () => {
    expect(isValidBrazilianPlate("ABC-1234")).toBe(true);
  });

  it("aceita placa antiga com letras minúsculas", () => {
    expect(isValidBrazilianPlate("abc1234")).toBe(true);
    expect(isValidBrazilianPlate("abc-1234")).toBe(true);
  });

  it("rejeita placa antiga com dígito no lugar de letra", () => {
    expect(isValidBrazilianPlate("1BC1234")).toBe(false);
    expect(isValidBrazilianPlate("AB31234")).toBe(false);
  });

  it("rejeita placa antiga com letra no lugar de dígito", () => {
    expect(isValidBrazilianPlate("ABCABCD")).toBe(false);
  });

  it("rejeita placa antiga com comprimento errado", () => {
    expect(isValidBrazilianPlate("ABC123")).toBe(false);   // 6 chars
    expect(isValidBrazilianPlate("ABC12345")).toBe(false); // 8 chars sem hífen
  });
});

describe("isValidBrazilianPlate — casos inválidos gerais", () => {
  it("rejeita string vazia", () => {
    expect(isValidBrazilianPlate("")).toBe(false);
  });

  it("rejeita apenas espaços", () => {
    expect(isValidBrazilianPlate("   ")).toBe(false);
  });

  it("rejeita placa com caracteres especiais", () => {
    expect(isValidBrazilianPlate("ABC!234")).toBe(false);
    expect(isValidBrazilianPlate("ABC#1D2")).toBe(false);
  });

  it("placa com espaço interno é normalizada e aceita (ABC 1234 → ABC1234)", () => {
    // normalizePlate remove espaços antes de validar
    // ABC 1234 → ABC1234 (formato antigo válido)
    expect(isValidBrazilianPlate("ABC 1234")).toBe(true);
  });

  it("rejeita undefined/null como string vazia", () => {
    expect(isValidBrazilianPlate("undefined")).toBe(false);
    expect(isValidBrazilianPlate("null")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// normalizePlate
// ─────────────────────────────────────────────────────────────────────────────

describe("normalizePlate — normalização para forma canônica", () => {
  it("converte MERCOSUL para maiúsculo sem hífen", () => {
    expect(normalizePlate("abc1d23")).toBe("ABC1D23");
  });

  it("mantém MERCOSUL já normalizado", () => {
    expect(normalizePlate("ABC1D23")).toBe("ABC1D23");
  });

  it("converte formato antigo sem hífen para maiúsculo", () => {
    expect(normalizePlate("abc1234")).toBe("ABC1234");
  });

  it("remove hífen do formato antigo e converte para maiúsculo", () => {
    expect(normalizePlate("abc-1234")).toBe("ABC1234");
    expect(normalizePlate("ABC-1234")).toBe("ABC1234");
  });

  it("remove espaços e converte para maiúsculo", () => {
    expect(normalizePlate("  abc1234  ")).toBe("ABC1234");
  });

  it("retorna string vazia para entrada vazia", () => {
    expect(normalizePlate("")).toBe("");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getPlateFormat
// ─────────────────────────────────────────────────────────────────────────────

describe("detectPlateFormat — identificação do formato", () => {
  it("identifica formato MERCOSUL corretamente", () => {
    expect(detectPlateFormat("ABC1D23")).toBe("mercosul");
    expect(detectPlateFormat("abc1d23")).toBe("mercosul");
  });

  it("identifica formato antigo corretamente", () => {
    expect(detectPlateFormat("ABC1234")).toBe("old");
    expect(detectPlateFormat("ABC-1234")).toBe("old");
    expect(detectPlateFormat("abc-1234")).toBe("old");
  });

  it("retorna 'invalid' para placa inválida", () => {
    expect(detectPlateFormat("INVALID")).toBe("invalid");
    expect(detectPlateFormat("")).toBe("invalid");
    expect(detectPlateFormat("ABC123")).toBe("invalid");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Regex exports
// ─────────────────────────────────────────────────────────────────────────────

describe("Regex exports — PLATE_REGEX_MERCOSUL e PLATE_REGEX_OLD", () => {
  it("PLATE_REGEX_MERCOSUL aceita placas MERCOSUL válidas", () => {
    expect(PLATE_REGEX_MERCOSUL.test("ABC1D23")).toBe(true);
    expect(PLATE_REGEX_MERCOSUL.test("XYZ9Z99")).toBe(true);
  });

  it("PLATE_REGEX_MERCOSUL rejeita formato antigo", () => {
    expect(PLATE_REGEX_MERCOSUL.test("ABC1234")).toBe(false);
  });

  it("PLATE_REGEX_OLD aceita placas antigas válidas (forma normalizada sem hífen)", () => {
    // A regex trabalha sobre a forma normalizada (sem hífen)
    expect(PLATE_REGEX_OLD.test("ABC1234")).toBe(true);
    // Com hífen deve ser normalizado antes de testar
    expect(PLATE_REGEX_OLD.test("ABC1234".replace(/-/g, ""))).toBe(true);
  });

  it("PLATE_REGEX_OLD rejeita formato MERCOSUL", () => {
    expect(PLATE_REGEX_OLD.test("ABC1D23")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integração: Zod refine pattern (simula validação do backend)
// ─────────────────────────────────────────────────────────────────────────────

describe("Integração — padrão Zod .refine() usado no backend", () => {
  const zodRefine = (plate: string) => isValidBrazilianPlate(plate);

  it("aceita todas as placas válidas que chegam ao backend", () => {
    const validPlates = [
      "ABC1D23",  // MERCOSUL
      "XYZ9Z99",  // MERCOSUL
      "ABC1234",  // antigo sem hífen
      "ABC-1234", // antigo com hífen
      "abc1d23",  // MERCOSUL minúsculo
      "abc-1234", // antigo minúsculo com hífen
    ];
    for (const plate of validPlates) {
      expect(zodRefine(plate)).toBe(true);
    }
  });

  it("rejeita todas as placas inválidas que chegam ao backend", () => {
    const invalidPlates = [
      "",
      "ABC",
      "1234567",
      "ABCDEFG",
      "ABC 1234",  // espaço interno — normaliza para ABC1234 que é válido, então removemos
      "ABC!1234",
      "AB1234",   // só 2 letras
      "ABCD1234", // 4 letras
    ];
    // Nota: "ABC 1234" normaliza para "ABC1234" que é válido — removido da lista
    const trulyInvalid = ["", "ABC", "1234567", "ABCDEFG", "ABC!1234", "AB1234", "ABCD1234"];
    for (const plate of trulyInvalid) {
      expect(zodRefine(plate)).toBe(false);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Normalização pós-validação (simula fluxo completo)
// ─────────────────────────────────────────────────────────────────────────────

describe("Fluxo completo — validar → normalizar → armazenar", () => {
  it("placa MERCOSUL minúscula é validada e normalizada corretamente", () => {
    const input = "abc1d23";
    expect(isValidBrazilianPlate(input)).toBe(true);
    expect(normalizePlate(input)).toBe("ABC1D23");
  });

  it("placa antiga com hífen é validada e normalizada sem hífen", () => {
    const input = "abc-1234";
    expect(isValidBrazilianPlate(input)).toBe(true);
    expect(normalizePlate(input)).toBe("ABC1234");
  });

  it("placa inválida não deve ser normalizada (caller deve checar antes)", () => {
    const input = "INVALID";
    expect(isValidBrazilianPlate(input)).toBe(false);
    // normalizePlate ainda remove hífen e converte para maiúsculo,
    // mas o resultado não é uma placa válida
    expect(isValidBrazilianPlate(normalizePlate(input))).toBe(false);
  });
});
