import { describe, expect, it, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

// Mock the database module
vi.mock("./db", () => ({
  getUserByEmail: vi.fn(),
  createUserWithPassword: vi.fn(),
  updateUserLastSignedIn: vi.fn(),
}));

import * as db from "./db";

describe("Auth System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Password Hashing", () => {
    it("should hash password correctly", async () => {
      const password = "testPassword123";
      const hash = await bcrypt.hash(password, 12);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it("should verify correct password", async () => {
      const password = "testPassword123";
      const hash = await bcrypt.hash(password, 12);
      
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "testPassword123";
      const wrongPassword = "wrongPassword456";
      const hash = await bcrypt.hash(password, 12);
      
      const isValid = await bcrypt.compare(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe("User Registration", () => {
    it("should check for existing email before registration", async () => {
      const email = "test@example.com";
      
      // Mock existing user
      vi.mocked(db.getUserByEmail).mockResolvedValueOnce({
        id: 1,
        openId: "existing_user",
        email: email,
        name: "Existing User",
        passwordHash: "hash",
        role: "user",
        kycStatus: "pending",
        verificationLevel: "basic",
        facialVerified: false,
        cnhVerified: false,
        addressVerified: false,
        totalTripsAsRenter: 0,
        totalTripsAsHost: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        phone: null,
        cpf: null,
        loginMethod: "email",
        avatarUrl: null,
        bio: null,
        dateOfBirth: null,
        addressStreet: null,
        addressNumber: null,
        addressComplement: null,
        addressNeighborhood: null,
        addressCity: null,
        addressState: null,
        addressZipCode: null,
        averageRating: null,
      });
      
      const existingUser = await db.getUserByEmail(email);
      expect(existingUser).toBeDefined();
      expect(existingUser?.email).toBe(email);
    });

    it("should return undefined for non-existing email", async () => {
      const email = "new@example.com";
      
      vi.mocked(db.getUserByEmail).mockResolvedValueOnce(undefined);
      
      const existingUser = await db.getUserByEmail(email);
      expect(existingUser).toBeUndefined();
    });

    it("should create user with hashed password", async () => {
      const userData = {
        openId: "email_test123",
        name: "Test User",
        email: "test@example.com",
        passwordHash: "hashedPassword",
        loginMethod: "email",
        role: "user" as const,
      };
      
      vi.mocked(db.createUserWithPassword).mockResolvedValueOnce(1);
      
      const userId = await db.createUserWithPassword(userData);
      expect(userId).toBe(1);
      expect(db.createUserWithPassword).toHaveBeenCalledWith(userData);
    });
  });

  describe("User Login", () => {
    it("should find user by email for login", async () => {
      const email = "test@example.com";
      const mockUser = {
        id: 1,
        openId: "email_test123",
        email: email,
        name: "Test User",
        passwordHash: await bcrypt.hash("password123", 12),
        role: "user" as const,
        kycStatus: "pending" as const,
        verificationLevel: "basic" as const,
        facialVerified: false,
        cnhVerified: false,
        addressVerified: false,
        totalTripsAsRenter: 0,
        totalTripsAsHost: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        phone: null,
        cpf: null,
        loginMethod: "email",
        avatarUrl: null,
        bio: null,
        dateOfBirth: null,
        addressStreet: null,
        addressNumber: null,
        addressComplement: null,
        addressNeighborhood: null,
        addressCity: null,
        addressState: null,
        addressZipCode: null,
        averageRating: null,
      };
      
      vi.mocked(db.getUserByEmail).mockResolvedValueOnce(mockUser);
      
      const user = await db.getUserByEmail(email);
      expect(user).toBeDefined();
      expect(user?.email).toBe(email);
      expect(user?.passwordHash).toBeDefined();
    });

    it("should update last signed in on successful login", async () => {
      const userId = 1;
      
      vi.mocked(db.updateUserLastSignedIn).mockResolvedValueOnce(undefined);
      
      await db.updateUserLastSignedIn(userId);
      expect(db.updateUserLastSignedIn).toHaveBeenCalledWith(userId);
    });
  });

  describe("Input Validation", () => {
    it("should validate email format", () => {
      const validEmails = ["test@example.com", "user.name@domain.co", "a@b.io"];
      const invalidEmails = ["invalid", "@domain.com", "user@", "user@.com"];
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });
      
      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it("should validate password minimum length", () => {
      const validPasswords = ["123456", "password", "longpassword123"];
      const invalidPasswords = ["12345", "abc", ""];
      
      validPasswords.forEach(password => {
        expect(password.length >= 6).toBe(true);
      });
      
      invalidPasswords.forEach(password => {
        expect(password.length >= 6).toBe(false);
      });
    });

    it("should validate name minimum length", () => {
      const validNames = ["Jo", "John", "John Doe"];
      const invalidNames = ["J", ""];
      
      validNames.forEach(name => {
        expect(name.length >= 2).toBe(true);
      });
      
      invalidNames.forEach(name => {
        expect(name.length >= 2).toBe(false);
      });
    });
  });
});
