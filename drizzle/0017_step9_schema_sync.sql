-- Migration: 0017_step9_schema_sync
-- Syncs schema with current codebase:
-- 1. Rename adminNotes -> reviewNotes in user_verifications
-- 2. Add missing columns to user_verifications
-- 3. Create motorcycle_specs table with full cilindrada enum

-- ============================================================
-- 1. user_verifications: rename adminNotes -> reviewNotes
-- ============================================================
ALTER TABLE `user_verifications` 
  RENAME COLUMN `adminNotes` TO `reviewNotes`;

-- ============================================================
-- 2. user_verifications: add missing columns
-- ============================================================
ALTER TABLE `user_verifications`
  ADD COLUMN `cpfSubmitted` boolean NOT NULL DEFAULT false,
  ADD COLUMN `cnhSubmitted` boolean NOT NULL DEFAULT false,
  ADD COLUMN `incomeProofSubmitted` boolean NOT NULL DEFAULT false,
  ADD COLUMN `lastAttemptAt` timestamp,
  ADD COLUMN `submittedAt` timestamp,
  ADD COLUMN `approvedAt` timestamp,
  ADD COLUMN `rejectedAt` timestamp,
  ADD COLUMN `blockedAt` timestamp;

-- ============================================================
-- 3. Create motorcycle_specs table
-- ============================================================
CREATE TABLE IF NOT EXISTS `motorcycle_specs` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `vehicleId` int NOT NULL,
  `cilindrada` enum('125cc','150cc','160cc','180cc','200cc','250cc','300cc','350cc','400cc','500cc','600cc','750cc','800cc','900cc','1000cc','1100cc','1200cc','1200cc+') NOT NULL,
  `tipoMoto` enum('street','sport','naked','cruiser','adventure','scooter') NOT NULL,
  `combustivel` enum('gasolina','eletrica') NOT NULL DEFAULT 'gasolina',
  `cambio` enum('manual','automatico','cvt') NOT NULL DEFAULT 'manual',
  `capaceteDisponivel` boolean NOT NULL DEFAULT false,
  `taxaCapacete` decimal(10,2) NOT NULL DEFAULT '0.00',
  `limitKmDiario` int NOT NULL DEFAULT 100,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `motorcycle_specs_vehicleId_unique` UNIQUE(`vehicleId`)
);
