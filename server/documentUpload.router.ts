/**
 * Document Upload Router
 * POST /api/upload/document
 *
 * Handles real file uploads for user KYC documents:
 * 1. Validates file type (image/jpeg, image/png, image/webp, application/pdf)
 * 2. Validates file size (max 10MB)
 * 3. ETAPA 8: Validates magic bytes (real MIME, not client-supplied header)
 * 4. Uploads to S3 via storagePut
 * 5. Creates a record in user_documents with status: "pending"
 * 6. Returns the stored file URL
 *
 * Security:
 * - Requires valid JWT session cookie (same as tRPC protectedProcedure)
 * - Users can only upload documents for themselves (ctx.user.id)
 * - File bytes are never stored in the database
 * - ETAPA 8: Magic bytes verification prevents MIME spoofing attacks
 */

import { Router, Request, Response } from "express";
import multer from "multer";
import { storagePut } from "./storage";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import { validateMulterFile, safeExtension } from "./_core/uploadValidator";
import { logUploadRejected, logAuthFailure } from "./_core/securityLogger";
import { getClientIp } from "./_core/rateLimiter";

const router = Router();

// ── Allowed MIME types ────────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

// ── Max file size: 10MB ───────────────────────────────────────────────────────
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

// ── Valid document types (must match schema enum) ─────────────────────────────
const VALID_DOCUMENT_TYPES = [
  "cnh_front",
  "cnh_back",
  "rg_front",
  "rg_back",
  "cpf",
  "selfie",
  "proof_of_address",
  "facial_recognition",
] as const;

type DocumentType = (typeof VALID_DOCUMENT_TYPES)[number];

// ── Multer: memory storage (no disk writes) ───────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Tipo de arquivo não permitido: ${file.mimetype}. Use JPG, PNG, WEBP ou PDF.`
        )
      );
    }
  },
});

// ── POST /api/upload/document ─────────────────────────────────────────────────
router.post(
  "/document",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      // ── 1. Authenticate user via session cookie (same as protectedProcedure) ─
      let user;
      try {
        user = await sdk.authenticateRequest(req);
      } catch {
        logAuthFailure({
          endpoint: "POST /api/upload/document",
          ipAddress: getClientIp(req),
          userAgent: req.headers["user-agent"] as string | undefined,
          reason: "invalid or missing session token",
        });
        return res.status(401).json({
          success: false,
          error: "Não autorizado. Faça login para enviar documentos.",
        });
      }

      // ── 2. Validate file was received ─────────────────────────────────────
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "Nenhum arquivo enviado.",
        });
      }

      // ── 3. Validate document type ─────────────────────────────────────────
      const documentType = req.body.documentType as DocumentType;
      if (!documentType || !VALID_DOCUMENT_TYPES.includes(documentType)) {
        return res.status(400).json({
          success: false,
          error: `Tipo de documento inválido: ${documentType}`,
        });
      }

      // ── 4. Double-check file size (multer already enforces, but be safe) ──
      if (req.file.size > MAX_FILE_SIZE_BYTES) {
        return res.status(400).json({
          success: false,
          error: `Arquivo muito grande. Máximo permitido: 10MB. Tamanho recebido: ${(req.file.size / 1024 / 1024).toFixed(1)}MB`,
        });
      }

      // ── 5. ETAPA 8: Magic bytes validation ────────────────────────────────
      // This prevents MIME spoofing: a malicious user could rename a .exe to .jpg
      // and set Content-Type: image/jpeg — magic bytes reveal the true file type.
      let verifiedMime: string;
      try {
        verifiedMime = validateMulterFile(req.file.buffer, req.file.mimetype, "user_document");
      } catch (validationErr: any) {
        logUploadRejected({
          userId: (user as any)?.id ?? null,
          endpoint: "POST /api/upload/document",
          ipAddress: getClientIp(req),
          userAgent: req.headers["user-agent"] as string | undefined,
          declaredMime: req.file.mimetype,
          context: req.file.originalname,
          reason: validationErr.message ?? "magic bytes mismatch",
        });
        return res.status(400).json({
          success: false,
          error: validationErr.message ?? "Arquivo inválido.",
        });
      }

      // ── 6. Build S3 key with user isolation (safe extension from verified MIME) ─
      const ext = safeExtension(verifiedMime);
      const fileKey = `user-documents/${user.id}/${documentType}-${Date.now()}.${ext}`;

      // ── 7. Upload to S3 ───────────────────────────────────────────────────
      const { url: fileUrl } = await storagePut(
        fileKey,
        req.file.buffer,
        verifiedMime
      );

      // ── 8. Save document record in database (status: "pending") ──────────
      const docId = await db.createUserDocument({
        userId: user.id,
        documentType,
        fileUrl,
        fileKey,
        mimeType: verifiedMime,
        status: "pending",
      });

      // ── 9. Update user KYC status to "submitted" ──────────────────────────
      await db.updateUserKycStatus(user.id, "submitted");

      return res.status(200).json({
        success: true,
        id: docId,
        fileUrl,
        documentType,
        status: "pending",
      });
    } catch (err: any) {
      // Multer file size error
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          error: "Arquivo muito grande. Máximo permitido: 10MB.",
        });
      }
      // Multer file type error (from fileFilter)
      if (err.message?.includes("Tipo de arquivo não permitido")) {
        return res.status(400).json({
          success: false,
          error: err.message,
        });
      }
      console.error("[DocumentUpload] Error:", err?.message ?? err);
      return res.status(500).json({
        success: false,
        error: "Erro interno ao processar o upload. Tente novamente.",
      });
    }
  }
);

export default router;
