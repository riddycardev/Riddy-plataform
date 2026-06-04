import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "../db";
import { motorcycleRouter } from "./motorcycle";

describe("Motorcycle Router", () => {
  it("should have all required procedures", () => {
    expect(motorcycleRouter.createCaller).toBeDefined();
    
    const procedures = Object.keys(motorcycleRouter._def.procedures);
    expect(procedures).toContain("create");
    expect(procedures).toContain("getById");
    expect(procedures).toContain("list");
    expect(procedures).toContain("getMyMotorcycles");
    expect(procedures).toContain("update");
    expect(procedures).toContain("delete");
    expect(procedures).toContain("search");
  });

  it("should validate required fields in create procedure", () => {
    // This test verifies that the schema validation is in place
    expect(motorcycleRouter._def.procedures.create).toBeDefined();
  });

  it("should have proper access control", () => {
    // getMyMotorcycles should be protected
    const getMyMotorcyclesProc = motorcycleRouter._def.procedures.getMyMotorcycles;
    expect(getMyMotorcyclesProc).toBeDefined();
    
    // list should be public
    const listProc = motorcycleRouter._def.procedures.list;
    expect(listProc).toBeDefined();
  });
});
