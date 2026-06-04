// ── Production-critical secrets guard ───────────────────────────────────────
// These secrets MUST be set in production. The server will refuse to start
// if any of them are missing when NODE_ENV=production.
const IS_PRODUCTION = process.env.NODE_ENV === "production";

function requireSecret(envVar: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    if (IS_PRODUCTION) {
      // Hard fail: never start the server without required secrets in production
      throw new Error(
        `[FATAL] Required environment variable "${envVar}" is not set. ` +
        `The server cannot start in production without this secret. ` +
        `Set it in Settings → Secrets.`
      );
    }
    // Development: return empty string (callers must check and handle gracefully)
    return "";
  }
  return value.trim();
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "riddy-secret-key-change-in-production",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: IS_PRODUCTION,
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Mercado Pago
  mercadoPagoAccessToken: process.env.MP_ACCESS_TOKEN ?? "",
  mercadoPagoPublicKey: process.env.MP_PUBLIC_KEY ?? "",
  // REQUIRED in production: without this, all webhook requests would be accepted without verification
  mercadoPagoWebhookSecret: requireSecret("MP_WEBHOOK_SECRET", process.env.MP_WEBHOOK_SECRET),
  // SMTP (email sending)
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: parseInt(process.env.SMTP_PORT ?? "587"),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  // App base URL
  appBaseUrl: process.env.APP_BASE_URL ?? "https://riddycar.com",
  // Twilio Verify
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioVerifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID ?? "",
};
