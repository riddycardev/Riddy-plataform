/**
 * Email Router - Procedures para enviar emails com templates RIDDY
 * Fase 27: Email Templates com Branding RIDDY
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import {
  bookingConfirmedTemplate,
  paymentConfirmedTemplate,
  bookingCancelledTemplate,
  documentApprovedTemplate,
  documentRejectedTemplate,
} from "./email-templates";

export const emailRouter = router({
  sendBookingConfirmed: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.bookingId);
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const renter = await db.getUserById(booking.renterId);
      const vehicle = await db.getVehicleById(booking.vehicleId);

      if (!renter || !vehicle) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const htmlContent = bookingConfirmedTemplate({
        userName: renter.name || "Usuário",
        vehicleName: `${vehicle.brand} ${vehicle.model}`,
        vehicleType: vehicle.vehicleType as "car" | "motorcycle",
        startDate: new Date(booking.startDate).toLocaleDateString("pt-BR"),
        endDate: new Date(booking.endDate).toLocaleDateString("pt-BR"),
        totalAmount: Number(booking.totalAmount),
        bookingId: Number(booking.id),
        location: "Localização não informada",
      });

      // Log email sent
      await db.logEmail({
        recipientEmail: renter.email || "",
        recipientName: renter.name || "",
        subject: "Sua Reserva RIDDY Foi Confirmada!",
        template: "booking_confirmed",
        relatedEntityType: "booking",
        relatedEntityId: booking.id,
        status: "sent",
      });

      return { success: true, message: "Email enviado com sucesso" };
    }),

  sendPaymentConfirmed: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
      receiptNumber: z.string(),
      paymentMethod: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.bookingId);
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const renter = await db.getUserById(booking.renterId);
      const vehicle = await db.getVehicleById(booking.vehicleId);

      if (!renter || !vehicle) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const htmlContent = paymentConfirmedTemplate({
        userName: renter.name || "Usuário",
        vehicleName: `${vehicle.brand} ${vehicle.model}`,
        receiptNumber: input.receiptNumber,
        amount: Number(booking.totalAmount),
        paymentMethod: input.paymentMethod,
        bookingId: Number(booking.id),
        startDate: new Date(booking.startDate).toLocaleDateString("pt-BR"),
        endDate: new Date(booking.endDate).toLocaleDateString("pt-BR"),
      });

      // Log email sent
      await db.logEmail({
        recipientEmail: renter.email || "",
        recipientName: renter.name || "",
        subject: `Recibo de Pagamento #${input.receiptNumber}`,
        template: "payment_confirmed",
        relatedEntityType: "booking",
        relatedEntityId: booking.id as number,
        status: "sent",
      });

      return { success: true, message: "Email de pagamento enviado com sucesso" };
    }),

  sendBookingCancelled: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
      refundAmount: z.number(),
      cancellationFee: z.number(),
      refundReason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.bookingId);
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const renter = await db.getUserById(booking.renterId);
      const vehicle = await db.getVehicleById(booking.vehicleId);

      if (!renter || !vehicle) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const htmlContent = bookingCancelledTemplate({
        userName: renter.name || "Usuário",
        vehicleName: `${vehicle.brand} ${vehicle.model}`,
        originalAmount: Number(booking.totalAmount),
        refundAmount: input.refundAmount,
        cancellationFee: input.cancellationFee,
        refundReason: input.refundReason,
        bookingId: Number(booking.id),
      });

      // Log email sent
      await db.logEmail({
        recipientEmail: renter.email || "",
        recipientName: renter.name || "",
        subject: "Sua Reserva RIDDY Foi Cancelada",
        template: "booking_cancelled",
        relatedEntityType: "booking",
        relatedEntityId: booking.id as number,
        status: "sent",
      });

      return { success: true, message: "Email de cancelamento enviado com sucesso" };
    }),

  sendDocumentApproved: protectedProcedure
    .input(z.object({
      userId: z.number(),
      documentType: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUserById(input.userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const htmlContent = documentApprovedTemplate({
        userName: user.name || "Usuário",
        documentType: input.documentType,
      });

      // Log email sent
      await db.logEmail({
        recipientEmail: user.email || "",
        recipientName: user.name || "",
        subject: "Seu Documento Foi Aprovado",
        template: "document_approved",
        relatedEntityType: "user",
        relatedEntityId: user.id,
        status: "sent",
      });

      return { success: true, message: "Email de aprovação enviado com sucesso" };
    }),

  sendDocumentRejected: protectedProcedure
    .input(z.object({
      userId: z.number(),
      documentType: z.string(),
      rejectionReason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUserById(input.userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const htmlContent = documentRejectedTemplate({
        userName: user.name || "Usuário",
        documentType: input.documentType,
        rejectionReason: input.rejectionReason,
      });

      // Log email sent
      await db.logEmail({
        recipientEmail: user.email || "",
        recipientName: user.name || "",
        subject: "Seu Documento Não Foi Aprovado",
        template: "document_rejected",
        relatedEntityType: "user",
        relatedEntityId: user.id,
        status: "sent",
      });

      return { success: true, message: "Email de rejeição enviado com sucesso" };
    }),
});
