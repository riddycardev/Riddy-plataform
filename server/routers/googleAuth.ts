/**
 * RIDDY Google OAuth Handler
 * Handles Google OAuth login/register flow.
 * Uses Google's OAuth2 to authenticate users and create RIDDY sessions.
 */
import { TRPCError } from "@trpc/server";
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

export const googleAuthRouter = router({
  /**
   * Get the Google OAuth authorization URL.
   * Frontend redirects user to this URL to start the Google login flow.
   */
  getAuthUrl: publicProcedure
    .input(z.object({ role: z.enum(["user", "host"]).default("user") }))
    .query(({ input, ctx }) => {
      const clientId = ENV.googleClientId;
      if (!clientId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Google OAuth não configurado.",
        });
      }

      const baseUrl = (ctx.req.headers.origin as string) || ENV.appBaseUrl;
      const redirectUri = `${baseUrl}/api/auth/google/callback`;

      const state = Buffer.from(JSON.stringify({ role: input.role, ts: Date.now() })).toString("base64url");

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        state,
        access_type: "offline",
        prompt: "select_account",
      });

      return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` };
    }),
});

/**
 * Express route handler for Google OAuth callback.
 * Called by Google after user authorizes the app.
 * Registers/logs in the user and redirects to the app.
 */
export async function handleGoogleCallback(req: any, res: any): Promise<void> {
  const { code, state, error } = req.query;

  if (error) {
    console.error("[Google OAuth] Error from Google:", error);
    return res.redirect("/?auth_error=google_denied");
  }

  if (!code) {
    return res.redirect("/?auth_error=no_code");
  }

  try {
    // Parse state to get role
    let role: "user" | "host" = "user";
    try {
      const stateData = JSON.parse(Buffer.from(state as string, "base64url").toString());
      role = stateData.role || "user";
    } catch {}

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: ENV.googleClientId,
        client_secret: ENV.googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      console.error("[Google OAuth] Token exchange failed:", await tokenResponse.text());
      return res.redirect("/?auth_error=token_exchange");
    }

    const tokens = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      return res.redirect("/?auth_error=userinfo_failed");
    }

    const googleUser = await userInfoResponse.json();
    const { id: googleId, email, name, picture } = googleUser;

    if (!email) {
      return res.redirect("/?auth_error=no_email");
    }

    const db = await getDb();
    if (!db) {
      return res.redirect("/?auth_error=db_unavailable");
    }

    // Check if user exists by Google ID or email
    const openIdForGoogle = `google_${googleId}`;
    let [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.openId, openIdForGoogle))
      .limit(1);

    if (!existingUser) {
      // Check by email (user might have registered with email/password first)
      const [emailUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      if (emailUser) {
        // Link Google to existing account
        await db
          .update(users)
          .set({ openId: openIdForGoogle, loginMethod: "google", emailVerified: true, lastSignedIn: new Date() })
          .where(eq(users.id, emailUser.id));
        existingUser = { ...emailUser, openId: openIdForGoogle };
      } else {
        // Create new user
        await db.insert(users).values({
          openId: openIdForGoogle,
          name: name || email.split("@")[0],
          email: email.toLowerCase(),
          loginMethod: "google",
          role,
          emailVerified: true, // Google emails are pre-verified
          avatarUrl: picture || null,
          lastSignedIn: new Date(),
        });

        const [newUser] = await db
          .select()
          .from(users)
          .where(eq(users.openId, openIdForGoogle))
          .limit(1);
        existingUser = newUser;
      }
    } else {
      // Update last signed in
      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, existingUser.id));
    }

    // Create session
    const sessionToken = await sdk.createSessionToken(existingUser.openId, {
      name: existingUser.name || "",
      expiresInMs: ONE_YEAR_MS,
    });

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

    // Redirect to home or dashboard
    return res.redirect("/");
  } catch (err) {
    console.error("[Google OAuth] Unexpected error:", err);
    return res.redirect("/?auth_error=unexpected");
  }
}
