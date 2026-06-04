/**
 * Seed Script - Popular banco com dados de exemplo
 * Execute com: node server/seed.mjs
 */

import mysql from "mysql2/promise";
import "dotenv/config";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não encontrada");
  process.exit(1);
}

async function seed() {
  console.log("🌱 Iniciando seed do banco de dados...\n");

  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    // ============================================
    // 1. CRIAR VEÍCULOS DE EXEMPLO
    // ============================================
    console.log("📦 Criando veículos de exemplo...");

    const vehicles = [
      {
        hostId: 1, // Assumindo que usuário ID 1 é proprietário
        brand: "Toyota",
        model: "Corolla",
        year: 2023,
        licensePlate: "ABC-1234",
        category: "sedan",
        fuelType: "flex",
        transmission: "automatic",
        seats: 5,
        dailyPrice: "150.00",
        pickupCity: "São Paulo",
        pickupState: "SP",
        pickupAddress: "Av. Paulista, 1000",
        status: "active",
        features: JSON.stringify(["ar_condicionado", "direcao_hidraulica", "vidros_eletricos"]),
      },
      {
        hostId: 1,
        brand: "Honda",
        model: "HR-V",
        year: 2024,
        licensePlate: "XYZ-5678",
        category: "suv",
        fuelType: "flex",
        transmission: "automatic",
        seats: 5,
        dailyPrice: "200.00",
        pickupCity: "Rio de Janeiro",
        pickupState: "RJ",
        pickupAddress: "Av. Atlântica, 500",
        status: "active",
        features: JSON.stringify(["ar_condicionado", "camera_re", "sensor_estacionamento"]),
      },
      {
        hostId: 1,
        brand: "Chevrolet",
        model: "Onix",
        year: 2022,
        licensePlate: "DEF-9012",
        category: "popular",
        fuelType: "flex",
        transmission: "manual",
        seats: 5,
        dailyPrice: "100.00",
        pickupCity: "Brasília",
        pickupState: "DF",
        pickupAddress: "Esplanada dos Ministérios",
        status: "active",
        features: JSON.stringify(["ar_condicionado", "direcao_hidraulica"]),
      },
    ];

    for (const vehicle of vehicles) {
      await connection.execute(
        `INSERT INTO vehicles (hostId, brand, model, year, licensePlate, category, fuelType, transmission, seats, dailyPrice, pickupCity, pickupState, pickupAddress, status, features, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          vehicle.hostId,
          vehicle.brand,
          vehicle.model,
          vehicle.year,
          vehicle.licensePlate,
          vehicle.category,
          vehicle.fuelType,
          vehicle.transmission,
          vehicle.seats,
          vehicle.dailyPrice,
          vehicle.pickupCity,
          vehicle.pickupState,
          vehicle.pickupAddress,
          vehicle.status,
          vehicle.features,
        ]
      );
    }

    console.log(`✅ ${vehicles.length} veículos criados\n`);

    // ============================================
    // 2. CRIAR RESERVAS DE EXEMPLO
    // ============================================
    console.log("📅 Criando reservas de exemplo...");

    // Buscar IDs dos veículos criados
    const [vehicleRows] = await connection.execute("SELECT id FROM vehicles LIMIT 3");
    const vehicleIds = vehicleRows.map((v) => v.id);

    const bookings = [
      {
        vehicleId: vehicleIds[0],
        renterId: 2, // Assumindo que usuário ID 2 é locatário
        hostId: 1,
        startDate: "2026-02-10",
        endDate: "2026-02-15",
        pickupLocation: "Aeroporto de Congonhas",
        dailyRate: "150.00",
        totalDays: 5,
        subtotal: "750.00",
        serviceFee: "75.00",
        totalAmount: "825.00",
        status: "confirmed",
        dailyKmLimit: 200,
        contractAccepted: true,
        contractAcceptedAt: new Date(),
        contractAcceptedIp: "192.168.1.1",
      },
      {
        vehicleId: vehicleIds[1],
        renterId: 2,
        hostId: 1,
        startDate: "2026-01-20",
        endDate: "2026-01-25",
        pickupLocation: "Centro do Rio",
        dailyRate: "200.00",
        totalDays: 5,
        subtotal: "1000.00",
        serviceFee: "100.00",
        totalAmount: "1100.00",
        status: "completed",
        dailyKmLimit: 200,
        contractAccepted: true,
        contractAcceptedAt: new Date(),
        contractAcceptedIp: "192.168.1.1",
      },
    ];

    for (const booking of bookings) {
      await connection.execute(
        `INSERT INTO bookings (vehicleId, renterId, hostId, startDate, endDate, pickupLocation, dailyRate, totalDays, subtotal, serviceFee, totalAmount, status, dailyKmLimit, contractAccepted, contractAcceptedAt, contractAcceptedIp, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          booking.vehicleId,
          booking.renterId,
          booking.hostId,
          booking.startDate,
          booking.endDate,
          booking.pickupLocation,
          booking.dailyRate,
          booking.totalDays,
          booking.subtotal,
          booking.serviceFee,
          booking.totalAmount,
          booking.status,
          booking.dailyKmLimit,
          booking.contractAccepted,
          booking.contractAcceptedAt,
          booking.contractAcceptedIp,
        ]
      );
    }

    console.log(`✅ ${bookings.length} reservas criadas\n`);

    // ============================================
    // 3. CRIAR FAVORITOS DE EXEMPLO
    // ============================================
    console.log("❤️ Criando favoritos de exemplo...");

    const favorites = [
      { userId: 2, vehicleId: vehicleIds[0] },
      { userId: 2, vehicleId: vehicleIds[2] },
    ];

    for (const favorite of favorites) {
      await connection.execute(
        `INSERT INTO favorites (userId, vehicleId, createdAt) VALUES (?, ?, NOW())`,
        [favorite.userId, favorite.vehicleId]
      );
    }

    console.log(`✅ ${favorites.length} favoritos criados\n`);

    // ============================================
    // 4. CRIAR AVALIAÇÕES DE EXEMPLO
    // ============================================
    console.log("⭐ Criando avaliações de exemplo...");

    const reviews = [
      {
        reviewerId: 1, // Proprietário avaliando locatário
        revieweeId: 2,
        bookingId: null,
        rating: 5,
        comment: "Locatário excelente! Devolveu o carro limpo e no prazo.",
      },
      {
        reviewerId: 2, // Locatário avaliando proprietário
        revieweeId: 1,
        bookingId: null,
        rating: 4,
        comment: "Ótimo proprietário, carro em perfeito estado!",
      },
    ];

    for (const review of reviews) {
      await connection.execute(
        `INSERT INTO reviews (reviewerId, revieweeId, bookingId, rating, comment, createdAt)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [review.reviewerId, review.revieweeId, review.bookingId, review.rating, review.comment]
      );
    }

    console.log(`✅ ${reviews.length} avaliações criadas\n`);

    // ============================================
    // 5. CRIAR NOTIFICAÇÕES DE EXEMPLO
    // ============================================
    console.log("🔔 Criando notificações de exemplo...");

    const notifications = [
      {
        userId: 2,
        title: "Reserva Confirmada",
        message: "Sua reserva para o Toyota Corolla foi confirmada!",
        notificationType: "booking_confirmed",
        isRead: false,
      },
      {
        userId: 2,
        title: "Nova Avaliação",
        message: "Você recebeu uma nova avaliação de 5 estrelas!",
        notificationType: "review_received",
        isRead: false,
      },
      {
        userId: 1,
        title: "Nova Reserva Pendente",
        message: "Você tem uma nova solicitação de reserva para aprovar",
        notificationType: "booking_request",
        isRead: false,
      },
    ];

    for (const notification of notifications) {
      await connection.execute(
        `INSERT INTO notifications (userId, title, message, notificationType, isRead, createdAt)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          notification.userId,
          notification.title,
          notification.message,
          notification.notificationType,
          notification.isRead,
        ]
      );
    }

    console.log(`✅ ${notifications.length} notificações criadas\n`);

    console.log("✅ Seed concluído com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao executar seed:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

seed()
  .then(() => {
    console.log("\n🎉 Banco de dados populado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Falha ao popular banco:", error);
    process.exit(1);
  });
