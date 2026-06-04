import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, hostProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { storagePut } from "../storage";
import { validateBase64, safeExtension } from "../_core/uploadValidator";
import { isValidBrazilianPlate, normalizePlate, INVALID_PLATE_MESSAGE } from "../../shared/licensePlate";

// ============================================
// MOTORCYCLE ROUTER
// ============================================

export const motorcycleRouter = router({
  /**
   * Create a new motorcycle listing
   */
  create: hostProcedure
    .input(z.object({
      brand: z.string().min(1, "Marca é obrigatória"),
      model: z.string().min(1, "Modelo é obrigatório"),
      year: z.number().min(1900).max(new Date().getFullYear() + 1),
      color: z.string().optional(),
      licensePlate: z.string().min(1, "Placa é obrigatória").refine(isValidBrazilianPlate, INVALID_PLATE_MESSAGE),
      dailyPrice: z.string().min(1, "Preço diário é obrigatório"),
      limitKmDiario: z.number().min(100, "Limite mínimo é 100km/dia").default(100),
      extraKmPrice: z.string().optional(),
      pickupAddress: z.string().min(1, "Endereço de retirada é obrigatório"),
      pickupCity: z.string().min(1, "Cidade é obrigatória"),
      pickupState: z.string().min(2).max(2, "Estado deve ter 2 caracteres"),
      features: z.array(z.string()).optional(),
      mainImageUrl: z.string().optional(),
      // Motorcycle specific fields
      cilindrada: z.enum(["125cc", "250cc", "600cc", "1200cc+"]),
      tipoMoto: z.enum(["street", "sport", "naked", "cruiser", "adventure", "scooter"]),
      combustivel: z.enum(["gasolina", "eletrica"]),
      cambio: z.enum(["manual", "automatico", "cvt"]),
      // Helmet add-on
      capaceteDisponivel: z.boolean().default(false),
      taxaCapacete: z.string().optional(),
      // Documents
      crlvBase64: z.string().min(1, "CRLV é obrigatório"),
      seguroBase64: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Validate helmet price if included
      if (input.capaceteDisponivel && !input.taxaCapacete) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Preço do capacete é obrigatório quando disponível",
        });
      }

      // ETAPA 8: Validate and upload CRLV document (magic bytes + size + allowed MIME)
      let crlvUrl = "";
      let crlvFileKey = "";
      if (input.crlvBase64) {
        const { mime: crlvMime, buffer: crlvBuffer } = validateBase64(
          input.crlvBase64,
          "vehicle_document"
        );
        const result = await storagePut(
          `motorcycles/crlv/${ctx.user.id}-${Date.now()}.${safeExtension(crlvMime)}`,
          crlvBuffer,
          crlvMime
        );
        crlvUrl = result.url;
        crlvFileKey = result.key;
      }

      // ETAPA 8: Validate and upload insurance document (magic bytes + size + allowed MIME)
      let seguroUrl = "";
      let seguroFileKey = "";
      if (input.seguroBase64) {
        const { mime: seguroMime, buffer: seguroBuffer } = validateBase64(
          input.seguroBase64,
          "vehicle_document"
        );
        const result = await storagePut(
          `motorcycles/insurance/${ctx.user.id}-${Date.now()}.${safeExtension(seguroMime)}`,
          seguroBuffer,
          seguroMime
        );
        seguroUrl = result.url;
        seguroFileKey = result.key;
      }

      // Create vehicle record with motorcycle type
      const vehicleId = await db.createVehicle({
        hostId: ctx.user.id,
        brand: input.brand,
        model: input.model,
        year: input.year,
        color: input.color,
        licensePlate: normalizePlate(input.licensePlate), // ETAPA 12: store canonical form
        category: "sport", // Default category for motorcycles (can be any valid category)
        vehicleType: "motorcycle",
        dailyPrice: input.dailyPrice,
        dailyKmLimit: input.limitKmDiario,
        extraKmPrice: input.extraKmPrice,
        pickupAddress: input.pickupAddress,
        pickupCity: input.pickupCity,
        pickupState: input.pickupState,
        features: input.features || [],
        mainImageUrl: input.mainImageUrl,
        crlvUrl,
        crlvFileKey,
        insuranceUrl: seguroUrl,
        insuranceFileKey: seguroFileKey,
        status: "pending_approval", // Must be reviewed by admin before appearing in search
      });

      // Create motorcycle specs
      await db.createMotorcycleSpecs({
        vehicleId,
        cilindrada: input.cilindrada as any,
        tipoMoto: input.tipoMoto as any,
        combustivel: input.combustivel as any,
        cambio: input.cambio as any,
        capaceteDisponivel: input.capaceteDisponivel,
        taxaCapacete: input.taxaCapacete || "0.00",
        limitKmDiario: input.limitKmDiario,
      });

      return { id: vehicleId, message: "Moto cadastrada com sucesso!" };
    }),

  /**
   * Get motorcycle by ID with specs
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const result = await db.getMotorcycleById(input.id);
      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Moto não encontrada" });
      }

      const { vehicle, specs } = result;

      // Remove sensitive document URLs from public response
      const { crlvUrl, crlvFileKey, insuranceUrl, insuranceFileKey, ...publicVehicle } = vehicle as any;

      return {
        ...publicVehicle,
        specs,
      };
    }),

  /**
   * List motorcycles with filters
   */
  list: publicProcedure
    .input(z.object({
      cilindrada: z.string().optional(),
      tipoMoto: z.string().optional(),
      combustivel: z.string().optional(),
      city: z.string().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      return await db.searchMotorcycles(input || {});
    }),

  /**
   * Get motorcycles by host ID
   */
  getMyMotorcycles: protectedProcedure.query(async ({ ctx }) => {
    return await db.getMotorcyclesByHostId(ctx.user.id);
  }),

  /**
   * Update motorcycle and specs
   */
  update: hostProcedure
    .input(z.object({
      id: z.number(),
      brand: z.string().optional(),
      model: z.string().optional(),
      year: z.number().optional(),
      color: z.string().optional(),
      dailyPrice: z.string().optional(),
      limitKmDiario: z.number().optional(),
      extraKmPrice: z.string().optional(),
      pickupAddress: z.string().optional(),
      pickupCity: z.string().optional(),
      pickupState: z.string().optional(),
      features: z.array(z.string()).optional(),
      // Motorcycle specs
      cilindrada: z.enum(["125cc", "250cc", "600cc", "1200cc+"]).optional(),
      tipoMoto: z.enum(["street", "sport", "naked", "cruiser", "adventure", "scooter"]).optional(),
      combustivel: z.enum(["gasolina", "eletrica"]).optional(),
      cambio: z.enum(["manual", "automatico", "cvt"]).optional(),
      capaceteDisponivel: z.boolean().optional(),
      taxaCapacete: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get motorcycle to verify ownership
      const motorcycle = await db.getMotorcycleById(input.id);
      if (!motorcycle) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Moto não encontrada" });
      }

      if (motorcycle.vehicle.hostId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para editar esta moto",
        });
      }

      // Update vehicle
      const vehicleData: any = {};
      if (input.brand) vehicleData.brand = input.brand;
      if (input.model) vehicleData.model = input.model;
      if (input.year) vehicleData.year = input.year;
      if (input.color) vehicleData.color = input.color;
      if (input.dailyPrice) vehicleData.dailyPrice = input.dailyPrice;
      if (input.limitKmDiario) vehicleData.dailyKmLimit = input.limitKmDiario;
      if (input.extraKmPrice) vehicleData.extraKmPrice = input.extraKmPrice;
      if (input.pickupAddress) vehicleData.pickupAddress = input.pickupAddress;
      if (input.pickupCity) vehicleData.pickupCity = input.pickupCity;
      if (input.pickupState) vehicleData.pickupState = input.pickupState;
      if (input.features) vehicleData.features = input.features;

      if (Object.keys(vehicleData).length > 0) {
        await db.updateVehicle(input.id, vehicleData);
      }

      // Update motorcycle specs
      const specsData: any = {};
      if (input.cilindrada) specsData.cilindrada = input.cilindrada;
      if (input.tipoMoto) specsData.tipoMoto = input.tipoMoto;
      if (input.combustivel) specsData.combustivel = input.combustivel;
      if (input.cambio) specsData.cambio = input.cambio;
      if (input.capaceteDisponivel !== undefined) specsData.capaceteDisponivel = input.capaceteDisponivel;
      if (input.taxaCapacete) specsData.taxaCapacete = input.taxaCapacete;

      if (Object.keys(specsData).length > 0) {
        await db.updateMotorcycleSpecs(input.id, specsData);
      }

      return { success: true, message: "Moto atualizada com sucesso!" };
    }),

  /**
   * Delete motorcycle
   */
  delete: hostProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Get motorcycle to verify ownership
      const motorcycle = await db.getMotorcycleById(input.id);
      if (!motorcycle) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Moto não encontrada" });
      }

      if (motorcycle.vehicle.hostId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para deletar esta moto",
        });
      }

      // Delete motorcycle specs first
      await db.deleteMotorcycleSpecs(input.id);

      // Delete vehicle
      await db.deleteVehicle(input.id);

      return { success: true, message: "Moto deletada com sucesso!" };
    }),

  /**
   * Search motorcycles with advanced filters
   */
  search: publicProcedure
    .input(z.object({
      cilindrada: z.string().optional(),
      tipoMoto: z.string().optional(),
      combustivel: z.string().optional(),
      city: z.string().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }))
    .query(async ({ input }) => {
      return await db.searchMotorcycles(input);
    }),
});
