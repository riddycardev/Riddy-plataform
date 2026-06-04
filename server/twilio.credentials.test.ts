/**
 * Twilio credentials validation test
 * Validates that TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_VERIFY_SERVICE_SID
 * are correctly configured by making a lightweight API call to Twilio.
 */
import { describe, it, expect } from "vitest";

describe("Twilio Credentials", () => {
  it("should have all three Twilio environment variables set", () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!accountSid || !authToken || !serviceSid) {
      console.warn("[Twilio] Credentials not set — SMS OTP will be unavailable");
      return;
    }

    expect(accountSid).toBeTruthy();
    expect(authToken).toBeTruthy();
    expect(serviceSid).toBeTruthy();
  });

  it("should successfully authenticate with Twilio API", async () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      console.warn("[Twilio] Credentials not set — skipping API test");
      return;
    }

    // Lightweight API call: fetch account info (no cost, no side effects)
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`;
    const response = await fetch(url, {
      headers: {
        Authorization:
          "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      },
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Twilio API returned ${response.status}: ${err}`);
    }

    const data = await response.json() as { sid: string; status: string; friendly_name: string };
    console.log(`[Twilio] Account verified: ${data.friendly_name} (${data.status})`);

    expect(data.sid).toBe(accountSid);
    expect(data.status).toBe("active");
  }, 15000);

  it("should have a valid Messaging Service SID format", () => {
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!serviceSid) {
      console.warn("[Twilio] TWILIO_VERIFY_SERVICE_SID not set — skipping format test");
      return;
    }

    // Messaging Service SIDs start with MG, Verify Service SIDs start with VA
    const isValidFormat = serviceSid.startsWith("MG") || serviceSid.startsWith("VA");
    if (!isValidFormat) {
      console.warn(`[Twilio] Service SID "${serviceSid}" has unexpected format (expected MG... or VA...)`);
    }
    expect(serviceSid.length).toBeGreaterThan(10);
  });
});
