// Email Service - Transactional emails for RIDDY platform

/**
 * Email Service - Sends transactional emails for RIDDY platform
 * Uses Manus built-in email service or fallback to SMTP
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface BookingConfirmationData {
  renterName: string;
  renterEmail: string;
  hostName: string;
  hostEmail: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehiclePlate: string;
  startDate: string;
  endDate: string;
  totalAmount: string;
  bookingId: number;
  pickupLocation: string;
  returnLocation: string;
}

/**
 * Send booking confirmation email to renter
 */
export async function sendBookingConfirmationToRenter(data: BookingConfirmationData) {
  const html = generateRenterConfirmationEmail(data);
  
  return sendEmail({
    to: data.renterEmail,
    subject: `Reserva Confirmada #RDY-${data.bookingId.toString().padStart(6, "0")} - RIDDY`,
    html,
  });
}

/**
 * Send booking notification email to host
 */
export async function sendBookingNotificationToHost(data: BookingConfirmationData) {
  const html = generateHostNotificationEmail(data);
  
  return sendEmail({
    to: data.hostEmail,
    subject: `Nova Reserva Recebida - ${data.vehicleBrand} ${data.vehicleModel}`,
    html,
  });
}

/**
 * Send booking cancellation email
 */
export async function sendCancellationEmail(
  email: string,
  name: string,
  bookingId: number,
  reason: string,
  refundAmount: string
) {
  const html = generateCancellationEmail(name, bookingId, reason, refundAmount);
  
  return sendEmail({
    to: email,
    subject: `Reserva Cancelada #RDY-${bookingId.toString().padStart(6, "0")} - RIDDY`,
    html,
  });
}

/**
 * Core email sending function
 */
async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Try using Manus built-in email service first
    if (process.env.BUILT_IN_FORGE_API_URL && process.env.BUILT_IN_FORGE_API_KEY) {
      return await sendViaManusEmail(options);
    }
    
    // Fallback to SMTP (if configured)
    if (process.env.SMTP_HOST) {
      return await sendViaSMTP(options);
    }
    
    console.warn("[Email] No email service configured. Skipping email send.");
    return false;
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return false;
  }
}

/**
 * Send via Manus built-in email API
 */
async function sendViaManusEmail(options: EmailOptions): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.BUILT_IN_FORGE_API_URL}/email/send`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        from: "noreply@riddy.com.br",
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Email API returned ${response.status}`);
    }
    
    console.log(`[Email] Sent to ${options.to}`);
    return true;
  } catch (error) {
    console.error("[Email] Manus email service failed:", error);
    return false;
  }
}

/**
 * Send via SMTP (fallback)
 */
async function sendViaSMTP(options: EmailOptions): Promise<boolean> {
  try {
    // SMTP implementation would go here
    // For now, using Manus email service only
    console.log(`[Email] SMTP not configured, using Manus service only`);
    return false;
  } catch (error) {
    console.error("[Email] SMTP failed:", error);
    return false;
  }
}

/**
 * Generate renter confirmation email HTML
 */
function generateRenterConfirmationEmail(data: BookingConfirmationData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00d4ff; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-row:last-child { border-bottom: none; }
          .label { font-weight: 600; color: #666; }
          .value { color: #333; }
          .button { display: inline-block; background: #00d4ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: 600; }
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Reserva Confirmada!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">#RDY-${data.bookingId.toString().padStart(6, "0")}</p>
          </div>
          
          <div class="content">
            <p>Olá <strong>${data.renterName}</strong>,</p>
            
            <p>Sua reserva foi confirmada com sucesso! Aqui estão os detalhes:</p>
            
            <div class="booking-details">
              <div class="detail-row">
                <span class="label">Veículo:</span>
                <span class="value">${data.vehicleBrand} ${data.vehicleModel}</span>
              </div>
              <div class="detail-row">
                <span class="label">Placa:</span>
                <span class="value">${data.vehiclePlate}</span>
              </div>
              <div class="detail-row">
                <span class="label">Período:</span>
                <span class="value">${data.startDate} até ${data.endDate}</span>
              </div>
              <div class="detail-row">
                <span class="label">Retirada:</span>
                <span class="value">${data.pickupLocation}</span>
              </div>
              <div class="detail-row">
                <span class="label">Devolução:</span>
                <span class="value">${data.returnLocation}</span>
              </div>
              <div class="detail-row">
                <span class="label">Valor Total:</span>
                <span class="value" style="font-size: 18px; font-weight: 700; color: #00d4ff;">R$ ${data.totalAmount}</span>
              </div>
            </div>
            
            <p>Você receberá instruções de retirada do veículo em breve. Em caso de dúvidas, entre em contato conosco.</p>
            
            <center>
              <a href="https://riddy.com.br/my-bookings/${data.bookingId}" class="button">Ver Detalhes da Reserva</a>
            </center>
            
            <p style="margin-top: 30px; color: #999; font-size: 14px;">
              Obrigado por escolher RIDDY! 🚗
            </p>
          </div>
          
          <div class="footer">
            <p>© 2026 RIDDY - Redefinindo Mobilidade. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate host notification email HTML
 */
function generateHostNotificationEmail(data: BookingConfirmationData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00d4ff; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-row:last-child { border-bottom: none; }
          .label { font-weight: 600; color: #666; }
          .value { color: #333; }
          .button { display: inline-block; background: #00d4ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: 600; }
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Nova Reserva Recebida!</h1>
          </div>
          
          <div class="content">
            <p>Olá <strong>${data.hostName}</strong>,</p>
            
            <p>Você recebeu uma nova reserva para seu veículo!</p>
            
            <div class="booking-details">
              <div class="detail-row">
                <span class="label">Veículo:</span>
                <span class="value">${data.vehicleBrand} ${data.vehicleModel}</span>
              </div>
              <div class="detail-row">
                <span class="label">Locatário:</span>
                <span class="value">${data.renterName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Período:</span>
                <span class="value">${data.startDate} até ${data.endDate}</span>
              </div>
              <div class="detail-row">
                <span class="label">Retirada:</span>
                <span class="value">${data.pickupLocation}</span>
              </div>
              <div class="detail-row">
                <span class="label">Devolução:</span>
                <span class="value">${data.returnLocation}</span>
              </div>
              <div class="detail-row">
                <span class="label">Sua Comissão:</span>
                <span class="value" style="font-size: 18px; font-weight: 700; color: #00d4ff;">R$ ${data.totalAmount}</span>
              </div>
            </div>
            
            <p>Verifique os detalhes da reserva e prepare seu veículo para a retirada.</p>
            
            <center>
              <a href="https://riddy.com.br/host/bookings/${data.bookingId}" class="button">Gerenciar Reserva</a>
            </center>
            
            <p style="margin-top: 30px; color: #999; font-size: 14px;">
              Obrigado por usar RIDDY! 🚗
            </p>
          </div>
          
          <div class="footer">
            <p>© 2026 RIDDY - Redefinindo Mobilidade. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate cancellation email HTML
 */
function generateCancellationEmail(
  name: string,
  bookingId: number,
  reason: string,
  refundAmount: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #cc0000 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff6b6b; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-row:last-child { border-bottom: none; }
          .label { font-weight: 600; color: #666; }
          .value { color: #333; }
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reserva Cancelada</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">#RDY-${bookingId.toString().padStart(6, "0")}</p>
          </div>
          
          <div class="content">
            <p>Olá <strong>${name}</strong>,</p>
            
            <p>Sua reserva foi cancelada. Aqui estão os detalhes:</p>
            
            <div class="details">
              <div class="detail-row">
                <span class="label">Motivo:</span>
                <span class="value">${reason}</span>
              </div>
              <div class="detail-row">
                <span class="label">Reembolso:</span>
                <span class="value" style="font-size: 18px; font-weight: 700; color: #ff6b6b;">R$ ${refundAmount}</span>
              </div>
            </div>
            
            <p>O reembolso será processado em até 5 dias úteis para sua conta.</p>
            
            <p style="margin-top: 30px; color: #999; font-size: 14px;">
              Em caso de dúvidas, entre em contato com nosso suporte.
            </p>
          </div>
          
          <div class="footer">
            <p>© 2026 RIDDY - Redefinindo Mobilidade. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
