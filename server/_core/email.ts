import { Resend } from "resend";

// Use riddycar.com if verified in Resend, otherwise use Resend's shared domain
// To verify: https://resend.com/domains → Add Domain → riddycar.com
const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS ?? "RIDDY <onboarding@resend.dev>";

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  const resend = getResendClient();

  if (!resend) {
    // Dev fallback: log emails to console
    console.log("[Email Dev] RESEND_API_KEY not set — would send email:");
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[Email] Resend error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return false;
  }
}

export function getVerificationEmailHtml(name: string, token: string, baseUrl: string): string {
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#0A0F1C;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0F1C;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
              <tr>
                <td style="background:#00D4AA;padding:32px;text-align:center;">
                  <h1 style="margin:0;color:#0A0F1C;font-size:28px;font-weight:bold;letter-spacing:-0.5px;">RIDDY</h1>
                  <p style="margin:8px 0 0;color:#0A0F1C;font-size:14px;opacity:0.8;">Redefinindo Mobilidade</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px 32px;">
                  <h2 style="margin:0 0 16px;color:#FFFFFF;font-size:22px;">Confirme seu e-mail</h2>
                  <p style="margin:0 0 24px;color:#9CA3AF;font-size:15px;line-height:1.6;">
                    Olá, <strong style="color:#FFFFFF;">${name}</strong>! Bem-vindo à RIDDY. Clique no botão abaixo para confirmar seu endereço de e-mail e ativar sua conta.
                  </p>
                  <div style="text-align:center;margin:32px 0;">
                    <a href="${verifyUrl}" style="display:inline-block;background:#00D4AA;color:#0A0F1C;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:16px;">
                      Confirmar E-mail
                    </a>
                  </div>
                  <p style="margin:24px 0 0;color:#6B7280;font-size:13px;line-height:1.6;">
                    Este link expira em <strong>24 horas</strong>. Se você não criou uma conta na RIDDY, ignore este e-mail.
                  </p>
                  <p style="margin:8px 0 0;color:#6B7280;font-size:12px;word-break:break-all;">
                    Ou copie e cole este link: <a href="${verifyUrl}" style="color:#00D4AA;">${verifyUrl}</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 32px;border-top:1px solid #1F2937;text-align:center;">
                  <p style="margin:0;color:#4B5563;font-size:12px;">
                    © ${new Date().getFullYear()} RIDDY. Todos os direitos reservados.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function getPasswordResetEmailHtml(name: string, token: string, baseUrl: string): string {
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#0A0F1C;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0F1C;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
              <tr>
                <td style="background:#00D4AA;padding:32px;text-align:center;">
                  <h1 style="margin:0;color:#0A0F1C;font-size:28px;font-weight:bold;letter-spacing:-0.5px;">RIDDY</h1>
                  <p style="margin:8px 0 0;color:#0A0F1C;font-size:14px;opacity:0.8;">Redefinindo Mobilidade</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px 32px;">
                  <h2 style="margin:0 0 16px;color:#FFFFFF;font-size:22px;">Redefinir senha</h2>
                  <p style="margin:0 0 24px;color:#9CA3AF;font-size:15px;line-height:1.6;">
                    Olá, <strong style="color:#FFFFFF;">${name}</strong>! Recebemos uma solicitação para redefinir a senha da sua conta RIDDY. Clique no botão abaixo para criar uma nova senha.
                  </p>
                  <div style="text-align:center;margin:32px 0;">
                    <a href="${resetUrl}" style="display:inline-block;background:#00D4AA;color:#0A0F1C;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:16px;">
                      Redefinir Senha
                    </a>
                  </div>
                  <p style="margin:24px 0 0;color:#6B7280;font-size:13px;line-height:1.6;">
                    Este link expira em <strong>1 hora</strong>. Se você não solicitou a redefinição de senha, ignore este e-mail — sua conta está segura.
                  </p>
                  <p style="margin:8px 0 0;color:#6B7280;font-size:12px;word-break:break-all;">
                    Ou copie e cole este link: <a href="${resetUrl}" style="color:#00D4AA;">${resetUrl}</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 32px;border-top:1px solid #1F2937;text-align:center;">
                  <p style="margin:0;color:#4B5563;font-size:12px;">
                    © ${new Date().getFullYear()} RIDDY. Todos os direitos reservados.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
