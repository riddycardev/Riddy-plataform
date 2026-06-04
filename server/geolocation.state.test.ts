/**
 * Tests for state-based vehicle filtering
 */
import { describe, it, expect } from "vitest";
import { normalizeState, BRAZIL_STATES } from "./db";

describe("normalizeState", () => {
  it("deve aceitar sigla válida em maiúsculo", () => {
    expect(normalizeState("RO")).toBe("RO");
    expect(normalizeState("SP")).toBe("SP");
    expect(normalizeState("MG")).toBe("MG");
  });

  it("deve aceitar sigla em minúsculo", () => {
    expect(normalizeState("ro")).toBe("RO");
    expect(normalizeState("sp")).toBe("SP");
  });

  it("deve aceitar nome completo com acentos", () => {
    expect(normalizeState("Rondônia")).toBe("RO");
    expect(normalizeState("São Paulo")).toBe("SP");
    expect(normalizeState("Minas Gerais")).toBe("MG");
  });

  it("deve aceitar nome sem acentos", () => {
    expect(normalizeState("Rondonia")).toBe("RO");
    expect(normalizeState("Sao Paulo")).toBe("SP");
  });

  it("deve retornar null para estado inválido", () => {
    expect(normalizeState("XX")).toBeNull();
    expect(normalizeState("")).toBeNull();
    expect(normalizeState("Narnia")).toBeNull();
  });
});

describe("BRAZIL_STATES", () => {
  it("deve ter 27 estados", () => {
    expect(Object.keys(BRAZIL_STATES).length).toBe(27);
  });

  it("deve incluir Rondônia como RO", () => {
    expect(BRAZIL_STATES["RO"]).toBe("Rondônia");
  });

  it("deve incluir todos os estados da região Norte", () => {
    const norte = ["AC", "AP", "AM", "PA", "RO", "RR", "TO"];
    norte.forEach((sigla) => {
      expect(BRAZIL_STATES[sigla]).toBeDefined();
    });
  });
});
