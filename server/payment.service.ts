/**
 * Payment Service
 * Supports: Pix, Boleto (via Mercado Pago — see mercadopago.service.ts for card payments)
 */

export interface PaymentData {
  bookingId: number;
  amount: number;
  method: "credit_card" | "debit_card" | "pix" | "boleto";
  customerEmail?: string;
  customerName?: string;
  description?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  pixQrCode?: string;
  boletoUrl?: string;
  message: string;
}

/**
 * Process Pix payment
 * In production, use Mercado Pago Pix (see mercadopago.service.ts)
 */
export async function processPixPayment(
  data: PaymentData
): Promise<PaymentResult> {
  try {
    const pixQrCode = generateMockPixQrCode(data.bookingId, data.amount);
    return {
      success: true,
      paymentId: `pix_${data.bookingId}_${Date.now()}`,
      pixQrCode,
      message: "Pix QR code generated successfully",
    };
  } catch (error) {
    console.error("[Payment] Pix error:", error);
    return {
      success: false,
      message: `Erro ao gerar Pix: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Process Boleto payment
 * In production, integrate with a Boleto provider (e.g., Asaas, Mercado Pago)
 */
export async function processBoletoPayment(
  data: PaymentData
): Promise<PaymentResult> {
  try {
    const boletoUrl = generateMockBoletoUrl(data.bookingId, data.amount);
    return {
      success: true,
      paymentId: `boleto_${data.bookingId}_${Date.now()}`,
      boletoUrl,
      message: "Boleto generated successfully",
    };
  } catch (error) {
    console.error("[Payment] Boleto error:", error);
    return {
      success: false,
      message: `Erro ao gerar Boleto: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Process payment with any method
 */
export async function processPayment(data: PaymentData): Promise<PaymentResult> {
  console.log(`[Payment] Processing ${data.method} payment for booking ${data.bookingId}`);
  switch (data.method) {
    case "pix":
      return processPixPayment(data);
    case "boleto":
      return processBoletoPayment(data);
    case "credit_card":
    case "debit_card":
      return {
        success: false,
        message: "Use processMPCreditCard para pagamentos com cartão via Mercado Pago.",
      };
    default:
      return {
        success: false,
        message: `Método de pagamento não suportado: ${data.method}`,
      };
  }
}

function generateMockPixQrCode(bookingId: number, amount: number): string {
  const timestamp = Date.now();
  return `00020126580014br.gov.bcb.pix0136${bookingId}-${timestamp}520400005303986540${amount.toFixed(2)}5802BR5913RIDDY6009SAOPAULO62410503***63041D3D`;
}

function generateMockBoletoUrl(bookingId: number, _amount: number): string {
  const bankCode = "001";
  const branchCode = "0001";
  const accountNumber = `${bookingId}`.padStart(10, "0");
  const sequenceNumber = Math.random().toString().substring(2, 12).padStart(10, "0");
  const barcode = `${bankCode}${branchCode}${accountNumber}${sequenceNumber}`;
  return `https://boleto.example.com/view/${barcode}`;
}

export async function verifyPaymentStatus(_paymentId: string): Promise<{
  status: "pending" | "completed" | "failed";
  amount?: number;
}> {
  return { status: "pending" };
}
