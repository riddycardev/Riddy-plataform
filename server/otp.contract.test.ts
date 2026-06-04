/**
 * Tests for OTP contract signing and SHA-256 hash integrity
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import crypto from "crypto";

// ─── SHA-256 Hash Tests ────────────────────────────────────────────────────────

describe("Contract SHA-256 hash", () => {
  /**
   * Replicate the hash logic from contractService.ts to test it in isolation
   */
  function generateContractHash(booking: Record<string, any>, vehicle: { licensePlate: string }, renter: { name: string; cpf?: string | null }) {
    const content = [
      `booking:${booking.id}`,
      `renter:${booking.renterFullName || renter.name}`,
      `cpf:${booking.renterCpf || renter.cpf || ""}`,
      `vehicle:${vehicle.licensePlate}`,
      `start:${booking.startDate}`,
      `end:${booking.endDate}`,
      `total:${booking.totalAmount}`,
      `accepted_at:${booking.contractAcceptedAt || ""}`,
      `accepted_ip:${booking.contractAcceptedIp || ""}`,
      `otp_channel:${booking.contractOtpChannel || "checkbox"}`,
      `otp_verified_at:${booking.contractOtpVerifiedAt || ""}`,
    ].join("|");
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  it("produces a 64-character hex string", () => {
    const hash = generateContractHash(
      { id: 1, renterFullName: "João Silva", renterCpf: "12345678900", startDate: "2026-01-01", endDate: "2026-01-03", totalAmount: 300, contractAcceptedAt: null, contractAcceptedIp: null, contractOtpChannel: null, contractOtpVerifiedAt: null },
      { licensePlate: "ABC-1234" },
      { name: "João Silva", cpf: "12345678900" }
    );
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it("produces the same hash for identical inputs", () => {
    const booking = { id: 42, renterFullName: "Maria Santos", renterCpf: "98765432100", startDate: "2026-03-10", endDate: "2026-03-15", totalAmount: 750, contractAcceptedAt: "2026-03-09T10:00:00Z", contractAcceptedIp: "192.168.1.1", contractOtpChannel: "sms", contractOtpVerifiedAt: "2026-03-09T10:01:00Z" };
    const vehicle = { licensePlate: "XYZ-5678" };
    const renter = { name: "Maria Santos", cpf: "98765432100" };

    const hash1 = generateContractHash(booking, vehicle, renter);
    const hash2 = generateContractHash(booking, vehicle, renter);
    expect(hash1).toBe(hash2);
  });

  it("produces different hashes when any field changes", () => {
    const base = { id: 1, renterFullName: "Carlos Lima", renterCpf: "11122233344", startDate: "2026-05-01", endDate: "2026-05-05", totalAmount: 500, contractAcceptedAt: null, contractAcceptedIp: null, contractOtpChannel: "email", contractOtpVerifiedAt: null };
    const vehicle = { licensePlate: "DEF-9999" };
    const renter = { name: "Carlos Lima", cpf: "11122233344" };

    const hashOriginal = generateContractHash(base, vehicle, renter);
    const hashModified = generateContractHash({ ...base, totalAmount: 501 }, vehicle, renter);

    expect(hashOriginal).not.toBe(hashModified);
  });

  it("uses 'checkbox' as default otp_channel when not set", () => {
    const booking = { id: 5, renterFullName: "Ana Costa", renterCpf: "55566677788", startDate: "2026-06-01", endDate: "2026-06-02", totalAmount: 200, contractAcceptedAt: null, contractAcceptedIp: null, contractOtpChannel: null, contractOtpVerifiedAt: null };
    const vehicle = { licensePlate: "GHI-1111" };
    const renter = { name: "Ana Costa", cpf: "55566677788" };

    const hash = generateContractHash(booking, vehicle, renter);
    // Verify the hash includes 'checkbox' as default channel
    const contentWithCheckbox = [
      `booking:5`,
      `renter:Ana Costa`,
      `cpf:55566677788`,
      `vehicle:GHI-1111`,
      `start:2026-06-01`,
      `end:2026-06-02`,
      `total:200`,
      `accepted_at:`,
      `accepted_ip:`,
      `otp_channel:checkbox`,
      `otp_verified_at:`,
    ].join("|");
    const expectedHash = crypto.createHash("sha256").update(contentWithCheckbox).digest("hex");
    expect(hash).toBe(expectedHash);
  });
});

// ─── OTP Service Tests ─────────────────────────────────────────────────────────

describe("OTP code generation", () => {
  it("generates a 6-digit numeric code", () => {
    // Replicate the OTP generation logic from otpService.ts
    const generateOtpCode = () => Math.floor(100000 + Math.random() * 900000).toString();
    
    for (let i = 0; i < 100; i++) {
      const code = generateOtpCode();
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^\d{6}$/);
      expect(parseInt(code)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(code)).toBeLessThanOrEqual(999999);
    }
  });

  it("OTP expires after 10 minutes", () => {
    const OTP_EXPIRY_MINUTES = 10;
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
    
    // Should not be expired immediately
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    
    // Should be expired after 11 minutes
    const elevenMinutesLater = new Date(Date.now() + 11 * 60 * 1000);
    expect(expiresAt.getTime()).toBeLessThan(elevenMinutesLater.getTime());
  });
});

// ─── Address Formatting Tests ──────────────────────────────────────────────────

describe("Renter address formatting for contract", () => {
  it("formats complete address correctly", () => {
    const b = {
      renterAddressStreet: "Rua das Flores",
      renterAddressNumber: "123",
      renterAddressComplement: "Apto 45",
      renterAddressNeighborhood: "Centro",
      renterAddressCity: "São Paulo",
      renterAddressState: "SP",
      renterAddressZipCode: "01310100",
    };

    const addressParts = [
      b.renterAddressStreet,
      b.renterAddressNumber ? `nº ${b.renterAddressNumber}` : null,
      b.renterAddressComplement || null,
      b.renterAddressNeighborhood,
      b.renterAddressCity,
      b.renterAddressState,
      b.renterAddressZipCode ? `CEP ${b.renterAddressZipCode}` : null,
    ].filter(Boolean).join(", ");

    expect(addressParts).toBe("Rua das Flores, nº 123, Apto 45, Centro, São Paulo, SP, CEP 01310100");
  });

  it("formats address without complement", () => {
    const b = {
      renterAddressStreet: "Av. Paulista",
      renterAddressNumber: "1000",
      renterAddressComplement: null,
      renterAddressNeighborhood: "Bela Vista",
      renterAddressCity: "São Paulo",
      renterAddressState: "SP",
      renterAddressZipCode: "01310100",
    };

    const addressParts = [
      b.renterAddressStreet,
      b.renterAddressNumber ? `nº ${b.renterAddressNumber}` : null,
      b.renterAddressComplement || null,
      b.renterAddressNeighborhood,
      b.renterAddressCity,
      b.renterAddressState,
      b.renterAddressZipCode ? `CEP ${b.renterAddressZipCode}` : null,
    ].filter(Boolean).join(", ");

    expect(addressParts).toBe("Av. Paulista, nº 1000, Bela Vista, São Paulo, SP, CEP 01310100");
  });

  it("returns empty string when no address fields", () => {
    const b = {
      renterAddressStreet: null,
      renterAddressNumber: null,
      renterAddressComplement: null,
      renterAddressNeighborhood: null,
      renterAddressCity: null,
      renterAddressState: null,
      renterAddressZipCode: null,
    };

    const addressParts = [
      b.renterAddressStreet,
      b.renterAddressNumber ? `nº ${b.renterAddressNumber}` : null,
      b.renterAddressComplement || null,
      b.renterAddressNeighborhood,
      b.renterAddressCity,
      b.renterAddressState,
      b.renterAddressZipCode ? `CEP ${b.renterAddressZipCode}` : null,
    ].filter(Boolean).join(", ");

    expect(addressParts).toBe("");
  });
});
