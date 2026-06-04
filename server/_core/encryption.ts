import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-key-change-in-production-32chars!!";
const ALGORITHM = "aes-256-cbc";

/**
 * Encrypt a string using AES-256-CBC
 * Returns base64 encoded string with IV prepended
 */
export function encryptAES(text: string): string {
  const key = crypto
    .createHash("sha256")
    .update(String(ENCRYPTION_KEY))
    .digest();

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Prepend IV to encrypted data and return as base64
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt a string encrypted with encryptAES
 */
export function decryptAES(encryptedText: string): string {
  const key = crypto
    .createHash("sha256")
    .update(String(ENCRYPTION_KEY))
    .digest();

  const parts = encryptedText.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
