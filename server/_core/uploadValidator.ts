/**
 * ETAPA 8 — Upload Validation Module
 *
 * Provides server-side validation for all file uploads:
 *   1. Magic bytes detection (real MIME, not client-supplied header)
 *   2. Per-context size limits (document vs image vs vehicle doc)
 *   3. Allowed MIME type enforcement per upload context
 *   4. Sanitized extension derivation
 *
 * Usage:
 *   import { validateBuffer, validateBase64, UploadContext } from "./_core/uploadValidator";
 *   validateBuffer(buffer, mimeType, "user_document");   // throws TRPCError on failure
 *   validateBase64(base64String, "vehicle_image");       // throws TRPCError on failure
 */

import { TRPCError } from "@trpc/server";

// ─────────────────────────────────────────────────────────────────────────────
// Magic byte signatures
// ─────────────────────────────────────────────────────────────────────────────

interface MagicEntry {
  mime: string;
  bytes: number[];
  offset?: number; // byte offset where signature starts (default 0)
}

const MAGIC_SIGNATURES: MagicEntry[] = [
  // JPEG: FF D8 FF
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  // WEBP: RIFF????WEBP (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF"
  // PDF: %PDF
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
  // GIF: GIF87a or GIF89a
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  // HEIC/HEIF: ftyp at offset 4
  { mime: "image/heic", bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
];

/**
 * Detects the real MIME type from the first bytes of a buffer.
 * Returns null if no known signature matches.
 */
export function detectMimeFromBuffer(buffer: Buffer): string | null {
  for (const entry of MAGIC_SIGNATURES) {
    const offset = entry.offset ?? 0;
    if (buffer.length < offset + entry.bytes.length) continue;

    const slice = buffer.slice(offset, offset + entry.bytes.length);
    const matches = entry.bytes.every((b, i) => slice[i] === b);

    if (matches) {
      // Extra check for WEBP: bytes 8-11 must be "WEBP"
      if (entry.mime === "image/webp") {
        if (buffer.length < 12) continue;
        const webp = buffer.slice(8, 12);
        if (webp.toString("ascii") !== "WEBP") continue;
      }
      return entry.mime;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload contexts and their policies
// ─────────────────────────────────────────────────────────────────────────────

export type UploadContext =
  | "user_document"       // KYC docs: CNH, RG, CPF, selfie, proof_of_address
  | "vehicle_image"       // Vehicle photos (Cloudinary)
  | "vehicle_document"    // CRLV, insurance (S3)
  | "verification_image"  // Booking verification: CNH + selfie photos
  | "generic_file";       // Generic S3 upload (vehicle.uploadFile)

interface UploadPolicy {
  maxBytes: number;
  allowedMimes: string[];
  label: string;
}

const UPLOAD_POLICIES: Record<UploadContext, UploadPolicy> = {
  user_document: {
    maxBytes: 10 * 1024 * 1024, // 10MB
    allowedMimes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    label: "documento de usuário",
  },
  vehicle_image: {
    maxBytes: 8 * 1024 * 1024, // 8MB
    allowedMimes: ["image/jpeg", "image/png", "image/webp"],
    label: "imagem de veículo",
  },
  vehicle_document: {
    maxBytes: 10 * 1024 * 1024, // 10MB
    allowedMimes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    label: "documento de veículo",
  },
  verification_image: {
    maxBytes: 5 * 1024 * 1024, // 5MB
    allowedMimes: ["image/jpeg", "image/png", "image/webp"],
    label: "imagem de verificação",
  },
  generic_file: {
    maxBytes: 10 * 1024 * 1024, // 10MB
    allowedMimes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    label: "arquivo",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Core validation functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a raw Buffer against the policy for the given context.
 * Throws TRPCError (BAD_REQUEST) on any violation.
 *
 * @param buffer - File bytes to validate
 * @param claimedMime - MIME type claimed by the client (will be cross-checked)
 * @param context - Upload context that determines size/type policy
 * @returns The verified MIME type (from magic bytes or claimed if undetectable)
 */
export function validateBuffer(
  buffer: Buffer,
  claimedMime: string,
  context: UploadContext
): string {
  const policy = UPLOAD_POLICIES[context];

  // 1. Size check
  if (buffer.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Arquivo vazio não é permitido.",
    });
  }
  if (buffer.length > policy.maxBytes) {
    const maxMB = (policy.maxBytes / 1024 / 1024).toFixed(0);
    const actualMB = (buffer.length / 1024 / 1024).toFixed(1);
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${policy.label}: arquivo muito grande (${actualMB}MB). Máximo permitido: ${maxMB}MB.`,
    });
  }

  // 2. Magic bytes detection
  const detectedMime = detectMimeFromBuffer(buffer);

  // 3. If we detected a MIME, it must match the claimed one
  if (detectedMime !== null && detectedMime !== claimedMime) {
    // Normalize image/jpg → image/jpeg
    const normalizedClaimed = claimedMime === "image/jpg" ? "image/jpeg" : claimedMime;
    if (detectedMime !== normalizedClaimed) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Tipo de arquivo inválido: o arquivo enviado é ${detectedMime} mas foi declarado como ${claimedMime}. Possível tentativa de spoofing.`,
      });
    }
  }

  // 4. Effective MIME: prefer detected, fall back to claimed
  const effectiveMime = detectedMime ?? claimedMime;

  // 5. Allowed MIME check
  const normalizedEffective = effectiveMime === "image/jpg" ? "image/jpeg" : effectiveMime;
  if (!policy.allowedMimes.includes(normalizedEffective)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Tipo de arquivo não permitido para ${policy.label}: ${normalizedEffective}. Tipos aceitos: ${policy.allowedMimes.join(", ")}.`,
    });
  }

  return normalizedEffective;
}

/**
 * Validates a base64-encoded file string.
 * Strips the data: prefix, decodes to Buffer, then calls validateBuffer.
 *
 * @param base64String - Raw base64 string (with or without data:mime;base64, prefix)
 * @param context - Upload context
 * @param claimedMime - Optional MIME override; if not provided, extracted from prefix
 * @returns Object with verified MIME and decoded Buffer
 */
export function validateBase64(
  base64String: string,
  context: UploadContext,
  claimedMime?: string
): { mime: string; buffer: Buffer } {
  if (!base64String || base64String.trim().length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Dados de arquivo vazios.",
    });
  }

  // Extract MIME from data: prefix if present
  let mimeFromPrefix: string | null = null;
  let rawBase64 = base64String;

  if (base64String.startsWith("data:")) {
    const semicolonIdx = base64String.indexOf(";");
    if (semicolonIdx === -1) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Formato base64 inválido: prefixo data: malformado.",
      });
    }
    mimeFromPrefix = base64String.slice(5, semicolonIdx); // "data:" = 5 chars
    const commaIdx = base64String.indexOf(",");
    if (commaIdx === -1) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Formato base64 inválido: vírgula separadora não encontrada.",
      });
    }
    rawBase64 = base64String.slice(commaIdx + 1);
  }

  // Decode base64
  let buffer: Buffer;
  try {
    buffer = Buffer.from(rawBase64, "base64");
  } catch {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Dados base64 inválidos: não foi possível decodificar o arquivo.",
    });
  }

  // Determine claimed MIME: explicit param > prefix > fallback
  const effective = claimedMime ?? mimeFromPrefix ?? "application/octet-stream";

  // Validate the buffer
  const verifiedMime = validateBuffer(buffer, effective, context);

  return { mime: verifiedMime, buffer };
}

/**
 * Derives a safe file extension from a verified MIME type.
 * Never trusts the client-supplied filename extension.
 */
export function safeExtension(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/heic": "heic",
    "application/pdf": "pdf",
  };
  return map[mime] ?? "bin";
}

/**
 * Validates a multer-uploaded file buffer (for Express routes).
 * Returns the verified MIME type.
 * Throws a plain Error (not TRPCError) for use in Express middleware.
 */
export function validateMulterFile(
  buffer: Buffer,
  claimedMime: string,
  context: UploadContext
): string {
  try {
    return validateBuffer(buffer, claimedMime, context);
  } catch (err: any) {
    // Re-throw as plain Error for Express error handling
    throw new Error(err.message ?? "Arquivo inválido.");
  }
}
