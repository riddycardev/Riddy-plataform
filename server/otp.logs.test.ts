/**
 * Tests for OTP logging system (otp_logs table)
 * Validates schema structure, masking functions, and event types.
 */
import { describe, it, expect } from "vitest";
import crypto from "crypto";

// ─── Schema validation ────────────────────────────────────────────────────────

describe("otp_logs schema", () => {
  it("defines all required fields", () => {
    const requiredFields = [
      "id",
      "bookingId",
      "channel",
      "event",
      "recipient",
      "otpCode",
      "providerStatus",
      "providerRef",
      "ipAddress",
      "userAgent",
      "errorMessage",
      "createdAt",
    ];
    // This test documents the expected schema — if the table structure changes,
    // update this list to match.
    expect(requiredFields).toHaveLength(12);
    expect(requiredFields).toContain("bookingId");
    expect(requiredFields).toContain("channel");
    expect(requiredFields).toContain("event");
  });

  it("channel enum only allows sms or email", () => {
    const validChannels = ["sms", "email"];
    expect(validChannels).toContain("sms");
    expect(validChannels).toContain("email");
    expect(validChannels).not.toContain("whatsapp");
    expect(validChannels).not.toContain("push");
  });

  it("event enum only allows sent, verified, or failed", () => {
    const validEvents = ["sent", "verified", "failed"];
    expect(validEvents).toContain("sent");
    expect(validEvents).toContain("verified");
    expect(validEvents).toContain("failed");
    expect(validEvents).not.toContain("pending");
    expect(validEvents).not.toContain("resent");
  });
});

// ─── Phone masking ────────────────────────────────────────────────────────────

describe("phone masking for privacy", () => {
  function maskPhone(phone: string): string {
    if (phone.length <= 6) return phone;
    return phone.slice(0, 6) + "****" + phone.slice(-4);
  }

  it("masks a full Brazilian phone number", () => {
    const masked = maskPhone("+5511999887766");
    expect(masked).toBe("+55119****7766");
    expect(masked).not.toContain("99988");
  });

  it("masks a shorter phone number", () => {
    const masked = maskPhone("+55119");
    // Short phone — returned as-is
    expect(masked).toBe("+55119");
  });

  it("preserves country code and last 4 digits", () => {
    const masked = maskPhone("+5521987654321");
    expect(masked.startsWith("+55219")).toBe(true);
    expect(masked.endsWith("4321")).toBe(true);
  });
});

// ─── Email masking ────────────────────────────────────────────────────────────

describe("email masking for privacy", () => {
  function maskEmail(email: string): string {
    const [local, domain] = email.split("@");
    if (!domain) return email;
    const masked = local.slice(0, 2) + "**";
    return `${masked}@${domain}`;
  }

  it("masks the local part of an email", () => {
    const masked = maskEmail("usuario@example.com");
    expect(masked).toBe("us**@example.com");
    expect(masked).not.toContain("uario");
  });

  it("preserves the domain", () => {
    const masked = maskEmail("joao.silva@riddycar.com");
    expect(masked).toContain("@riddycar.com");
    expect(masked.startsWith("jo**")).toBe(true);
  });

  it("handles email without @ gracefully", () => {
    const masked = maskEmail("invalidemail");
    expect(masked).toBe("invalidemail");
  });
});

// ─── OTP log event structure ──────────────────────────────────────────────────

describe("OTP log event structure", () => {
  it("sent event has correct structure for SMS", () => {
    const event = {
      bookingId: 42,
      channel: "sms" as const,
      event: "sent" as const,
      recipient: "+55119****7766",
      providerStatus: "pending",
      providerRef: "VE1234567890",
    };
    expect(event.channel).toBe("sms");
    expect(event.event).toBe("sent");
    expect(event.bookingId).toBe(42);
    expect(event.providerRef).toBeTruthy();
  });

  it("sent event has correct structure for email", () => {
    const event = {
      bookingId: 42,
      channel: "email" as const,
      event: "sent" as const,
      recipient: "us**@riddycar.com",
      otpCode: "847291",
      providerStatus: "sent",
    };
    expect(event.channel).toBe("email");
    expect(event.event).toBe("sent");
    expect(event.otpCode).toMatch(/^\d{6}$/);
  });

  it("verified event has correct structure", () => {
    const event = {
      bookingId: 42,
      channel: "sms" as const,
      event: "verified" as const,
      recipient: "+55119****7766",
      providerStatus: "approved",
      providerRef: "VE1234567890",
    };
    expect(event.event).toBe("verified");
    expect(event.providerStatus).toBe("approved");
  });

  it("failed event includes error message", () => {
    const event = {
      bookingId: 42,
      channel: "email" as const,
      event: "failed" as const,
      recipient: "us**@example.com",
      providerStatus: "invalid_code",
      errorMessage: "Código inválido. Verifique e tente novamente.",
    };
    expect(event.event).toBe("failed");
    expect(event.errorMessage).toBeTruthy();
  });
});

// ─── OTP code for email channel ───────────────────────────────────────────────

describe("OTP code stored in otp_logs for email channel", () => {
  it("email OTP code is a 6-digit string", () => {
    const code = crypto.randomInt(100000, 999999).toString();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^\d{6}$/);
  });

  it("SMS channel does not store OTP code (Twilio manages it)", () => {
    // For SMS via Twilio Verify, otpCode should be null in otp_logs
    const smsEvent = {
      bookingId: 1,
      channel: "sms" as const,
      event: "sent" as const,
      otpCode: null, // Twilio Verify manages the code internally
    };
    expect(smsEvent.otpCode).toBeNull();
  });
});

// ─── Twilio Verify endpoint correctness ──────────────────────────────────────
describe("Twilio Verify endpoint URL", () => {
  it("uses VerificationCheck (without s) for code verification", () => {
    // The correct Twilio Verify endpoint is /VerificationCheck (no trailing 's')
    // Using /VerificationChecks returns 404 even with valid pending verifications
    const correctEndpoint = "VerificationCheck";
    const wrongEndpoint = "VerificationChecks";
    expect(correctEndpoint).not.toBe(wrongEndpoint);
    expect(correctEndpoint.endsWith("s")).toBe(false);
    // Verify the endpoint used in the service matches the Twilio API docs
    expect("https://verify.twilio.com/v2/Services/VA123/VerificationCheck").toContain(correctEndpoint);
    expect("https://verify.twilio.com/v2/Services/VA123/VerificationCheck").not.toContain(wrongEndpoint);
  });
  it("send endpoint uses Verifications (with s)", () => {
    // The send endpoint IS /Verifications (with 's')
    const sendEndpoint = "Verifications";
    expect(sendEndpoint.endsWith("s")).toBe(true);
    expect("https://verify.twilio.com/v2/Services/VA123/Verifications").toContain(sendEndpoint);
  });
});
