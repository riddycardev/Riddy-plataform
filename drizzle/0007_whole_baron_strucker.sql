ALTER TABLE `bookings` ADD `contractAccepted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `contractAcceptedAt` timestamp;--> statement-breakpoint
ALTER TABLE `bookings` ADD `contractAcceptedIp` varchar(45);--> statement-breakpoint
ALTER TABLE `bookings` ADD `contractVersion` varchar(20) DEFAULT '1.0' NOT NULL;