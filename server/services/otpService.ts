/**
 * OTP Service — Contract signing verification
 *
 * SMS:   Twilio Verify API (VA... Service SID) — gerencia envio e verificação automaticamente
 * Email: Resend via server/_core/email.ts
 *
 * Twilio Verify Flow:
 *   1. POST /Services/{ServiceSid}/Verifications  → envia o código por SMS
 *   2. POST /Services/{ServiceSid}/VerificationCheck → verifica o código digitado
 *
 * Note: com Twilio Verify, o código é gerado e armazenado pela Twilio.
 * Para e-mail, geramos o código localmente e enviamos via Resend.
 *
 * Todos os eventos (envio e verificação) são registrados na tabela otp_logs.
 */
import { ENV } from "../_core/env";
import { sendEmail } from "../_core/email";
import { logOtpEvent } from "../db";
import crypto from "crypto";

// ─── OTP Config ──────────────────────────────────────────────────────────────
export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate a random numeric OTP code (used only for email channel) */
export function generateOtpCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/** Get OTP expiry timestamp (10 minutes from now) — used for email channel */
export function getOtpExpiry(): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() + OTP_TTL_MINUTES);
  return d;
}

/** Check if email OTP is still valid (used only for email channel) */
export function isOtpValid(
  code: string,
  storedCode: string,
  expiresAt: Date,
  attempts: number
): { valid: boolean; reason?: string } {
  if (attempts >= OTP_MAX_ATTEMPTS) {
    return { valid: false, reason: "Número máximo de tentativas atingido. Solicite um novo código." };
  }
  if (new Date() > expiresAt) {
    return { valid: false, reason: "Código expirado. Solicite um novo código." };
  }
  if (code.trim() !== storedCode.trim()) {
    return { valid: false, reason: "Código inválido. Verifique e tente novamente." };
  }
  return { valid: true };
}

// ─── Twilio Verify Helpers ────────────────────────────────────────────────────

function getTwilioVerifyHeaders(): HeadersInit {
  const { twilioAccountSid, twilioAuthToken } = ENV;
  return {
    Authorization: "Basic " + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString("base64"),
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

function isTwilioConfigured(): boolean {
  return !!(ENV.twilioAccountSid && ENV.twilioAuthToken && ENV.twilioVerifyServiceSid);
}

/** Format Brazilian phone number to E.164 (+55XXXXXXXXXXX) */
function formatBrazilianPhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (!digits.startsWith("55")) {
    digits = "55" + digits;
  }
  return "+" + digits;
}

/** Mask phone number for privacy (e.g. +5511999887766 → +55119****7766) */
function maskPhone(phone: string): string {
  if (phone.length <= 6) return phone;
  return phone.slice(0, 6) + "****" + phone.slice(-4);
}

/** Mask email for privacy (e.g. user@example.com → us**@example.com) */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const masked = local.slice(0, 2) + "**";
  return `${masked}@${domain}`;
}

// ─── SMS via Twilio Verify API ────────────────────────────────────────────────

/**
 * Send OTP via Twilio Verify API.
 * Twilio generates and sends the code automatically.
 * Logs the event to otp_logs table.
 * Returns true on success, false on failure.
 */
export async function sendOtpViaSms(
  phone: string,
  bookingId: number,
  opts?: { ipAddress?: string; userAgent?: string }
): Promise<boolean> {
  if (!isTwilioConfigured()) {
    console.warn("[OTP] Twilio Verify not configured — SMS OTP unavailable");
    await logOtpEvent({
      bookingId,
      channel: "sms",
      event: "failed",
      recipient: maskPhone(formatBrazilianPhone(phone)),
      providerStatus: "not_configured",
      errorMessage: "Twilio Verify not configured",
      ipAddress: opts?.ipAddress,
      userAgent: opts?.userAgent,
    });
    return false;
  }
  try {
    const formattedPhone = formatBrazilianPhone(phone);
    const url = `https://verify.twilio.com/v2/Services/${ENV.twilioVerifyServiceSid}/Verifications`;
    const body = new URLSearchParams({
      To: formattedPhone,
      Channel: "sms",
    });
    const response = await fetch(url, {
      method: "POST",
      headers: getTwilioVerifyHeaders(),
      body: body.toString(),
    });
    if (!response.ok) {
      const err = await response.text();
      console.error("[OTP] Twilio Verify send error:", err);
      await logOtpEvent({
        bookingId,
        channel: "sms",
        event: "failed",
        recipient: maskPhone(formattedPhone),
        providerStatus: "error",
        errorMessage: err.slice(0, 500),
        ipAddress: opts?.ipAddress,
        userAgent: opts?.userAgent,
      });
      return false;
    }
    const result = await response.json() as { sid?: string; status?: string };
    console.log(`[OTP] Twilio Verify SMS sent to ${formattedPhone} — SID: ${result.sid}, status: ${result.status}`);
    await logOtpEvent({
      bookingId,
      channel: "sms",
      event: "sent",
      recipient: maskPhone(formattedPhone),
      providerStatus: result.status,
      providerRef: result.sid,
      ipAddress: opts?.ipAddress,
      userAgent: opts?.userAgent,
    });
    return true;
  } catch (err) {
    console.error("[OTP] Twilio Verify SMS send failed:", err);
    await logOtpEvent({
      bookingId,
      channel: "sms",
      event: "failed",
      recipient: maskPhone(formatBrazilianPhone(phone)),
      providerStatus: "exception",
      errorMessage: String(err).slice(0, 500),
      ipAddress: opts?.ipAddress,
      userAgent: opts?.userAgent,
    });
    return false;
  }
}

/**
 * Verify OTP code via Twilio Verify API.
 * Logs the result to otp_logs table.
 * Returns { valid: true } on success, { valid: false, reason } on failure.
 */
export async function verifyOtpViaTwilio(
  phone: string,
  code: string,
  bookingId: number,
  opts?: { ipAddress?: string; userAgent?: string }
): Promise<{ valid: boolean; reason?: string }> {
  if (!isTwilioConfigured()) {
    return { valid: false, reason: "Verificação SMS indisponível. Use o canal de e-mail." };
  }
  try {
    const formattedPhone = formatBrazilianPhone(phone);
    const url = `https://verify.twilio.com/v2/Services/${ENV.twilioVerifyServiceSid}/VerificationCheck`;
    const body = new URLSearchParams({
      To: formattedPhone,
      Code: code,
    });
    const response = await fetch(url, {
      method: "POST",
      headers: getTwilioVerifyHeaders(),
      body: body.toString(),
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error("[OTP] Twilio Verify check error:", errText);
      await logOtpEvent({
        bookingId,
        channel: "sms",
        event: "failed",
        recipient: maskPhone(formattedPhone),
        providerStatus: "check_error",
        errorMessage: errText.slice(0, 500),
        ipAddress: opts?.ipAddress,
        userAgent: opts?.userAgent,
      });
      return { valid: false, reason: "Código inválido ou expirado. Tente novamente." };
    }
    const result = await response.json() as { status?: string; valid?: boolean; sid?: string };
    console.log(`[OTP] Twilio Verify check for ${formattedPhone}: status=${result.status}, valid=${result.valid}`);
    if (result.status === "approved" || result.valid === true) {
      await logOtpEvent({
        bookingId,
        channel: "sms",
        event: "verified",
        recipient: maskPhone(formattedPhone),
        providerStatus: result.status,
        providerRef: result.sid,
        ipAddress: opts?.ipAddress,
        userAgent: opts?.userAgent,
      });
      return { valid: true };
    }
    await logOtpEvent({
      bookingId,
      channel: "sms",
      event: "failed",
      recipient: maskPhone(formattedPhone),
      providerStatus: result.status,
      providerRef: result.sid,
      errorMessage: "Code not approved",
      ipAddress: opts?.ipAddress,
      userAgent: opts?.userAgent,
    });
    return { valid: false, reason: "Código inválido ou expirado. Solicite um novo código." };
  } catch (err) {
    console.error("[OTP] Twilio Verify check failed:", err);
    return { valid: false, reason: "Erro ao verificar o código. Tente novamente." };
  }
}

// ─── Email OTP via Resend ────────────────────────────────────────────────────

/**
 * Send OTP via email using Resend (server/_core/email.ts).
 * Code is generated locally and stored in the booking record.
 * Logs the event to otp_logs table.
 */
export async function sendOtpViaEmail(
  email: string,
  name: string,
  code: string,
  bookingId: number,
  opts?: { ipAddress?: string; userAgent?: string }
): Promise<boolean> {
  try {
    const html = generateOtpEmailHtml(name, code);
    const success = await sendEmail({
      to: email,
      subject: `${code} — Código de assinatura RIDDY`,
      html,
    });
    if (success) {
      console.log(`[OTP] Email sent to ${email}`);
      await logOtpEvent({
        bookingId,
        channel: "email",
        event: "sent",
        recipient: maskEmail(email),
        otpCode: code,
        providerStatus: "sent",
        ipAddress: opts?.ipAddress,
        userAgent: opts?.userAgent,
      });
    } else {
      console.error(`[OTP] Email failed to send to ${email}`);
      await logOtpEvent({
        bookingId,
        channel: "email",
        event: "failed",
        recipient: maskEmail(email),
        providerStatus: "send_failed",
        errorMessage: "Resend returned failure",
        ipAddress: opts?.ipAddress,
        userAgent: opts?.userAgent,
      });
    }
    return success;
  } catch (err) {
    console.error("[OTP] Email send failed:", err);
    await logOtpEvent({
      bookingId,
      channel: "email",
      event: "failed",
      recipient: maskEmail(email),
      providerStatus: "exception",
      errorMessage: String(err).slice(0, 500),
      ipAddress: opts?.ipAddress,
      userAgent: opts?.userAgent,
    });
    return false;
  }
}

/**
 * Log a successful email OTP verification.
 * Called from routers.ts after validating the code locally.
 */
export async function logEmailOtpVerified(
  email: string,
  bookingId: number,
  opts?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  await logOtpEvent({
    bookingId,
    channel: "email",
    event: "verified",
    recipient: maskEmail(email),
    providerStatus: "verified",
    ipAddress: opts?.ipAddress,
    userAgent: opts?.userAgent,
  });
}

/**
 * Log a failed email OTP verification attempt.
 */
export async function logEmailOtpFailed(
  email: string,
  bookingId: number,
  reason: string,
  opts?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  await logOtpEvent({
    bookingId,
    channel: "email",
    event: "failed",
    recipient: maskEmail(email),
    providerStatus: "invalid_code",
    errorMessage: reason,
    ipAddress: opts?.ipAddress,
    userAgent: opts?.userAgent,
  });
}

// ─── Email Template ───────────────────────────────────────────────────────────

function generateOtpEmailHtml(name: string, code: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de Assinatura RIDDY</title>
</head>
<body style="margin:0;padding:0;background:#0A0F1C;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0F1C;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1E293B;max-width:560px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0EA5E9,#06B6D4);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">RIDDY</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Assinatura de Contrato</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 8px;color:#94A3B8;font-size:14px;">Olá, ${name || "Locatário"}!</p>
              <p style="margin:0 0 32px;color:#E2E8F0;font-size:16px;line-height:1.6;">
                Use o código abaixo para assinar seu contrato de locação.
                O código é válido por <strong style="color:#38BDF8;">${OTP_TTL_MINUTES} minutos</strong>.
              </p>
              <!-- OTP Code -->
              <div style="background:#0F172A;border:2px solid #0EA5E9;border-radius:12px;padding:28px;text-align:center;margin:0 0 32px;">
                <p style="margin:0 0 8px;color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Seu código</p>
                <p style="margin:0;color:#38BDF8;font-size:48px;font-weight:900;letter-spacing:12px;font-family:'Courier New',monospace;">${code}</p>
              </div>
              <div style="background:#1E293B;border-radius:8px;padding:16px;margin:0 0 24px;">
                <p style="margin:0;color:#94A3B8;font-size:13px;line-height:1.6;">
                  ⚠️ <strong style="color:#E2E8F0;">Não compartilhe este código</strong> com ninguém.
                  A RIDDY nunca solicitará seu código por telefone ou chat.
                </p>
              </div>
              <p style="margin:0;color:#475569;font-size:12px;line-height:1.6;">
                Se você não solicitou este código, ignore este e-mail.
                Nenhuma ação é necessária.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#0F172A;padding:20px 40px;text-align:center;border-top:1px solid #1E293B;">
              <p style="margin:0;color:#334155;font-size:12px;">© ${new Date().getFullYear()} RIDDY — Redefinindo Mobilidade</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
