-- Migration: 0019_cnh_fields
-- Adds CNH category, number and expiry fields to users table for motorcycle booking validation
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `cnhCategory` ENUM('A','AB','B','C','D','E','ACC') NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `cnhNumber` VARCHAR(20) NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `cnhExpiresAt` TIMESTAMP NULL;
