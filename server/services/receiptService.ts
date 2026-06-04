/**
 * RIDDY - Receipt PDF Generation Service
 * Generates professional payment receipts as PDF and stores in S3
 */

import PDFDocument from "pdfkit";
import { storagePut } from "../storage";
import * as db from "../db";

const RIDDY_CNPJ = "65.901.010/0001-43";
const RIDDY_EMAIL = "contato@riddycar.com";
const RIDDY_SITE = "www.riddycar.com";

/**
 * Generate a payment receipt PDF for a booking
 */
export async function generateReceiptPdf(bookingId: number): Promise<{ success: boolean; pdfUrl?: string; error?: string }> {
  try {
    const booking = await db.getBookingById(bookingId);
    if (!booking) {
      return { success: false, error: "Reserva não encontrada" };
    }

    const renter = await db.getUserById(booking.renterId);
    const host = await db.getUserById(booking.hostId);
    const vehicle = await db.getVehicleById(booking.vehicleId);
    const payments = await db.getPaymentsByBookingId(bookingId);
    const completedPayment = payments.find(p => p.status === "completed");

    if (!renter || !vehicle) {
      return { success: false, error: "Dados incompletos para gerar recibo" };
    }

    const receiptNumber = `RDY-REC-${String(bookingId).padStart(6, "0")}`;
    const issueDate = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const startDate = new Date(booking.startDate).toLocaleDateString("pt-BR");
    const endDate = new Date(booking.endDate).toLocaleDateString("pt-BR");
    const totalAmount = parseFloat(booking.totalAmount);
    const dailyRate = parseFloat(booking.dailyRate);
    const subtotal = parseFloat(booking.subtotal);
    const serviceFee = parseFloat(booking.serviceFee);
    const insuranceFee = parseFloat(booking.insuranceFee);

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 60, right: 60 },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const W = 595.28 - 120; // usable width

      // ── HEADER ──────────────────────────────────────────────────────────
      // Teal header bar
      doc.rect(0, 0, 595.28, 80).fill("#0D9488");

      // RIDDY logo text
      doc.fontSize(28).font("Helvetica-Bold").fillColor("#FFFFFF");
      doc.text("RIDDY", 60, 25);

      doc.fontSize(10).font("Helvetica").fillColor("#CCFBF1");
      doc.text("Redefinindo Mobilidade", 60, 55);

      // Receipt label on right
      doc.fontSize(14).font("Helvetica-Bold").fillColor("#FFFFFF");
      doc.text("RECIBO DE PAGAMENTO", 300, 30, { width: 235, align: "right" });
      doc.fontSize(10).font("Helvetica").fillColor("#CCFBF1");
      doc.text(`Nº ${receiptNumber}`, 300, 52, { width: 235, align: "right" });

      doc.fillColor("#000000");
      let y = 100;

      // ── COMPANY INFO ────────────────────────────────────────────────────
      doc.fontSize(9).font("Helvetica").fillColor("#6B7280");
      doc.text(`RIDDY Tecnologia e Mobilidade Ltda  |  CNPJ: ${RIDDY_CNPJ}`, 60, y, { align: "center", width: W });
      doc.text(`${RIDDY_EMAIL}  |  ${RIDDY_SITE}`, 60, y + 12, { align: "center", width: W });

      y += 35;

      // ── RECEIPT INFO BOX ────────────────────────────────────────────────
      doc.rect(60, y, W, 60).fill("#F0FDFA").stroke("#99F6E4");
      doc.fillColor("#000000");

      doc.fontSize(10).font("Helvetica-Bold").fillColor("#0F766E");
      doc.text("INFORMAÇÕES DO RECIBO", 75, y + 10);

      doc.fontSize(9).font("Helvetica").fillColor("#374151");
      doc.text(`Data de Emissão: ${issueDate}`, 75, y + 26);
      doc.text(`Número do Recibo: ${receiptNumber}`, 75, y + 38);
      doc.text(`Reserva: #RDY-${String(bookingId).padStart(6, "0")}`, 300, y + 26);
      doc.text(`Status: PAGO`, 300, y + 38);

      y += 75;

      // ── PARTIES ─────────────────────────────────────────────────────────
      const halfW = (W - 15) / 2;

      // Locatário box
      doc.rect(60, y, halfW, 90).fill("#F9FAFB").stroke("#E5E7EB");
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#0F766E");
      doc.text("LOCATÁRIO", 75, y + 10);
      doc.fontSize(9).font("Helvetica").fillColor("#374151");
      doc.text(booking.renterFullName || renter.name || "—", 75, y + 24, { width: halfW - 20 });
      doc.text(`CPF: ${booking.renterCpf || "—"}`, 75, y + 36);
      doc.text(`Email: ${booking.renterEmail || renter.email || "—"}`, 75, y + 48, { width: halfW - 20 });
      doc.text(`Tel: ${booking.renterPhone || "—"}`, 75, y + 60);

      // Proprietário box
      const hostX = 60 + halfW + 15;
      doc.rect(hostX, y, halfW, 90).fill("#F9FAFB").stroke("#E5E7EB");
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#0F766E");
      doc.text("PROPRIETÁRIO", hostX + 15, y + 10);
      doc.fontSize(9).font("Helvetica").fillColor("#374151");
      doc.text(host?.name || "—", hostX + 15, y + 24, { width: halfW - 20 });
      doc.text(`Email: ${host?.email || "—"}`, hostX + 15, y + 36, { width: halfW - 20 });

      y += 105;

      // ── VEHICLE ─────────────────────────────────────────────────────────
      doc.rect(60, y, W, 55).fill("#F9FAFB").stroke("#E5E7EB");
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#0F766E");
      doc.text("VEÍCULO", 75, y + 10);
      doc.fontSize(9).font("Helvetica").fillColor("#374151");
      doc.text(`${vehicle.brand} ${vehicle.model} ${vehicle.year}`, 75, y + 24);
      doc.text(`Placa: ${vehicle.licensePlate || "—"}`, 75, y + 36);
      doc.text(`Cor: ${vehicle.color || "—"}  |  Câmbio: ${vehicle.transmission || "—"}`, 250, y + 24);
      doc.text(`Retirada: ${vehicle.pickupCity}, ${vehicle.pickupState}`, 250, y + 36);

      y += 70;

      // ── RENTAL PERIOD ───────────────────────────────────────────────────
      doc.rect(60, y, W, 40).fill("#F0FDFA").stroke("#99F6E4");
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#0F766E");
      doc.text("PERÍODO DA LOCAÇÃO", 75, y + 8);
      doc.fontSize(9).font("Helvetica").fillColor("#374151");
      doc.text(`Retirada: ${startDate}   →   Devolução: ${endDate}   |   ${booking.totalDays} dia(s)`, 75, y + 22);

      y += 55;

      // ── FINANCIAL BREAKDOWN ─────────────────────────────────────────────
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#0F766E");
      doc.text("DETALHAMENTO FINANCEIRO", 60, y);
      y += 15;

      // Table header
      doc.rect(60, y, W, 22).fill("#0D9488");
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#FFFFFF");
      doc.text("Descrição", 75, y + 7);
      doc.text("Valor", 450, y + 7, { width: 80, align: "right" });
      y += 22;

      // Rows
      const rows = [
        { label: `Diária (R$ ${dailyRate.toFixed(2)} × ${booking.totalDays} dia${booking.totalDays !== 1 ? "s" : ""})`, value: subtotal },
        { label: "Taxa de serviço RIDDY", value: serviceFee },
        ...(insuranceFee > 0 ? [{ label: "Proteção / Seguro", value: insuranceFee }] : []),
      ];

      rows.forEach((row, i) => {
        const rowY = y + i * 22;
        doc.rect(60, rowY, W, 22).fill(i % 2 === 0 ? "#FFFFFF" : "#F9FAFB").stroke("#E5E7EB");
        doc.fontSize(9).font("Helvetica").fillColor("#374151");
        doc.text(row.label, 75, rowY + 7);
        doc.text(`R$ ${row.value.toFixed(2)}`, 450, rowY + 7, { width: 80, align: "right" });
      });

      y += rows.length * 22;

      // Total row
      doc.rect(60, y, W, 28).fill("#0D9488");
      doc.fontSize(11).font("Helvetica-Bold").fillColor("#FFFFFF");
      doc.text("TOTAL PAGO", 75, y + 8);
      doc.text(`R$ ${totalAmount.toFixed(2)}`, 450, y + 8, { width: 80, align: "right" });
      y += 40;

      // Payment method
      if (completedPayment) {
        doc.fontSize(9).font("Helvetica").fillColor("#6B7280");
        const methodLabel = completedPayment.paymentMethod === "credit_card" ? "Cartão de Crédito"
          : completedPayment.paymentMethod === "debit_card" ? "Cartão de Débito"
          : completedPayment.paymentMethod === "pix" ? "PIX"
          : completedPayment.paymentMethod || "—";
        doc.text(`Forma de pagamento: ${methodLabel}`, 60, y);
        if (completedPayment.mpPaymentId) {
          doc.text(`ID da transação: ${completedPayment.mpPaymentId}`, 60, y + 12);
          y += 12;
        }
        y += 20;
      }

      // ── FOOTER ──────────────────────────────────────────────────────────
      y = Math.max(y, 700);
      doc.rect(0, y, 595.28, 1).fill("#E5E7EB");
      y += 10;

      doc.fontSize(8).font("Helvetica").fillColor("#9CA3AF");
      doc.text(
        `Este recibo é um comprovante de pagamento emitido pela RIDDY Tecnologia e Mobilidade Ltda (CNPJ: ${RIDDY_CNPJ}). ` +
        `Guarde este documento para fins de comprovação. Em caso de dúvidas, entre em contato: ${RIDDY_EMAIL}`,
        60, y, { width: W, align: "center" }
      );

      doc.end();
    });

    // Upload to S3
    const fileKey = `receipts/${bookingId}/recibo-${receiptNumber}-${Date.now()}.pdf`;
    const { url } = await storagePut(fileKey, pdfBuffer, "application/pdf");

    return { success: true, pdfUrl: url };
  } catch (err) {
    console.error("[ReceiptService] Error generating receipt PDF:", err);
    return { success: false, error: String(err) };
  }
}
