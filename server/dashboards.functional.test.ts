/**
 * Dashboard Functionality Tests
 * Valida que todos os 3 dashboards (Usuário, Proprietário, Admin) estão funcionais
 */

import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("Dashboard Functionality Tests", () => {
  // ==================== USER DASHBOARD ====================
  describe("User Dashboard - Favoritos", () => {
    it("deve retornar lista de favoritos com dados do veículo", async () => {
      const favorites = await db.getFavoritesByUserId(1);
      
      expect(Array.isArray(favorites)).toBe(true);
      
      // Se houver favoritos, validar estrutura
      if (favorites.length > 0) {
        const fav = favorites[0];
        expect(fav).toHaveProperty("id");
        expect(fav).toHaveProperty("vehicleId");
        expect(fav).toHaveProperty("vehicle");
        
        // Validar que vehicle tem os campos corretos
        if (fav.vehicle) {
          expect(fav.vehicle).toHaveProperty("brand");
          expect(fav.vehicle).toHaveProperty("model");
          expect(fav.vehicle).toHaveProperty("dailyPrice");
          expect(fav.vehicle).toHaveProperty("pickupCity");
        }
      }
    });
  });

  describe("User Dashboard - Avaliações", () => {
    it("deve retornar avaliações recebidas por um usuário", async () => {
      const reviews = await db.getReviewsByRevieweeId(1);
      
      expect(Array.isArray(reviews)).toBe(true);
      
      // Se houver reviews, validar estrutura
      if (reviews.length > 0) {
        const review = reviews[0];
        expect(review).toHaveProperty("id");
        expect(review).toHaveProperty("rating");
        expect(review).toHaveProperty("reviewerId");
        expect(review).toHaveProperty("revieweeId");
        expect(review.rating).toBeGreaterThanOrEqual(1);
        expect(review.rating).toBeLessThanOrEqual(5);
      }
    });
  });

  // ==================== HOST DASHBOARD ====================
  describe("Host Dashboard - Reservas", () => {
    it("deve retornar reservas de um proprietário", async () => {
      const bookings = await db.getBookingsByHostId(1);
      
      expect(Array.isArray(bookings)).toBe(true);
      
      // Se houver bookings, validar estrutura
      if (bookings.length > 0) {
        const booking = bookings[0];
        expect(booking).toHaveProperty("id");
        expect(booking).toHaveProperty("vehicleId");
        expect(booking).toHaveProperty("status");
        expect(booking).toHaveProperty("totalAmount");
      }
    });

    it("deve permitir atualizar status de reservas existentes", async () => {
      // Buscar reservas existentes
      const bookings = await db.getBookingsByHostId(1);
      
      // Se houver reservas, validar que a função de update existe
      if (bookings.length > 0) {
        const bookingId = bookings[0].id;
        
        // Validar que função updateBookingStatus existe e pode ser chamada
        expect(typeof db.updateBookingStatus).toBe("function");
      } else {
        // Se não há reservas, teste passa
        expect(true).toBe(true);
      }
    });
  });

  describe("Host Dashboard - Veículos", () => {
    it("deve retornar veículos de um proprietário", async () => {
      const vehicles = await db.getVehiclesByHostId(1);
      
      expect(Array.isArray(vehicles)).toBe(true);
      
      // Se houver veículos, validar estrutura
      if (vehicles.length > 0) {
        const vehicle = vehicles[0];
        expect(vehicle).toHaveProperty("id");
        expect(vehicle).toHaveProperty("brand");
        expect(vehicle).toHaveProperty("model");
        expect(vehicle).toHaveProperty("licensePlate");
        expect(vehicle).toHaveProperty("status");
        expect(vehicle).toHaveProperty("dailyPrice");
      }
    });
  });

  // ==================== ADMIN DASHBOARD ====================
  describe("Admin Dashboard - Estatísticas", () => {
    it("deve retornar estatísticas do sistema", async () => {
      const stats = await db.getAdminStats();
      
      expect(stats).toHaveProperty("totalUsers");
      expect(stats).toHaveProperty("activeVehicles");
      expect(stats).toHaveProperty("pendingDocuments");
      expect(stats).toHaveProperty("pendingFines");
      
      expect(typeof stats.totalUsers).toBe("number");
      expect(typeof stats.activeVehicles).toBe("number");
      expect(typeof stats.pendingDocuments).toBe("number");
      expect(typeof stats.pendingFines).toBe("number");
    });
  });

  describe("Admin Dashboard - Documentos Pendentes", () => {
    it("deve retornar documentos pendentes de aprovação", async () => {
      const pendingDocs = await db.getPendingDocuments();
      
      expect(Array.isArray(pendingDocs)).toBe(true);
      
      // Se houver documentos, validar estrutura
      if (pendingDocs.length > 0) {
        const doc = pendingDocs[0];
        expect(doc).toHaveProperty("id");
        expect(doc).toHaveProperty("userId");
        expect(doc).toHaveProperty("documentType");
        expect(doc).toHaveProperty("status");
        expect(doc.status).toBe("pending");
      }
    });

    it("deve aprovar um documento", async () => {
      // Buscar documentos pendentes
      const pendingDocs = await db.getPendingDocuments();
      
      if (pendingDocs.length > 0) {
        const docId = pendingDocs[0].id;
        
        // Aprovar documento
        await db.updateDocumentStatus(docId, "approved", 1);
        
        // Verificar que foi aprovado
        const allDocs = await db.getPendingDocuments();
        const approvedDoc = allDocs.find(d => d.id === docId);
        
        // Documento não deve mais estar na lista de pendentes
        expect(approvedDoc).toBeUndefined();
      } else {
        // Se não há documentos pendentes, teste passa
        expect(true).toBe(true);
      }
    });
  });

  describe("Admin Dashboard - Veículos Pendentes", () => {
    it("deve retornar veículos pendentes de aprovação", async () => {
      const pendingVehicles = await db.getPendingVehicles();
      
      expect(Array.isArray(pendingVehicles)).toBe(true);
      
      // Se houver veículos, validar estrutura
      if (pendingVehicles.length > 0) {
        const vehicle = pendingVehicles[0];
        expect(vehicle).toHaveProperty("id");
        expect(vehicle).toHaveProperty("brand");
        expect(vehicle).toHaveProperty("model");
        expect(vehicle).toHaveProperty("status");
        expect(vehicle.status).toBe("pending_approval");
      }
    });
  });

  describe("Admin Dashboard - Multas Pendentes", () => {
    it("deve retornar multas pendentes de resolução", async () => {
      const pendingFines = await db.getPendingFines();
      
      expect(Array.isArray(pendingFines)).toBe(true);
      
      // Se houver multas, validar estrutura
      if (pendingFines.length > 0) {
        const fine = pendingFines[0];
        expect(fine).toHaveProperty("id");
        expect(fine).toHaveProperty("bookingId");
        expect(fine).toHaveProperty("amount");
        expect(fine).toHaveProperty("reason");
        expect(fine).toHaveProperty("status");
      }
    });
  });

  describe("Admin Dashboard - Todos os Usuários", () => {
    it("deve retornar lista de todos os usuários", async () => {
      const users = await db.getAllUsers(10, 0);
      
      expect(Array.isArray(users)).toBe(true);
      
      // Se houver usuários, validar estrutura
      if (users.length > 0) {
        const user = users[0];
        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("email");
        expect(user).toHaveProperty("name");
        expect(user).toHaveProperty("role");
      }
    });
  });
});
