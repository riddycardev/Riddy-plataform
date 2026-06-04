/**
 * Tests for admin document verification procedures
 * Covers: getPendingVehiclesForVerification, approveVehicleVerification,
 *         rejectVehicleVerification, getPendingOwnerVerifications,
 *         approveUserDocument, rejectUserDocument
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock db module ───────────────────────────────────────────────────────────

const mockDb = {
  getPendingVehiclesForVerification: vi.fn(),
  getVehicleVerificationDetails: vi.fn(),
  getOwnerDocuments: vi.fn(),
  getPendingOwnerVerifications: vi.fn(),
  approveVehicleVerification: vi.fn(),
  rejectVehicleVerification: vi.fn(),
  approveUserDocument: vi.fn(),
  rejectUserDocument: vi.fn(),
  approveVehicleDocument: vi.fn(),
  rejectVehicleDocument: vi.fn(),
  getVehicleById: vi.fn(),
  createNotification: vi.fn(),
};

vi.mock("./db", () => mockDb);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const adminCtx = { user: { id: 1, role: "admin" as const } };
const userCtx = { user: { id: 2, role: "user" as const } };

// ─── getPendingVehiclesForVerification ────────────────────────────────────────

describe("getPendingVehiclesForVerification", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns enriched vehicles with images and documents", async () => {
    const mockVehicle = {
      vehicle: { id: 1, brand: "Nissan", model: "Sentra", status: "pending_approval", hostId: 10 },
      owner: { id: 10, name: "João Silva", email: "joao@example.com" },
      verification: { id: 1, vehicleId: 1, status: "pending", crlvStatus: "pending" },
      images: [{ id: 1, vehicleId: 1, imageUrl: "https://example.com/img.jpg" }],
      vehicleDocuments: [],
      ownerDocuments: [{ id: 1, userId: 10, documentType: "cnh_front", status: "pending" }],
    };

    mockDb.getPendingVehiclesForVerification.mockResolvedValue([mockVehicle]);

    const result = await mockDb.getPendingVehiclesForVerification();

    expect(result).toHaveLength(1);
    expect(result[0].vehicle.brand).toBe("Nissan");
    expect(result[0].images).toHaveLength(1);
    expect(result[0].ownerDocuments).toHaveLength(1);
  });

  it("returns empty array when no pending vehicles", async () => {
    mockDb.getPendingVehiclesForVerification.mockResolvedValue([]);
    const result = await mockDb.getPendingVehiclesForVerification();
    expect(result).toEqual([]);
  });
});

// ─── approveVehicleVerification ───────────────────────────────────────────────

describe("approveVehicleVerification", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls approveVehicleVerification with correct params", async () => {
    mockDb.approveVehicleVerification.mockResolvedValue(undefined);
    mockDb.getVehicleById.mockResolvedValue({
      id: 1,
      brand: "Nissan",
      model: "Sentra",
      hostId: 10,
    });
    mockDb.createNotification.mockResolvedValue(1);

    await mockDb.approveVehicleVerification(1, 1, "Looks good");

    expect(mockDb.approveVehicleVerification).toHaveBeenCalledWith(1, 1, "Looks good");
  });

  it("sends notification to vehicle owner on approval", async () => {
    mockDb.getVehicleById.mockResolvedValue({ id: 1, brand: "Nissan", model: "Sentra", hostId: 10 });
    mockDb.createNotification.mockResolvedValue(1);

    await mockDb.getVehicleById(1);
    const vehicle = await mockDb.getVehicleById(1);

    if (vehicle?.hostId) {
      await mockDb.createNotification({
        userId: vehicle.hostId,
        notificationType: "document_approved",
        title: "Veículo Aprovado! ✅",
        message: `Parabéns! Seu veículo ${vehicle.brand} ${vehicle.model} foi aprovado.`,
        relatedId: 1,
        relatedType: "vehicle",
      });
    }

    expect(mockDb.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 10,
        notificationType: "document_approved",
      })
    );
  });
});

// ─── rejectVehicleVerification ────────────────────────────────────────────────

describe("rejectVehicleVerification", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls rejectVehicleVerification with reason", async () => {
    mockDb.rejectVehicleVerification.mockResolvedValue(undefined);
    await mockDb.rejectVehicleVerification(1, 1, "CRLV ilegível", "Admin notes");
    expect(mockDb.rejectVehicleVerification).toHaveBeenCalledWith(
      1, 1, "CRLV ilegível", "Admin notes"
    );
  });

  it("sends rejection notification to owner", async () => {
    mockDb.getVehicleById.mockResolvedValue({ id: 1, brand: "Nissan", model: "Sentra", hostId: 10 });
    mockDb.createNotification.mockResolvedValue(1);

    const vehicle = await mockDb.getVehicleById(1);
    if (vehicle?.hostId) {
      await mockDb.createNotification({
        userId: vehicle.hostId,
        notificationType: "document_rejected",
        title: "Veículo Rejeitado",
        message: `Seu veículo ${vehicle.brand} ${vehicle.model} foi rejeitado. Motivo: CRLV ilegível`,
        relatedId: 1,
        relatedType: "vehicle",
      });
    }

    expect(mockDb.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 10,
        notificationType: "document_rejected",
        title: "Veículo Rejeitado",
      })
    );
  });
});

// ─── approveUserDocument / rejectUserDocument ─────────────────────────────────

describe("approveUserDocument", () => {
  beforeEach(() => vi.clearAllMocks());

  it("approves a user document", async () => {
    mockDb.approveUserDocument.mockResolvedValue(undefined);
    await mockDb.approveUserDocument(5, 1);
    expect(mockDb.approveUserDocument).toHaveBeenCalledWith(5, 1);
  });
});

describe("rejectUserDocument", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a user document with reason", async () => {
    mockDb.rejectUserDocument.mockResolvedValue(undefined);
    await mockDb.rejectUserDocument(5, 1, "Documento ilegível");
    expect(mockDb.rejectUserDocument).toHaveBeenCalledWith(5, 1, "Documento ilegível");
  });
});

// ─── getPendingOwnerVerifications ─────────────────────────────────────────────

describe("getPendingOwnerVerifications", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns users with pending documents", async () => {
    mockDb.getPendingOwnerVerifications.mockResolvedValue([
      {
        user: { id: 10, name: "João Silva", email: "joao@example.com" },
        documents: [
          { id: 1, userId: 10, documentType: "cnh_front", status: "pending", fileUrl: "https://example.com/cnh.jpg" },
        ],
      },
    ]);

    const result = await mockDb.getPendingOwnerVerifications();
    expect(result).toHaveLength(1);
    expect(result[0].user.name).toBe("João Silva");
    expect(result[0].documents).toHaveLength(1);
    expect(result[0].documents[0].documentType).toBe("cnh_front");
  });

  it("returns empty when no pending owners", async () => {
    mockDb.getPendingOwnerVerifications.mockResolvedValue([]);
    const result = await mockDb.getPendingOwnerVerifications();
    expect(result).toEqual([]);
  });
});
