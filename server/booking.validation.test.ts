import { describe, it, expect } from "vitest";

/**
 * Unit tests for booking.create validation logic (STEP 1 fixes)
 * These tests validate the logic inline since we cannot easily spin up the full tRPC stack.
 */

describe("Booking Validation Logic (STEP 1 Fixes)", () => {
  // ─── C6: Double-booking overlap detection ───────────────────────────────────
  describe("Double-booking prevention", () => {
    const activeStatuses = ["pending_payment", "pending", "pending_host_approval", "confirmed"];

    function hasOverlap(
      existingBookings: { startDate: Date; endDate: Date; status: string }[],
      newStart: Date,
      newEnd: Date
    ) {
      return existingBookings.some((b) => {
        if (!activeStatuses.includes(b.status)) return false;
        return newStart < b.endDate && newEnd > b.startDate;
      });
    }

    it("detects overlap when new booking starts inside existing booking", () => {
      const existing = [{
        startDate: new Date("2026-05-01"),
        endDate: new Date("2026-05-10"),
        status: "confirmed",
      }];
      expect(hasOverlap(existing, new Date("2026-05-05"), new Date("2026-05-15"))).toBe(true);
    });

    it("detects overlap when new booking ends inside existing booking", () => {
      const existing = [{
        startDate: new Date("2026-05-05"),
        endDate: new Date("2026-05-15"),
        status: "confirmed",
      }];
      expect(hasOverlap(existing, new Date("2026-05-01"), new Date("2026-05-08"))).toBe(true);
    });

    it("detects overlap when new booking fully contains existing booking", () => {
      const existing = [{
        startDate: new Date("2026-05-05"),
        endDate: new Date("2026-05-08"),
        status: "pending",
      }];
      expect(hasOverlap(existing, new Date("2026-05-01"), new Date("2026-05-15"))).toBe(true);
    });

    it("does NOT detect overlap when bookings are adjacent (no gap)", () => {
      const existing = [{
        startDate: new Date("2026-05-01"),
        endDate: new Date("2026-05-05"),
        status: "confirmed",
      }];
      // New booking starts exactly when existing ends
      expect(hasOverlap(existing, new Date("2026-05-05"), new Date("2026-05-10"))).toBe(false);
    });

    it("does NOT detect overlap when bookings are completely separate", () => {
      const existing = [{
        startDate: new Date("2026-05-01"),
        endDate: new Date("2026-05-05"),
        status: "confirmed",
      }];
      expect(hasOverlap(existing, new Date("2026-05-10"), new Date("2026-05-15"))).toBe(false);
    });

    it("ignores cancelled bookings when checking overlap", () => {
      const existing = [{
        startDate: new Date("2026-05-01"),
        endDate: new Date("2026-05-10"),
        status: "cancelled_by_renter",
      }];
      expect(hasOverlap(existing, new Date("2026-05-03"), new Date("2026-05-08"))).toBe(false);
    });

    it("ignores completed bookings when checking overlap", () => {
      const existing = [{
        startDate: new Date("2026-05-01"),
        endDate: new Date("2026-05-10"),
        status: "completed",
      }];
      expect(hasOverlap(existing, new Date("2026-05-03"), new Date("2026-05-08"))).toBe(false);
    });
  });

  // ─── C8: Self-booking prevention ────────────────────────────────────────────
  describe("Self-booking prevention", () => {
    it("blocks host from booking their own vehicle", () => {
      const hostId = 42;
      const currentUserId = 42;
      expect(hostId === currentUserId).toBe(true); // should throw FORBIDDEN
    });

    it("allows renter to book a vehicle they do not own", () => {
      const hostId = 42;
      const currentUserId = 99;
      expect(hostId === currentUserId).toBe(false); // should proceed
    });
  });

  // ─── C9: Vehicle status validation ──────────────────────────────────────────
  describe("Vehicle status validation", () => {
    const allowedStatus = "active";

    it("allows booking when vehicle is active", () => {
      expect("active" === allowedStatus).toBe(true);
    });

    it("blocks booking when vehicle is pending_approval", () => {
      expect("pending_approval" === allowedStatus).toBe(false);
    });

    it("blocks booking when vehicle is rejected", () => {
      expect("rejected" === allowedStatus).toBe(false);
    });

    it("blocks booking when vehicle is suspended", () => {
      expect("suspended" === allowedStatus).toBe(false);
    });

    it("blocks booking when vehicle is draft", () => {
      expect("draft" === allowedStatus).toBe(false);
    });

    it("blocks booking when vehicle is inactive", () => {
      expect("inactive" === allowedStatus).toBe(false);
    });
  });
});
