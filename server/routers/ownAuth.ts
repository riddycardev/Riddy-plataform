/**
 * RIDDY Own Authentication Router
 * Handles email/password registration, login, email verification, and password reset.
 * Coexists with the Manus OAuth flow — session cookie format is identical.
 */
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { publicProcedure, router } from "../_core/trpc";
import { sdk } from "../_core/sdk";
import { ENV } from "../_core/env";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import {
  sendEmail,
  getVerificationEmailHtml,
  getPasswordResetEmailHtml,
} from "../_core/email";

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

async function getDbOrThrow() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  return db;
}

async function createSessionAndSetCookie(
  openId: string,
  name: string,
  req: any,
  res: any
): Promise<void> {
  const sessionToken = await sdk.createSessionToken(openId, {
    name,
    expiresInMs: ONE_YEAR_MS,
  });
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
}

// ── Router ───────────────────────────────────────────────────────────────────

export const ownAuthRouter = router({
  /**
   * Register a new user with email and password.
   * Sends a verification email after registration.
   */
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
        email: z.string().email("E-mail inválido"),
        password: z
          .string()
          .min(8, "Senha deve ter pelo menos 8 caracteres")
          .max(128),
        role: z.enum(["user", "host"]).default("user"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { name, email, password, role } = input;
      const db = await getDbOrThrow();

      // Check if email already exists
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este e-mail já está cadastrado. Faça login ou use outro e-mail.",
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Generate unique openId for own-auth users
      const openId = `riddy_${crypto.randomBytes(16).toString("hex")}`;

      // Generate email verification token
      const emailVerifyToken = generateToken();
      const emailVerifyTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

      // Create user
      await db.insert(users).values({
        openId,
        name,
        email: email.toLowerCase(),
        passwordHash,
        loginMethod: "email",
        role,
        emailVerified: false,
        emailVerifyToken,
        emailVerifyTokenExpiresAt,
        lastSignedIn: new Date(),
      });

      // Send verification email (non-blocking)
      const baseUrl = (ctx.req.headers.origin as string) || ENV.appBaseUrl;
      sendEmail({
        to: email,
        subject: "Confirme seu e-mail — RIDDY",
        html: getVerificationEmailHtml(name, emailVerifyToken, baseUrl),
      }).catch((err) => console.error("[Auth] Failed to send verification email:", err));

      // Create session and set cookie
      await createSessionAndSetCookie(openId, name, ctx.req, ctx.res);

      return { success: true, message: "Conta criada com sucesso! Verifique seu e-mail." };
    }),

  /**
   * Login with email and password.
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("E-mail inválido"),
        password: z.string().min(1, "Senha é obrigatória"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { email, password } = input;
      const db = await getDbOrThrow();

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "E-mail ou senha incorretos.",
        });
      }

      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatch) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "E-mail ou senha incorretos.",
        });
      }

      // Update last signed in
      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));

      // Create session and set cookie
      await createSessionAndSetCookie(user.openId, user.name || "", ctx.req, ctx.res);

      return { success: true, message: "Login realizado com sucesso!" };
    }),

  /**
   * Verify email with token from the verification email.
   */
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const { token } = input;
      const db = await getDbOrThrow();

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.emailVerifyToken, token))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Token de verificação inválido ou expirado.",
        });
      }

      if (user.emailVerifyTokenExpiresAt && user.emailVerifyTokenExpiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Token de verificação expirado. Solicite um novo e-mail de verificação.",
        });
      }

      await db
        .update(users)
        .set({
          emailVerified: true,
          emailVerifyToken: null,
          emailVerifyTokenExpiresAt: null,
        })
        .where(eq(users.id, user.id));

      return { success: true, message: "E-mail verificado com sucesso!" };
    }),

  /**
   * Resend verification email.
   */
  resendVerification: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const { email } = input;
      const db = await getDbOrThrow();

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      // Always return success to prevent email enumeration
      if (!user || user.emailVerified) {
        return { success: true };
      }

      const emailVerifyToken = generateToken();
      const emailVerifyTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await db
        .update(users)
        .set({ emailVerifyToken, emailVerifyTokenExpiresAt })
        .where(eq(users.id, user.id));

      const baseUrl = (ctx.req.headers.origin as string) || ENV.appBaseUrl;
      sendEmail({
        to: email,
        subject: "Confirme seu e-mail — RIDDY",
        html: getVerificationEmailHtml(user.name || "Usuário", emailVerifyToken, baseUrl),
      }).catch(console.error);

      return { success: true };
    }),

  /**
   * Request a password reset email.
   */
  forgotPassword: publicProcedure
    .input(z.object({ email: z.string().email("E-mail inválido") }))
    .mutation(async ({ input, ctx }) => {
      const { email } = input;
      const db = await getDbOrThrow();

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      // Always return success to prevent email enumeration
      if (!user) {
        return { success: true };
      }

      const passwordResetToken = generateToken();
      const passwordResetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

      await db
        .update(users)
        .set({ passwordResetToken, passwordResetTokenExpiresAt })
        .where(eq(users.id, user.id));

      const baseUrl = (ctx.req.headers.origin as string) || ENV.appBaseUrl;
      sendEmail({
        to: email,
        subject: "Redefinir senha — RIDDY",
        html: getPasswordResetEmailHtml(user.name || "Usuário", passwordResetToken, baseUrl),
      }).catch(console.error);

      return { success: true };
    }),

  /**
   * Reset password using the token from the reset email.
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        password: z
          .string()
          .min(8, "Senha deve ter pelo menos 8 caracteres")
          .max(128),
      })
    )
    .mutation(async ({ input }) => {
      const { token, password } = input;
      const db = await getDbOrThrow();

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.passwordResetToken, token))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Token de redefinição inválido ou expirado.",
        });
      }

      if (user.passwordResetTokenExpiresAt && user.passwordResetTokenExpiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Token de redefinição expirado. Solicite um novo e-mail.",
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      await db
        .update(users)
        .set({
          passwordHash,
          passwordResetToken: null,
          passwordResetTokenExpiresAt: null,
        })
        .where(eq(users.id, user.id));

      return { success: true, message: "Senha redefinida com sucesso! Faça login." };
    }),
});
