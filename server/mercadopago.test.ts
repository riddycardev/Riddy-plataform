/**
 * Tests for Mercado Pago payment procedures
 * Validates that the tRPC procedures exist and have correct input schemas
 */

import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "test-user-mp",
    email: "test@riddy.com.br",
    name: "Test User",
    loginMethod: "email",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: { origin: "https://riddycar.manus.space" },
    } as TrpcContext["req"],
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

describe("Mercado Pago payment procedures", () => {
  it("processMPCreditCard procedure exists in payment router", () => {
    const caller = appRouter.createCaller(createAuthContext());
    expect(typeof caller.payment.processMPCreditCard).toBe("function");
  });

  it("processMPPix procedure exists in payment router", () => {
    const caller = appRouter.createCaller(createAuthContext());
    expect(typeof caller.payment.processMPPix).toBe("function");
  });

  it("checkMPPixStatus procedure exists in payment router", () => {
    const caller = appRouter.createCaller(createAuthContext());
    expect(typeof caller.payment.checkMPPixStatus).toBe("function");
  });

  it("processMPCreditCard rejects invalid input (missing required fields)", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      caller.payment.processMPCreditCard({
        bookingId: 0,
        cardToken: "",
        installments: 0, // invalid: min 1
        paymentMethodId: "",
        cpf: "123", // invalid: too short
      })
    ).rejects.toThrow();
  });

  it("processMPPix rejects invalid CPF (too short)", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      caller.payment.processMPPix({
        bookingId: 0,
        cpf: "123", // invalid: min 11 chars
      })
    ).rejects.toThrow();
  });

  it("checkMPPixStatus requires valid mpPaymentId and bookingId", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    // Should throw NOT_FOUND since booking doesn't exist
    await expect(
      caller.payment.checkMPPixStatus({
        mpPaymentId: "test-payment-id",
        bookingId: 999999,
      })
    ).rejects.toThrow();
  });

  it("VITE_MP_PUBLIC_KEY is set in environment", () => {
    // This validates that the secret was properly configured
    const publicKey = process.env.VITE_MP_PUBLIC_KEY;
    expect(publicKey).toBeDefined();
    expect(publicKey).toMatch(/^APP_USR-/);
  });

  it("MP_ACCESS_TOKEN is set in environment", () => {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    expect(accessToken).toBeDefined();
    expect(accessToken).toMatch(/^APP_USR-/);
  });
});
