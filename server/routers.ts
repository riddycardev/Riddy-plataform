import { z } from "zod";
import type { z as zod } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { SignJWT } from "jose";
import fs from "fs";
import path from "path";
import { processCreditCardPayment, processPixPayment, getMPPaymentStatus, cancelMPPayment, createMPCheckoutProPreference } from "./mercadopago.service";
import { notifyOwner } from "./_core/notification";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, hostProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import * as db from "./db";
import { storagePut } from "./storage";
import { extractCNHData, validateNameMatch } from "./_core/ocr";
import { validateBase64, safeExtension } from "./_core/uploadValidator";
import { logForbidden, logAdminAction, logUploadRejected, logAuthFailure } from "./_core/securityLogger";
import { isValidBrazilianPlate, normalizePlate, INVALID_PLATE_MESSAGE } from "../shared/licensePlate";
import { getClientIp } from "./_core/rateLimiter";
import { sendBookingConfirmationToRenter, sendBookingNotificationToHost } from "./email.service";
import { emailRouter } from "./email-router";
import { generateAndSendContract, sendContractAcceptanceEmail } from "./services/contractProcedure";
import { motorcycleRouter } from "./routers/motorcycle";
import { ownAuthRouter } from "./routers/ownAuth";
import { googleAuthRouter, handleGoogleCallback } from "./routers/googleAuth";
import { geolocationRouter } from "./routers/geolocation";
import { chatRouter } from "./routers/chat";
import { riddyCareRouter } from "./routers/riddyCare";
import { levelsRouter } from "./routers/levels";
import { makeRequest, GeocodingResult } from "./_core/map";
import {
  bookingConfirmedTemplate,
  paymentConfirmedTemplate,
  bookingCancelledTemplate,
  documentApprovedTemplate,
  documentRejectedTemplate,
} from "./email-templates";

// ============================================
// AUTH ROUTER
// ============================================

const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  
  signup: publicProcedure
    .input(z.object({
      name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
      email: z.string().email("Email inválido"),
      password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if email already exists
      const existingUser = await db.getUserByEmail(input.email);
      if (existingUser) {
        throw new TRPCError({ 
          code: "CONFLICT", 
          message: "Este email já está cadastrado" 
        });
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 12);
      
      // Create user with unique openId
      const openId = `email_${nanoid(16)}`;
      const userId = await db.createUserWithPassword({
        openId,
        name: input.name,
        email: input.email,
        passwordHash,
        loginMethod: "email",
        role: "user",
      });
      
      // Create JWT token using SDK format (openId, appId, name)
      const secret = new TextEncoder().encode(ENV.cookieSecret);
      const token = await new SignJWT({ 
        openId,
        appId: ENV.appId,
        name: input.name,
      })
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setExpirationTime(Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000))
        .sign(secret);
      
      // Set cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      
      return { 
        success: true, 
        user: { id: userId, name: input.name, email: input.email, role: "user" }
      };
    }),
  
  login: publicProcedure
    .input(z.object({
      email: z.string().email("Email inválido"),
      password: z.string().min(1, "Senha é obrigatória"),
    }))
    .mutation(async ({ ctx, input }) => {
      // Find user by email
      const user = await db.getUserByEmail(input.email);
      if (!user) {
        logAuthFailure({
          endpoint: "auth.login",
          ipAddress: getClientIp(ctx.req),
          userAgent: ctx.req.headers["user-agent"],
          reason: "user not found",
          attemptedIdentifier: input.email,
        });
        throw new TRPCError({ 
          code: "UNAUTHORIZED", 
          message: "Email ou senha incorretos" 
        });
      }
      
      // Check if user has password (might be OAuth user)
      if (!user.passwordHash) {
        logAuthFailure({
          endpoint: "auth.login",
          ipAddress: getClientIp(ctx.req),
          userAgent: ctx.req.headers["user-agent"],
          reason: "oauth user attempted password login",
          attemptedIdentifier: input.email,
        });
        throw new TRPCError({ 
          code: "UNAUTHORIZED", 
          message: "Esta conta usa login social. Por favor, use o botão de login social." 
        });
      }
      
      // Verify password
      const isValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!isValid) {
        logAuthFailure({
          endpoint: "auth.login",
          ipAddress: getClientIp(ctx.req),
          userAgent: ctx.req.headers["user-agent"],
          reason: "wrong password",
          attemptedIdentifier: input.email,
        });
        throw new TRPCError({ 
          code: "UNAUTHORIZED", 
          message: "Email ou senha incorretos" 
        });
      }
      
      // Update last signed in
      await db.updateUserLastSignedIn(user.id);
      
      // Create JWT token using SDK format (openId, appId, name)
      const secret = new TextEncoder().encode(ENV.cookieSecret);
      const token = await new SignJWT({ 
        openId: user.openId,
        appId: ENV.appId,
        name: user.name || "",
      })
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setExpirationTime(Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000))
        .sign(secret);
      
      // Set cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      
      return { 
        success: true, 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          role: user.role 
        }
      };
    }),
  
  signupHost: publicProcedure
    .input(z.object({
      name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
      email: z.string().email("Email inválido"),
      password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if email already exists
      const existingUser = await db.getUserByEmail(input.email);
      if (existingUser) {
        throw new TRPCError({ 
          code: "CONFLICT", 
          message: "Este email já está cadastrado" 
        });
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 12);
      
      // Create user with unique openId and host role
      const openId = `email_${nanoid(16)}`;
      const userId = await db.createUserWithPassword({
        openId,
        name: input.name,
        email: input.email,
        passwordHash,
        loginMethod: "email",
        role: "host", // Host role for property owners
      });
      
      // Create JWT token using SDK format (openId, appId, name)
      const secret = new TextEncoder().encode(ENV.cookieSecret);
      const token = await new SignJWT({ 
        openId,
        appId: ENV.appId,
        name: input.name,
      })
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setExpirationTime(Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000))
        .sign(secret);
      
      // Set cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      
      return { 
        success: true, 
        user: { id: userId, name: input.name, email: input.email, role: "host" }
      };
    }),
  
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});

// ============================================
// USER ROUTER
// ============================================

const userRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return await db.getUserById(ctx.user.id);
  }),

  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      cpf: z.string().optional(),
      dateOfBirth: z.string().optional(),
      addressStreet: z.string().optional(),
      addressNumber: z.string().optional(),
      addressComplement: z.string().optional(),
      addressNeighborhood: z.string().optional(),
      addressCity: z.string().optional(),
      addressState: z.string().optional(),
      addressZipCode: z.string().optional(),
      cnhCategory: z.enum(["A", "AB", "B", "C", "D", "E", "ACC"]).optional(),
      cnhNumber: z.string().optional(),
      cnhExpiresAt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.updateUserProfile(ctx.user.id, {
        ...input,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
        cnhExpiresAt: input.cnhExpiresAt ? new Date(input.cnhExpiresAt) : undefined,
      });
      return { success: true };
    }),

  getDocuments: protectedProcedure.query(async ({ ctx }) => {
    return await db.getUserDocuments(ctx.user.id);
  }),

  uploadDocument: protectedProcedure
    .input(z.object({
      documentType: z.enum(["cnh_front", "cnh_back", "rg_front", "rg_back", "cpf", "selfie", "proof_of_address", "facial_recognition"]),
      fileUrl: z.string(),
      fileKey: z.string(),
      mimeType: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const docId = await db.createUserDocument({
        userId: ctx.user.id,
        documentType: input.documentType,
        fileUrl: input.fileUrl,
        fileKey: input.fileKey,
        mimeType: input.mimeType,
        status: "pending",
      });
      
      // Update user KYC status
      await db.updateUserKycStatus(ctx.user.id, "submitted");
      
      return { id: docId, success: true };
    }),
  
  uploadDocumentBase64: protectedProcedure
    .input(z.object({
      documentType: z.enum(["cnh_front", "cnh_back", "rg_front", "rg_back", "cpf", "selfie", "proof_of_address", "facial_recognition"]),
      base64Image: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // ETAPA 8: Validate base64 image (magic bytes + size + allowed MIME)
      const { mime: verifiedMime, buffer: imageBuffer } = validateBase64(
        input.base64Image,
        "user_document"
      );
      const ext = safeExtension(verifiedMime);
      // Upload to S3
      const uploadResult = await storagePut(
        `user-documents/${ctx.user.id}/${input.documentType}-${Date.now()}.${ext}`,
        imageBuffer,
        verifiedMime
      );
      
      // Perform OCR if it's a CNH document
      let extractedData: any = {};
      if (input.documentType === "cnh_front") {
        try {
          const cnhData = await extractCNHData(input.base64Image);
          extractedData = {
            extractedName: cnhData.name,
            extractedCPF: cnhData.cpf,
            extractedBirthDate: cnhData.birthDate,
            extractedExpirationDate: cnhData.expirationDate,
            extractedCNHNumber: cnhData.cnhNumber,
          };
          
          // Validate name match
          if (cnhData.name && ctx.user.name) {
            const nameMatches = validateNameMatch(cnhData.name, ctx.user.name);
            if (!nameMatches) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `O nome na CNH (${cnhData.name}) não coincide com o nome cadastrado (${ctx.user.name})`,
              });
            }
          }
        } catch (error: any) {
          // If it's a name mismatch error, rethrow it
          if (error.code === "BAD_REQUEST") {
            throw error;
          }
          // Otherwise, log OCR error but continue
          console.error("OCR extraction failed:", error);
        }
      }
      
      const docId = await db.createUserDocument({
        userId: ctx.user.id,
        documentType: input.documentType,
        fileUrl: uploadResult.url,
        fileKey: `user-documents/${ctx.user.id}/${input.documentType}-${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
        status: "pending",
      });
      
      // Update user KYC status
      await db.updateUserKycStatus(ctx.user.id, "submitted");
      
      return { id: docId, url: uploadResult.url, success: true };
    }),

  getNotifications: protectedProcedure.query(async ({ ctx }) => {
    return await db.getNotificationsByUserId(ctx.user.id);
  }),

  getUnreadNotificationCount: protectedProcedure.query(async ({ ctx }) => {
    return await db.getUnreadNotificationCount(ctx.user.id);
  }),

  markNotificationRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // ETAPA 7: ownership check — only mark own notifications as read (prevents IDOR)
      await db.markNotificationAsReadForUser(input.id, ctx.user.id);
      return { success: true };
    }),

  // ── Modo Ativo (contexto operacional) ─────────────────────────────────────
  // Persiste o modo atual do usuário no banco para manter consistência entre sessões
  updateActiveMode: protectedProcedure
    .input(z.object({
      // Apenas renter e host são modos válidos para alteração pelo usuário.
      // Admin não pode ser definido via esta procedure — é um atributo de role, não de modo.
      mode: z.enum(["renter", "host"]),
    }))
    .mutation(async ({ ctx, input }) => {
      // SECURITY: Bloquear mode=host para role=user (sem ativação prévia)
      if (input.mode === "host") {
        const allowedRoles = ["host", "both", "admin"];
        if (!allowedRoles.includes(ctx.user.role)) {
          // Log de tentativa de bypass
          console.warn(
            `[SECURITY] updateActiveMode bypass attempt: userId=${ctx.user.id} role=${ctx.user.role} tried mode=host`
          );
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Você precisa ativar o modo anfitrião primeiro. (10003)",
          });
        }
      }
      // Usar helper dedicado com try/catch e retorno de sucesso
      const updated = await db.updateUserActiveMode(ctx.user.id, input.mode);
      if (!updated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível atualizar o modo. Tente novamente.",
        });
      }
      return { success: true, mode: input.mode };
    }),

  // Ativa o modo anfitrião para um usuário com role 'user' (converte para 'both')
  activateHostMode: protectedProcedure
    .mutation(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });

      // Usar helper dedicado que trata a conversão de role e retorna sucesso
      const result = await db.activateUserHostMode(ctx.user.id, user.role);
      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível ativar o modo anfitrião. Tente novamente.",
        });
      }

      return {
        success: true,
        newRole: result.newRole as "user" | "host" | "admin" | "both",
        mode: "host" as const,
      };
    }),
});

// ============================================
// VEHICLE ROUTER
// ============================================

const vehicleRouter = router({
  list: publicProcedure
    .input(z.object({
      city: z.string().optional(),
      category: z.string().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      return await db.getVehicles(input);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const vehicle = await db.getVehicleById(input.id);
      if (!vehicle) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Veículo não encontrado" });
      }
      
      const images = await db.getVehicleImages(input.id);
      const reviews = await db.getReviewsByVehicleId(input.id);
      
      // Remove sensitive document URLs from public response
      const { crlvUrl, crlvFileKey, insuranceUrl, insuranceFileKey, ...publicVehicle } = vehicle as any;
      
      return { ...publicVehicle, images, reviews };
    }),
  
  getOwnerDocuments: protectedProcedure
    .input(z.object({ vehicleId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Get vehicle to find owner
      const vehicle = await db.getVehicleById(input.vehicleId);
      if (!vehicle) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Veículo não encontrado" });
      }
      
      // Check permission: only admin or vehicle owner can view
      if (ctx.user.role !== "admin" && ctx.user.id !== vehicle.hostId) {
        logForbidden({
          userId: ctx.user.id,
          endpoint: "vehicle.getOwnerDocuments",
          ipAddress: getClientIp(ctx.req),
          userAgent: ctx.req.headers["user-agent"],
          resourceType: "vehicle",
          resourceId: input.vehicleId,
          reason: "not vehicle owner",
        });
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "Você não tem permissão para visualizar esses documentos" 
        });
      }
      
      // Get owner's documents
      const documents = await db.getUserDocuments(vehicle.hostId);
      return documents;
    }),
  
  getDocuments: protectedProcedure
    .input(z.object({ vehicleId: z.number() }))
    .query(async ({ ctx, input }) => {
      const vehicle = await db.getVehicleById(input.vehicleId);
      if (!vehicle) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Veículo não encontrado" });
      }
      
      // Only owner and admin can view documents
      if (ctx.user.role !== "admin" && vehicle.hostId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Você não tem permissão para visualizar estes documentos" });
      }
      
      return {
        crlvUrl: (vehicle as any).crlvUrl,
        crlvValidated: (vehicle as any).crlvValidated,
        crlvOwnerName: (vehicle as any).crlvOwnerName,
        insuranceUrl: (vehicle as any).insuranceUrl,
      };
    }),

  getMyVehicles: protectedProcedure.query(async ({ ctx }) => {
    return await db.getVehiclesByHostId(ctx.user.id);
  }),

  create: hostProcedure
    .input(z.object({
      brand: z.string(),
      model: z.string(),
      year: z.number(),
      color: z.string().optional(),
      licensePlate: z.string().refine(isValidBrazilianPlate, INVALID_PLATE_MESSAGE),
      category: z.enum(["popular", "sedan", "suv", "luxury", "electric", "sport", "pickup", "hatch"]),
      transmission: z.enum(["manual", "automatic"]).optional(),
      fuelType: z.enum(["gasoline", "ethanol", "flex", "diesel", "electric", "hybrid"]).optional(),
      seats: z.number().optional(),
      doors: z.number().optional(),
      dailyPrice: z.string(),
      dailyKmLimit: z.number().optional(),
      extraKmPrice: z.string().optional(),
      pickupAddress: z.string(),
      pickupCity: z.string(),
      pickupState: z.string(),
      features: z.array(z.string()).optional(),
      mainImageUrl: z.string().optional(),
      guaranteeAdjusted: z.number().optional().default(100), // 100 = default (5x), 0-200 range
      hostCpfCnpj: z.string().optional(), // CPF ou CNPJ do anfitrião para o contrato
      // Documents
      crlvBase64: z.string(), // CRLV is mandatory
      insuranceBase64: z.string().optional(), // Insurance is optional
    }))
    .mutation(async ({ ctx, input }) => {
      // Validate CRLV owner name matches user name
      // TODO: Implement OCR validation
      const ownerName = ctx.user.name || "";
      
      // ETAPA 8: Validate CRLV document (magic bytes + size + allowed MIME)
      // Prevents spoofing: client cannot lie about MIME type in the data: prefix
      const { mime: crlvMimeType, buffer: crlvBuffer } = validateBase64(
        input.crlvBase64,
        "vehicle_document"
      );
      const crlvKey = `vehicles/crlv/${ctx.user.id}-${Date.now()}.${safeExtension(crlvMimeType)}`;
      const crlvResult = await storagePut(crlvKey, crlvBuffer, crlvMimeType);
      
      // Upload insurance if provided
      let insuranceUrl = null;
      let insuranceFileKey = null;
      if (input.insuranceBase64) {
        // ETAPA 8: Validate insurance document (magic bytes + size + allowed MIME)
        const { mime: insuranceMimeType, buffer: insuranceBuffer } = validateBase64(
          input.insuranceBase64,
          "vehicle_document"
        );
        const insuranceKey = `vehicles/insurance/${ctx.user.id}-${Date.now()}.${safeExtension(insuranceMimeType)}`;
        const insuranceResult = await storagePut(insuranceKey, insuranceBuffer, insuranceMimeType);
        insuranceUrl = insuranceResult.url;
        insuranceFileKey = insuranceKey;
      }

      // Geocode the pickup address to get lat/lng
      let pickupLatitude: string | null = null;
      let pickupLongitude: string | null = null;
      try {
        const fullAddress = `${input.pickupAddress}, ${input.pickupCity}, ${input.pickupState}, Brasil`;
        const geocodeResult = await makeRequest<GeocodingResult>("/maps/api/geocode/json", {
          address: fullAddress,
        });
        if (geocodeResult.status === "OK" && geocodeResult.results[0]) {
          const loc = geocodeResult.results[0].geometry.location;
          pickupLatitude = String(loc.lat);
          pickupLongitude = String(loc.lng);
        }
      } catch (err) {
        // Geocoding failure is non-fatal — vehicle is still created without coordinates
        console.warn("[vehicle.create] Geocoding failed:", err);
      }
      
      const vehicleId = await db.createVehicle({
        hostId: ctx.user.id,
        ...input,
        licensePlate: normalizePlate(input.licensePlate), // ETAPA 12: store canonical form
        crlvUrl: crlvResult.url,
        crlvFileKey: crlvKey,
        crlvValidated: false, // Requires admin review before approval
        crlvOwnerName: ownerName,
        insuranceUrl,
        insuranceFileKey,
        pickupLatitude,
        pickupLongitude,
        status: "pending_approval", // Must be reviewed by admin before appearing in search
      } as any);
      
      // Update user role to host if not already
      if (ctx.user.role === "user") {
        await db.updateUserProfile(ctx.user.id, { role: "host" });
      }
      
      return { id: vehicleId, success: true };
    }),

  update: hostProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        brand: z.string().optional(),
        model: z.string().optional(),
        year: z.number().optional(),
        color: z.string().optional(),
        licensePlate: z.string().refine(v => v === undefined || isValidBrazilianPlate(v), INVALID_PLATE_MESSAGE).optional(),
        category: z.enum(["popular", "sedan", "suv", "luxury", "electric", "sport", "pickup", "hatch"]).optional(),
        transmission: z.enum(["manual", "automatic"]).optional(),
        fuelType: z.enum(["gasoline", "ethanol", "flex", "diesel", "electric", "hybrid"]).optional(),
        seats: z.number().optional(),
        doors: z.number().optional(),
        dailyPrice: z.string().optional(),
        dailyKmLimit: z.number().optional(),
        extraKmPrice: z.string().optional(),
        pickupCity: z.string().optional(),
        pickupState: z.string().optional(),
        pickupAddress: z.string().optional(),
        description: z.string().optional(),
        features: z.array(z.string()).optional(),
        instantBooking: z.boolean().optional(),
        mainImageUrl: z.string().optional(),
        status: z.enum(["draft", "pending_approval", "active", "inactive"]).optional(),
        guaranteeAdjusted: z.number().min(0).max(200).optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const vehicle = await db.getVehicleById(input.id);
      if (!vehicle || vehicle.hostId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      
      // [NEW] Re-geocode if address fields changed
      const updateData: Record<string, unknown> = { ...input.data };
      const addressChanged = input.data.pickupAddress || input.data.pickupCity || input.data.pickupState;
      if (addressChanged) {
        const newAddress = input.data.pickupAddress || vehicle.pickupAddress;
        const newCity = input.data.pickupCity || vehicle.pickupCity;
        const newState = input.data.pickupState || vehicle.pickupState;
        const fullAddress = `${newAddress}, ${newCity}, ${newState}, Brasil`;
        try {
          const geocodeResult = await makeRequest<GeocodingResult>("/maps/api/geocode/json", {
            address: fullAddress,
            language: "pt-BR",
          });
          if (geocodeResult.status === "OK" && geocodeResult.results[0]) {
            const loc = geocodeResult.results[0].geometry.location;
            updateData.pickupLatitude = loc.lat.toString();
            updateData.pickupLongitude = loc.lng.toString();
            console.log(`[Vehicle Update] Re-geocoded ${fullAddress} → lat=${loc.lat}, lng=${loc.lng}`);
          }
        } catch (geoErr) {
          console.error("[Vehicle Update] Re-geocoding failed:", geoErr);
        }
      }
      
      await db.updateVehicle(input.id, updateData);
      return { success: true };
    }),

  getReviews: publicProcedure
    .input(z.object({ vehicleId: z.number() }))
    .query(async ({ input }) => {
      return await db.getReviewsByVehicleId(input.vehicleId);
    }),

  // Upload file to S3 and return URL
  uploadFile: hostProcedure
    .input(z.object({
      fileName: z.string(),
      fileData: z.string(), // base64 encoded
      contentType: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // ETAPA 8: Validate base64 file (magic bytes + size + allowed MIME)
      // contentType from client is cross-checked against real magic bytes
      const { mime: verifiedMime, buffer } = validateBase64(
        input.fileData,
        "generic_file",
        input.contentType
      );
      
      // Generate unique filename using safe extension from verified MIME
      const ext = safeExtension(verifiedMime);
      const uniqueFileName = `${Date.now()}-${nanoid(8)}.${ext}`;
      const fileKey = `vehicles/${ctx.user.id}/${uniqueFileName}`;
      
      // Upload to S3 with verified MIME (not client-supplied)
      const { url } = await storagePut(fileKey, buffer, verifiedMime);
      
      return { url, key: fileKey };
    }),

  uploadImage: hostProcedure
    .input(z.object({
      vehicleId: z.number(),
      base64Image: z.string(), // Base64 encoded image
      imageType: z.enum(["front", "back", "left", "right", "interior_front", "interior_back", "dashboard", "trunk", "other"]).optional(),
      sortOrder: z.number().optional(),
      isMain: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const vehicle = await db.getVehicleById(input.vehicleId);
      if (!vehicle || vehicle.hostId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      
      // ETAPA 8: Validate base64 image (magic bytes + size + allowed MIME)
      // Ensures only real images are sent to Cloudinary (prevents PDF/EXE uploads)
      validateBase64(input.base64Image, "vehicle_image");
      
      // Upload to Cloudinary
      const { uploadToCloudinary } = await import('./cloudinaryUpload');
      const cloudinaryResult = await uploadToCloudinary(
        input.base64Image,
        `vehicles/${input.vehicleId}`
      );
      
      const imageId = await db.createVehicleImage({
        vehicleId: input.vehicleId,
        imageUrl: cloudinaryResult.url,
        fileKey: cloudinaryResult.publicId,
        imageType: input.imageType,
        sortOrder: input.sortOrder,
        isMain: input.isMain,
      });
      
      // Update main image if this is the first or marked as main
      if (input.isMain || input.sortOrder === 0) {
        await db.updateVehicleMainImage(input.vehicleId, cloudinaryResult.url);
      }
      
      return { id: imageId, url: cloudinaryResult.url, success: true };
    }),

  deleteImage: hostProcedure
    .input(z.object({ id: z.number(), vehicleId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const vehicle = await db.getVehicleById(input.vehicleId);
      if (!vehicle || vehicle.hostId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      
      await db.deleteVehicleImage(input.id);
      return { success: true };
    }),

  search: publicProcedure
    .input(z.object({
      city: z.string().optional(),
      category: z.string().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      transmission: z.string().optional(),
      fuelType: z.string().optional(),
      minSeats: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      sortBy: z.enum(["price_asc", "price_desc", "rating", "recommended"]).optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
      // Vehicle type isolation: "car" | "motorcycle" — always filter by type
      vehicleType: z.enum(["car", "motorcycle"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      return await db.searchVehicles(input);
    }),

  // Get vehicles grouped by city for homepage
  getGroupedByCity: publicProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return await db.getVehiclesGroupedByCity(input?.limit);
    }),

  // Get all cities that have vehicles
  getCities: publicProcedure.query(async () => {
    return await db.getCitiesWithVehicles();
  }),

  // Get all states that have active vehicles
  getStates: publicProcedure
    .input(z.object({ vehicleType: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return await db.getStatesWithVehicles(input?.vehicleType);
    }),

  // Get vehicles by state (sigla, ex: "RO" for Rondonia)
  getByState: publicProcedure
    .input(z.object({
      state: z.string().min(2).max(2),
      category: z.string().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      transmission: z.string().optional(),
      sortBy: z.enum(["price_asc", "price_desc", "rating", "recommended"]).optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const stateCode = input.state.toUpperCase();
      return await db.getVehiclesByState(stateCode, {
        category: input.category,
        minPrice: input.minPrice,
        maxPrice: input.maxPrice,
        transmission: input.transmission,
        sortBy: input.sortBy,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  // Get vehicles grouped by city within a state
  getGroupedByCityInState: publicProcedure
    .input(z.object({
      state: z.string().min(2).max(2),
      limit: z.number().optional(),
      maxCities: z.number().optional(),
      vehicleType: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const stateCode = input.state.toUpperCase();
      return await db.getVehiclesGroupedByCityInState(stateCode, input.limit, input.maxCities ?? 2, input.vehicleType);
    }),

  // Get vehicle availability (bookings and blocked dates)
  getAvailability: publicProcedure
    .input(z.object({ vehicleId: z.number() }))
    .query(async ({ input }) => {
      const bookings = await db.getVehicleBookings(input.vehicleId);
      const blockedDates = await db.getVehicleBlockedDates(input.vehicleId);
      
      // Only confirmed/active bookings block dates.
      // pending_payment and payment_failed do NOT block the calendar — they may never be paid.
      const BLOCKING_STATUSES = ["confirmed", "in_progress", "completed", "pending_host_approval"];
      const bookedPeriods = bookings
        .filter(b => BLOCKING_STATUSES.includes(b.status))
        .map(b => ({
          id: b.id,
          startDate: b.startDate,
          endDate: b.endDate,
          status: b.status,
        }));
      
      // Transform blocked dates to periods (group consecutive dates)
      // Normalize dates to midnight UTC for consistent comparison
      // Use getUTC* to avoid server timezone drift (server may run in UTC-4 while clients are in UTC-3)
      const normDate = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      const blockedPeriods: { id: number; startDate: Date; endDate: Date }[] = [];
      let currentPeriod: { id: number; startDate: Date; endDate: Date } | null = null;
      
      for (const blocked of blockedDates) {
        const normalizedDate = normDate(blocked.date);
        if (!currentPeriod) {
          currentPeriod = { id: blocked.id, startDate: normalizedDate, endDate: normalizedDate };
        } else {
          const nextDay = new Date(currentPeriod.endDate);
          nextDay.setUTCDate(nextDay.getUTCDate() + 1);
          
          if (normalizedDate.getTime() === nextDay.getTime()) {
            currentPeriod.endDate = normalizedDate;
          } else {
            blockedPeriods.push(currentPeriod);
            currentPeriod = { id: blocked.id, startDate: normalizedDate, endDate: normalizedDate };
          }
        }
      }
      if (currentPeriod) blockedPeriods.push(currentPeriod);
      
      return { bookedPeriods, blockedPeriods };
    }),

  // Block dates for a vehicle (host only)
  blockDates: hostProcedure
    .input(z.object({
      vehicleId: z.number(),
      startDate: z.string(),
      endDate: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const vehicle = await db.getVehicleById(input.vehicleId);
      if (!vehicle || vehicle.hostId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      
      const result = await db.blockVehicleDates(
        input.vehicleId,
        new Date(input.startDate),
        new Date(input.endDate),
        input.reason
      );
      return result;
    }),

  // Unblock dates for a vehicle (host only)
  unblockDates: hostProcedure
    .input(z.object({
      vehicleId: z.number(),
      startDate: z.string(),
      endDate: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const vehicle = await db.getVehicleById(input.vehicleId);
      if (!vehicle || vehicle.hostId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      
      const result = await db.unblockVehicleDates(
        input.vehicleId,
        new Date(input.startDate),
        new Date(input.endDate)
      );
      
      return result;
    }),
  
  // Get all documents for host's vehicles
  getHostDocuments: protectedProcedure.query(async ({ ctx }) => {
    return await db.getHostVehicleDocuments(ctx.user.id);
  }),
  
  // Delete vehicle (owner or admin only)
  deleteVehicle: hostProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const vehicle = await db.getVehicleById(input.id);
      if (!vehicle) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Veículo não encontrado" });
      }
      
      // Only owner or admin can delete
      if (vehicle.hostId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      
      await db.deleteVehicle(input.id);
      return { success: true };
    }),
});

// ============================================
// BOOKING ROUTER
// ============================================

const bookingRouter = router({
  getMyBookings: protectedProcedure.query(async ({ ctx }) => {
    return await db.getBookingsByRenterId(ctx.user.id);
  }),

  getHostBookings: protectedProcedure.query(async ({ ctx }) => {
    return await db.getBookingsByHostId(ctx.user.id);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.id);
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reserva não encontrada" });
      }
      
      // Check access
      if (booking.renterId !== ctx.user.id && booking.hostId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      
      const vehicle = await db.getVehicleById(booking.vehicleId);
      const payments = await db.getPaymentsByBookingId(booking.id);
      const fines = await db.getFinesByBookingId(booking.id);
      
      return { ...booking, vehicle, payments, fines };
    }),

  /**
   * Polling endpoint: retorna o status atual da reserva e do pagamento.
   * Consulta a API do Mercado Pago DIRETAMENTE para obter o status real,
   * sem depender do webhook. Atualiza o banco se o status mudou.
   */
  getPaymentStatus: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .query(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.bookingId);
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reserva não encontrada" });
      }
      if (booking.renterId !== ctx.user.id && booking.hostId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      const payments = await db.getPaymentsByBookingId(booking.id);
      const latestPayment = payments.sort((a, b) => b.id - a.id)[0] ?? null;

      // Se a reserva já está confirmada ou falhou, retornar direto sem consultar MP
      if (booking.status === "confirmed" || booking.status === "payment_failed") {
        return {
          bookingId: booking.id,
          bookingStatus: booking.status,
          paymentStatus: latestPayment?.status ?? null,
          paymentId: latestPayment?.id ?? null,
          mpPaymentId: latestPayment?.mpPaymentId ?? null,
        };
      }

      // Se há um mpPaymentId, consultar a API do MP diretamente (não depende do webhook)
      if (latestPayment?.mpPaymentId && latestPayment.status !== "completed" && latestPayment.status !== "failed") {
        try {
          const mpStatus = await getMPPaymentStatus(latestPayment.mpPaymentId);

          let ourStatus: "pending" | "processing" | "completed" | "failed" = latestPayment.status as any;
          if (mpStatus.status === "approved") {
            ourStatus = "completed";
          } else if (mpStatus.status === "rejected" || mpStatus.status === "cancelled") {
            ourStatus = "failed";
          } else if (mpStatus.status === "in_process" || mpStatus.status === "pending") {
            ourStatus = "processing";
          }

          // Se o status mudou, atualizar o banco agora (sem esperar o webhook)
          if (ourStatus !== latestPayment.status) {
            await db.updatePaymentStatus(latestPayment.id, ourStatus, { mpPaymentId: latestPayment.mpPaymentId });

            if (ourStatus === "completed") {
              await db.updateBookingStatus(booking.id, "confirmed");
              
              // [NEW] Generate and send contract PDF after payment approval
              try {
                const contractResult = await generateAndSendContract(booking.id);
                if (contractResult.success) {
                  console.log(`[Payment] Contract PDF generated and sent for booking #${booking.id}`);
                } else {
                  console.error(`[Payment] Contract generation failed: ${contractResult.error}`);
                }
              } catch (contractErr) {
                console.error(`[Payment] Error generating contract:`, contractErr);
              }
              
              // Notificar locatário e host
              try {
                const vehicle = await db.getVehicleById(booking.vehicleId);
                if (vehicle) {
                  await db.createNotification({
                    userId: booking.renterId,
                    title: "Pagamento Confirmado! ✅",
                    message: `Seu pagamento foi confirmado. Reserva ${vehicle.brand} ${vehicle.model} confirmada!`,
                    notificationType: "payment_received",
                    relatedId: booking.id,
                    relatedType: "booking",
                  });
                  await db.createNotification({
                    userId: vehicle.hostId,
                    title: "Pagamento Recebido! 💰",
                    message: `Você recebeu pagamento pela reserva de ${vehicle.brand} ${vehicle.model}.`,
                    notificationType: "payment_received",
                    relatedId: booking.id,
                    relatedType: "booking",
                  });
                }
              } catch (_) {}
              return {
                bookingId: booking.id,
                bookingStatus: "confirmed",
                paymentStatus: "completed",
                paymentId: latestPayment.id,
                mpPaymentId: latestPayment.mpPaymentId,
              };
            } else if (ourStatus === "failed") {
              await db.updateBookingStatus(booking.id, "payment_failed");
              return {
                bookingId: booking.id,
                bookingStatus: "payment_failed",
                paymentStatus: "failed",
                paymentId: latestPayment.id,
                mpPaymentId: latestPayment.mpPaymentId,
              };
            }
          }
        } catch (mpErr) {
          // Se a consulta MP falhar, retornar o status do banco sem erro
          console.error("[getPaymentStatus] Falha ao consultar API MP:", mpErr);
        }
      }

      return {
        bookingId: booking.id,
        bookingStatus: booking.status,
        paymentStatus: latestPayment?.status ?? null,
        paymentId: latestPayment?.id ?? null,
        mpPaymentId: latestPayment?.mpPaymentId ?? null,
      };
    }),

    create: protectedProcedure
    .input(z.object({
      vehicleId: z.number(),
      startDate: z.string(),
      endDate: z.string(),
      pickupLocation: z.string(),
      protectionLevel: z.enum(["basic", "standard", "premium"]),
      contractAccepted: z.boolean(),
      contractAcceptedIp: z.string().optional(),
      // Renter personal data collected at booking time
      renterFullName: z.string().optional(),
      renterEmail: z.string().optional(),
      renterPhone: z.string().optional(),
      renterCpf: z.string().optional(),
      // Renter address
      renterAddressZipCode: z.string().optional(),
      renterAddressStreet: z.string().optional(),
      renterAddressNumber: z.string().optional(),
      renterAddressComplement: z.string().optional(),
      renterAddressNeighborhood: z.string().optional(),
      renterAddressCity: z.string().optional(),
      renterAddressState: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const vehicle = await db.getVehicleById(input.vehicleId);
      if (!vehicle) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Veículo não encontrado" });
      }

      // [FIX C8] Block host from booking their own vehicle
      if (vehicle.hostId === ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não pode reservar seu próprio veículo",
        });
      }

      // [FIX C9] Validate vehicle status — only active vehicles can be booked
      if (vehicle.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este veículo não está disponível para reservas no momento",
        });
      }
      
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (days <= 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Datas inválidas" });
      }

      // [FIX C6] Prevent double-booking: check for overlapping confirmed/pending bookings
      const existingBookings = await db.getVehicleBookings(input.vehicleId);
      // Only confirmed/active bookings constitute a real conflict.
      // pending_payment and payment_failed reservations may never be paid, so they must NOT block new bookings.
      // This allows other users to book the same dates if a previous attempt was not completed.
      const CONFLICT_STATUSES = ["confirmed", "in_progress", "pending_host_approval"];
      const hasOverlap = existingBookings.some((b) => {
        if (!CONFLICT_STATUSES.includes(b.status)) return false;
        const bStart = new Date(b.startDate);
        const bEnd = new Date(b.endDate);
        // Overlap if: newStart < existingEnd AND newEnd > existingStart
        return startDate < bEnd && endDate > bStart;
      });
      if (hasOverlap) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este veículo já está reservado para o período selecionado. Por favor, escolha outras datas.",
        });
      }
      
      const dailyRate = parseFloat(vehicle.dailyPrice);
      const subtotal = days * dailyRate;
      const serviceFee = subtotal * 0.12;
      
      let insuranceFee = 0;
      if (input.protectionLevel === "standard") {
        insuranceFee = days * 35;
      } else if (input.protectionLevel === "premium") {
        insuranceFee = days * 65;
      }
      
      const total = subtotal + serviceFee + insuranceFee;

      // Garantia Reembolsável — cálculo escalonado por número de dias
      // 1 dia = 2×, 2-3 dias = 3×, 4-6 dias = 4×, 7+ dias = 5× a diária
      const GUARANTEE_MIN = 500;
      const GUARANTEE_MAX = 5000;
      let guaranteeMultiplier: number;
      if (days === 1) {
        guaranteeMultiplier = 2;
      } else if (days <= 3) {
        guaranteeMultiplier = 3;
      } else if (days <= 6) {
        guaranteeMultiplier = 4;
      } else {
        guaranteeMultiplier = 5;
      }
      // Aplicar multiplicador e limites globais
      const guaranteeCalculated = guaranteeMultiplier * dailyRate;
      // Se o host definiu um valor ajustado no veículo, usar; senão usar o calculado
      const hostGuarantee = vehicle.guaranteeAdjusted ? parseFloat(vehicle.guaranteeAdjusted.toString()) : null;
      const guaranteeRaw = hostGuarantee ?? guaranteeCalculated;
      const guaranteeAdjusted = Math.min(GUARANTEE_MAX, Math.max(GUARANTEE_MIN, guaranteeRaw));
      const securityDeposit = guaranteeAdjusted;
      
      // contractAccepted may be false at booking creation time (OTP flow).
      // The contract is accepted via OTP verification in a subsequent step.
      // We still record the value passed, but do NOT block creation when it is false.
      
      // Capture client IP for audit trail
      const clientIp = getClientIp(ctx.req);
      
      const bookingData = {
        vehicleId: input.vehicleId,
        renterId: ctx.user.id,
        hostId: vehicle.hostId,
        startDate: startDate,
        endDate: endDate,
        pickupLocation: input.pickupLocation,
        dailyKmLimit: parseInt(vehicle.dailyKmLimit?.toString() || "100"),
        extraKmPrice: vehicle.extraKmPrice?.toString() || "0.50",
        dailyRate: dailyRate.toString(),
        totalDays: days,
        subtotal: subtotal.toString(),
        serviceFee: serviceFee.toString(),
        insuranceFee: insuranceFee.toString(),
        securityDeposit: securityDeposit.toString(),
        // Garantia Reembolsável — campos detalhados
        guaranteeMultiplier: guaranteeMultiplier.toFixed(2),
        guaranteeCalculated: guaranteeCalculated.toFixed(2),
        guaranteeAdjusted: guaranteeAdjusted.toFixed(2),
        guaranteeRetainedAt: new Date(),
        guaranteeReleaseStatus: "held",
        // totalAmount inclui Garantia Reembolsável — cobrado integralmente no pagamento
        totalAmount: (total + securityDeposit).toString(),
        status: "pending_payment", // Pronto para pagamento imediato pelo locatário
        contractAccepted: input.contractAccepted,
        contractAcceptedAt: new Date(),
        contractAcceptedIp: clientIp, // Captured IP for audit trail
        contractVersion: "1.0",
        renterFullName: input.renterFullName || null,
        renterEmail: input.renterEmail || null,
        renterPhone: input.renterPhone || null,
        renterCpf: input.renterCpf || null,
        renterAddressZipCode: input.renterAddressZipCode || null,
        renterAddressStreet: input.renterAddressStreet || null,
        renterAddressNumber: input.renterAddressNumber || null,
        renterAddressComplement: input.renterAddressComplement || null,
        renterAddressNeighborhood: input.renterAddressNeighborhood || null,
        renterAddressCity: input.renterAddressCity || null,
        renterAddressState: input.renterAddressState || null,
      } as any;
      
      // [FIX C5] Removed console.log with sensitive booking data (CPF, email, phone)
      
      const bookingId = await db.createBooking(bookingData);
      
      // Create notification for host
      await db.createNotification({
        userId: vehicle.hostId,
        title: "Nova Reserva Criada",
        message: `${ctx.user.name} criou uma reserva para ${vehicle.brand} ${vehicle.model} — aguardando pagamento`,
        notificationType: "booking_request",
        relatedId: bookingId,
        relatedType: "booking",
      });

      // Create conversation and send system message for new booking request
      try {
        const conv = await db.getOrCreateConversationForBooking(ctx.user.id, vehicle.hostId, bookingId);
        await db.sendSystemMessage(
          conv.id,
          `📋 Reserva #RDY-${String(bookingId).padStart(6, '0')} criada — ${vehicle.brand} ${vehicle.model} por ${days} dia(s). Aguardando pagamento do locatário.`
        );
      } catch (sysErr) {
        console.error("[Booking] Failed to create system message:", sysErr);
      }
      
      // Send confirmation emails
      const host = await db.getUserById(vehicle.hostId);
      if (ctx.user.email && host?.email) {
        const emailData = {
          renterName: ctx.user.name || "Locatário",
          renterEmail: ctx.user.email,
          hostName: host.name || "Proprietário",
          hostEmail: host.email,
          vehicleBrand: vehicle.brand,
          vehicleModel: vehicle.model,
          vehiclePlate: vehicle.licensePlate,
          startDate: startDate.toLocaleDateString("pt-BR"),
          endDate: endDate.toLocaleDateString("pt-BR"),
          totalAmount: (total + securityDeposit).toFixed(2),
          bookingId,
          pickupLocation: input.pickupLocation,
          returnLocation: input.pickupLocation,
        };

        // Send emails asynchronously
        Promise.all([
          sendBookingConfirmationToRenter(emailData),
          sendBookingNotificationToHost(emailData),
        ]).catch((err) => {
          console.error("[Booking] Failed to send emails:", err);
        });
      }
      
      return { id: bookingId, total, success: true };
    }),

  // Host approves booking → moves from pending_host_approval to pending_payment
  approveForPayment: hostProcedure
    .input(z.object({
      id: z.number(),
      hostIp: z.string().optional(),
      hostUserAgent: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.id);
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reserva não encontrada" });
      }
      if (booking.hostId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas o proprietário pode aprovar esta reserva" });
      }
      if (booking.status !== "pending_host_approval") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Esta reserva não está aguardando aprovação" });
      }
      // Get real IP from request headers
      const realIp = ctx.req.headers['x-forwarded-for']?.toString().split(',')[0].trim()
        || ctx.req.headers['x-real-ip']?.toString()
        || input.hostIp
        || ctx.req.socket?.remoteAddress
        || 'unknown';
      await db.updateBookingStatus(input.id, "pending_payment", {
        hostContractAccepted: true,
        hostContractAcceptedAt: new Date(),
        hostContractAcceptedIp: realIp,
        hostContractAcceptedUserAgent: input.hostUserAgent || ctx.req.headers['user-agent'] || null,
      } as any);
      await db.createNotification({
        userId: booking.renterId,
        title: "✅ Reserva Aprovada!",
        message: `Seu pedido de reserva #RDY-${String(input.id).padStart(6, '0')} foi aprovado! Acesse o app para realizar o pagamento.`,
        notificationType: "booking_confirmed",
        relatedId: input.id,
        relatedType: "booking",
      });
      try {
        const conv = await db.getOrCreateConversationForBooking(booking.renterId, booking.hostId, input.id);
        await db.sendSystemMessage(conv.id, `✅ Reserva #RDY-${String(input.id).padStart(6, '0')} aprovada pelo proprietário! Você já pode realizar o pagamento.`);
      } catch (e) { console.error("[Chat] approveForPayment msg error:", e); }
      return { success: true };
    }),

  // Host rejects booking before payment
  rejectBooking: hostProcedure
    .input(z.object({
      id: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.id);
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reserva não encontrada" });
      }
      if (booking.hostId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas o proprietário pode rejeitar esta reserva" });
      }
      if (booking.status !== "pending_host_approval") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Esta reserva não está aguardando aprovação" });
      }
      await db.updateBookingStatus(input.id, "cancelled_by_host", { cancellationReason: input.reason, cancelledAt: new Date() });
      await db.createNotification({
        userId: booking.renterId,
        title: "❌ Reserva Não Aprovada",
        message: `Infelizmente o proprietário não aprovou sua reserva #RDY-${String(input.id).padStart(6, '0')}.${input.reason ? ` Motivo: ${input.reason}` : ''}`,
        notificationType: "booking_cancelled",
        relatedId: input.id,
        relatedType: "booking",
      });
      try {
        const conv = await db.getOrCreateConversationForBooking(booking.renterId, booking.hostId, input.id);
        await db.sendSystemMessage(conv.id, `❌ Reserva #RDY-${String(input.id).padStart(6, '0')} não aprovada pelo proprietário.${input.reason ? ` Motivo: ${input.reason}` : ''}`);
      } catch (e) { console.error("[Chat] rejectBooking msg error:", e); }
      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["confirmed", "cancelled_by_renter", "cancelled_by_host"]),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.id);
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reserva não encontrada" });
      }
      
      // Validate permissions
      if (input.status === "confirmed" && booking.hostId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas o anfitrião pode confirmar" });
      }
      if (input.status === "cancelled_by_renter" && booking.renterId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas o locatário pode cancelar" });
      }
      if (input.status === "cancelled_by_host" && booking.hostId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas o anfitrião pode cancelar" });
      }
      
      await db.updateBookingStatus(input.id, input.status, {
        cancellationReason: input.reason,
        cancelledAt: input.status.includes("cancelled") ? new Date() : undefined,
      });

      // System messages for status changes
      try {
        const conv = await db.getOrCreateConversationForBooking(booking.renterId, booking.hostId, input.id);
        if (input.status === "confirmed") {
          await db.sendSystemMessage(conv.id, `✅ Reserva #RDY-${String(input.id).padStart(6, '0')} aprovada pelo anfitrão! Tenha uma ótima viagem!`);
        } else if (input.status === "cancelled_by_renter") {
          await db.sendSystemMessage(conv.id, `❌ Reserva #RDY-${String(input.id).padStart(6, '0')} cancelada pelo locatário.${input.reason ? ` Motivo: ${input.reason}` : ''}`);
        } else if (input.status === "cancelled_by_host") {
          await db.sendSystemMessage(conv.id, `❌ Reserva #RDY-${String(input.id).padStart(6, '0')} cancelada pelo anfitrão.${input.reason ? ` Motivo: ${input.reason}` : ''}`);
        }
      } catch (e) { console.error("[Chat] status system msg error:", e); }
      
      return { success: true };
    }),

  recordMileage: hostProcedure
    .input(z.object({
      id: z.number(),
      type: z.enum(["start", "end"]),
      mileage: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.id);
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      
      if (booking.hostId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Block check-in if identity verification is not approved
      if (input.type === "start" && booking.verificationStatus !== "approved" && booking.verificationStatus !== "not_required") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "A verificação de identidade do locatário ainda não foi aprovada. Aguarde a aprovação antes de iniciar a viagem."
        });
      }
      
      if (input.type === "start") {
        await db.updateBookingMileage(input.id, input.mileage, undefined);
        await db.updateBookingStatus(input.id, "in_progress", { actualPickupTime: new Date() });
      } else {
        await db.updateBookingMileage(input.id, undefined, input.mileage);
        
        // Calculate extra km charge
        if (booking.startMileage) {
          const kmDriven = input.mileage - booking.startMileage;
          const allowedKm = booking.dailyKmLimit * booking.totalDays;
          const extraKm = Math.max(0, kmDriven - allowedKm);
          
          if (extraKm > 0) {
            const extraKmCharge = extraKm * parseFloat(booking.extraKmPrice);
            await db.updateBookingStatus(input.id, "completed", {
              actualReturnTime: new Date(),
              extraKmCharge: extraKmCharge.toString(),
            });
            
            // Create fine for extra km
            if (extraKmCharge > 0) {
              await db.createFine({
                bookingId: input.id,
                userId: booking.renterId,
                fineType: "extra_km",
                amount: extraKmCharge.toString(),
                description: `Km excedente: ${extraKm} km a R$ ${booking.extraKmPrice}/km`,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
              });
            }
          } else {
            await db.updateBookingStatus(input.id, "completed", { actualReturnTime: new Date() });
          }

          // Notify renter and host to leave reviews
          try {
            await db.createNotification({
              userId: booking.renterId,
              title: "Avalie sua experiência! ⭐",
              message: `Sua reserva foi concluída. Que tal avaliar o veículo e o anfitrião? Sua avaliação ajuda outros locatários.`,
              notificationType: "review_received",
              relatedId: input.id,
              relatedType: "booking",
            });
            await db.createNotification({
              userId: booking.hostId,
              title: "Avalie o locatário! ⭐",
              message: `A reserva foi concluída. Avalie o locatário para ajudar outros anfitriões.`,
              notificationType: "review_received",
              relatedId: input.id,
              relatedType: "booking",
            });
          } catch (notifErr) {
            // Non-critical: don't fail the return flow if notification fails
          }
        }
      }
      
      return { success: true };
    }),

  // Admin: list all bookings with full details
  adminList: adminProcedure
    .input(z.object({
      status: z.string().optional(),
      limit: z.number().min(1).max(100).optional(),
      offset: z.number().min(0).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return await db.adminListAllBookings({
        status: input?.status,
        limit: input?.limit ?? 50,
        offset: input?.offset ?? 0,
      });
    }),

  // ─── OTP Contract Signing ──────────────────────────────────────────────────

  /**
   * Send OTP code to renter via SMS or email for contract signing.
   * Creates a temporary booking record (without contractAccepted) to hold the OTP.
   */
  sendContractOtp: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
      channel: z.enum(["sms", "email"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const { generateOtpCode, getOtpExpiry, sendOtpViaSms, sendOtpViaEmail } = await import("./services/otpService");
      const clientIpSend = getClientIp(ctx.req);
      const userAgentSend = ctx.req.headers["user-agent"] || undefined;
      const otpOpts = { ipAddress: clientIpSend, userAgent: userAgentSend };

      const booking = await db.getBookingById(input.bookingId);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Reserva não encontrada" });
      if (booking.renterId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      const renter = await db.getUserById(ctx.user.id);
      if (!renter) throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });

      let sent = false;

      if (input.channel === "sms") {
        // SMS: Twilio Verify gerencia o código internamente — não precisamos gerar/armazenar
        const phone = (booking as any).renterPhone || (renter as any).phone || "";
        if (!phone) throw new TRPCError({ code: "BAD_REQUEST", message: "Telefone não encontrado. Use o canal de e-mail." });

        sent = await sendOtpViaSms(phone, input.bookingId, otpOpts);

        if (!sent) {
          // Fallback automático para e-mail se SMS falhar
          const email = booking.renterEmail || renter.email || "";
          if (email) {
            const code = generateOtpCode();
            const expiresAt = getOtpExpiry();
            await db.updateBookingOtp(input.bookingId, {
              contractOtpCode: code,
              contractOtpExpiresAt: expiresAt,
              contractOtpChannel: "email",
              contractOtpAttempts: 0,
            });
            sent = await sendOtpViaEmail(email, renter.name || "Locatário", code, input.bookingId, otpOpts);
            if (sent) return { success: true, channel: "email", fallback: true };
          }
        } else {
          // Registrar canal SMS (sem código local — Twilio gerencia)
          await db.updateBookingOtp(input.bookingId, {
            contractOtpCode: "twilio-verify", // marcador: verificação delegada à Twilio
            contractOtpExpiresAt: getOtpExpiry(),
            contractOtpChannel: "sms",
            contractOtpAttempts: 0,
          });
        }
      } else {
        // Email: geramos o código localmente e enviamos via Resend
        const email = booking.renterEmail || renter.email || "";
        if (!email) throw new TRPCError({ code: "BAD_REQUEST", message: "E-mail não encontrado" });

        const code = generateOtpCode();
        const expiresAt = getOtpExpiry();
        await db.updateBookingOtp(input.bookingId, {
          contractOtpCode: code,
          contractOtpExpiresAt: expiresAt,
          contractOtpChannel: "email",
          contractOtpAttempts: 0,
        });
        sent = await sendOtpViaEmail(email, renter.name || "Locatário", code, input.bookingId, otpOpts);
      }

      if (!sent) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao enviar o código. Tente novamente." });

      return { success: true, channel: input.channel, fallback: false };
    }),

  /**
   * Verify OTP code and mark contract as accepted.
   */
  verifyContractOtp: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
      code: z.string().length(6),
    }))
    .mutation(async ({ ctx, input }) => {
      const { isOtpValid, verifyOtpViaTwilio, logEmailOtpVerified, logEmailOtpFailed } = await import("./services/otpService");
      const clientIpVerify = getClientIp(ctx.req);
      const userAgentVerify = ctx.req.headers["user-agent"] || undefined;
      const verifyOpts = { ipAddress: clientIpVerify, userAgent: userAgentVerify };

      const booking = await db.getBookingById(input.bookingId);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Reserva não encontrada" });
      if (booking.renterId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      const b = booking as any;
      if (!b.contractOtpCode || !b.contractOtpExpiresAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhum código foi solicitado. Solicite um novo código." });
      }

      let result: { valid: boolean; reason?: string };

      if (b.contractOtpChannel === "sms" && b.contractOtpCode === "twilio-verify") {
        // SMS: verificação delegada à Twilio Verify API
        const renter = await db.getUserById(ctx.user.id);
        const phone = (b.renterPhone) || (renter as any)?.phone || "";
        if (!phone) throw new TRPCError({ code: "BAD_REQUEST", message: "Telefone não encontrado." });
        result = await verifyOtpViaTwilio(phone, input.code, input.bookingId, verifyOpts);
      } else {
        // Email: verificação local
        const attempts = (b.contractOtpAttempts || 0) + 1;
        await db.updateBookingOtp(input.bookingId, { contractOtpAttempts: attempts });
        result = isOtpValid(
          input.code,
          b.contractOtpCode,
          new Date(b.contractOtpExpiresAt),
          attempts
        );
        // Log email OTP result
        const emailForLog = (b.renterEmail) || (await db.getUserById(ctx.user.id))?.email || "";
        if (result.valid) {
          await logEmailOtpVerified(emailForLog, input.bookingId, verifyOpts);
        } else {
          await logEmailOtpFailed(emailForLog, input.bookingId, result.reason || "invalid", verifyOpts);
        }
      }

      if (!result.valid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.reason });
      }

      // Mark contract as accepted with OTP verification
      const clientIp = getClientIp(ctx.req);
      await db.updateBookingStatus(input.bookingId, booking.status as any, {
        contractAccepted: true,
        contractAcceptedAt: new Date(),
        contractAcceptedIp: clientIp,
        contractAcceptedUserAgent: ctx.req.headers["user-agent"] || null,
        contractOtpVerifiedAt: new Date(),
      } as any);

      return { success: true };
    }),
});

// ============================================
// PAYMENT ROUTER
// ============================================

const paymentRouter = router({
  getMyPayments: protectedProcedure.query(async ({ ctx }) => {
    return await db.getPaymentsByUserId(ctx.user.id);
  }),

  getPaymentMethods: protectedProcedure.query(async ({ ctx }) => {
    return await db.getUserPaymentMethods(ctx.user.id);
  }),

  // ============================================
  // MERCADO PAGO TRANSPARENT CHECKOUT
  // ============================================

  /**
   * Process credit card payment via Mercado Pago Transparent Checkout
   * Card is tokenized on the frontend using MercadoPago.js SDK
   */
  processMPCreditCard: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
      cardToken: z.string(),           // Token from MercadoPago.js
      installments: z.number().min(1).max(12),
      paymentMethodId: z.string(),     // e.g. "visa", "master"
      issuerId: z.string().optional(), // Card issuer ID from MP
      cpf: z.string().min(11).max(14), // Payer CPF
      deviceId: z.string().optional(), // MP Device ID for fraud prevention
    }))
    .mutation(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.bookingId);
      if (!booking || booking.renterId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reserva não encontrada" });
      }

      if (booking.status !== "pending_payment" && booking.status !== "payment_failed") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Esta reserva não está aguardando pagamento" });
      }
      // Allow retry: if previous attempt failed, reset status to pending_payment
      if (booking.status === "payment_failed") {
        await db.updateBookingStatus(input.bookingId, "pending_payment");
      }

      const vehicle = await db.getVehicleById(booking.vehicleId);
      // bookingTotal inclui caução (securityDeposit) — garantia reembolsável cobrada no pagamento
      const bookingTotal = parseFloat(booking.subtotal) + parseFloat(booking.serviceFee) + parseFloat(booking.insuranceFee) + parseFloat(booking.securityDeposit || '0');
      const description = vehicle
        ? `RIDDY: ${vehicle.brand} ${vehicle.model} - ${booking.totalDays} dias`
        : `RIDDY Reserva #${input.bookingId}`;

      const user = await db.getUserById(ctx.user.id);

      const result = await processCreditCardPayment({
        bookingId: input.bookingId,
        amount: bookingTotal,
        description,
        customerEmail: user?.email || ctx.user.email || "",
        customerName: user?.name || ctx.user.name || "",
        customerCpf: input.cpf,
        cardToken: input.cardToken,
        installments: input.installments,
        paymentMethodId: input.paymentMethodId,
        issuerId: input.issuerId,
        deviceId: input.deviceId, // MP Device ID for fraud prevention
      });

      // Determine payment record status based on MP response
      // in_process/pending = antifraude em análise, NÃO é falha — manter reserva ativa
      // requires3DS = pending_challenge — aguardar autenticação bancária via 3DS
      const isProcessing = result.status === "in_process" || result.status === "pending";
      const requires3DS = result.requires3DS === true;
      const paymentRecordStatus = result.success ? "completed" : isProcessing ? "processing" : "failed";

      // Create payment record
      const paymentId = await db.createPayment({
        bookingId: input.bookingId,
        userId: ctx.user.id,
        paymentType: "booking_payment",
        amount: bookingTotal.toString(),
        paymentMethod: "credit_card",
        status: paymentRecordStatus,
        mpPaymentId: result.paymentId,
        failureReason: (!result.success && !isProcessing) ? result.message : undefined,
      });

      if (result.success) {
        // Pagamento aprovado imediatamente
        await db.updateBookingStatus(input.bookingId, "confirmed");
        // Generate and send contract PDF
        try {
          const contractResult = await generateAndSendContract(input.bookingId);
          if (contractResult.success) {
            console.log(`[CreditCard] Contract PDF generated for booking #${input.bookingId}`);
          } else {
            console.error(`[CreditCard] Contract generation failed: ${contractResult.error}`);
          }
        } catch (contractErr) {
          console.error(`[CreditCard] Error generating contract:`, contractErr);
        }
        try {
          const booking = await db.getBookingById(input.bookingId);
          if (booking) {
            const conv = await db.getOrCreateConversationForBooking(booking.renterId, booking.hostId, input.bookingId);
            await db.sendSystemMessage(conv.id, `✅ Pagamento confirmado via cartão de crédito. Reserva #RDY-${String(input.bookingId).padStart(6, '0')} está ativa! Por favor, envie seus documentos para finalizar a reserva.`);
          }
        } catch (e) { console.error("[Chat] system msg error:", e); }
      } else if (isProcessing) {
        // Pagamento em análise antifraude — reserva permanece em pending_payment, webhook confirmará
        // NÃO alterar status da reserva — aguardar webhook do MP
        try {
          const booking = await db.getBookingById(input.bookingId);
          if (booking) {
            const conv = await db.getOrCreateConversationForBooking(booking.renterId, booking.hostId, input.bookingId);
            await db.sendSystemMessage(conv.id, `⏳ Pagamento em análise. Reserva #RDY-${String(input.bookingId).padStart(6, '0')} será confirmada automaticamente assim que o pagamento for aprovado pelo banco.`);
          }
        } catch (e) { console.error("[Chat] system msg error:", e); }
      } else {
        // Pagamento recusado definitivamente
        await db.updateBookingStatus(input.bookingId, "payment_failed");
        try {
          const booking = await db.getBookingById(input.bookingId);
          if (booking) {
            const conv = await db.getOrCreateConversationForBooking(booking.renterId, booking.hostId, input.bookingId);
            await db.sendSystemMessage(conv.id, `❌ Pagamento não aprovado. Por favor, tente novamente ou use outro método de pagamento.`);
          }
        } catch (e) { console.error("[Chat] system msg error:", e); }
      }

      return {
        success: result.success,
        isProcessing, // true when in_process/pending — frontend should show "em análise"
        requires3DS,  // true when pending_challenge — frontend should open 3DS modal
        threeDSChallengeUrl: result.threeDSChallengeUrl, // URL for 3DS iframe/redirect
        paymentId,
        mpPaymentId: result.paymentId,
        status: result.status,
        statusDetail: result.statusDetail,
        message: requires3DS
          ? "🔒 Autenticação bancária necessária. Confirme o pagamento no seu banco."
          : isProcessing
          ? "⏳ Pagamento em análise pelo banco. Você será notificado assim que for aprovado."
          : result.message,
      };
    }),

  /**
   * Generate PIX QR Code via Mercado Pago Transparent Checkout
   * Returns QR code data for display in the frontend
   */
  processMPPix: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
      cpf: z.string().min(11).max(14),
    }))
    .mutation(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.bookingId);
      if (!booking || booking.renterId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reserva não encontrada" });
      }

      if (booking.status !== "pending_payment" && booking.status !== "payment_failed") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Esta reserva não está aguardando pagamento" });
      }
      // Allow retry: if previous attempt failed, reset status to pending_payment
      if (booking.status === "payment_failed") {
        await db.updateBookingStatus(input.bookingId, "pending_payment");
      }

      const vehicle = await db.getVehicleById(booking.vehicleId);
      // bookingTotal inclui caução (securityDeposit) — garantia reembolsável cobrada no pagamento
      // Nota: o desconto PIX de 5% se aplica apenas ao subtotal+taxas, NÃO ao caução (reembolsável)
      const baseTotal = parseFloat(booking.subtotal) + parseFloat(booking.serviceFee) + parseFloat(booking.insuranceFee);
      const depositAmount = parseFloat(booking.securityDeposit || '0');
      const bookingTotal = baseTotal + depositAmount;
      // PIX 5% discount applies only to base (not to the refundable deposit)
      const pixTotal = (baseTotal * 0.95) + depositAmount;
      const description = vehicle
        ? `RIDDY: ${vehicle.brand} ${vehicle.model} - ${booking.totalDays} dias`
        : `RIDDY Reserva #${input.bookingId}`;

      const user = await db.getUserById(ctx.user.id);

      const result = await processPixPayment({
        bookingId: input.bookingId,
        amount: Math.round(pixTotal * 100) / 100, // Round to 2 decimals
        description,
        customerEmail: user?.email || ctx.user.email || "",
        customerName: user?.name || ctx.user.name || "",
        customerCpf: input.cpf,
      });

      if (!result.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.message });
      }

      // Create payment record with PIX data
      const paymentId = await db.createPayment({
        bookingId: input.bookingId,
        userId: ctx.user.id,
        paymentType: "booking_payment",
        amount: pixTotal.toString(),
        paymentMethod: "pix",
        status: "processing", // PIX starts as processing until webhook confirms
        mpPaymentId: result.paymentId,
        mpPixQrCode: result.pixQrCode,
        mpPixQrCodeBase64: result.pixQrCodeBase64,
      });

      return {
        success: true,
        paymentId,
        mpPaymentId: result.paymentId,
        pixQrCode: result.pixQrCode,
        pixQrCodeBase64: result.pixQrCodeBase64,
        pixExpirationDate: result.pixExpirationDate,
        amount: pixTotal,
        message: result.message,
      };
    }),

  /**
   * Poll PIX payment status (frontend polls until confirmed)
   */
  checkMPPixStatus: protectedProcedure
    .input(z.object({
      mpPaymentId: z.string(),
      bookingId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.bookingId);
      if (!booking || booking.renterId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const mpStatus = await getMPPaymentStatus(input.mpPaymentId);

      // If approved, update booking and payment
      if (mpStatus.status === "approved") {
        const payment = await db.getPaymentByMpId(input.mpPaymentId);
        if (payment && payment.status !== "completed") {
          await db.updatePaymentStatus(payment.id, "completed", { mpPaymentId: input.mpPaymentId });
          await db.updateBookingStatus(input.bookingId, "confirmed");

          // Generate and send contract PDF for PIX payment
          try {
            const contractResult = await generateAndSendContract(input.bookingId);
            if (contractResult.success) {
              console.log(`[PIX] Contract PDF generated for booking #${input.bookingId}`);
            } else {
              console.error(`[PIX] Contract generation failed: ${contractResult.error}`);
            }
          } catch (contractErr) {
            console.error(`[PIX] Error generating contract:`, contractErr);
          }

          // System message: PIX payment confirmed
          try {
            const conv = await db.getOrCreateConversationForBooking(booking.renterId, booking.hostId, input.bookingId);
            await db.sendSystemMessage(conv.id, `✅ Pagamento via PIX confirmado! Reserva #RDY-${String(input.bookingId).padStart(6, '0')} está ativa. Por favor, envie seus documentos para finalizar a reserva.`);
          } catch (e) { console.error("[Chat] PIX system msg error:", e); }

          // Notify owner about confirmed payment
          try {
            const vehicle = await db.getVehicleById(booking.vehicleId);
            const renter = await db.getUserById(ctx.user.id);
            await notifyOwner({
              title: `✅ Pagamento PIX confirmado — Reserva #${input.bookingId}`,
              content: `O pagamento PIX de R$ ${mpStatus.amount.toFixed(2)} foi confirmado.\n\nVeículo: ${vehicle?.brand} ${vehicle?.model}\nLocatário: ${renter?.name}\nPeríodo: ${new Date(booking.startDate).toLocaleDateString("pt-BR")} a ${new Date(booking.endDate).toLocaleDateString("pt-BR")}`,
            });
          } catch (notifErr) {
            console.error("[Payment] Failed to notify owner:", notifErr);
          }
        }
      }

      return {
        status: mpStatus.status,
        statusDetail: mpStatus.statusDetail,
        isApproved: mpStatus.status === "approved",
        isPending: mpStatus.status === "pending" || mpStatus.status === "in_process",
        isRejected: mpStatus.status === "rejected" || mpStatus.status === "cancelled",
      };
    }),

  /**
   * Cancel a booking and refund via Mercado Pago
   * Calculates refund based on cancellation policy:
   * - 48h+ before start: full refund
   * - 24-48h before start: 50% refund
   * - Less than 24h: no refund
   */
  cancelWithRefund: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.bookingId);
      if (!booking || booking.renterId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reserva não encontrada" });
      }

      const cancellableStatuses = ["pending_payment", "confirmed", "pending_host_approval"];
      if (!cancellableStatuses.includes(booking.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Não é possível cancelar uma reserva com status: ${booking.status}`,
        });
      }

      // Calculate refund amount based on cancellation policy
      const now = new Date();
      const startDate = new Date(booking.startDate);
      const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Find the MP payment for this booking
      const bookingPayments = await db.getPaymentsByBookingId(input.bookingId);
      const mpPayment = bookingPayments.find(
        (p) => p.mpPaymentId && (p.status === "completed" || p.status === "processing")
      );

      let refundResult: { success: boolean; refundId?: string; message: string } | null = null;
      let refundPercentage = 0;
      let refundAmount = 0;

      if (mpPayment?.mpPaymentId) {
        const paidAmount = parseFloat(mpPayment.amount);

        if (hoursUntilStart >= 48) {
          // Full refund
          refundPercentage = 100;
          refundAmount = paidAmount;
        } else if (hoursUntilStart >= 24) {
          // 50% refund
          refundPercentage = 50;
          refundAmount = paidAmount * 0.5;
        } else {
          // No refund
          refundPercentage = 0;
          refundAmount = 0;
        }

        if (refundAmount > 0) {
          refundResult = await cancelMPPayment(mpPayment.mpPaymentId, refundAmount);
          if (refundResult.success) {
            await db.updatePaymentStatus(mpPayment.id, "refunded");
          }
        } else {
          // Just cancel without refund
          refundResult = await cancelMPPayment(mpPayment.mpPaymentId);
        }
      }

      // Update booking status
      await db.updateBookingStatus(input.bookingId, "cancelled_by_renter", {
        cancellationReason: input.reason || "Cancelado pelo locatário",
        cancelledAt: now,
      });

      // Notify both renter and host about cancellation
      try {
        const vehicle = await db.getVehicleById(booking.vehicleId);
        const renter = await db.getUserById(ctx.user.id);
        
        if (vehicle && renter) {
          // Notify renter (locatário)
          await db.createNotification({
            userId: ctx.user.id,
            title: "Reserva Cancelada ❌",
            message: `Sua reserva para ${vehicle.brand} ${vehicle.model} foi cancelada. Reembolso: ${refundPercentage}% (R$ ${refundAmount.toFixed(2)})`,
            notificationType: "booking_cancelled",
            relatedId: input.bookingId,
            relatedType: "booking",
          });
          
          // Notify host (proprietário)
          await db.createNotification({
            userId: vehicle.hostId,
            title: "Reserva Cancelada ❌",
            message: `A reserva de ${renter.name} para ${vehicle.brand} ${vehicle.model} foi cancelada. Motivo: ${input.reason || "Não informado"}`,
            notificationType: "booking_cancelled",
            relatedId: input.bookingId,
            relatedType: "booking",
          });
        }
      } catch (notifErr) {
        console.error("[Booking] Failed to send cancellation notifications:", notifErr);
      }

      // Notify platform owner
      try {
        const vehicle = await db.getVehicleById(booking.vehicleId);
        const renter = await db.getUserById(ctx.user.id);
        await notifyOwner({
          title: `❌ Reserva #${input.bookingId} cancelada pelo locatário`,
          content: `Veículo: ${vehicle?.brand} ${vehicle?.model}\nLocatário: ${renter?.name}\nMotivo: ${input.reason || "Não informado"}\nReembolso: ${refundPercentage}% (R$ ${refundAmount.toFixed(2)})`,
        });
      } catch (notifErr) {
        console.error("[Booking] Failed to notify owner on cancel:", notifErr);
      }

      return {
        success: true,
        refundPercentage,
        refundAmount,
        refundId: refundResult?.refundId,
        message: refundAmount > 0
          ? `Reserva cancelada. Reembolso de R$ ${refundAmount.toFixed(2)} (${refundPercentage}%) será processado em 3-5 dias úteis.`
          : "Reserva cancelada. Sem reembolso conforme política de cancelamento.",
      };
    }),

  /**
   * Create Mercado Pago Checkout Pro preference
   * Redirects user to official MP checkout page (higher approval rate)
   */
  createMPCheckoutPro: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.bookingId);
      if (!booking || booking.renterId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reserva não encontrada" });
      }
      if (!['pending_payment', 'payment_failed'].includes(booking.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Esta reserva não está aguardando pagamento" });
      }

      const vehicle = await db.getVehicleById(booking.vehicleId);
      const totalAmount = parseFloat(booking.totalAmount || booking.subtotal);
      const description = vehicle
        ? `Reserva Riddy: ${vehicle.brand} ${vehicle.model} - ${booking.totalDays} dias`
        : `Reserva Riddy #${input.bookingId}`;

      const origin = ctx.req.headers.origin || "https://riddycar.com";
      const successUrl = `${origin}/booking/success?bookingId=${input.bookingId}&source=checkout_pro`;
      const failureUrl = `${origin}/pay/${input.bookingId}?error=payment_failed`;
      const pendingUrl = `${origin}/booking/pending?bookingId=${input.bookingId}&source=checkout_pro`;

      const result = await createMPCheckoutProPreference({
        bookingId: input.bookingId,
        amount: totalAmount,
        description,
        customerEmail: ctx.user.email || "",
        customerName: ctx.user.name || "",
        successUrl,
        failureUrl,
        pendingUrl,
      });

      // Mark booking as pending_payment (reset from payment_failed if needed)
      if (booking.status === 'payment_failed') {
        await db.updateBookingStatus(input.bookingId, 'pending_payment');
      }

      return {
        preferenceId: result.preferenceId,
        checkoutUrl: result.checkoutUrl,
        sandboxUrl: result.sandboxUrl,
      };
    }),

  /**
   * Notify owner when a credit card payment is confirmed
   * Called automatically after processMPCreditCard succeeds
   */
  notifyPaymentConfirmed: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
      amount: z.number(),
      paymentMethod: z.enum(["credit_card", "pix"]),
      installments: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.bookingId);
      if (!booking || booking.renterId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      try {
        const vehicle = await db.getVehicleById(booking.vehicleId);
        const renter = await db.getUserById(ctx.user.id);
        const methodLabel = input.paymentMethod === "pix" ? "PIX" : `Cartão de Crédito${input.installments && input.installments > 1 ? ` (${input.installments}x)` : ""}`;

        await notifyOwner({
          title: `✅ Pagamento confirmado — Reserva #${input.bookingId}`,
          content: `Um novo pagamento foi confirmado!\n\nVeículo: ${vehicle?.brand} ${vehicle?.model} ${vehicle?.year}\nLocatário: ${renter?.name} (${renter?.email})\nPeríodo: ${new Date(booking.startDate).toLocaleDateString("pt-BR")} a ${new Date(booking.endDate).toLocaleDateString("pt-BR")}\nValor: R$ ${input.amount.toFixed(2)}\nMétodo: ${methodLabel}`,
        });
        return { success: true };
      } catch (err) {
        console.error("[Payment] notifyPaymentConfirmed error:", err);
        return { success: false };
      }
    }),
});

// ============================================
// FINE ROUTER
// ============================================

const fineRouter = router({
  getMyFines: protectedProcedure.query(async ({ ctx }) => {
    return await db.getFinesByUserId(ctx.user.id);
  }),

  dispute: protectedProcedure
    .input(z.object({
      id: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const fines = await db.getFinesByUserId(ctx.user.id);
      const fine = fines.find(f => f.id === input.id);
      
      if (!fine) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      
      await db.updateFineStatus(input.id, "disputed", { disputeReason: input.reason });
      return { success: true };
    }),

  pay: protectedProcedure
    .input(z.object({
      id: z.number(),
      paymentMethod: z.enum(["credit_card", "debit_card", "pix"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const fines = await db.getFinesByUserId(ctx.user.id);
      const fine = fines.find(f => f.id === input.id);
      
      if (!fine) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Pagamento de multas via gateway externo não está disponível. Entre em contato com o suporte." });
    }),
});

// ============================================
// MESSAGE ROUTER
// ============================================

const messageRouter = router({
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    const conversations = await db.getConversationsByUserId(ctx.user.id);
    
    // Enrich with participant info, last message, and vehicle thumbnail
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.participant1Id === ctx.user.id ? conv.participant2Id : conv.participant1Id;
        const otherUser = await db.getUserById(otherUserId);
        const messages = await db.getMessagesByConversationId(conv.id, 1);
        const lastMessage = messages[0] || null;
        
        // Fetch vehicle info for thumbnail + name display in conversation list
        // Also determine isRenter/isHost for filter pills
        let vehicleInfo: { id: number; brand: string | null; model: string | null; year: number | null; mainImageUrl: string | null; vehicleType: string | null; pickupCity: string | null; pickupState: string | null } | null = null;
        let isRenter = false; // current user is the renter (locatário)
        let isHost = false;   // current user is the vehicle owner (anfitrião)
        if (conv.bookingId) {
          try {
            const booking = await db.getBookingById(conv.bookingId);
            if (booking) {
              const vehicle = await db.getVehicleById(booking.vehicleId);
              if (vehicle) {
                vehicleInfo = {
                  id: vehicle.id,
                  brand: vehicle.brand,
                  model: vehicle.model,
                  year: vehicle.year,
                  mainImageUrl: vehicle.mainImageUrl,
                  vehicleType: vehicle.vehicleType,
                  pickupCity: vehicle.pickupCity ?? null,
                  pickupState: vehicle.pickupState ?? null,
                };
                // isRenter = current user made the booking
                isRenter = booking.renterId === ctx.user.id;
                // isHost = current user owns the vehicle (hostId field)
                isHost = vehicle.hostId === ctx.user.id;
              }
            }
          } catch {}
        }
        
        return {
          ...conv,
          otherUser: otherUser ? {
            id: otherUser.id,
            name: otherUser.name,
            avatarUrl: otherUser.avatarUrl,
          } : null,
          lastMessage,
          vehicle: vehicleInfo,
          isRenter,
          isHost,
        };
      })
    );
    
    return enrichedConversations;
  }),

  getMessages: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Verify user is part of conversation
      const conversation = await db.getConversationById(input.conversationId);
      if (!conversation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Conversa não encontrada" });
      }
      if (conversation.participant1Id !== ctx.user.id && conversation.participant2Id !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Você não tem acesso a esta conversa" });
      }
      
      // Mark as read
      await db.markMessagesAsRead(input.conversationId, ctx.user.id);
      return await db.getMessagesByConversationId(input.conversationId);
    }),

  send: protectedProcedure
    .input(z.object({
      conversationId: z.number(),
      content: z.string().min(1, "Mensagem não pode estar vazia"),
    }))
    .mutation(async ({ ctx, input }) => {
      // Security validation: block phone numbers, emails, and external links
      const phoneRegex = /\b\d[\d\s\-().]{8,}\d\b/;
      const emailRegex = /\S+@\S+\.\S+/;
      const linkRegex = /https?:\/\/|www\./i;
      const whatsappRegex = /whatsapp|wpp|zap|\+55|\(\d{2}\)/i;
      
      if (phoneRegex.test(input.content)) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Por segurança, não é permitido compartilhar números de telefone no chat. Use a plataforma RIDDY para toda comunicação." 
        });
      }
      if (emailRegex.test(input.content)) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Por segurança, não é permitido compartilhar endereços de email no chat. Use a plataforma RIDDY para toda comunicação." 
        });
      }
      if (linkRegex.test(input.content)) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Por segurança, não é permitido compartilhar links externos no chat. Use a plataforma RIDDY para toda comunicação." 
        });
      }
      if (whatsappRegex.test(input.content)) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Por segurança, não é permitido compartilhar contatos de WhatsApp no chat. Use a plataforma RIDDY para toda comunicação." 
        });
      }
      
      // Verify user is part of conversation
      const conversation = await db.getConversationById(input.conversationId);
      if (!conversation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Conversa não encontrada" });
      }
      if (conversation.participant1Id !== ctx.user.id && conversation.participant2Id !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Você não tem acesso a esta conversa" });
      }
      
      const messageId = await db.createMessage({
        conversationId: input.conversationId,
        senderId: ctx.user.id,
        content: input.content,
        messageType: "text",
      });
      
      // Notify the recipient
      try {
        const sender = await db.getUserById(ctx.user.id);
        const recipientId = conversation.participant1Id === ctx.user.id 
          ? conversation.participant2Id 
          : conversation.participant1Id;
        
        if (sender) {
          await db.createNotification({
            userId: recipientId,
            title: "Nova Mensagem de " + sender.name,
            message: input.content.substring(0, 100) + (input.content.length > 100 ? "..." : ""),
            notificationType: "message_received",
            relatedId: input.conversationId,
            relatedType: "conversation",
          });
        }
      } catch (notifErr) {
        console.error("[Messages] Failed to send message notification:", notifErr);
      }
      
      return { id: messageId, success: true };
    }),

  startConversation: protectedProcedure
    .input(z.object({
      otherUserId: z.number(),
      bookingId: z.number().optional(),
      initialMessage: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (input.otherUserId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode iniciar uma conversa consigo mesmo" });
      }
      
      const conversation = await db.getOrCreateConversation(
        ctx.user.id,
        input.otherUserId,
        input.bookingId
      );
      
      // Send initial message if provided
      if (input.initialMessage) {
        await db.createMessage({
          conversationId: conversation.id,
          senderId: ctx.user.id,
          content: input.initialMessage,
          messageType: "text",
        });
        
        // Notify the recipient
        try {
          const sender = await db.getUserById(ctx.user.id);
          if (sender) {
            await db.createNotification({
              userId: input.otherUserId,
              title: "Nova Mensagem de " + sender.name,
              message: input.initialMessage.substring(0, 100) + (input.initialMessage.length > 100 ? "..." : ""),
              notificationType: "message_received",
              relatedId: conversation.id,
              relatedType: "conversation",
            });
          }
        } catch (notifErr) {
          console.error("[Messages] Failed to send initial message notification:", notifErr);
        }
      }
      
      return { conversationId: conversation.id, success: true };
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    return await db.getUnreadMessageCount(ctx.user.id);
  }),

  // Returns unread count per conversation (for badges on conversation list)
  getUnreadPerConversation: protectedProcedure.query(async ({ ctx }) => {
    const convs = await db.getConversationsByUserId(ctx.user.id);
    if (convs.length === 0) return {} as Record<number, number>;
    const result: Record<number, number> = {};
    await Promise.all(
      convs.map(async (conv) => {
        const unread = await db.getUnreadCountForConversation(conv.id, ctx.user.id);
        result[conv.id] = unread;
      })
    );
    return result;
  }),

  // Returns booking + vehicle context for a conversation (Airbnb-style context card)
  getConversationContext: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const conversation = await db.getConversationById(input.conversationId);
      if (!conversation) throw new TRPCError({ code: "NOT_FOUND", message: "Conversa n\u00e3o encontrada" });
      if (conversation.participant1Id !== ctx.user.id && conversation.participant2Id !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sem acesso" });
      }
      if (!conversation.bookingId) return null;
      const booking = await db.getBookingById(conversation.bookingId);
      if (!booking) return null;
      const vehicle = await db.getVehicleById(booking.vehicleId);
      return {
        bookingId: booking.id,
        bookingCode: `RDY-${String(booking.id).padStart(7, "0")}`,
        status: booking.status,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalDays: booking.totalDays,
        totalAmount: booking.totalAmount,
        pickupLocation: booking.pickupLocation,
        vehicle: vehicle ? {
          id: vehicle.id,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          mainImageUrl: vehicle.mainImageUrl,
          vehicleType: vehicle.vehicleType,
        } : null,
      };
    }),

  // Send image message (URL from S3 upload)
  sendImage: protectedProcedure
    .input(z.object({
      conversationId: z.number(),
      imageUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const conversation = await db.getConversationById(input.conversationId);
      if (!conversation) throw new TRPCError({ code: "NOT_FOUND", message: "Conversa n\u00e3o encontrada" });
      if (conversation.participant1Id !== ctx.user.id && conversation.participant2Id !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sem acesso" });
      }
      const messageId = await db.createMessage({
        conversationId: input.conversationId,
        senderId: ctx.user.id,
        content: input.imageUrl,
        messageType: "image",
      });
      try {
        const sender = await db.getUserById(ctx.user.id);
        const recipientId = conversation.participant1Id === ctx.user.id
          ? conversation.participant2Id
          : conversation.participant1Id;
        if (sender) {
          await db.createNotification({
            userId: recipientId,
            title: "\uD83D\uDCF7 Imagem de " + sender.name,
            message: "Enviou uma imagem no chat",
            notificationType: "message_received",
            relatedId: input.conversationId,
            relatedType: "conversation",
          });
        }
      } catch {}
       return { id: messageId, success: true };
    }),
  // Upload image from base64 and send as message in one step
  uploadChatImage: protectedProcedure
    .input(z.object({
      conversationId: z.number(),
      base64Image: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const conversation = await db.getConversationById(input.conversationId);
      if (!conversation) throw new TRPCError({ code: "NOT_FOUND", message: "Conversa n\u00e3o encontrada" });
      if (conversation.participant1Id !== ctx.user.id && conversation.participant2Id !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sem acesso" });
      }
      const { mime: verifiedMime, buffer } = validateBase64(input.base64Image, "vehicle_image");
      const ext = safeExtension(verifiedMime);
      const { url } = await storagePut(
        `chat-images/${ctx.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`,
        buffer,
        verifiedMime
      );
      const messageId = await db.createMessage({
        conversationId: input.conversationId,
        senderId: ctx.user.id,
        content: url,
        messageType: "image",
      });
      try {
        const sender = await db.getUserById(ctx.user.id);
        const recipientId = conversation.participant1Id === ctx.user.id
          ? conversation.participant2Id
          : conversation.participant1Id;
        if (sender) {
          await db.createNotification({
            userId: recipientId,
            title: "\uD83D\uDCF7 Imagem de " + sender.name,
            message: "Enviou uma imagem no chat",
            notificationType: "message_received",
            relatedId: input.conversationId,
            relatedType: "conversation",
          });
        }
      } catch {}
      return { id: messageId, url, success: true };
    }),
});
// ============================================
// FAVORITE ROUTER
// ============================================

const favoriteRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db.getFavoritesByUserId(ctx.user.id);
  }),

  add: protectedProcedure
    .input(z.object({ vehicleId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.addFavorite(ctx.user.id, input.vehicleId);
      return { success: true };
    }),

  remove: protectedProcedure
    .input(z.object({ vehicleId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.removeFavorite(ctx.user.id, input.vehicleId);
      return { success: true };
    }),

  // Sync local (pre-login) favorites to the user's account
  syncLocal: protectedProcedure
    .input(z.object({ vehicleIds: z.array(z.number()).max(50) }))
    .mutation(async ({ ctx, input }) => {
      const results = await Promise.allSettled(
        input.vehicleIds.map((vehicleId) =>
          db.addFavorite(ctx.user.id, vehicleId).catch(() => null)
        )
      );
      const synced = results.filter((r) => r.status === "fulfilled").length;
      return { synced };
    }),
});

// ============================================
// REVIEW ROUTER
// ============================================

const reviewRouter = router({
  // Public platform stats for homepage (no auth required)
  getPlatformStats: publicProcedure.query(async () => {
    return await db.getPlatformStats();
  }),

  // Public reviews for homepage testimonials (no auth required)
  getPublicReviews: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).optional() }))
    .query(async ({ input }) => {
      return await db.getPublicReviews(input.limit ?? 6);
    }),

  create: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
      vehicleId: z.number().optional(),
      revieweeId: z.number().optional(),
      reviewType: z.enum(["renter_to_host", "host_to_renter", "renter_to_vehicle"]),
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
      cleanlinessRating: z.number().min(1).max(5).optional(),
      communicationRating: z.number().min(1).max(5).optional(),
      accuracyRating: z.number().min(1).max(5).optional(),
      valueRating: z.number().min(1).max(5).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // ETAPA 7: ownership check — reviewer must be renter or host of the booking
      const booking = await db.getBookingById(input.bookingId);
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reserva não encontrada" });
      }
      if (booking.renterId !== ctx.user.id && booking.hostId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem permissão para avaliar esta reserva",
        });
      }
      // Validate reviewType matches the user's role in the booking
      if (input.reviewType === "renter_to_host" || input.reviewType === "renter_to_vehicle") {
        if (booking.renterId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas o locatário pode enviar este tipo de avaliação",
          });
        }
      }
      if (input.reviewType === "host_to_renter") {
        if (booking.hostId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas o anfitrião pode enviar este tipo de avaliação",
          });
        }
      }
      // Booking must be completed to allow reviews
      if (booking.status !== "completed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Só é possível avaliar reservas concluídas",
        });
      }
      const reviewId = await db.createReview({
        ...input,
        reviewerId: ctx.user.id,
      });

      // Recalculate vehicle average rating after a vehicle review
      if (input.vehicleId && (input.reviewType === "renter_to_vehicle" || input.reviewType === "renter_to_host")) {
        await db.updateVehicleAverageRating(input.vehicleId);
      }
      
      return { id: reviewId, success: true };
    }),
  
  getMyReviews: protectedProcedure.query(async ({ ctx }) => {
    return await db.getReviewsByRevieweeId(ctx.user.id);
  }),
  
  // Get reviews received by host (from renters)
  getHostReviews: protectedProcedure.query(async ({ ctx }) => {
    return await db.getReviewsByRevieweeId(ctx.user.id);
  }),
});

// ============================================
// ADMIN ROUTER
// ============================================

const adminRouter = router({
  getStats: adminProcedure.query(async ({ ctx }) => {
    return await db.getAdminStats();
  }),

  getPendingDocuments: adminProcedure.query(async ({ ctx }) => {
    return await db.getPendingDocuments();
  }),

  reviewDocument: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["approved", "rejected"]),
      rejectionReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      
      await db.updateDocumentStatus(input.id, input.status, ctx.user.id, input.rejectionReason);
      return { success: true };
    }),

  getPendingVehicles: adminProcedure.query(async ({ ctx }) => {
    return await db.getPendingVehicles();
  }),

  approveVehicle: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {

      // Fetch vehicle to get hostId before updating
      const vehicleToApprove = await db.getVehicleById(input.id);
      if (!vehicleToApprove) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Veículo não encontrado." });
      }

      await db.updateVehicle(input.id, { status: "active", isVerified: true });

      // Notify the vehicle owner in-app
      try {
        await db.createNotification({
          userId: vehicleToApprove.hostId,
          title: "Veículo aprovado! 🎉",
          message: `Seu veículo ${vehicleToApprove.brand} ${vehicleToApprove.model} (${vehicleToApprove.licensePlate}) foi aprovado e já está disponível para aluguel na plataforma RIDDY.`,
          notificationType: "system",
          relatedId: vehicleToApprove.id,
        });
        await notifyOwner({
          title: `[Admin] Veículo aprovado: ${vehicleToApprove.brand} ${vehicleToApprove.model}`,
          content: `Admin ${ctx.user.name} aprovou o veículo ${vehicleToApprove.brand} ${vehicleToApprove.model} (${vehicleToApprove.licensePlate}) do proprietário ID ${vehicleToApprove.hostId}.`,
        });
      } catch (notifErr) {
        console.error("[Admin] Failed to send vehicle approval notification:", notifErr);
      }

      return { success: true };
    }),

  rejectVehicle: adminProcedure
    .input(z.object({
      id: z.number(),
      reason: z.string().min(1, "Motivo da rejeição é obrigatório."),
    }))
    .mutation(async ({ ctx, input }) => {

      // Fetch vehicle to get hostId before updating
      const vehicleToReject = await db.getVehicleById(input.id);
      if (!vehicleToReject) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Veículo não encontrado." });
      }

      await db.updateVehicle(input.id, { status: "rejected" } as any);

      // Notify the vehicle owner in-app with the rejection reason
      try {
        await db.createNotification({
          userId: vehicleToReject.hostId,
          title: "Veículo não aprovado",
          message: `Seu veículo ${vehicleToReject.brand} ${vehicleToReject.model} (${vehicleToReject.licensePlate}) não foi aprovado. Motivo: ${input.reason}. Corrija as informações e reenvie para análise.`,
          notificationType: "system",
          relatedId: vehicleToReject.id,
        });
        await notifyOwner({
          title: `[Admin] Veículo rejeitado: ${vehicleToReject.brand} ${vehicleToReject.model}`,
          content: `Admin ${ctx.user.name} rejeitou o veículo ${vehicleToReject.brand} ${vehicleToReject.model} (${vehicleToReject.licensePlate}) do proprietário ID ${vehicleToReject.hostId}. Motivo: ${input.reason}`,
        });
      } catch (notifErr) {
        console.error("[Admin] Failed to send vehicle rejection notification:", notifErr);
      }

      return { success: true };
    }),

  getPendingVehiclesForVerification: adminProcedure.query(async ({ ctx }) => {
    return await db.getPendingVehiclesForVerification();
  }),

  getVehicleVerificationDetails: adminProcedure
    .input(z.object({ vehicleId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await db.getVehicleVerificationDetails(input.vehicleId);
    }),

  getOwnerDocuments: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await db.getOwnerDocuments(input.userId);
    }),

  approveVehicleVerification: adminProcedure
    .input(z.object({
      vehicleId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.approveVehicleVerification(input.vehicleId, ctx.user.id, input.notes);

      // Notify the vehicle owner of approval
      try {
        const vehicle = await db.getVehicleById(input.vehicleId);
        if (vehicle?.hostId) {
          await db.createNotification({
            userId: vehicle.hostId,
            notificationType: "document_approved",
            title: "Veículo Aprovado! ✅",
            message: `Parabéns! Seu veículo ${vehicle.brand} ${vehicle.model} foi aprovado e já está disponível para aluguel na plataforma RIDDY.`,
            relatedId: input.vehicleId,
            relatedType: "vehicle",
          });
        }
      } catch (notifErr) {
        console.error("[Admin] Failed to send approval notification:", notifErr);
      }

      return { success: true };
    }),

  rejectVehicleVerification: adminProcedure
    .input(z.object({
      vehicleId: z.number(),
      rejectionReason: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.rejectVehicleVerification(input.vehicleId, ctx.user.id, input.rejectionReason, input.notes);

      // Notify the vehicle owner
      try {
        const vehicle = await db.getVehicleById(input.vehicleId);
        if (vehicle?.hostId) {
          await db.createNotification({
            userId: vehicle.hostId,
            notificationType: "document_rejected",
            title: "Veículo Rejeitado",
            message: `Seu veículo ${vehicle.brand} ${vehicle.model} foi rejeitado. Motivo: ${input.rejectionReason}`,
            relatedId: input.vehicleId,
            relatedType: "vehicle",
          });
        }
      } catch (notifErr) {
        console.error("[Admin] Failed to send rejection notification:", notifErr);
      }

      return { success: true };
    }),

  getPendingFines: adminProcedure.query(async ({ ctx }) => {
    return await db.getPendingFines();
  }),

  resolveFine: adminProcedure
    .input(z.object({
      id: z.number(),
      resolution: z.enum(["accepted", "waived"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      
      await db.updateFineStatus(input.id, input.resolution, {
        disputeResolution: input.notes,
        disputeResolvedAt: new Date(),
      });
      return { success: true };
    }),

  getAllUsers: adminProcedure
    .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return await db.getAllUsers(input?.limit, input?.offset);
    }),
  
  // Vehicle Management
  blockVehicle: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.updateVehicle(input.id, { status: "suspended" });
      return { success: true };
    }),
  
  unblockVehicle: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.updateVehicle(input.id, { status: "active" });
      return { success: true };
    }),
  
  deleteVehicle: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteVehicle(input.id);
      return { success: true };
    }),
  
  // User Management
  suspendUser: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Add suspended field to user or use a status field
      // For now, we'll use a simple approach
      return { success: true, message: "User suspended" };
    }),
  
  unsuspendUser: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return { success: true, message: "User unsuspended" };
    }),
  
  deleteUser: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteUser(input.id);
      return { success: true };
    }),

  // ── Document Review Procedures ──────────────────────────────────────────

  // Get all pending owner verifications (users with pending documents)
  getPendingOwnerVerifications: adminProcedure.query(async ({ ctx }) => {
    return await db.getPendingOwnerVerifications();
  }),

  // Approve a single user document
  approveUserDocument: adminProcedure
    .input(z.object({ docId: z.number() }))
    .mutation(async ({ ctx, input }) => {
        await db.approveUserDocument(input.docId, ctx.user.id);
      return { success: true };
    }),

  // Reject a single user document
  rejectUserDocument: adminProcedure
    .input(z.object({ docId: z.number(), reason: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
        await db.rejectUserDocument(input.docId, ctx.user.id, input.reason);
      return { success: true };
    }),

  // Approve a single vehicle document
  approveVehicleDocument: adminProcedure
    .input(z.object({ docId: z.number() }))
    .mutation(async ({ ctx, input }) => {
        await db.approveVehicleDocument(input.docId, ctx.user.id);
      return { success: true };
    }),

  // Reject a single vehicle document
  rejectVehicleDocument: adminProcedure
    .input(z.object({ docId: z.number(), reason: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
        await db.rejectVehicleDocument(input.docId, ctx.user.id, input.reason);
      return { success: true };
    }),

  // Request document resubmission (sets status back to pending with a note)
  requestDocumentResubmission: adminProcedure
    .input(z.object({
      docId: z.number(),
      docType: z.enum(["user", "vehicle"]),
      reason: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
         if (input.docType === "user") {
        await db.rejectUserDocument(input.docId, ctx.user.id, `Reenvio solicitado: ${input.reason}`);
      } else {
        await db.rejectVehicleDocument(input.docId, ctx.user.id, `Reenvio solicitado: ${input.reason}`);
      }
      return { success: true };
    }),
  // ETAPA 10: Security audit log viewer for admins
  getSecurityLogs: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(200).optional().default(50),
      offset: z.number().min(0).optional().default(0),
      eventType: z.enum(["UNAUTHORIZED", "FORBIDDEN", "UPLOAD_REJECTED", "RATE_LIMITED", "INVALID_INPUT", "ADMIN_ACTION", "AUTH_FAILURE"]).optional(),
      severity: z.enum(["low", "medium", "high", "critical"]).optional(),
      userId: z.number().optional(),
      ipAddress: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return db.getSecurityLogs(input);
    }),
  getSecurityStats: adminProcedure.query(async ({ ctx }) => {
    return db.getSecurityStats();
  }),

  regenerateContract: adminProcedure
    .input(z.object({ bookingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.bookingId);
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reserva não encontrada." });
      }
      const result = await generateAndSendContract(input.bookingId);
      if (!result.success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error || "Falha ao regenerar contrato." });
      }
      return { success: true, contractUrl: result.pdfUrl };
    }),
});
// ============================================
// MAIN APP ROUTER
// ============================================

// ============================================
// NOTIFICATION ROUTER
// ============================================

const notificationRouter = router({  
  getMyNotifications: protectedProcedure
    .input(z.object({
      limit: z.number().optional().default(10),
    }))
    .query(async ({ ctx, input }) => {
      return db.getNotificationsByUserId(ctx.user.id, input.limit);
    }),
  
  markAsRead: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.markNotificationAsRead(input.id);
      return { success: true };
    }),
  
  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      await db.markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),
});

// ============================================
// VERIFICATION ROUTER (Fase 1A: Turo Brasileiro)
// ============================================
const verificationRouter = router({
  // Get user's verification status
  getStatus: protectedProcedure
    .query(async ({ ctx }) => {
      return db.getUserVerification(ctx.user.id);
    }),
  
  // Submit verification documents
  submitDocuments: protectedProcedure
    .input(z.object({
      cpfUrl: z.string().optional(),
      cnhUrl: z.string().optional(),
      incomeProofUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const verification = await db.getUserVerification(ctx.user.id);
      
      // Check if already blocked
      if (verification?.status === "blocked") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sua conta foi bloqueada. Contate o suporte."
        });
      }
      
      // Check attempt count
      if ((verification?.attemptCount || 0) >= 3) {
        await db.blockUserVerification(ctx.user.id);
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Limite de tentativas excedido. Sua conta foi bloqueada."
        });
      }
      
      // Create or update verification
      const verificationId = await db.submitUserVerification(ctx.user.id, {
        cpfUrl: input.cpfUrl,
        cnhUrl: input.cnhUrl,
        incomeProofUrl: input.incomeProofUrl,
      });
      
      return { success: true, verificationId };
    }),
  
  // Get verification documents for admin review
  getDocumentsForReview: adminProcedure
    .query(async ({ ctx }) => {
      return db.getPendingVerifications();
    }),
  
  // Admin: Approve verification
  approveVerification: adminProcedure
    .input(z.object({
      verificationId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.approveUserVerification(input.verificationId, ctx.user.id, input.notes);
      return { success: true };
    }),
  
  // Admin: Reject verification
  rejectVerification: adminProcedure
    .input(z.object({
      verificationId: z.number(),
      notes: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.rejectUserVerification(input.verificationId, ctx.user.id, input.notes);
      return { success: true };
    }),
});

// ============================================
// BOOKING VERIFICATION ROUTER (Post-payment identity check)
// ============================================
const bookingVerificationRouter = router({
  // Get verification status for a booking
  getByBooking: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Ensure user owns this booking
      const booking = await db.getBookingById(input.bookingId);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
      if (booking.renterId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return db.getBookingVerification(input.bookingId);
    }),

  // Submit CNH + selfie images for a booking (accepts base64 and uploads to S3)
  submit: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
      cnhImageBase64: z.string().min(100), // data:image/jpeg;base64,...
      selfieImageBase64: z.string().min(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const booking = await db.getBookingById(input.bookingId);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
      if (booking.renterId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      // Allow submission when: payment confirmed, awaiting verification, or rejected (resubmission)
      const allowedStatuses = ["confirmed", "awaiting_verification", "rejected_verification", "pending_host_approval"];
      if (!allowedStatuses.includes(booking.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esta reserva não está aguardando verificação."
        });
      }

      // ETAPA 8: Validate CNH and selfie images (magic bytes + size + allowed MIME)
      const { mime: cnhMime, buffer: cnhBuffer } = validateBase64(
        input.cnhImageBase64,
        "verification_image"
      );
      const { mime: selfieMime, buffer: selfieBuffer } = validateBase64(
        input.selfieImageBase64,
        "verification_image"
      );
      const ts = Date.now();
      const { url: cnhImageUrl } = await storagePut(
        `verifications/${input.bookingId}/cnh-${ts}.${safeExtension(cnhMime)}`,
        cnhBuffer,
        cnhMime
      );
      const { url: selfieImageUrl } = await storagePut(
        `verifications/${input.bookingId}/selfie-${ts}.${safeExtension(selfieMime)}`,
        selfieBuffer,
        selfieMime
      );

      const verification = await db.upsertBookingVerification({
        bookingId: input.bookingId,
        renterId: ctx.user.id,
        cnhImageUrl,
        selfieImageUrl,
      });

      // Update booking verificationStatus to pending_review
      const { getDb } = await import('./db');
      const dbConn = await getDb();
      if (dbConn) {
        const { bookings: bookingsTable } = await import('../drizzle/schema');
        const { eq: eqOp } = await import('drizzle-orm');
        await dbConn.update(bookingsTable).set({
          verificationStatus: "pending_review",
          status: "awaiting_verification",
          updatedAt: new Date(),
        }).where(eqOp(bookingsTable.id, input.bookingId));
      }

      // Notify owner
      try {
        await notifyOwner({
          title: "📋 Nova Verificação de Identidade",
          content: `Reserva #RDY-${String(input.bookingId).padStart(6, '0')} aguarda verificação de identidade. Locatário: ${booking.renterFullName || ctx.user.name || 'N/A'}.`,
        });
      } catch (e) { /* non-critical */ }

      return { success: true, verification };
    }),

  // Admin: List all verifications
  adminList: adminProcedure
    .input(z.object({
      status: z.enum(["pending_review", "approved", "rejected"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      return db.listAllVerifications(input.status);
    }),

  // Admin: Approve
  adminApprove: adminProcedure
    .input(z.object({ bookingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.approveBookingVerification(input.bookingId, ctx.user.id);

      // Notify renter
      const booking = await db.getBookingById(input.bookingId);
      if (booking) {
        try {
          await notifyOwner({
            title: "✅ Verificação Aprovada",
            content: `Reserva #RDY-${String(input.bookingId).padStart(6, '0')} verificação aprovada. Reserva confirmada!`,
          });
        } catch (e) { /* non-critical */ }
      }

      return { success: true };
    }),

  // Admin: Reject
  adminReject: adminProcedure
    .input(z.object({
      bookingId: z.number(),
      rejectionReason: z.string().min(10, "Informe o motivo da rejeição (mínimo 10 caracteres)"),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.rejectBookingVerification(input.bookingId, ctx.user.id, input.rejectionReason);
      return { success: true };
    }),
});

// ============================================
// RECEIPT ROUTER
// ============================================
const receiptRouter = router({
  getReceipts: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      return db.getUserReceipts(ctx.user.id, input.limit, input.offset);
    }),

  getReceipt: protectedProcedure
    .input(z.object({
      receiptId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const receipt = await db.getReceiptById(input.receiptId);
      if (!receipt || receipt.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return receipt;
    }),

  resendByEmail: protectedProcedure
    .input(z.object({
      receiptId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const receipt = await db.getReceiptById(input.receiptId);
      if (!receipt || receipt.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      
      await db.logEmail({
        recipientEmail: ctx.user.email || "",
        recipientName: ctx.user.name || "",
        subject: `Recibo #${receipt.receiptNumber}`,
        template: "receipt",
        relatedEntityType: "receipt",
        relatedEntityId: receipt.id,
        status: "sent",
      });
      
      return { success: true };
    }),

  // [NEW] Generate or retrieve receipt PDF URL
  downloadPdf: protectedProcedure
    .input(z.object({
      receiptId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const receipt = await db.getReceiptById(input.receiptId);
      if (!receipt || receipt.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      
      // Return cached PDF if already generated
      if (receipt.pdfUrl) {
        return { success: true, pdfUrl: receipt.pdfUrl };
      }
      
      // Generate PDF on demand
      const { generateReceiptPdf } = await import("./services/receiptService");
      const result = await generateReceiptPdf(receipt.bookingId);
      
      if (!result.success || !result.pdfUrl) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error || "Erro ao gerar recibo" });
      }
      
      // Cache the URL
      await db.updateReceiptPdfUrl(receipt.id, result.pdfUrl);
      
      return { success: true, pdfUrl: result.pdfUrl };
    }),
});

// ============================================
// HOST PUBLIC PROFILE ROUTER
// ============================================
const hostRouter = router({
  getPublicProfile: publicProcedure
    .input(z.object({ hostId: z.number() }))
    .query(async ({ input }) => {
      const host = await db.getUserById(input.hostId);
      if (!host) throw new TRPCError({ code: "NOT_FOUND", message: "Host não encontrado" });

      // Only expose public-safe fields
      const publicProfile = {
        id: host.id,
        name: host.name,
        avatarUrl: host.avatarUrl,
        bio: host.bio,
        totalTripsAsHost: host.totalTripsAsHost,
        averageRating: host.averageRating,
        kycStatus: host.kycStatus,
        verificationLevel: host.verificationLevel,
        cnhVerified: host.cnhVerified,
        memberSince: host.createdAt,
        addressCity: host.addressCity,
        addressState: host.addressState,
      };

      // Get host's active vehicles
      const vehicles = await db.getVehiclesByHostId(input.hostId);
      const activeVehicles = vehicles.filter(v => v.status === "active");

      // Get public reviews for this host
      const reviews = await db.getReviewsByRevieweeId(input.hostId);
      const publicReviews = reviews
        .filter((r: any) => r.isPublic !== false)
        .slice(0, 10)
        .map((r: any) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          reviewerName: r.reviewerName || "Usuário",
          createdAt: r.createdAt,
        }));

      return { host: publicProfile, vehicles: activeVehicles, reviews: publicReviews };
    }),
});

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  user: userRouter,
  vehicle: vehicleRouter,
  motorcycle: motorcycleRouter,
  booking: bookingRouter,
  payment: paymentRouter,
  fine: fineRouter,
  message: messageRouter,
  favorite: favoriteRouter,
  review: reviewRouter,
  notification: notificationRouter,
  email: emailRouter,
  receipt: receiptRouter,
  verification: verificationRouter,
  bookingVerification: bookingVerificationRouter,
  admin: adminRouter,
  geolocation: geolocationRouter,
  host: hostRouter,
  ownAuth: ownAuthRouter,
  googleAuth: googleAuthRouter,
  chat: chatRouter,
  support: riddyCareRouter,
  levels: levelsRouter,
});
export type AppRouter = typeof appRouter;
