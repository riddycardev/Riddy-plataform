/**
 * Email Service
 * Handles sending contract PDFs and notifications
 */

import { Resend } from 'resend';
import { Booking, User, Vehicle } from '../../drizzle/schema';

const resend = new Resend(process.env.RESEND_API_KEY);

// NOTE: DNS records for riddycar.com have not been added to Resend yet (status: not_started)
// Using onboarding@resend.dev as temporary sender until DNS is configured.
// To fix: Go to https://resend.com/domains → riddycar.com → Add DNS records → Verify
// Then change RIDDY_EMAIL back to 'contratos@riddycar.com'
const RIDDY_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const RIDDY_COMPANY = 'RIDDY TECNOLOGIA LTDA';

interface SendContractEmailParams {
  booking: Booking;
  vehicle: Vehicle;
  renter: User;
  host: User;
  contractPdfUrl: string;
}

/**
 * Send contract PDF to renter
 */
export async function sendContractToRenter(params: SendContractEmailParams): Promise<boolean> {
  try {
    const { booking, vehicle, renter, contractPdfUrl } = params;

    const bookingId = String(booking.id).padStart(6, '0');
    const startDate = booking.startDate ? new Date(booking.startDate).toLocaleDateString('pt-BR') : '';
    const endDate = booking.endDate ? new Date(booking.endDate).toLocaleDateString('pt-BR') : '';
    const totalAmount = booking.totalAmount ? parseFloat(booking.totalAmount.toString()).toFixed(2) : '0.00';

    if (!renter.email) return false;
    await resend.emails.send({
      from: RIDDY_EMAIL,
      to: renter.email,
      subject: `Contrato de Locação #RDY-${bookingId} - ${vehicle.model}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
              .content { padding: 20px; background: #f9f9f9; border-radius: 8px; margin: 20px 0; }
              .booking-details { background: white; padding: 15px; border-left: 4px solid #00d4ff; margin: 15px 0; }
              .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
              .detail-label { font-weight: bold; color: #666; }
              .detail-value { color: #333; }
              .button { display: inline-block; background: #00d4ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 15px 0; }
              .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
              .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Contrato de Locação</h1>
                <p>Reserva #RDY-${bookingId}</p>
              </div>

              <div class="content">
                <p>Olá <strong>${renter.name}</strong>,</p>

                <p>Seu contrato de locação foi gerado e está pronto para download. Abaixo estão os detalhes da sua reserva:</p>

                <div class="booking-details">
                  <div class="detail-row">
                    <span class="detail-label">Veículo:</span>
                    <span class="detail-value">${vehicle.model} (${vehicle.licensePlate})</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Período:</span>
                    <span class="detail-value">${startDate} até ${endDate}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Valor Total:</span>
                    <span class="detail-value"><strong>R$ ${totalAmount}</strong></span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value">Contrato Assinado</span>
                  </div>
                </div>

                <div class="warning">
                  <strong>⚠️ Importante:</strong> Você deve aceitar os termos do contrato antes de retirar o veículo. Certifique-se de ler todas as cláusulas, especialmente sobre responsabilidades, multas e danos.
                </div>

                <p style="text-align: center;">
                  <a href="${contractPdfUrl}" class="button">📥 Baixar Contrato em PDF</a>
                </p>

                <p><strong>Próximos passos:</strong></p>
                <ul>
                  <li>Baixe e revise o contrato em PDF</li>
                  <li>Acesse sua conta RIDDY para confirmar os dados</li>
                  <li>No dia da retirada, apresente os documentos originais (CNH + RG)</li>
                  <li>Inspecione o veículo com o proprietário e tire fotos</li>
                </ul>

                <p><strong>Dúvidas?</strong> Entre em contato conosco através do app ou envie um email para <a href="mailto:suporte@riddy.com">suporte@riddy.com</a></p>
              </div>

              <div class="footer">
                <p>© 2026 ${RIDDY_COMPANY} - Todos os direitos reservados</p>
                <p>CNPJ: 65.901.010/0001-43</p>
                <p>Este é um email automático. Não responda a este endereço.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return true;
  } catch (error) {
    console.error('[Email Service] Error sending contract to renter:', error);
    return false;
  }
}

/**
 * Send contract PDF to host
 */
export async function sendContractToHost(params: SendContractEmailParams): Promise<boolean> {
  try {
    const { booking, vehicle, host, renter, contractPdfUrl } = params;

    const bookingId = String(booking.id).padStart(6, '0');
    const startDate = booking.startDate ? new Date(booking.startDate).toLocaleDateString('pt-BR') : '';
    const endDate = booking.endDate ? new Date(booking.endDate).toLocaleDateString('pt-BR') : '';
    const totalAmount = booking.totalAmount ? parseFloat(booking.totalAmount.toString()).toFixed(2) : '0.00';

    if (!host.email) return false;
    await resend.emails.send({
      from: RIDDY_EMAIL,
      to: host.email,
      subject: `Novo Contrato de Locação #RDY-${bookingId} - ${vehicle.model}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
              .content { padding: 20px; background: #f9f9f9; border-radius: 8px; margin: 20px 0; }
              .booking-details { background: white; padding: 15px; border-left: 4px solid #00d4ff; margin: 15px 0; }
              .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
              .detail-label { font-weight: bold; color: #666; }
              .detail-value { color: #333; }
              .button { display: inline-block; background: #00d4ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 15px 0; }
              .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
              .renter-info { background: #e8f4f8; padding: 15px; border-radius: 4px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Nova Locação Confirmada</h1>
                <p>Reserva #RDY-${bookingId}</p>
              </div>

              <div class="content">
                <p>Olá <strong>${host.name}</strong>,</p>

                <p>Uma nova reserva foi confirmada para seu veículo. Aqui estão os detalhes:</p>

                <div class="booking-details">
                  <div class="detail-row">
                    <span class="detail-label">Veículo:</span>
                    <span class="detail-value">${vehicle.model} (${vehicle.licensePlate})</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Período:</span>
                    <span class="detail-value">${startDate} até ${endDate}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Valor Total:</span>
                    <span class="detail-value"><strong>R$ ${totalAmount}</strong></span>
                  </div>
                </div>

                <div class="renter-info">
                  <h3 style="margin-top: 0;">Informações do Locatário</h3>
                  <div class="detail-row">
                    <span class="detail-label">Nome:</span>
                    <span class="detail-value">${renter.name}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${renter.email}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Telefone:</span>
                    <span class="detail-value">${renter.phone || 'Não informado'}</span>
                  </div>
                </div>

                <p style="text-align: center;">
                  <a href="${contractPdfUrl}" class="button">📥 Visualizar Contrato</a>
                </p>

                <p><strong>Próximos passos:</strong></p>
                <ul>
                  <li>Prepare o veículo para retirada</li>
                  <li>Verifique se toda a documentação está em ordem</li>
                  <li>No dia da retirada, inspecione o veículo com o locatário</li>
                  <li>Tire fotos do odômetro e do estado geral do veículo</li>
                  <li>Acompanhe o status da reserva em seu dashboard</li>
                </ul>

                <p><strong>Dúvidas?</strong> Acesse seu dashboard RIDDY ou envie um email para <a href="mailto:suporte@riddy.com">suporte@riddy.com</a></p>
              </div>

              <div class="footer">
                <p>© 2026 ${RIDDY_COMPANY} - Todos os direitos reservados</p>
                <p>CNPJ: 65.901.010/0001-43</p>
                <p>Este é um email automático. Não responda a este endereço.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return true;
  } catch (error) {
    console.error('[Email Service] Error sending contract to host:', error);
    return false;
  }
}

/**
 * Send contract acceptance confirmation
 */
export async function sendContractAcceptanceConfirmation(params: SendContractEmailParams): Promise<boolean> {
  try {
    const { booking, vehicle, renter, contractPdfUrl } = params;

    const bookingId = String(booking.id).padStart(6, '0');

    if (!renter.email) return false;
    await resend.emails.send({
      from: RIDDY_EMAIL,
      to: renter.email,
      subject: `Contrato Aceito #RDY-${bookingId} - Confirmação`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
              .content { padding: 20px; background: #f9f9f9; border-radius: 8px; margin: 20px 0; }
              .success-box { background: #d4edda; border: 1px solid #28a745; padding: 15px; border-radius: 4px; margin: 15px 0; }
              .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✓ Contrato Aceito</h1>
                <p>Reserva #RDY-${bookingId}</p>
              </div>

              <div class="content">
                <p>Olá <strong>${renter.name}</strong>,</p>

                <div class="success-box">
                  <p style="margin: 0;"><strong>✓ Seu contrato foi aceito com sucesso!</strong></p>
                  <p style="margin: 5px 0 0 0; font-size: 14px;">Você está pronto para retirar o ${vehicle.model}.</p>
                </div>

                <p><strong>Detalhes da Reserva:</strong></p>
                <ul>
                  <li>Veículo: ${vehicle.model} (${vehicle.licensePlate})</li>
                  <li>Reserva: #RDY-${bookingId}</li>
                  <li>Status: Contrato Assinado ✓</li>
                </ul>

                <p><strong>Próximos passos:</strong></p>
                <ol>
                  <li>Acesse sua conta RIDDY para confirmar os detalhes finais</li>
                  <li>Prepare os documentos originais (CNH + RG)</li>
                  <li>No dia e hora agendados, compareça para retirar o veículo</li>
                  <li>Inspecione o veículo com o proprietário</li>
                  <li>Tire fotos do odômetro e do estado geral</li>
                </ol>

                <p><strong>Importante:</strong> Guarde uma cópia do contrato assinado. Você pode fazer download novamente a qualquer momento acessando sua conta.</p>
              </div>

              <div class="footer">
                <p>© 2026 ${RIDDY_COMPANY} - Todos os direitos reservados</p>
                <p>CNPJ: 65.901.010/0001-43</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return true;
  } catch (error) {
    console.error('[Email Service] Error sending acceptance confirmation:', error);
    return false;
  }
}
