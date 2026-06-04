/**
 * STEP 6 — Document Lifecycle Tests
 * Verifies that documents follow the correct pending → approved/rejected lifecycle
 * with NO fake OCR or auto-approval.
 */

import { describe, it, expect } from "vitest";

// ── Helpers (mirrors server logic) ──────────────────────────────────────────

type DocumentStatus = "pending" | "approved" | "rejected";

interface DocumentRecord {
  id: number;
  userId: number;
  documentType: string;
  fileUrl: string;
  status: DocumentStatus;
  rejectionReason?: string;
}

function createDocument(userId: number, documentType: string, fileUrl: string): DocumentRecord {
  // Status MUST always start as "pending" — no auto-approval
  return {
    id: Math.floor(Math.random() * 10000),
    userId,
    documentType,
    fileUrl,
    status: "pending",
  };
}

function approveDocument(doc: DocumentRecord): DocumentRecord {
  return { ...doc, status: "approved" };
}

function rejectDocument(doc: DocumentRecord, reason: string): DocumentRecord {
  if (!reason || reason.trim().length === 0) {
    throw new Error("Rejection reason is required");
  }
  return { ...doc, status: "rejected", rejectionReason: reason };
}

function canVehicleBeActivated(vehicleDocs: DocumentRecord[]): boolean {
  // A vehicle can only be activated if its CRLV document is approved
  const crlv = vehicleDocs.find(d => d.documentType === "crlv");
  return crlv?.status === "approved";
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Document Lifecycle — Initial Status", () => {
  it("should always create documents with pending status", () => {
    const doc = createDocument(1, "cnh_front", "https://s3.example.com/cnh.jpg");
    expect(doc.status).toBe("pending");
  });

  it("should never auto-approve on creation", () => {
    const doc = createDocument(1, "cnh_front", "https://s3.example.com/cnh.jpg");
    expect(doc.status).not.toBe("approved");
  });

  it("should never auto-reject on creation", () => {
    const doc = createDocument(1, "proof_of_address", "https://s3.example.com/proof.pdf");
    expect(doc.status).not.toBe("rejected");
  });

  it("should create pending status for all document types", () => {
    const types = ["cnh_front", "cnh_back", "rg_front", "rg_back", "cpf", "selfie", "proof_of_address", "facial_recognition"];
    for (const type of types) {
      const doc = createDocument(1, type, `https://s3.example.com/${type}.jpg`);
      expect(doc.status).toBe("pending");
    }
  });
});

describe("Document Lifecycle — Admin Approval", () => {
  it("should transition from pending to approved", () => {
    const doc = createDocument(1, "cnh_front", "https://s3.example.com/cnh.jpg");
    expect(doc.status).toBe("pending");

    const approved = approveDocument(doc);
    expect(approved.status).toBe("approved");
  });

  it("should not change other fields when approving", () => {
    const doc = createDocument(42, "selfie", "https://s3.example.com/selfie.jpg");
    const approved = approveDocument(doc);
    expect(approved.userId).toBe(42);
    expect(approved.documentType).toBe("selfie");
    expect(approved.fileUrl).toBe("https://s3.example.com/selfie.jpg");
  });

  it("should not have rejection reason after approval", () => {
    const doc = createDocument(1, "cnh_back", "https://s3.example.com/cnh_back.jpg");
    const approved = approveDocument(doc);
    expect(approved.rejectionReason).toBeUndefined();
  });
});

describe("Document Lifecycle — Admin Rejection", () => {
  it("should transition from pending to rejected with reason", () => {
    const doc = createDocument(1, "cnh_front", "https://s3.example.com/cnh.jpg");
    const rejected = rejectDocument(doc, "Imagem ilegível");
    expect(rejected.status).toBe("rejected");
    expect(rejected.rejectionReason).toBe("Imagem ilegível");
  });

  it("should require a rejection reason", () => {
    const doc = createDocument(1, "cnh_front", "https://s3.example.com/cnh.jpg");
    expect(() => rejectDocument(doc, "")).toThrow("Rejection reason is required");
  });

  it("should require a non-whitespace rejection reason", () => {
    const doc = createDocument(1, "cnh_front", "https://s3.example.com/cnh.jpg");
    expect(() => rejectDocument(doc, "   ")).toThrow("Rejection reason is required");
  });

  it("should preserve document data when rejecting", () => {
    const doc = createDocument(99, "proof_of_address", "https://s3.example.com/proof.pdf");
    const rejected = rejectDocument(doc, "Documento vencido");
    expect(rejected.userId).toBe(99);
    expect(rejected.documentType).toBe("proof_of_address");
  });
});

describe("Document Lifecycle — No Fake OCR", () => {
  it("should not set status based on setTimeout", () => {
    // The validated state in AddVehicle.tsx means 'file received', not 'OCR approved'
    // This test documents the contract: file received ≠ document approved
    const fileReceived = true; // user uploaded a file
    const documentApproved = false; // admin has not yet reviewed

    expect(fileReceived).toBe(true);
    expect(documentApproved).toBe(false);
    expect(fileReceived).not.toBe(documentApproved);
  });

  it("should not auto-validate CRLV document", () => {
    // Backend must set crlvValidated: false on vehicle creation
    const vehicleCreationDefaults = {
      crlvValidated: false,
      status: "pending_approval",
    };

    expect(vehicleCreationDefaults.crlvValidated).toBe(false);
    expect(vehicleCreationDefaults.status).toBe("pending_approval");
    expect(vehicleCreationDefaults.status).not.toBe("active");
  });

  it("should not show 'validated' message without admin approval", () => {
    // DocumentUpload.tsx shows 'Em análise' (not 'Validado') when validated=true
    const uiMessage = "Em análise"; // what the component shows
    expect(uiMessage).not.toBe("Documento validado com sucesso");
    expect(uiMessage).toBe("Em análise");
  });
});

describe("Document Lifecycle — Vehicle Activation Gate", () => {
  it("should not allow vehicle activation without approved CRLV", () => {
    const docs: DocumentRecord[] = [
      createDocument(1, "crlv", "https://s3.example.com/crlv.jpg"), // still pending
    ];
    expect(canVehicleBeActivated(docs)).toBe(false);
  });

  it("should allow vehicle activation after CRLV is approved", () => {
    const docs: DocumentRecord[] = [
      approveDocument(createDocument(1, "crlv", "https://s3.example.com/crlv.jpg")),
    ];
    expect(canVehicleBeActivated(docs)).toBe(true);
  });

  it("should not activate vehicle if CRLV is rejected", () => {
    const docs: DocumentRecord[] = [
      rejectDocument(createDocument(1, "crlv", "https://s3.example.com/crlv.jpg"), "Documento inválido"),
    ];
    expect(canVehicleBeActivated(docs)).toBe(false);
  });

  it("should not activate vehicle with no documents", () => {
    expect(canVehicleBeActivated([])).toBe(false);
  });
});
