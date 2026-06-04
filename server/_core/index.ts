import "dotenv/config";
import express from "express";
import helmet from "helmet";
import { trpcAuthRateLimiter, globalTrpcLimiter, oauthLimiter, uploadLimiter, webhookLimiter, getClientIp } from "./rateLimiter";
import { logSecurityEvent } from "./securityLogger";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { imageProxyHandler } from "../imageProxy";
import mpWebhookRouter from "../mercadopago/webhook";
import { handleGoogleCallback } from "../routers/googleAuth";
import documentUploadRouter from "../documentUpload.router";
import { csrfTokenHandler } from "./csrf";
import { registerStorageProxy } from "./storageProxy";
import { getMPPaymentStatus } from "../mercadopago.service";
import { getPaymentByMpId, updatePaymentStatus, updateBookingStatus } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

const IS_PRODUCTION = process.env.NODE_ENV === "production";

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Explicitly disable X-Powered-By at the Express app level.
  // helmet's xPoweredBy option removes it from helmet's own responses,
  // but this ensures it's removed from ALL responses including Vite middleware.
  app.disable("x-powered-by");

  // ── Security headers (helmet) ────────────────────────────────────────────────
  // Must be the FIRST middleware so all responses include security headers.
  app.use(
    helmet({
      // Content-Security-Policy: restrict sources to prevent XSS
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            // Vite HMR in development requires inline scripts
            ...(IS_PRODUCTION ? [] : ["'unsafe-inline'", "'unsafe-eval'"]),
            "'unsafe-inline'", // Required for Mercado Pago SDK inline scripts
            "https://maps.googleapis.com",
            "https://fonts.googleapis.com",
            "https://sdk.mercadopago.com",
            "https://www.mercadopago.com",
            "https://secure.mlstatic.com",
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'", // Required for Tailwind CSS-in-JS and shadcn/ui
            "https://fonts.googleapis.com",
          ],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
          imgSrc: [
            "'self'",
            "data:",
            "blob:",
            "https:", // Allow images from any HTTPS source (S3, Cloudinary, etc.)
          ],
          connectSrc: [
            "'self'",
            "https://maps.googleapis.com",
            "https://viacep.com.br",
            "https://servicodados.ibge.gov.br",
            // Mercado Pago API and SDK connections
            "https://api.mercadopago.com",
            "https://www.mercadopago.com",
            "https://secure.mlstatic.com",
            "https://http2.mlstatic.com",
            "https://events.mercadopago.com",
            // Vite HMR WebSocket in development
            ...(IS_PRODUCTION ? [] : ["ws://localhost:*", "wss://localhost:*"]),
          ],
          frameSrc: [
            // Mercado Pago 3DS challenge iframe
            "https://www.mercadopago.com",
            "https://secure.mlstatic.com",
          ],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: IS_PRODUCTION ? [] : null,
        },
      },
      // X-Frame-Options: DENY — prevents clickjacking
      frameguard: { action: "deny" },
      // X-Content-Type-Options: nosniff — prevents MIME type sniffing
      noSniff: true,
      // Strict-Transport-Security — enforces HTTPS in production
      hsts: IS_PRODUCTION
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
      // Referrer-Policy: strict-origin-when-cross-origin
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      // X-Powered-By is removed by helmet by default
      xPoweredBy: false,
    })
  );
  // ────────────────────────────────────────────────────────────────────────────

  // Mercado Pago webhook MUST be registered BEFORE express.json() to access raw body for HMAC verification
  // Rate limited: 100 req/min per IP to block DDoS while allowing legitimate MP traffic
  // express.raw({ type: "*/*" }) accepts any Content-Type so MP simulation events
  // (sent without Content-Type header) are also captured as raw Buffer for HMAC verification.
  app.use("/api/mercadopago", webhookLimiter, express.raw({ type: "*/*" }), mpWebhookRouter);

  
  // Document upload endpoint (multipart/form-data)
  // Must be registered BEFORE express.json() middleware to handle multipart correctly
  app.use("/api/upload", uploadLimiter, documentUploadRouter);
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // OAuth callback under /api/oauth/callback (rate limited: 20 req/min per IP)
  app.use("/api/oauth", oauthLimiter);
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // Google OAuth callback
  app.get("/api/auth/google/callback", handleGoogleCallback);
  // Image proxy endpoint
  app.get("/api/image-proxy", imageProxyHandler);
  // ETAPA 13: CSRF token endpoint — issues signed tokens for sensitive mutations
  app.get("/api/csrf-token", csrfTokenHandler);

  // 3DS polling endpoint: check MP payment status for 3DS challenge resolution
  app.get("/api/mp/payment-status", async (req, res) => {
    const { mpPaymentId, bookingId } = req.query as { mpPaymentId?: string; bookingId?: string };
    if (!mpPaymentId || !bookingId) {
      return res.status(400).json({ error: "Missing mpPaymentId or bookingId" });
    }
    try {
      const mpStatus = await getMPPaymentStatus(mpPaymentId);
      // If approved, update booking and payment in DB
      if (mpStatus.status === "approved") {
        const payment = await getPaymentByMpId(mpPaymentId);
        if (payment) {
          await updatePaymentStatus(payment.id, "completed", { mpPaymentId });
          await updateBookingStatus(parseInt(bookingId), "confirmed");
        }
      }
      return res.json({ status: mpStatus.status, statusDetail: mpStatus.statusDetail });
    } catch (err) {
      return res.status(500).json({ error: "Failed to check payment status" });
    }
  });
  // tRPC API — smart rate limiter routes auth procedures to tighter limits
  app.use(
    "/api/trpc",
    trpcAuthRateLimiter,
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ error, path, ctx }) {
        // ETAPA 10: Automatically log all FORBIDDEN and UNAUTHORIZED events
        if (error.code === "FORBIDDEN" || error.code === "UNAUTHORIZED") {
          const req = (ctx as any)?.req;
          const user = (ctx as any)?.user;
          logSecurityEvent({
            eventType: error.code === "FORBIDDEN" ? "FORBIDDEN" : "UNAUTHORIZED",
            severity: error.code === "FORBIDDEN" ? "high" : "medium",
            userId: user?.id ?? null,
            endpoint: path ?? "unknown",
            method: req?.method,
            ipAddress: req ? getClientIp(req) : "unknown",
            userAgent: req?.headers?.["user-agent"],
            details: { message: error.message },
            statusCode: error.code === "FORBIDDEN" ? 403 : 401,
          });
        }
      },
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // Cleanup job: cancel abandoned pending_payment bookings every 10 minutes.
  // Bookings older than 30 minutes without payment are freed up so other users can book the same dates.
  const { cancelExpiredPendingBookings } = await import("../db");
  setInterval(async () => {
    try {
      await cancelExpiredPendingBookings(30);
    } catch (err) {
      console.error("[Cleanup] Error cancelling expired bookings:", err);
    }
  }, 10 * 60 * 1000); // every 10 minutes

  // Run once immediately on startup to clean up any leftover bookings from previous sessions
  try {
    await cancelExpiredPendingBookings(30);
  } catch (err) {
    console.error("[Cleanup] Initial cleanup error:", err);
  }
}

startServer().catch(console.error);
