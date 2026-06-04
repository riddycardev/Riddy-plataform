import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Add auth columns one by one (IF NOT EXISTS for safety)
  const alterStatements = [
    "ALTER TABLE `users` ADD COLUMN `emailVerified` boolean NOT NULL DEFAULT false",
    "ALTER TABLE `users` ADD COLUMN `emailVerifyToken` varchar(255)",
    "ALTER TABLE `users` ADD COLUMN `emailVerifyTokenExpiresAt` timestamp NULL",
    "ALTER TABLE `users` ADD COLUMN `passwordResetToken` varchar(255)",
    "ALTER TABLE `users` ADD COLUMN `passwordResetTokenExpiresAt` timestamp NULL",
    "ALTER TABLE `users` ADD COLUMN `googleId` varchar(255)",
  ];

  for (const sql of alterStatements) {
    try {
      await conn.query(sql);
      console.log(`✓ Applied: ${sql.substring(0, 60)}...`);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log(`⚠ Already exists, skipping: ${sql.substring(0, 60)}...`);
      } else {
        throw err;
      }
    }
  }

  console.log('\n✅ Migration applied successfully!');
} finally {
  await conn.end();
}
