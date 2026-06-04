/**
 * Email Templates com Branding RIDDY
 * Templates HTML para notificações de booking, pagamento e cancelamento
 */

const RIDDY_LOGO = "https://riddy.com/logo.png";
const RIDDY_COLOR_PRIMARY = "#00BCD4"; // Cyan
const RIDDY_COLOR_DARK = "#0A0F1C"; // Dark background
const RIDDY_COLOR_SUCCESS = "#10B981"; // Green
const RIDDY_COLOR_WARNING = "#F59E0B"; // Orange
const RIDDY_COLOR_DANGER = "#EF4444"; // Red

/**
 * Template base com estilos comuns
 */
const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RIDDY</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, ${RIDDY_COLOR_DARK} 0%, #1a2332 100%);
            padding: 30px 20px;
            text-align: center;
            border-bottom: 3px solid ${RIDDY_COLOR_PRIMARY};
        }
        .logo {
            width: 50px;
            height: 50px;
            margin-bottom: 15px;
        }
        .header h1 {
            color: white;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 1px;
        }
        .content {
            padding: 40px 30px;
        }
        .content h2 {
            color: ${RIDDY_COLOR_DARK};
            font-size: 20px;
            margin-bottom: 20px;
            font-weight: 600;
        }
        .content p {
            color: #555;
            margin-bottom: 15px;
            font-size: 14px;
        }
        .info-box {
            background-color: #f9fafb;
            border-left: 4px solid ${RIDDY_COLOR_PRIMARY};
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box strong {
            color: ${RIDDY_COLOR_DARK};
            display: block;
            margin-bottom: 5px;
        }
        .info-box span {
            color: #666;
            font-size: 13px;
        }
        .button {
            display: inline-block;
            background-color: ${RIDDY_COLOR_PRIMARY};
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            transition: background-color 0.3s;
        }
        .button:hover {
            background-color: #00a8c4;
        }
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 15px;
        }
        .status-success {
            background-color: #d1fae5;
            color: ${RIDDY_COLOR_SUCCESS};
        }
        .status-warning {
            background-color: #fef3c7;
            color: ${RIDDY_COLOR_WARNING};
        }
        .status-danger {
            background-color: #fee2e2;
            color: ${RIDDY_COLOR_DANGER};
        }
        .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #999;
        }
        .footer a {
            color: ${RIDDY_COLOR_PRIMARY};
            text-decoration: none;
        }
        table {
            width: 100%;
            margin: 20px 0;
            border-collapse: collapse;
        }
        table th {
            background-color: #f3f4f6;
            padding: 10px;
            text-align: left;
            font-weight: 600;
            color: ${RIDDY_COLOR_DARK};
            border-bottom: 2px solid #e5e7eb;
        }
        table td {
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
            color: #555;
        }
        table tr:last-child td {
            border-bottom: none;
        }
        .amount {
            font-size: 18px;
            font-weight: 700;
            color: ${RIDDY_COLOR_PRIMARY};
        }
    </style>
</head>
<body>
    <div class="container">
        ${content}
    </div>
</body>
</html>
`;

/**
 * Template: Reserva Confirmada
 */
export const bookingConfirmedTemplate = (data: {
  userName: string;
  vehicleName: string;
  vehicleType: "car" | "motorcycle";
  startDate: string;
  endDate: string;
  totalAmount: number;
  bookingId: number;
  location: string;
}) => {
  const content = `
    <div class="header">
      <h1>✓ Reserva Confirmada!</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${data.userName}</strong>,</p>
      <p>Sua reserva foi confirmada com sucesso! Aqui estão os detalhes:</p>
      
      <div class="info-box">
        <strong>Veículo</strong>
        <span>${data.vehicleName} ${data.vehicleType === "motorcycle" ? "🏍️" : "🚗"}</span>
      </div>
      
      <div class="info-box">
        <strong>Período</strong>
        <span>${data.startDate} até ${data.endDate}</span>
      </div>
      
      <div class="info-box">
        <strong>Localização</strong>
        <span>${data.location}</span>
      </div>
      
      <div class="info-box">
        <strong>Valor Total</strong>
        <span class="amount">R$ ${data.totalAmount.toFixed(2)}</span>
      </div>
      
      <p>Você receberá instruções de retirada em breve. Se tiver dúvidas, entre em contato conosco.</p>
      
      <a href="https://riddy.com/bookings/${data.bookingId}" class="button">Ver Detalhes da Reserva</a>
    </div>
    <div class="footer">
      <p>© 2026 RIDDY - Aluguel de Carros e Motos entre Pessoas</p>
      <p><a href="https://riddy.com/privacy">Política de Privacidade</a> | <a href="https://riddy.com/terms">Termos de Uso</a></p>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Template: Pagamento Confirmado
 */
export const paymentConfirmedTemplate = (data: {
  userName: string;
  vehicleName: string;
  receiptNumber: string;
  amount: number;
  paymentMethod: string;
  bookingId: number;
  startDate: string;
  endDate: string;
}) => {
  const content = `
    <div class="header">
      <span class="status-badge status-success">✓ Pagamento Confirmado</span>
      <h1>Recibo de Pagamento</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${data.userName}</strong>,</p>
      <p>Seu pagamento foi processado com sucesso!</p>
      
      <table>
        <tr>
          <th>Descrição</th>
          <th style="text-align: right;">Valor</th>
        </tr>
        <tr>
          <td>${data.vehicleName}</td>
          <td style="text-align: right;">R$ ${data.amount.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; color: ${RIDDY_COLOR_DARK};">TOTAL</td>
          <td style="text-align: right; font-weight: 600; color: ${RIDDY_COLOR_PRIMARY};">R$ ${data.amount.toFixed(2)}</td>
        </tr>
      </table>
      
      <div class="info-box">
        <strong>Número do Recibo</strong>
        <span>${data.receiptNumber}</span>
      </div>
      
      <div class="info-box">
        <strong>Método de Pagamento</strong>
        <span>${data.paymentMethod}</span>
      </div>
      
      <div class="info-box">
        <strong>Período da Reserva</strong>
        <span>${data.startDate} até ${data.endDate}</span>
      </div>
      
      <p>Você pode baixar este recibo a qualquer momento em sua conta.</p>
      
      <a href="https://riddy.com/receipts/${data.receiptNumber}" class="button">Baixar Recibo em PDF</a>
    </div>
    <div class="footer">
      <p>© 2026 RIDDY - Aluguel de Carros e Motos entre Pessoas</p>
      <p><a href="https://riddy.com/privacy">Política de Privacidade</a> | <a href="https://riddy.com/terms">Termos de Uso</a></p>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Template: Reserva Cancelada com Reembolso
 */
export const bookingCancelledTemplate = (data: {
  userName: string;
  vehicleName: string;
  originalAmount: number;
  refundAmount: number;
  cancellationFee: number;
  refundReason: string;
  bookingId: number;
}) => {
  const content = `
    <div class="header">
      <span class="status-badge status-warning">⚠ Reserva Cancelada</span>
      <h1>Cancelamento Processado</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${data.userName}</strong>,</p>
      <p>Sua reserva foi cancelada conforme solicitado.</p>
      
      <div class="info-box">
        <strong>Veículo</strong>
        <span>${data.vehicleName}</span>
      </div>
      
      <div class="info-box">
        <strong>Motivo do Cancelamento</strong>
        <span>${data.refundReason}</span>
      </div>
      
      <table>
        <tr>
          <th>Descrição</th>
          <th style="text-align: right;">Valor</th>
        </tr>
        <tr>
          <td>Valor Original</td>
          <td style="text-align: right;">R$ ${data.originalAmount.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Taxa de Cancelamento</td>
          <td style="text-align: right; color: ${RIDDY_COLOR_DANGER};">-R$ ${data.cancellationFee.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; color: ${RIDDY_COLOR_DARK};">Valor Reembolsado</td>
          <td style="text-align: right; font-weight: 600; color: ${RIDDY_COLOR_SUCCESS};">R$ ${data.refundAmount.toFixed(2)}</td>
        </tr>
      </table>
      
      <p><strong>Informação Importante:</strong> O reembolso será processado em 3-5 dias úteis na sua conta bancária ou cartão de crédito.</p>
      
      <a href="https://riddy.com/bookings/${data.bookingId}" class="button">Ver Detalhes</a>
    </div>
    <div class="footer">
      <p>© 2026 RIDDY - Aluguel de Carros e Motos entre Pessoas</p>
      <p><a href="https://riddy.com/privacy">Política de Privacidade</a> | <a href="https://riddy.com/terms">Termos de Uso</a></p>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Template: Documento Aprovado
 */
export const documentApprovedTemplate = (data: {
  userName: string;
  documentType: string;
}) => {
  const content = `
    <div class="header">
      <span class="status-badge status-success">✓ Aprovado</span>
      <h1>Documento Verificado</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${data.userName}</strong>,</p>
      <p>Seu documento foi verificado e aprovado com sucesso!</p>
      
      <div class="info-box">
        <strong>Tipo de Documento</strong>
        <span>${data.documentType}</span>
      </div>
      
      <p>Você agora pode alugar veículos na plataforma RIDDY. Aproveite!</p>
      
      <a href="https://riddy.com/cars" class="button">Explorar Carros</a>
    </div>
    <div class="footer">
      <p>© 2026 RIDDY - Aluguel de Carros e Motos entre Pessoas</p>
      <p><a href="https://riddy.com/privacy">Política de Privacidade</a> | <a href="https://riddy.com/terms">Termos de Uso</a></p>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Template: Documento Rejeitado
 */
export const documentRejectedTemplate = (data: {
  userName: string;
  documentType: string;
  rejectionReason: string;
}) => {
  const content = `
    <div class="header">
      <span class="status-badge status-danger">✗ Rejeitado</span>
      <h1>Documento Não Aprovado</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${data.userName}</strong>,</p>
      <p>Infelizmente, seu documento não foi aprovado. Veja o motivo abaixo:</p>
      
      <div class="info-box">
        <strong>Tipo de Documento</strong>
        <span>${data.documentType}</span>
      </div>
      
      <div class="info-box">
        <strong>Motivo da Rejeição</strong>
        <span>${data.rejectionReason}</span>
      </div>
      
      <p>Por favor, envie um novo documento e tente novamente. Se tiver dúvidas, entre em contato com nosso suporte.</p>
      
      <a href="https://riddy.com/documents" class="button">Reenviar Documento</a>
    </div>
    <div class="footer">
      <p>© 2026 RIDDY - Aluguel de Carros e Motos entre Pessoas</p>
      <p><a href="https://riddy.com/privacy">Política de Privacidade</a> | <a href="https://riddy.com/terms">Termos de Uso</a></p>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Função para renderizar template com variáveis
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string | number>
): string {
  let rendered = template;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    rendered = rendered.replace(regex, String(value));
  });
  return rendered;
}
