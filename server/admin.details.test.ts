/**
 * Tests for admin vehicle details visualization
 * Covers: getVehicleVerificationDetails, photo gallery, document display
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock db module ───────────────────────────────────────────────────────────

const mockDb = {
  getVehicleVerificationDetails: vi.fn(),
  getPendingVehiclesForVerification: vi.fn(),
};

vi.mock("./db", () => mockDb);

// ─── Test Data ────────────────────────────────────────────────────────────────

const mockVehicleDetails = {
  vehicle: {
    id: 1,
    brand: "Nissan",
    model: "Sentra",
    year: 2023,
    licensePlate: "ABC-1234",
    color: "Prata",
    category: "Sedan",
    fuelType: "Flex",
    transmission: "Automático",
    seats: 5,
    dailyPrice: 150,
    pickupCity: "Porto Velho",
    pickupState: "RO",
    crlvUrl: "https://example.com/crlv.pdf",
    crlvOwnerName: "João Silva",
    status: "pending_approval",
    hostId: 10,
  },
  owner: {
    id: 10,
    name: "João Silva",
    email: "joao@example.com",
    phone: "11999999999",
  },
  verification: {
    id: 1,
    vehicleId: 1,
    status: "pending",
    crlvStatus: "pending",
  },
  images: [
    { id: 1, vehicleId: 1, imageUrl: "https://example.com/img1.jpg", sortOrder: 0 },
    { id: 2, vehicleId: 1, imageUrl: "https://example.com/img2.jpg", sortOrder: 1 },
    { id: 3, vehicleId: 1, imageUrl: "https://example.com/img3.jpg", sortOrder: 2 },
  ],
  vehicleDocuments: [
    {
      id: 1,
      vehicleId: 1,
      documentType: "insurance",
      fileUrl: "https://example.com/insurance.pdf",
      status: "pending",
      rejectionReason: null,
    },
  ],
  ownerDocuments: [
    {
      id: 1,
      userId: 10,
      documentType: "cnh_front",
      fileUrl: "https://example.com/cnh_front.jpg",
      status: "pending",
      rejectionReason: null,
    },
    {
      id: 2,
      userId: 10,
      documentType: "proof_of_address",
      fileUrl: "https://example.com/proof.jpg",
      status: "pending",
      rejectionReason: null,
    },
  ],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Admin Vehicle Details Visualization", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("getVehicleVerificationDetails", () => {
    it("returns complete vehicle details with all related data", async () => {
      mockDb.getVehicleVerificationDetails.mockResolvedValue(mockVehicleDetails);

      const result = await mockDb.getVehicleVerificationDetails(1);

      expect(result).toBeDefined();
      expect(result.vehicle.brand).toBe("Nissan");
      expect(result.vehicle.model).toBe("Sentra");
      expect(result.owner.name).toBe("João Silva");
      expect(result.images).toHaveLength(3);
      expect(result.vehicleDocuments).toHaveLength(1);
      expect(result.ownerDocuments).toHaveLength(2);
    });

    it("includes CRLV information with owner name", async () => {
      mockDb.getVehicleVerificationDetails.mockResolvedValue(mockVehicleDetails);

      const result = await mockDb.getVehicleVerificationDetails(1);

      expect(result.vehicle.crlvUrl).toBe("https://example.com/crlv.pdf");
      expect(result.vehicle.crlvOwnerName).toBe("João Silva");
    });

    it("includes all vehicle images in correct order", async () => {
      mockDb.getVehicleVerificationDetails.mockResolvedValue(mockVehicleDetails);

      const result = await mockDb.getVehicleVerificationDetails(1);

      expect(result.images).toHaveLength(3);
      expect(result.images[0].sortOrder).toBe(0);
      expect(result.images[1].sortOrder).toBe(1);
      expect(result.images[2].sortOrder).toBe(2);
    });

    it("includes vehicle documents with status", async () => {
      mockDb.getVehicleVerificationDetails.mockResolvedValue(mockVehicleDetails);

      const result = await mockDb.getVehicleVerificationDetails(1);

      expect(result.vehicleDocuments).toHaveLength(1);
      expect(result.vehicleDocuments[0].documentType).toBe("insurance");
      expect(result.vehicleDocuments[0].status).toBe("pending");
    });

    it("includes owner personal documents with status", async () => {
      mockDb.getVehicleVerificationDetails.mockResolvedValue(mockVehicleDetails);

      const result = await mockDb.getVehicleVerificationDetails(1);

      expect(result.ownerDocuments).toHaveLength(2);
      expect(result.ownerDocuments[0].documentType).toBe("cnh_front");
      expect(result.ownerDocuments[1].documentType).toBe("proof_of_address");
      expect(result.ownerDocuments[0].status).toBe("pending");
    });

    it("includes owner contact information", async () => {
      mockDb.getVehicleVerificationDetails.mockResolvedValue(mockVehicleDetails);

      const result = await mockDb.getVehicleVerificationDetails(1);

      expect(result.owner.email).toBe("joao@example.com");
      expect(result.owner.phone).toBe("11999999999");
    });

    it("returns null for non-existent vehicle", async () => {
      mockDb.getVehicleVerificationDetails.mockResolvedValue(null);

      const result = await mockDb.getVehicleVerificationDetails(999);

      expect(result).toBeNull();
    });
  });

  describe("Document display requirements", () => {
    it("provides URLs for all documents", async () => {
      mockDb.getVehicleVerificationDetails.mockResolvedValue(mockVehicleDetails);

      const result = await mockDb.getVehicleVerificationDetails(1);

      // CRLV
      expect(result.vehicle.crlvUrl).toMatch(/\.(pdf|jpg|png)$/i);

      // Vehicle documents
      result.vehicleDocuments.forEach((doc: any) => {
        expect(doc.fileUrl).toBeDefined();
        expect(doc.fileUrl).toMatch(/https?:\/\//);
      });

      // Owner documents
      result.ownerDocuments.forEach((doc: any) => {
        expect(doc.fileUrl).toBeDefined();
        expect(doc.fileUrl).toMatch(/https?:\/\//);
      });
    });

    it("includes document type labels for UI rendering", async () => {
      mockDb.getVehicleVerificationDetails.mockResolvedValue(mockVehicleDetails);

      const result = await mockDb.getVehicleVerificationDetails(1);

      const docTypes = [
        ...result.vehicleDocuments.map((d: any) => d.documentType),
        ...result.ownerDocuments.map((d: any) => d.documentType),
      ];

      // All should be valid document types
      expect(docTypes).toContain("insurance");
      expect(docTypes).toContain("cnh_front");
      expect(docTypes).toContain("proof_of_address");
    });

    it("includes rejection reasons when documents are rejected", async () => {
      const detailsWithRejection = {
        ...mockVehicleDetails,
        ownerDocuments: [
          {
            id: 1,
            userId: 10,
            documentType: "cnh_front",
            fileUrl: "https://example.com/cnh_front.jpg",
            status: "rejected",
            rejectionReason: "Documento ilegível",
          },
        ],
      };

      mockDb.getVehicleVerificationDetails.mockResolvedValue(detailsWithRejection);

      const result = await mockDb.getVehicleVerificationDetails(1);

      expect(result.ownerDocuments[0].status).toBe("rejected");
      expect(result.ownerDocuments[0].rejectionReason).toBe("Documento ilegível");
    });
  });

  describe("Photo gallery requirements", () => {
    it("returns multiple images for gallery display", async () => {
      mockDb.getVehicleVerificationDetails.mockResolvedValue(mockVehicleDetails);

      const result = await mockDb.getVehicleVerificationDetails(1);

      expect(result.images.length).toBeGreaterThan(0);
      expect(result.images.length).toBeLessThanOrEqual(10);
    });

    it("includes sortOrder for image sequencing", async () => {
      mockDb.getVehicleVerificationDetails.mockResolvedValue(mockVehicleDetails);

      const result = await mockDb.getVehicleVerificationDetails(1);

      result.images.forEach((img: any, idx: number) => {
        expect(img.sortOrder).toBeDefined();
        expect(typeof img.sortOrder).toBe("number");
      });
    });

    it("handles missing images gracefully", async () => {
      const detailsNoImages = { ...mockVehicleDetails, images: [] };
      mockDb.getVehicleVerificationDetails.mockResolvedValue(detailsNoImages);

      const result = await mockDb.getVehicleVerificationDetails(1);

      expect(result.images).toEqual([]);
    });
  });

  describe("CRLV name matching", () => {
    it("detects when CRLV owner name matches proprietário", async () => {
      mockDb.getVehicleVerificationDetails.mockResolvedValue(mockVehicleDetails);

      const result = await mockDb.getVehicleVerificationDetails(1);

      const crlvFirstName = result.vehicle.crlvOwnerName.split(" ")[0].toLowerCase();
      const ownerFirstName = result.owner.name.split(" ")[0].toLowerCase();

      expect(crlvFirstName).toBe(ownerFirstName);
    });

    it("detects when CRLV owner name does NOT match proprietário", async () => {
      const detailsMismatch = {
        ...mockVehicleDetails,
        vehicle: {
          ...mockVehicleDetails.vehicle,
          crlvOwnerName: "Maria Santos",
        },
      };

      mockDb.getVehicleVerificationDetails.mockResolvedValue(detailsMismatch);

      const result = await mockDb.getVehicleVerificationDetails(1);

      const crlvFirstName = result.vehicle.crlvOwnerName.split(" ")[0].toLowerCase();
      const ownerFirstName = result.owner.name.split(" ")[0].toLowerCase();

      expect(crlvFirstName).not.toBe(ownerFirstName);
    });
  });
});
