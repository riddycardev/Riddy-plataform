/**
 * Mercado Pago Transparent Checkout Service
 * Supports: Credit Card and PIX
 * Payments happen inside the platform (no redirect)
 */

import { MercadoPagoConfig, Payment, PaymentMethod as MPPaymentMethod } from "mercadopago";
import { ENV } from "./_core/env";

// Initialize Mercado Pago client
const mpClient = new MercadoPagoConfig({
  accessToken: ENV.mercadoPagoAccessToken,
  options: { timeout: 30000 }, // 30s timeout — MP antifraude pode demorar até 20s
});

const paymentClient = new Payment(mpClient);

export interface CreditCardPaymentInput {
  bookingId: number;
  amount: number;
  description: string;
  customerEmail: string;
  customerName: string;
  customerCpf: string;
  // Tokenized card data from MercadoPago.js on frontend
  cardToken: string;
  installments: number;
  paymentMethodId: string; // e.g., "visa", "master"
  issuerId?: string;
  deviceId?: string; // MP Device Session ID for fraud prevention (reduces cc_rejected_high_risk)
}

export interface PixPaymentInput {
  bookingId: number;
  amount: number;
  description: string;
  customerEmail: string;
  customerName: string;
  customerCpf: string;
}

export interface MPPaymentResult {
  success: boolean;
  paymentId?: string;
  status?: string;
  statusDetail?: string;
  // PIX specific
  pixQrCode?: string;
  pixQrCodeBase64?: string;
  pixExpirationDate?: string;
  // 3DS 2.0 challenge
  requires3DS?: boolean;
  threeDSChallengeUrl?: string;
  // Error
  message: string;
}

/**
 * Process Credit Card payment via Mercado Pago Transparent Checkout
 */
export async function processCreditCardPayment(
  input: CreditCardPaymentInput
): Promise<MPPaymentResult> {
  try {
    const externalReference = `booking_${input.bookingId}_${Date.now()}`;

    const response = await paymentClient.create({
      body: {
        transaction_amount: input.amount,
        token: input.cardToken,
        description: input.description,
        installments: input.installments,
        payment_method_id: input.paymentMethodId,
        issuer_id: input.issuerId ? parseInt(input.issuerId) : undefined,
        external_reference: externalReference,
        notification_url: `https://riddycar.com/api/mercadopago/webhook`,
        // 3DS 2.0: optional mode — MP triggers challenge only when needed (high risk)
        // binary_mode must be false (default) for 3DS to work
        three_d_secure_mode: "optional",
        // Additional info improves fraud detection and approval rate
        additional_info: {
          items: [
            {
              id: `booking_${input.bookingId}`,
              title: input.description,
              quantity: 1,
              unit_price: input.amount,
            },
          ],
          payer: {
            first_name: input.customerName.split(" ")[0],
            last_name: input.customerName.split(" ").slice(1).join(" ") || input.customerName,
          },
        },
        payer: {
          email: input.customerEmail,
          first_name: input.customerName.split(" ")[0],
          last_name: input.customerName.split(" ").slice(1).join(" ") || input.customerName,
          identification: {
            type: "CPF",
            number: input.customerCpf.replace(/\D/g, ""),
          },
        },
      },
      // requestOptions.meliSessionId sends Device ID to reduce cc_rejected_high_risk
      requestOptions: input.deviceId ? { meliSessionId: input.deviceId } : undefined,
    });

    const status = response.status ?? "unknown";
    const statusDetail = response.status_detail ?? "";

    console.log(`[MP] Credit card payment ${response.id}: ${status} - ${statusDetail}`);

    if (status === "approved") {
      return {
        success: true,
        paymentId: response.id?.toString(),
        status,
        statusDetail,
        message: "Pagamento aprovado com sucesso!",
      };
    } else if (status === "pending" && statusDetail === "pending_challenge") {
      // 3DS 2.0 challenge required — return URL for frontend to open
      const challengeUrl = (response as any).three_ds_info?.external_resource_url;
      console.log(`[MP] 3DS challenge required for payment ${response.id}: ${challengeUrl}`);
      return {
        success: false,
        paymentId: response.id?.toString(),
        status,
        statusDetail,
        requires3DS: true,
        threeDSChallengeUrl: challengeUrl,
        message: "Autenticação bancária necessária. Por favor, confirme o pagamento no seu banco.",
      };
    } else if (status === "in_process" || status === "pending") {
      return {
        success: false,
        paymentId: response.id?.toString(),
        status,
        statusDetail,
        message: getStatusMessage(status, statusDetail || ""),
      };
    } else {
      return {
        success: false,
        paymentId: response.id?.toString(),
        status,
        statusDetail,
        message: getStatusMessage(status, statusDetail || ""),
      };
    }
  } catch (error: any) {
    console.error("[MP] Credit card payment error:", error);
    const errorMessage = error?.cause?.[0]?.description || error?.message || "Erro ao processar pagamento";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Process PIX payment via Mercado Pago
 */
export async function processPixPayment(
  input: PixPaymentInput
): Promise<MPPaymentResult> {
  try {
    const externalReference = `booking_${input.bookingId}_${Date.now()}`;

    const response = await paymentClient.create({
      body: {
        transaction_amount: input.amount,
        description: input.description,
        payment_method_id: "pix",
        external_reference: externalReference,
        notification_url: `https://riddycar.com/api/mercadopago/webhook`,
        date_of_expiration: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h expiry
        payer: {
          email: input.customerEmail,
          first_name: input.customerName.split(" ")[0],
          last_name: input.customerName.split(" ").slice(1).join(" ") || input.customerName,
          identification: {
            type: "CPF",
            number: input.customerCpf.replace(/\D/g, ""),
          },
        },
      },
    });

    const pixData = response.point_of_interaction?.transaction_data;

    console.log(`[MP] PIX payment ${response.id}: ${response.status}`);

    return {
      success: true,
      paymentId: response.id?.toString(),
      status: response.status,
      statusDetail: response.status_detail,
      pixQrCode: pixData?.qr_code || undefined,
      pixQrCodeBase64: pixData?.qr_code_base64 || undefined,
      pixExpirationDate: response.date_of_expiration || undefined,
      message: "QR Code PIX gerado com sucesso!",
    };
  } catch (error: any) {
    console.error("[MP] PIX payment error:", error);
    const errorMessage = error?.cause?.[0]?.description || error?.message || "Erro ao gerar PIX";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Get payment status from Mercado Pago
 */
export async function getMPPaymentStatus(mpPaymentId: string): Promise<{
  status: string;
  statusDetail: string;
  amount: number;
}> {
  try {
    const response = await paymentClient.get({ id: parseInt(mpPaymentId, 10) });
    return {
      status: response.status || "unknown",
      statusDetail: response.status_detail || "",
      amount: response.transaction_amount || 0,
    };
  } catch (error) {
    console.error("[MP] Get payment status error:", error);
    return { status: "unknown", statusDetail: "", amount: 0 };
  }
}

/**
 * Map MP status to user-friendly message
 */
function getStatusMessage(status: string, statusDetail: string): string {
  const messages: Record<string, string> = {
    // Approved
    "approved_accredited": "Pagamento aprovado!",
    // Pending
    "pending_waiting_payment": "Aguardando pagamento",
    "pending_waiting_transfer": "Aguardando transferência",
    // In process
    "in_process": "Pagamento em processamento",
    // Rejected
    "cc_rejected_bad_filled_card_number": "Número do cartão inválido",
    "cc_rejected_bad_filled_date": "Data de validade inválida",
    "cc_rejected_bad_filled_other": "Dados do cartão inválidos",
    "cc_rejected_bad_filled_security_code": "Código de segurança inválido",
    "cc_rejected_blacklist": "Cartão bloqueado. Entre em contato com seu banco",
    "cc_rejected_call_for_authorize": "Autorize o pagamento com seu banco",
    "cc_rejected_card_disabled": "Cartão desabilitado. Entre em contato com seu banco",
    "cc_rejected_duplicated_payment": "Pagamento duplicado",
    "cc_rejected_high_risk": "Pagamento recusado por segurança",
    "cc_rejected_insufficient_amount": "Saldo insuficiente",
    "cc_rejected_invalid_installments": "Número de parcelas inválido",
    "cc_rejected_max_attempts": "Limite de tentativas atingido. Tente outro cartão",
    "cc_rejected_other_reason": "Pagamento recusado. Tente outro cartão",
  };

  return messages[statusDetail] || messages[status] || `Pagamento ${status}`;
}

/**
 * Cancel/Refund a payment via Mercado Pago
 * - Full refund: omit amount (or set to full amount)
 * - Partial refund: pass amount in BRL
 */
export async function cancelMPPayment(
  mpPaymentId: string,
  refundAmount?: number
): Promise<{ success: boolean; refundId?: string; message: string }> {
  try {
    const paymentIdNum = parseInt(mpPaymentId, 10);

    // First check payment status
    const payment = await paymentClient.get({ id: paymentIdNum });
    const status = payment.status;

    // Pending payments can be cancelled directly
    if (status === "pending" || status === "in_process") {
      await paymentClient.cancel({ id: paymentIdNum });
      return { success: true, message: "Pagamento cancelado com sucesso" };
    }

    // Approved payments need a refund via PaymentRefund API
    if (status === "approved") {
      const { PaymentRefund } = await import("mercadopago");
      const mpClient = new MercadoPagoConfig({ accessToken: ENV.mercadoPagoAccessToken });
      const refundApi = new PaymentRefund(mpClient);

      const body: Record<string, unknown> = {};
      if (refundAmount !== undefined) {
        body.amount = refundAmount;
      }

      const refund = await refundApi.create({ payment_id: paymentIdNum, body });
      return {
        success: true,
        refundId: String(refund.id),
        message: refundAmount
          ? `Reembolso parcial de R$ ${refundAmount.toFixed(2)} solicitado`
          : "Reembolso total solicitado com sucesso",
      };
    }

    return {
      success: false,
      message: `Não é possível cancelar pagamento com status: ${status}`,
    };
  } catch (error: any) {
    console.error("[MP] Cancel/Refund error:", error);
    const msg = error?.message || "Erro ao processar reembolso";
    return { success: false, message: msg };
  }
}

/**
 * Create a Mercado Pago Checkout Pro preference
 * This redirects the user to the official MP checkout page,
 * which has higher approval rates than transparent checkout.
 */
export async function createMPCheckoutProPreference(input: {
  bookingId: number;
  amount: number;
  description: string;
  customerEmail: string;
  customerName: string;
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
}): Promise<{ preferenceId: string; checkoutUrl: string; sandboxUrl: string }> {
  const { Preference } = await import("mercadopago");
  const preferenceClient = new Preference(mpClient);

  const preference = await preferenceClient.create({
    body: {
      items: [
        {
          id: `booking-${input.bookingId}`,
          title: input.description,
          quantity: 1,
          unit_price: input.amount,
          currency_id: "BRL",
        },
      ],
      payer: {
        email: input.customerEmail,
        name: input.customerName,
      },
      back_urls: {
        success: input.successUrl,
        failure: input.failureUrl,
        pending: input.pendingUrl,
      },
      auto_return: "approved",
      external_reference: String(input.bookingId),
      statement_descriptor: "RIDDY CAR",
      metadata: {
        booking_id: input.bookingId,
      },
    },
  });

  return {
    preferenceId: preference.id!,
    checkoutUrl: preference.init_point!,
    sandboxUrl: preference.sandbox_init_point!,
  };
}
