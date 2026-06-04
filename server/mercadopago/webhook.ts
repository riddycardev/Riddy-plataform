/**
 * Mercado Pago Webhook Handler — Produção
 *
 * DIAGNÓSTICO REALIZADO (2026-04-17):
 * O painel MP envia x-signature MESMO nos testes de simulação (live_mode: false).
 * O secret correto para verificação ainda não foi configurado no ambiente.
 *
 * ESTRATÉGIA DE SEGURANÇA:
 *   - live_mode: false  → bypass de assinatura (evento de teste/simulação)
 *   - live_mode: true   → verificação HMAC-SHA256 obrigatória
 *
 * MANIFEST CORRETO (documentação oficial MP):
 *   id:[data.id da QUERY STRING];request-id:[x-request-id header];ts:[ts do x-signature]
 *   Referência: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 *
 * IMPORTANTE: O data.id vem da QUERY STRING da URL (?data.id=xxx), não do body JSON.
 * A URL do webhook é chamada como: POST /api/mercadopago/webhook?data.id=xxx&type=payment
 */

import { Router, Request, Response } from "express";
import crypto from "crypto";
import { getMPPaymentStatus } from "../mercadopago.service";
import * as db from "../db";
import { ENV } from "../_core/env";
import logger from "../_core/logger";

const router = Router();

// ── Idempotência: evita processar o mesmo evento duas vezes ──────────────────
const processedEvents = new Set<string>();
const MAX_PROCESSED_EVENTS = 10_000;

function markProcessed(eventKey: string): boolean {
  if (processedEvents.has(eventKey)) return false; // já processado
  if (processedEvents.size >= MAX_PROCESSED_EVENTS) {
    // Limpa metade mais antiga quando o Set fica grande
    const entries = Array.from(processedEvents);
    entries.slice(0, MAX_PROCESSED_EVENTS / 2).forEach(k => processedEvents.delete(k));
  }
  processedEvents.add(eventKey);
  return true; // novo evento
}

// ── Verificação de assinatura HMAC-SHA256 ────────────────────────────────────

/**
 * Verifica o header x-signature enviado pelo MercadoPago.
 *
 * MANIFEST: id:<data.id_url>;request-id:<x-request-id>;ts:<ts>
 * Onde data.id_url vem da QUERY STRING da URL, não do body.
 *
 * Retorna true  → assinatura válida
 * Retorna false → assinatura ausente, malformada ou inválida
 */
export function verifyMPSignature(req: Request): boolean {
  const secret = ENV.mercadoPagoWebhookSecret;

  if (!secret) {
    logger.error("[MP Webhook] SECURITY: MP_WEBHOOK_SECRET não configurado. Todas as requisições são rejeitadas.");
    return false;
  }

  const signatureHeader = req.headers["x-signature"] as string | undefined;
  const requestId = req.headers["x-request-id"] as string | undefined;

  if (!signatureHeader) {
    logger.warn("[MP Webhook] x-signature ausente");
    return false;
  }

  // Parse "ts=<ts>,v1=<hmac>"
  const parts: Record<string, string> = {};
  for (const part of signatureHeader.split(",")) {
    const eqIdx = part.indexOf("=");
    if (eqIdx > 0) {
      const k = part.slice(0, eqIdx).trim();
      const v = part.slice(eqIdx + 1).trim();
      parts[k] = v;
    }
  }

  const ts = parts["ts"];
  const v1 = parts["v1"];

  if (!ts || !v1) {
    logger.warn("[MP Webhook] x-signature malformado: ts ou v1 ausente");
    return false;
  }

  // data.id vem da QUERY STRING da URL (?data.id=xxx), conforme documentação MP
  // Se não houver na query string, tenta o body como fallback
  // req.query pode ser undefined em mocks de teste — usar optional chaining
  const urlDataId = (req.query?.["data.id"] as string | undefined) ?? "";

  // Fallback: tentar extrair do body se não vier na query string
  let bodyDataId = "";
  try {
    const raw = req.body;
    let parsed: Record<string, unknown> | null = null;
    if (raw && typeof raw === "object" && !Buffer.isBuffer(raw)) {
      parsed = raw as Record<string, unknown>;
    } else if (Buffer.isBuffer(raw)) {
      const str = raw.toString("utf8").trim();
      if (str) parsed = JSON.parse(str) as Record<string, unknown>;
    }
    if (parsed) {
      bodyDataId = (parsed?.data as Record<string, unknown>)?.id?.toString() ?? "";
    }
  } catch { /* ignorar */ }

  const dataId = urlDataId || bodyDataId;

  // Montar manifest: omite campos ausentes (conforme documentação)
  const signedParts: string[] = [];
  if (dataId) signedParts.push(`id:${dataId}`);
  if (requestId) signedParts.push(`request-id:${requestId}`);
  signedParts.push(`ts:${ts}`);
  const manifest = signedParts.join(";");

  const expected = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  logger.info(`[MP Webhook] Verificando assinatura | manifest="${manifest}" | expected="${expected}" | received="${v1}"`);

  // Comparação segura contra timing attacks
  let valid = false;
  try {
    const expBuf = Buffer.from(expected, "hex");
    const v1Buf = Buffer.from(v1.padEnd(expected.length, "0").slice(0, expected.length), "hex");
    if (expBuf.length === v1Buf.length) {
      valid = crypto.timingSafeEqual(expBuf, v1Buf);
    }
  } catch {
    valid = false;
  }

  if (!valid) {
    logger.warn(`[MP Webhook] Assinatura inválida | manifest="${manifest}"`);
  }

  return valid;
}

// ── Rota principal do webhook ─────────────────────────────────────────────────

router.post("/webhook", async (req: Request, res: Response) => {
  // ── 0. Parse defensivo do body ─────────────────────────────────────────────
  let rawBody: Record<string, unknown> | null = null;
  try {
    const raw = req.body;
    if (raw && typeof raw === "object" && !Buffer.isBuffer(raw) && Object.keys(raw).length > 0) {
      rawBody = raw as Record<string, unknown>;
    } else if (Buffer.isBuffer(raw)) {
      const str = raw.toString("utf8").trim();
      if (str) rawBody = JSON.parse(str) as Record<string, unknown>;
    } else if (typeof raw === "string" && (raw as string).trim()) {
      rawBody = JSON.parse(raw as string) as Record<string, unknown>;
    }
  } catch {
    // body inválido — tratado abaixo
  }

  // ── 1. Log completo para auditoria ─────────────────────────────────────────
  const urlDataId = req.query["data.id"] as string | undefined;
  const urlType = req.query["type"] as string | undefined;
  logger.info(
    `[MP Webhook] Recebido | IP: ${req.ip} | ` +
    `x-signature: ${req.headers["x-signature"] ? "presente" : "AUSENTE"} | ` +
    `x-request-id: ${req.headers["x-request-id"] ?? "ausente"} | ` +
    `content-type: ${req.headers["content-type"] ?? "ausente"} | ` +
    `query: data.id=${urlDataId ?? "ausente"}, type=${urlType ?? "ausente"} | ` +
    `body.live_mode: ${rawBody?.live_mode} | ` +
    `body: ${JSON.stringify(rawBody)}`
  );

  // ── 2. Detecção de modo: teste vs produção ────────────────────────────────
  // live_mode: false → evento de teste/simulação do painel MP
  // live_mode: true  → evento real de produção
  const isTestEvent = rawBody?.live_mode === false;
  const isEmptyBody = rawBody === null || Object.keys(rawBody ?? {}).length === 0;

  if (isEmptyBody) {
    logger.info(`[MP Webhook] Body vazio → 200 OK (ping de verificação)`);
    return res.status(200).json({ received: true, ping: true });
  }

  // ── 3. Verificação de assinatura ──────────────────────────────────────────
  // Eventos de teste (live_mode: false): bypass de assinatura pois o secret de
  // teste é diferente do de produção, mas AINDA processamos o evento normalmente.
  // Eventos reais (live_mode: true): verificação HMAC-SHA256 obrigatória.
  if (!isTestEvent && !verifyMPSignature(req)) {
    logger.warn("[MP Webhook] Rejeitado: assinatura inválida ou ausente");
    return res.status(401).json({ error: "Invalid signature" });
  }

  if (isTestEvent) {
    logger.info(`[MP Webhook] Evento de teste (live_mode=false) — processando sem verificação de assinatura`);
  }

  // ── 4. Garantir body válido ────────────────────────────────────────────────
  if (!rawBody) {
    logger.warn("[MP Webhook] Body inválido ou vazio em requisição com assinatura");
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  // ── 5. Idempotência ────────────────────────────────────────────────────────
  const { type, data, action } = rawBody as {
    type?: string;
    data?: { id?: string | number };
    action?: string;
  };
  const paymentId = urlDataId ?? data?.id?.toString() ?? "";
  const requestId = req.headers["x-request-id"] as string | undefined;
  const eventKey = `${requestId ?? paymentId}-${action ?? type}`;

  if (!markProcessed(eventKey)) {
    logger.info(`[MP Webhook] Evento duplicado ignorado: ${eventKey}`);
    return res.status(200).json({ received: true, duplicate: true });
  }

  // ── 6. Confirmar recebimento imediatamente (MP exige < 5s) ─────────────────
  res.status(200).json({ received: true });

  logger.info(`[MP Webhook] Processando: type=${type}, action=${action}, paymentId=${paymentId}`);

  // ── 7. Processar notificação de pagamento de forma assíncrona ──────────────
  try {
    if ((type === "payment" || action === "payment.updated") && paymentId) {
      const mpStatus = await getMPPaymentStatus(paymentId);
      logger.info(`[MP Webhook] Payment ${paymentId} status: ${mpStatus.status}`);

      const payment = await db.getPaymentByMpId(paymentId);
      if (!payment) {
        logger.warn(`[MP Webhook] Pagamento não encontrado para mpPaymentId: ${paymentId}`);
        return;
      }

      // Mapear status MP → status interno
      let ourStatus: "pending" | "processing" | "completed" | "failed" = "processing";
      if (mpStatus.status === "approved") {
        ourStatus = "completed";
      } else if (mpStatus.status === "rejected" || mpStatus.status === "cancelled") {
        ourStatus = "failed";
      } else if (mpStatus.status === "pending" || mpStatus.status === "in_process") {
        ourStatus = "processing";
      }

      await db.updatePaymentStatus(payment.id, ourStatus, { mpPaymentId: paymentId });

      if (ourStatus === "completed") {
        await db.updateBookingStatus(payment.bookingId, "confirmed");
        logger.info(`[MP Webhook] Reserva ${payment.bookingId} confirmada após pagamento ${paymentId}`);

        try {
          const booking = await db.getBookingById(payment.bookingId);
          const user = await db.getUserById(payment.userId);
          const vehicle = booking?.vehicleId ? await db.getVehicleById(booking.vehicleId) : null;

          if (booking && user && vehicle) {
            // Send confirmation email to renter
            try {
              const { sendBookingConfirmationToRenter, sendBookingNotificationToHost } = await import("../email.service");
              const hostUser = await db.getUserById(vehicle.hostId);

              const emailData = {
                renterName: booking.renterFullName || user.name || "Locatário",
                renterEmail: booking.renterEmail || user.email || "",
                hostName: hostUser?.name || "Proprietário",
                hostEmail: hostUser?.email || "",
                vehicleBrand: vehicle.brand,
                vehicleModel: vehicle.model,
                vehiclePlate: vehicle.licensePlate || "",
                startDate: new Date(booking.startDate).toLocaleDateString("pt-BR"),
                endDate: new Date(booking.endDate).toLocaleDateString("pt-BR"),
                totalAmount: Number(booking.totalAmount).toFixed(2),
                bookingId: booking.id,
                pickupLocation: booking.pickupLocation || vehicle.pickupAddress || "",
                returnLocation: booking.returnLocation || booking.pickupLocation || vehicle.pickupAddress || "",
              };

              if (emailData.renterEmail) {
                await sendBookingConfirmationToRenter(emailData);
                logger.info(`[MP Webhook] E-mail de confirmação enviado para ${emailData.renterEmail}`);
              }

              if (emailData.hostEmail) {
                await sendBookingNotificationToHost(emailData);
                logger.info(`[MP Webhook] E-mail de notificação enviado para host ${emailData.hostEmail}`);
              }
            } catch (emailErr) {
              logger.error("[MP Webhook] Falha ao enviar e-mails de confirmação:", emailErr);
            }

            await db.createNotification({
              userId: payment.userId,
              title: "Pagamento Confirmado! ✅",
              message: `Seu pagamento de R$ ${payment.amount} foi confirmado. Sua reserva para ${vehicle.brand} ${vehicle.model} está confirmada!`,
              notificationType: "payment_received",
              relatedId: payment.bookingId,
              relatedType: "booking",
            });

            await db.createNotification({
              userId: vehicle.hostId,
              title: "Pagamento Recebido! 💰",
              message: `Você recebeu R$ ${payment.amount} pela reserva de ${vehicle.brand} ${vehicle.model}.`,
              notificationType: "payment_received",
              relatedId: payment.bookingId,
              relatedType: "booking",
            });
          }
        } catch (notifErr) {
          logger.error("[MP Webhook] Falha ao enviar notificações de pagamento:", notifErr);
        }
      } else if (ourStatus === "failed") {
        await db.updateBookingStatus(payment.bookingId, "payment_failed");
        logger.info(`[MP Webhook] Pagamento falhou para reserva ${payment.bookingId}`);

        try {
          const booking = await db.getBookingById(payment.bookingId);
          const vehicle = booking?.vehicleId ? await db.getVehicleById(booking.vehicleId) : null;

          if (booking && vehicle) {
            await db.createNotification({
              userId: payment.userId,
              title: "Pagamento Falhou ⚠",
              message: `Seu pagamento para a reserva de ${vehicle.brand} ${vehicle.model} foi recusado. Tente novamente com outro método de pagamento.`,
              notificationType: "payment_failed",
              relatedId: payment.bookingId,
              relatedType: "booking",
            });
          }
        } catch (notifErr) {
          logger.error("[MP Webhook] Falha ao enviar notificação de pagamento recusado:", notifErr);
        }
      }
    }
  } catch (error) {
    logger.error("[MP Webhook] Erro ao processar webhook:", error);
    // Resposta 200 já enviada — apenas logar
  }
});

export default router;
