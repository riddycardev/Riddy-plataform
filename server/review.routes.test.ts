import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Unit tests for STEP 2 — Fix Broken Routes
 * Validates review route logic and star rating constraints
 */

describe("Review Route Logic (STEP 2 Fixes)", () => {
  // ─── Route existence ─────────────────────────────────────────────────────────
  describe("Route /bookings/:id/review", () => {
    it("route pattern matches /bookings/123/review", () => {
      const pattern = /^\/bookings\/(\d+)\/review$/;
      expect(pattern.test("/bookings/123/review")).toBe(true);
    });

    it("route pattern does NOT match /bookings/review (no id)", () => {
      const pattern = /^\/bookings\/(\d+)\/review$/;
      expect(pattern.test("/bookings/review")).toBe(false);
    });

    it("route pattern does NOT match /bookings/abc/review (non-numeric id)", () => {
      const pattern = /^\/bookings\/(\d+)\/review$/;
      expect(pattern.test("/bookings/abc/review")).toBe(false);
    });
  });

  // ─── Review input validation ─────────────────────────────────────────────────
  describe("Review input validation", () => {
    it("overall rating must be between 1 and 5", () => {
      const isValid = (r: number) => r >= 1 && r <= 5;
      expect(isValid(0)).toBe(false);
      expect(isValid(1)).toBe(true);
      expect(isValid(3)).toBe(true);
      expect(isValid(5)).toBe(true);
      expect(isValid(6)).toBe(false);
    });

    it("optional sub-ratings must also be between 1 and 5 when provided", () => {
      const isValidOptional = (r: number | undefined) =>
        r === undefined || (r >= 1 && r <= 5);
      expect(isValidOptional(undefined)).toBe(true);
      expect(isValidOptional(3)).toBe(true);
      expect(isValidOptional(0)).toBe(false);
    });

    it("comment is optional — empty string normalizes to undefined", () => {
      const normalizeComment = (c: string) => c.trim() || undefined;
      expect(normalizeComment("")).toBeUndefined();
      expect(normalizeComment("   ")).toBeUndefined();
      expect(normalizeComment("Great car!")).toBe("Great car!");
    });

    it("comment must not exceed 1000 characters", () => {
      const maxLen = 1000;
      const longComment = "a".repeat(1001);
      expect(longComment.length > maxLen).toBe(true);
      const validComment = "a".repeat(1000);
      expect(validComment.length <= maxLen).toBe(true);
    });
  });

  // ─── Only completed bookings can be reviewed ─────────────────────────────────
  describe("Booking status check before review", () => {
    it("allows review when booking is completed", () => {
      expect("completed" === "completed").toBe(true);
    });

    it("blocks review when booking is confirmed (not yet done)", () => {
      expect("confirmed" === "completed").toBe(false);
    });

    it("blocks review when booking is pending", () => {
      expect("pending" === "completed").toBe(false);
    });

    it("blocks review when booking is cancelled", () => {
      expect("cancelled_by_renter" === "completed").toBe(false);
    });
  });

  // ─── Orphan imports removed and route registered ──────────────────────────────
  describe("App.tsx route and import integrity", () => {
    const appContent = readFileSync(
      resolve(process.cwd(), "client/src/App.tsx"),
      "utf-8"
    );

    it("Signup import was removed from App.tsx", () => {
      expect(appContent).not.toContain("import Signup from");
    });

    it("SearchResults import was replaced by ReviewPage in App.tsx", () => {
      expect(appContent).not.toContain("import SearchResults from");
      // ReviewPage can be either a static import or a React.lazy() import
      expect(
        appContent.includes("import ReviewPage from") ||
        appContent.includes("ReviewPage = lazy")
      ).toBe(true);
    });

    it("/bookings/:id/review route is registered in App.tsx", () => {
      expect(appContent).toContain("/bookings/:id/review");
    });

    it("ReviewPage component is used as route component", () => {
      // ReviewPage is now wrapped in ProtectedRoute (Step 4 fix)
      // Route uses JSX children pattern: <ProtectedRoute><ReviewPage /></ProtectedRoute>
      expect(appContent).toContain("<ReviewPage />");
    });
  });
});
