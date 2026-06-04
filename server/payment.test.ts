/**
 * Payment Service Tests
 * Tests for Pix and Boleto payment flows (Mercado Pago card payments tested separately)
 */
import { describe, it, expect } from "vitest";
import { processPixPayment, processBoletoPayment, processPayment } from "./payment.service";

describe("Payment Service", () => {
  describe("processPixPayment", () => {
    it("should generate a Pix QR code", async () => {
      const result = await processPixPayment({
        bookingId: 1,
        amount: 500,
        method: "pix",
      });
      expect(result.success).toBe(true);
      expect(result.pixQrCode).toBeDefined();
      expect(result.paymentId).toMatch(/^pix_/);
    });
  });

  describe("processBoletoPayment", () => {
    it("should generate a Boleto URL", async () => {
      const result = await processBoletoPayment({
        bookingId: 2,
        amount: 300,
        method: "boleto",
      });
      expect(result.success).toBe(true);
      expect(result.boletoUrl).toBeDefined();
      expect(result.paymentId).toMatch(/^boleto_/);
    });
  });

  describe("processPayment", () => {
    it("should route pix to processPixPayment", async () => {
      const result = await processPayment({
        bookingId: 3,
        amount: 200,
        method: "pix",
      });
      expect(result.success).toBe(true);
      expect(result.pixQrCode).toBeDefined();
    });

    it("should return error for credit_card (use processMPCreditCard instead)", async () => {
      const result = await processPayment({
        bookingId: 4,
        amount: 400,
        method: "credit_card",
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain("processMPCreditCard");
    });

    it("should calculate correct amount for Pix", async () => {
      const total = 447.99;
      const result = await processPixPayment({
        bookingId: 5,
        amount: total,
        method: "pix",
      });
      expect(result.success).toBe(true);
      expect(result.pixQrCode).toContain("447.99");
    });
  });
});
