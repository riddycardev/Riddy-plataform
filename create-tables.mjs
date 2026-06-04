import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL não definida');
  process.exit(1);
}

async function createTables() {
  let connection;
  try {
    connection = await mysql.createConnection(DATABASE_URL);
    
    console.log('Conectado ao banco de dados');
    
    // Criar tabela receipts
    const createReceiptsSQL = `
      CREATE TABLE IF NOT EXISTS receipts (
        id INT AUTO_INCREMENT NOT NULL,
        bookingId INT NOT NULL,
        userId INT NOT NULL,
        type ENUM('payment', 'cancellation') NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
        refundAmount DECIMAL(10, 2),
        refundReason TEXT,
        receiptNumber VARCHAR(50) NOT NULL UNIQUE,
        description TEXT NOT NULL,
        data JSON,
        emailSentAt TIMESTAMP,
        emailRetries INT NOT NULL DEFAULT 0,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (bookingId) REFERENCES bookings(id),
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `;
    
    await connection.execute(createReceiptsSQL);
    console.log('✓ Tabela receipts criada');
    
    // Criar tabela emailLogs
    const createEmailLogsSQL = `
      CREATE TABLE IF NOT EXISTS emailLogs (
        id INT AUTO_INCREMENT NOT NULL,
        recipientEmail VARCHAR(255) NOT NULL,
        recipientName VARCHAR(255),
        subject VARCHAR(255) NOT NULL,
        template VARCHAR(50) NOT NULL,
        relatedEntityType VARCHAR(50),
        relatedEntityId INT,
        status ENUM('sent', 'failed', 'bounced') NOT NULL DEFAULT 'sent',
        errorMessage TEXT,
        sentAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_recipientEmail (recipientEmail),
        INDEX idx_relatedEntity (relatedEntityType, relatedEntityId),
        INDEX idx_sentAt (sentAt)
      )
    `;
    
    await connection.execute(createEmailLogsSQL);
    console.log('✓ Tabela emailLogs criada');
    
    console.log('\n✅ Todas as tabelas foram criadas com sucesso!');
    
  } catch (error) {
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️  Tabelas já existem no banco de dados');
    } else {
      console.error('❌ Erro ao criar tabelas:', error.message);
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createTables();
