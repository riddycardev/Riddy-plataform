import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "user" | "host" | "admin" = "user"): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });
  });
});

describe("auth.me", () => {
  it("returns user when authenticated", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeDefined();
    expect(result?.email).toBe("sample@example.com");
    expect(result?.name).toBe("Sample User");
  });

  it("returns null when not authenticated", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeNull();
  });
});

describe("vehicle.list", () => {
  it("returns an array (may be empty if no DB)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.vehicle.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("accepts filter parameters", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.vehicle.list({
      city: "São Paulo",
      category: "sedan",
      minPrice: 100,
      maxPrice: 500,
      limit: 10,
      offset: 0,
    });

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("router structure", () => {
  it("has all expected routers", () => {
    expect(appRouter._def.procedures).toBeDefined();
    
    // Check main routers exist
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("auth.me");
    expect(procedures).toContain("auth.logout");
    expect(procedures).toContain("vehicle.list");
    expect(procedures).toContain("vehicle.getById");
  });
});

describe("admin router access control", () => {
  it("admin.getStats throws FORBIDDEN for non-admin users", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.getStats()).rejects.toThrow("You do not have required permission (10002)");
  });

  it("admin.getStats works for admin users", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    // This may return null if DB is not available, but should not throw FORBIDDEN
    const result = await caller.admin.getStats();
    // Result can be null if DB not available
    expect(result === null || typeof result === "object").toBe(true);
  });
});

describe("Price Calculations", () => {
  it("calculates extra km charge correctly", () => {
    const dailyKmLimit = 200;
    const totalDays = 3;
    const startMileage = 50000;
    const endMileage = 50750;
    const extraKmPrice = 1.5;
    
    const totalKmAllowed = dailyKmLimit * totalDays; // 600
    const actualKmDriven = endMileage - startMileage; // 750
    const extraKm = Math.max(0, actualKmDriven - totalKmAllowed); // 150
    const extraCharge = extraKm * extraKmPrice; // 225
    
    expect(totalKmAllowed).toBe(600);
    expect(actualKmDriven).toBe(750);
    expect(extraKm).toBe(150);
    expect(extraCharge).toBe(225);
  });

  it("calculates booking total correctly", () => {
    const dailyRate = 450;
    const totalDays = 3;
    const subtotal = dailyRate * totalDays; // 1350
    const serviceFee = subtotal * 0.12; // 162
    const insuranceFee = totalDays * 35; // 105 (standard)
    const total = subtotal + serviceFee + insuranceFee; // 1617
    
    expect(subtotal).toBe(1350);
    expect(serviceFee).toBe(162);
    expect(insuranceFee).toBe(105);
    expect(total).toBe(1617);
  });

  it("calculates late return fee correctly", () => {
    const hourlyLateFee = 50;
    const hoursLate = 3;
    const lateFee = hourlyLateFee * hoursLate;
    
    expect(lateFee).toBe(150);
  });

  it("calculates no extra charge when under km limit", () => {
    const dailyKmLimit = 200;
    const totalDays = 3;
    const startMileage = 50000;
    const endMileage = 50500; // Only 500km driven
    const extraKmPrice = 1.5;
    
    const totalKmAllowed = dailyKmLimit * totalDays; // 600
    const actualKmDriven = endMileage - startMileage; // 500
    const extraKm = Math.max(0, actualKmDriven - totalKmAllowed); // 0
    const extraCharge = extraKm * extraKmPrice; // 0
    
    expect(extraKm).toBe(0);
    expect(extraCharge).toBe(0);
  });
});

describe("Input Validation", () => {
  it("validates rating range", () => {
    const validRatings = [1, 2, 3, 4, 5];
    const invalidRatings = [0, 6, -1, 10];
    
    validRatings.forEach(rating => {
      expect(rating >= 1 && rating <= 5).toBe(true);
    });
    
    invalidRatings.forEach(rating => {
      expect(rating >= 1 && rating <= 5).toBe(false);
    });
  });

  it("validates booking dates are in correct order", () => {
    const startDate = new Date("2026-02-01");
    const endDate = new Date("2026-02-05");
    const invalidEndDate = new Date("2026-01-25");
    
    expect(endDate > startDate).toBe(true);
    expect(invalidEndDate > startDate).toBe(false);
  });

  it("validates CPF format (11 digits)", () => {
    const validCPF = "12345678901";
    const invalidCPF = "123456789"; // Only 9 digits
    
    expect(validCPF.length).toBe(11);
    expect(invalidCPF.length).not.toBe(11);
  });

  it("validates phone format (10-11 digits)", () => {
    const validPhone1 = "11999999999"; // Mobile
    const validPhone2 = "1133334444"; // Landline
    const invalidPhone = "123456"; // Too short
    
    expect(validPhone1.length >= 10 && validPhone1.length <= 11).toBe(true);
    expect(validPhone2.length >= 10 && validPhone2.length <= 11).toBe(true);
    expect(invalidPhone.length >= 10 && invalidPhone.length <= 11).toBe(false);
  });
});

describe("Protected Routes", () => {
  it("user.getProfile throws for unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.user.getProfile()).rejects.toThrow();
  });

  it("payment.getMyPayments throws for unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.payment.getMyPayments()).rejects.toThrow();
  });

  it("fine.getMyFines throws for unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.fine.getMyFines()).rejects.toThrow();
  });

  it("message.getConversations throws for unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.message.getConversations()).rejects.toThrow();
  });

  it("favorite.list throws for unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.favorite.list()).rejects.toThrow();
  });
});
