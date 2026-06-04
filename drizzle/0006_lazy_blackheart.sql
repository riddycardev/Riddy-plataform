DROP TABLE `user_sessions`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `emailVerified`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `emailVerificationCode`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `emailVerificationExpires`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `phoneVerified`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `phoneVerificationCode`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `phoneVerificationExpires`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `cpfVerified`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `twoFactorEnabled`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `twoFactorSecret`;