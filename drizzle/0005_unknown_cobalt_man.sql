CREATE TABLE `user_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionToken` varchar(255) NOT NULL,
	`deviceInfo` text,
	`ipAddress` varchar(45),
	`location` text,
	`lastActiveAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_sessions_sessionToken_unique` UNIQUE(`sessionToken`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerificationCode` varchar(10);--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerificationExpires` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `phoneVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `phoneVerificationCode` varchar(10);--> statement-breakpoint
ALTER TABLE `users` ADD `phoneVerificationExpires` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `cpfVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `twoFactorEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `twoFactorSecret` varchar(255);