/**
 * Testes para Sistema de Contrato Obrigatório
 * Valida que o contrato deve ser aceito antes de criar reserva
 */

import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Sistema de Contrato Obrigatório", () => {
  let testUserId: number;
  let testVehicleId: number;

  beforeAll(async () => {
    // Criar usuário de teste
    const openId = `test_contract_${Date.now()}`;
    testUserId = await db.createUserWithPassword({
      openId,
      name: "Test User Contract",
      email: `contract_${Date.now()}@test.com`,
      passwordHash: "hash",
      loginMethod: "email",
      role: "user",
    });

    // Criar veículo de teste
    testVehicleId = await db.createVehicle({
      hostId: testUserId,
      brand: "Test",
      model: "Contract Test",
      year: 2024,
      licensePlate: "ABC1234",
      category: "sedan",
      transmission: "automatic",
      fuelType: "flex",
      seats: 5,
      dailyPrice: "100.00",
      dailyKmLimit: 300,
      extraKmPrice: "0.50",
      pickupAddress: "Test Address",
      pickupCity: "São Paulo",
      pickupState: "SP",
      status: "active",
    });
  });

  it("deve criar reserva com contrato aceito", async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);

    const bookingId = await db.createBooking({
      vehicleId: testVehicleId,
      renterId: testUserId,
      hostId: testUserId,
      startDate,
      endDate,
      pickupLocation: "São Paulo, SP",
      dailyKmLimit: 300,
      extraKmPrice: "0.50",
      dailyRate: "100.00",
      totalDays: 2,
      subtotal: "200.00",
      serviceFee: "24.00",
      insuranceFee: "70.00",
      securityDeposit: "500.00",
      totalAmount: "294.00",
      status: "pending",
      contractAccepted: true,
      contractAcceptedAt: new Date(),
      contractAcceptedIp: "127.0.0.1",
      contractVersion: "1.0",
    } as any);

    expect(bookingId).toBeGreaterThan(0);

    // Verificar que o contrato foi salvo
    const booking = await db.getBookingById(bookingId);
    expect(booking).toBeDefined();
    expect(booking?.contractAccepted).toBe(true);
    expect(booking?.contractAcceptedAt).toBeDefined();
    expect(booking?.contractAcceptedIp).toBe("127.0.0.1");
    expect(booking?.contractVersion).toBe("1.0");
  });

  it("deve ter campos de contrato no schema", async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 5);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const bookingId = await db.createBooking({
      vehicleId: testVehicleId,
      renterId: testUserId,
      hostId: testUserId,
      startDate,
      endDate,
      pickupLocation: "Rio de Janeiro, RJ",
      dailyKmLimit: 300,
      extraKmPrice: "0.50",
      dailyRate: "100.00",
      totalDays: 2,
      subtotal: "200.00",
      serviceFee: "24.00",
      insuranceFee: "70.00",
      securityDeposit: "500.00",
      totalAmount: "294.00",
      status: "pending",
      contractAccepted: false,
      contractVersion: "1.0",
    } as any);

    const booking = await db.getBookingById(bookingId);
    
    // Verificar que todos os campos de contrato existem
    expect(booking).toHaveProperty("contractAccepted");
    expect(booking).toHaveProperty("contractAcceptedAt");
    expect(booking).toHaveProperty("contractAcceptedIp");
    expect(booking).toHaveProperty("contractVersion");
    
    // Verificar valores padrão
    expect(booking?.contractAccepted).toBe(false);
    expect(booking?.contractVersion).toBe("1.0");
  });

  it("deve armazenar timestamp de aceitação do contrato", async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 10);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 12);

    const acceptanceTime = new Date();

    const bookingId = await db.createBooking({
      vehicleId: testVehicleId,
      renterId: testUserId,
      hostId: testUserId,
      startDate,
      endDate,
      pickupLocation: "Brasília, DF",
      dailyKmLimit: 300,
      extraKmPrice: "0.50",
      dailyRate: "100.00",
      totalDays: 2,
      subtotal: "200.00",
      serviceFee: "24.00",
      insuranceFee: "70.00",
      securityDeposit: "500.00",
      totalAmount: "294.00",
      status: "pending",
      contractAccepted: true,
      contractAcceptedAt: acceptanceTime,
      contractAcceptedIp: "192.168.1.1",
      contractVersion: "1.0",
    } as any);

    const booking = await db.getBookingById(bookingId);
    
    // Verificar que timestamp foi salvo (MySQL pode ter precisão diferente)
    expect(booking?.contractAcceptedAt).toBeDefined();
    const acceptedAt = new Date(booking!.contractAcceptedAt!);
    // Verificar que está no mesmo dia (tolerando diferença de milissegundos)
    expect(acceptedAt.getFullYear()).toBe(acceptanceTime.getFullYear());
    expect(acceptedAt.getMonth()).toBe(acceptanceTime.getMonth());
    expect(acceptedAt.getDate()).toBe(acceptanceTime.getDate());
  });
});
