/**
 * Motorcycle Frontend Routes Test
 * Validates that all motorcycle-related routes and procedures are properly registered
 */
import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

describe("Motorcycle Router Registration", () => {
  it("should have motorcycle router registered in appRouter", () => {
    const routerKeys = Object.keys(appRouter._def.procedures);
    const motorcycleProcedures = routerKeys.filter(k => k.startsWith("motorcycle."));
    expect(motorcycleProcedures.length).toBeGreaterThan(0);
  });

  it("should have motorcycle.list procedure", () => {
    const routerKeys = Object.keys(appRouter._def.procedures);
    expect(routerKeys).toContain("motorcycle.list");
  });

  it("should have motorcycle.getById procedure", () => {
    const routerKeys = Object.keys(appRouter._def.procedures);
    expect(routerKeys).toContain("motorcycle.getById");
  });

  it("should have motorcycle.create procedure", () => {
    const routerKeys = Object.keys(appRouter._def.procedures);
    expect(routerKeys).toContain("motorcycle.create");
  });

  it("should have motorcycle.search procedure", () => {
    const routerKeys = Object.keys(appRouter._def.procedures);
    expect(routerKeys).toContain("motorcycle.search");
  });

  it("should have motorcycle.getMyMotorcycles procedure", () => {
    const routerKeys = Object.keys(appRouter._def.procedures);
    expect(routerKeys).toContain("motorcycle.getMyMotorcycles");
  });

  it("should have motorcycle.update procedure", () => {
    const routerKeys = Object.keys(appRouter._def.procedures);
    expect(routerKeys).toContain("motorcycle.update");
  });

  it("should have motorcycle.delete procedure", () => {
    const routerKeys = Object.keys(appRouter._def.procedures);
    expect(routerKeys).toContain("motorcycle.delete");
  });

  it("should have exactly 7 motorcycle procedures", () => {
    const routerKeys = Object.keys(appRouter._def.procedures);
    const motorcycleProcedures = routerKeys.filter(k => k.startsWith("motorcycle."));
    expect(motorcycleProcedures.length).toBe(7);
  });
});
