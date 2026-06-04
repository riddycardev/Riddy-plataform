/**
 * Credential validation tests for Resend and Google OAuth
 * These tests verify that the configured API keys are valid.
 */
import { describe, it, expect } from "vitest";

describe("Resend API Key", () => {
  it("should have RESEND_API_KEY configured", () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey).toBeTruthy();
    expect(apiKey).toMatch(/^re_/);
  });

  it("should successfully connect to Resend API", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY not set");
    }

    // Validate by calling Resend's domains list endpoint (lightweight, no email sent)
    const response = await fetch("https://api.resend.com/domains", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    expect(response.status).not.toBe(401); // 401 = invalid API key
    expect(response.status).not.toBe(403); // 403 = forbidden
    // 200 = success, 422 = valid key but domain issue — both mean key is valid
    expect([200, 422, 404]).toContain(response.status);
  }, 15000);
});

describe("Google OAuth Credentials", () => {
  it("should have GOOGLE_CLIENT_ID configured", () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    expect(clientId).toBeTruthy();
    expect(clientId).toMatch(/\.apps\.googleusercontent\.com$/);
  });

  it("should have GOOGLE_CLIENT_SECRET configured", () => {
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    expect(clientSecret).toBeTruthy();
    expect(clientSecret!.length).toBeGreaterThan(10);
  });
});
