import { Resend } from "resend";
import { readFileSync } from "fs";

// Load env vars
const envPath = "/home/ubuntu/riddy-website/.env";
try {
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const [key, ...vals] = line.split("=");
    if (key && vals.length) process.env[key.trim()] = vals.join("=").trim();
  }
} catch {}

const resendKey = process.env.RESEND_API_KEY;
const twilioSid = process.env.TWILIO_ACCOUNT_SID;
const twilioToken = process.env.TWILIO_AUTH_TOKEN;
const twilioService = process.env.TWILIO_VERIFY_SERVICE_SID;

console.log("=== ENV Check ===");
console.log("RESEND_API_KEY:", resendKey ? `set (${resendKey.substring(0,8)}...)` : "NOT SET");
console.log("TWILIO_ACCOUNT_SID:", twilioSid ? `set (${twilioSid.substring(0,8)}...)` : "NOT SET");
console.log("TWILIO_AUTH_TOKEN:", twilioToken ? "set" : "NOT SET");
console.log("TWILIO_VERIFY_SERVICE_SID:", twilioService ? `set (${twilioService})` : "NOT SET");

// Test Resend
if (resendKey) {
  console.log("\n=== Testing Resend ===");
  const resend = new Resend(resendKey);
  try {
    const { data, error } = await resend.emails.send({
      from: "RIDDY <noreply@riddycar.com>",
      to: "delivered@resend.dev", // Resend test address
      subject: "Teste OTP RIDDY",
      html: "<p>Código: <strong>123456</strong></p>",
    });
    if (error) {
      console.error("Resend ERROR:", JSON.stringify(error));
    } else {
      console.log("Resend SUCCESS:", data);
    }
  } catch (e) {
    console.error("Resend EXCEPTION:", e.message);
  }
} else {
  console.log("\nResend: SKIPPED (no key)");
}

// Test Twilio
if (twilioSid && twilioToken && twilioService) {
  console.log("\n=== Testing Twilio Messaging Service ===");
  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
  const body = new URLSearchParams({
    To: "+5567992914788", // Test with a real number format
    MessagingServiceSid: twilioService,
    Body: "Teste RIDDY OTP: 123456",
  });
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
    const result = await resp.json();
    if (!resp.ok) {
      console.error("Twilio ERROR:", JSON.stringify(result));
    } else {
      console.log("Twilio SUCCESS: SID =", result.sid, "status =", result.status);
    }
  } catch (e) {
    console.error("Twilio EXCEPTION:", e.message);
  }
}
