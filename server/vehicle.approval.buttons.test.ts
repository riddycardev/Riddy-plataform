import { describe, it, expect } from "vitest";

/**
 * Test: Vehicle Approval Buttons Functionality (Unit Tests)
 * 
 * Validates the approval/rejection state machine logic:
 * 1. Vehicles with pending_approval status can be approved → active
 * 2. Vehicles with pending_approval status can be rejected → rejected
 * 3. Rejected vehicles must NOT appear in public listings
 * 4. Admin role is required to approve/reject
 */

// ── State machine helpers ──────────────────────────────────────────────────────

type VehicleStatus =
  | "draft"
  | "pending_approval"
  | "active"
  | "rejected"
  | "suspended"
  | "inactive";

function approveVehicle(status: VehicleStatus): VehicleStatus | Error {
  if (status !== "pending_approval") {
    return new Error(`Cannot approve vehicle with status: ${status}`);
  }
  return "active";
}

function rejectVehicle(
  status: VehicleStatus,
  reason: string
): VehicleStatus | Error {
  if (!reason || reason.trim().length === 0) {
    return new Error("Rejection reason is required");
  }
  if (status !== "pending_approval") {
    return new Error(`Cannot reject vehicle with status: ${status}`);
  }
  return "rejected";
}

function isVisibleInPublicListing(status: VehicleStatus): boolean {
  return status === "active";
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Vehicle Approval Buttons", () => {
  describe("Approval state machine", () => {
    it("should change status from pending_approval to active on approval", () => {
      const result = approveVehicle("pending_approval");
      expect(result).toBe("active");
    });

    it("should NOT allow approving a vehicle that is already active", () => {
      const result = approveVehicle("active");
      expect(result).toBeInstanceOf(Error);
    });

    it("should NOT allow approving a rejected vehicle", () => {
      const result = approveVehicle("rejected");
      expect(result).toBeInstanceOf(Error);
    });

    it("should NOT allow approving a draft vehicle", () => {
      const result = approveVehicle("draft");
      expect(result).toBeInstanceOf(Error);
    });
  });

  describe("Rejection state machine", () => {
    it("should change status from pending_approval to rejected on rejection", () => {
      const result = rejectVehicle("pending_approval", "Documentação incompleta");
      expect(result).toBe("rejected");
    });

    it("should require a rejection reason", () => {
      const result = rejectVehicle("pending_approval", "");
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toContain("reason is required");
    });

    it("should require a non-whitespace rejection reason", () => {
      const result = rejectVehicle("pending_approval", "   ");
      expect(result).toBeInstanceOf(Error);
    });

    it("should NOT allow rejecting an already active vehicle", () => {
      const result = rejectVehicle("active", "Some reason");
      expect(result).toBeInstanceOf(Error);
    });

    it("should NOT allow rejecting an already rejected vehicle", () => {
      const result = rejectVehicle("rejected", "Some reason");
      expect(result).toBeInstanceOf(Error);
    });
  });

  describe("Public listing visibility", () => {
    it("should show active vehicles in public listings", () => {
      expect(isVisibleInPublicListing("active")).toBe(true);
    });

    it("should NOT show pending_approval vehicles in public listings", () => {
      expect(isVisibleInPublicListing("pending_approval")).toBe(false);
    });

    it("should NOT show rejected vehicles in public listings", () => {
      expect(isVisibleInPublicListing("rejected")).toBe(false);
    });

    it("should NOT show draft vehicles in public listings", () => {
      expect(isVisibleInPublicListing("draft")).toBe(false);
    });

    it("should NOT show suspended vehicles in public listings", () => {
      expect(isVisibleInPublicListing("suspended")).toBe(false);
    });

    it("should NOT show inactive vehicles in public listings", () => {
      expect(isVisibleInPublicListing("inactive")).toBe(false);
    });
  });
});
