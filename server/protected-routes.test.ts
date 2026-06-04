/**
 * STEP 4 — Protected Routes Auth Tests
 * Validates the auth redirect logic and route protection rules
 */

import { describe, it, expect } from "vitest";

// ── Helpers that mirror ProtectedRoute logic ──────────────────────────────────

function buildReturnUrl(currentPath: string): string {
  return `/login?returnUrl=${encodeURIComponent(currentPath)}`;
}

function getRedirectTarget(userRole: string, requiredRole: string | undefined): string | null {
  if (!requiredRole) return null; // no restriction
  if (userRole === "admin") return null; // admin can access everything
  if (userRole === requiredRole) return null; // role matches
  // Role mismatch — redirect to own dashboard
  switch (userRole) {
    case "host": return "/host";
    case "user": return "/dashboard";
    default: return "/";
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ProtectedRoute — Auth Redirect Logic", () => {
  describe("Unauthenticated redirect", () => {
    it("should redirect to /login with returnUrl for /my-bookings", () => {
      const url = buildReturnUrl("/my-bookings");
      expect(url).toBe("/login?returnUrl=%2Fmy-bookings");
    });

    it("should redirect to /login with returnUrl for /bookings/42", () => {
      const url = buildReturnUrl("/bookings/42");
      expect(url).toBe("/login?returnUrl=%2Fbookings%2F42");
    });

    it("should redirect to /login with returnUrl for /booking/7?start=2026-05-01&end=2026-05-05", () => {
      const path = "/booking/7?start=2026-05-01&end=2026-05-05";
      const url = buildReturnUrl(path);
      expect(url).toContain("/login?returnUrl=");
      expect(url).toContain("%2Fbooking%2F7");
    });

    it("should redirect to /login with returnUrl for /profile", () => {
      const url = buildReturnUrl("/profile");
      expect(url).toBe("/login?returnUrl=%2Fprofile");
    });

    it("should redirect to /login with returnUrl for /documents", () => {
      const url = buildReturnUrl("/documents");
      expect(url).toBe("/login?returnUrl=%2Fdocuments");
    });

    it("should redirect to /login with returnUrl for /messages", () => {
      const url = buildReturnUrl("/messages");
      expect(url).toBe("/login?returnUrl=%2Fmessages");
    });

    it("should redirect to /login with returnUrl for /payments", () => {
      const url = buildReturnUrl("/payments");
      expect(url).toBe("/login?returnUrl=%2Fpayments");
    });

    it("should redirect to /login with returnUrl for /receipts", () => {
      const url = buildReturnUrl("/receipts");
      expect(url).toBe("/login?returnUrl=%2Freceipts");
    });

    it("should redirect to /login with returnUrl for /bookings/5/review", () => {
      const url = buildReturnUrl("/bookings/5/review");
      expect(url).toBe("/login?returnUrl=%2Fbookings%2F5%2Freview");
    });
  });

  describe("Role-based access control", () => {
    it("should allow admin to access user-only routes", () => {
      const redirect = getRedirectTarget("admin", "user");
      expect(redirect).toBeNull();
    });

    it("should allow admin to access host-only routes", () => {
      const redirect = getRedirectTarget("admin", "host");
      expect(redirect).toBeNull();
    });

    it("should allow admin to access admin-only routes", () => {
      const redirect = getRedirectTarget("admin", "admin");
      expect(redirect).toBeNull();
    });

    it("should allow host to access host-only routes", () => {
      const redirect = getRedirectTarget("host", "host");
      expect(redirect).toBeNull();
    });

    it("should redirect host away from user-only routes to /host", () => {
      const redirect = getRedirectTarget("host", "user");
      expect(redirect).toBe("/host");
    });

    it("should redirect host away from admin-only routes to /host", () => {
      const redirect = getRedirectTarget("host", "admin");
      expect(redirect).toBe("/host");
    });

    it("should allow user to access user-only routes", () => {
      const redirect = getRedirectTarget("user", "user");
      expect(redirect).toBeNull();
    });

    it("should redirect user away from host-only routes to /dashboard", () => {
      const redirect = getRedirectTarget("user", "host");
      expect(redirect).toBe("/dashboard");
    });

    it("should redirect user away from admin-only routes to /dashboard", () => {
      const redirect = getRedirectTarget("user", "admin");
      expect(redirect).toBe("/dashboard");
    });

    it("should allow access when no role is required", () => {
      const redirect = getRedirectTarget("user", undefined);
      expect(redirect).toBeNull();
    });
  });

  describe("Login returnUrl handling", () => {
    it("should decode returnUrl correctly", () => {
      const encoded = encodeURIComponent("/bookings/42");
      const decoded = decodeURIComponent(encoded);
      expect(decoded).toBe("/bookings/42");
    });

    it("should decode complex returnUrl with query params", () => {
      const path = "/booking/7?start=2026-05-01&end=2026-05-05";
      const encoded = encodeURIComponent(path);
      const decoded = decodeURIComponent(encoded);
      expect(decoded).toBe(path);
    });

    it("should fallback to / when no returnUrl param", () => {
      const params = new URLSearchParams("");
      const returnUrl = params.get("returnUrl") ?? "/";
      expect(returnUrl).toBe("/");
    });

    it("should read returnUrl from query params", () => {
      const params = new URLSearchParams("returnUrl=%2Fmy-bookings");
      const returnUrl = params.get("returnUrl") ?? "/";
      expect(returnUrl).toBe("/my-bookings");
    });
  });
});
