CREATE TABLE `user_verifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` enum('pending','verified','rejected','blocked') NOT NULL DEFAULT 'pending',
	`attemptCount` int NOT NULL DEFAULT 0,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_verifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_verifications_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `verification_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`verificationId` int NOT NULL,
	`documentType` enum('cpf','cnh','income_proof') NOT NULL,
	`encryptedUrl` text NOT NULL,
	`filename` varchar(255),
	`mimeType` varchar(100),
	`fileSize` int,
	`cloudinaryPublicId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `verification_documents_id` PRIMARY KEY(`id`)
);
