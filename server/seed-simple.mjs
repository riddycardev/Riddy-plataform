/**
 * Seed Script Simplificado - Adicionar notificações de exemplo
 * Execute com: node server/seed-simple.mjs
 */

import mysql from "mysql2/promise";
import "dotenv/config";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não encontrada");
  process.exit(1);
}

async function seed() {
  console.log("🌱 Adicionando notificações de exemplo...\n");

  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    // Criar notificações de exemplo para usuário ID 2 (locatário)
    const notifications = [
      {
        userId: 2,
        title: "Bem-vindo ao RIDDY!",
        message: "Explore nossa frota e encontre o veículo perfeito para sua próxima viagem.",
        notificationType: "system",
        isRead: false,
      },
      {
        userId: 2,
        title: "Dica: Complete seu perfil",
        message: "Complete seu perfil para aumentar suas chances de aprovação nas reservas.",
        notificationType: "system",
        isRead: false,
      },
      {
        userId: 2,
        title: "Novos veículos disponíveis",
        message: "Confira os novos veículos adicionados na sua região!",
        notificationType: "system",
        isRead: true,
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

    // Criar notificações para proprietário ID 1
    const hostNotifications = [
      {
        userId: 1,
        title: "Bem-vindo, Proprietário!",
        message: "Gerencie seus veículos e aprove reservas pelo dashboard.",
        notificationType: "system",
        isRead: false,
      },
      {
        userId: 1,
        title: "Dica: Adicione fotos",
        message: "Veículos com fotos de qualidade recebem 3x mais reservas!",
        notificationType: "system",
        isRead: false,
      },
    ];

    for (const notification of hostNotifications) {
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

    console.log(`✅ ${hostNotifications.length} notificações para proprietário criadas\n`);

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
    console.log("\n🎉 Notificações adicionadas com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Falha ao adicionar notificações:", error);
    process.exit(1);
  });
