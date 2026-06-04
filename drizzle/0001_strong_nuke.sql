CREATE TABLE `booking_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`photoType` enum('checkin_exterior','checkin_interior','checkin_odometer','checkin_fuel','checkin_damage','checkout_exterior','checkout_interior','checkout_odometer','checkout_fuel','checkout_damage') NOT NULL,
	`imageUrl` text NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`notes` text,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `booking_photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` int NOT NULL,
	`renterId` int NOT NULL,
	`hostId` int NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`pickupLocation` text NOT NULL,
	`returnLocation` text,
	`actualPickupTime` timestamp,
	`actualReturnTime` timestamp,
	`startMileage` int,
	`endMileage` int,
	`dailyKmLimit` int NOT NULL,
	`extraKmPrice` decimal(10,2) NOT NULL,
	`dailyRate` decimal(10,2) NOT NULL,
	`totalDays` int NOT NULL,
	`subtotal` decimal(12,2) NOT NULL,
	`discountAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`deliveryFee` decimal(10,2) NOT NULL DEFAULT '0.00',
	`serviceFee` decimal(10,2) NOT NULL,
	`insuranceFee` decimal(10,2) NOT NULL,
	`securityDeposit` decimal(10,2) NOT NULL,
	`totalAmount` decimal(12,2) NOT NULL,
	`extraKmCharge` decimal(10,2) NOT NULL DEFAULT '0.00',
	`lateReturnCharge` decimal(10,2) NOT NULL DEFAULT '0.00',
	`cleaningCharge` decimal(10,2) NOT NULL DEFAULT '0.00',
	`damageCharge` decimal(10,2) NOT NULL DEFAULT '0.00',
	`fuelCharge` decimal(10,2) NOT NULL DEFAULT '0.00',
	`status` enum('pending','confirmed','in_progress','completed','cancelled_by_renter','cancelled_by_host','disputed') NOT NULL DEFAULT 'pending',
	`cancelledAt` timestamp,
	`cancellationReason` text,
	`refundAmount` decimal(10,2),
	`renterNotes` text,
	`hostNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int,
	`participant1Id` int NOT NULL,
	`participant2Id` int NOT NULL,
	`lastMessageAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`userId` int NOT NULL,
	`issuedBy` int,
	`fineType` enum('late_return','extra_km','damage','cleaning','traffic_violation','fuel_not_refilled','smoking','pet_damage','other') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`description` text NOT NULL,
	`evidenceUrls` json,
	`status` enum('pending','accepted','disputed','paid','waived','sent_to_collection') NOT NULL DEFAULT 'pending',
	`disputeReason` text,
	`disputeResolvedAt` timestamp,
	`disputeResolution` text,
	`paymentId` int,
	`paidAt` timestamp,
	`dueDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`senderId` int NOT NULL,
	`content` text NOT NULL,
	`messageType` enum('text','image','system') NOT NULL DEFAULT 'text',
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`notificationType` enum('booking_request','booking_confirmed','booking_cancelled','payment_received','payment_failed','review_received','message_received','document_approved','document_rejected','fine_issued','system') NOT NULL,
	`relatedId` int,
	`relatedType` varchar(50),
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_methods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`methodType` enum('credit_card','debit_card','pix') NOT NULL,
	`cardBrand` varchar(20),
	`cardLast4` varchar(4),
	`cardExpMonth` int,
	`cardExpYear` int,
	`cardHolderName` varchar(255),
	`stripePaymentMethodId` varchar(255),
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_methods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`userId` int NOT NULL,
	`paymentType` enum('booking_payment','security_deposit','extra_charges','fine','refund','host_payout') NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'BRL',
	`paymentMethod` enum('credit_card','debit_card','pix','bank_transfer') NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`stripeChargeId` varchar(255),
	`pixTransactionId` varchar(255),
	`status` enum('pending','processing','completed','failed','refunded','partially_refunded') NOT NULL DEFAULT 'pending',
	`failureReason` text,
	`hostPayoutAmount` decimal(12,2),
	`platformFeeAmount` decimal(10,2),
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `promo_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`description` text,
	`discountType` enum('percentage','fixed') NOT NULL,
	`discountValue` decimal(10,2) NOT NULL,
	`maxDiscount` decimal(10,2),
	`minBookingAmount` decimal(10,2),
	`usageLimit` int,
	`usageCount` int NOT NULL DEFAULT 0,
	`validFrom` timestamp NOT NULL,
	`validUntil` timestamp NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promo_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `promo_codes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`reviewerId` int NOT NULL,
	`revieweeId` int,
	`vehicleId` int,
	`reviewType` enum('renter_to_host','host_to_renter','renter_to_vehicle') NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`cleanlinessRating` int,
	`communicationRating` int,
	`accuracyRating` int,
	`valueRating` int,
	`isPublic` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`documentType` enum('cnh_front','cnh_back','rg_front','rg_back','cpf','selfie','proof_of_address','facial_recognition') NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`mimeType` varchar(100),
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`rejectionReason` text,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`extractedData` json,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicle_availability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` int NOT NULL,
	`date` timestamp NOT NULL,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`customDailyPrice` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vehicle_availability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicle_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` int NOT NULL,
	`documentType` enum('crlv','insurance','inspection_report','ownership_proof','maintenance_history') NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`mimeType` varchar(100),
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`rejectionReason` text,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicle_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicle_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`imageType` enum('front','back','left','right','interior_front','interior_back','dashboard','trunk','other') NOT NULL DEFAULT 'other',
	`sortOrder` int NOT NULL DEFAULT 0,
	`isMain` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vehicle_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hostId` int NOT NULL,
	`brand` varchar(100) NOT NULL,
	`model` varchar(100) NOT NULL,
	`year` int NOT NULL,
	`color` varchar(50),
	`licensePlate` varchar(10) NOT NULL,
	`renavam` varchar(20),
	`chassi` varchar(30),
	`category` enum('popular','sedan','suv','luxury','electric','sport','pickup') NOT NULL,
	`transmission` enum('manual','automatic') NOT NULL DEFAULT 'automatic',
	`fuelType` enum('gasoline','ethanol','flex','diesel','electric','hybrid') NOT NULL DEFAULT 'flex',
	`seats` int NOT NULL DEFAULT 5,
	`doors` int NOT NULL DEFAULT 4,
	`trunkCapacity` int,
	`engineSize` varchar(10),
	`features` json,
	`dailyPrice` decimal(10,2) NOT NULL,
	`weeklyDiscount` int DEFAULT 0,
	`monthlyDiscount` int DEFAULT 0,
	`dailyKmLimit` int NOT NULL DEFAULT 300,
	`extraKmPrice` decimal(10,2) NOT NULL DEFAULT '0.50',
	`pickupAddress` text NOT NULL,
	`pickupCity` varchar(100) NOT NULL,
	`pickupState` varchar(2) NOT NULL,
	`pickupLatitude` decimal(10,8),
	`pickupLongitude` decimal(11,8),
	`deliveryAvailable` boolean NOT NULL DEFAULT false,
	`deliveryRadius` int,
	`deliveryFee` decimal(10,2),
	`minRentalDays` int NOT NULL DEFAULT 1,
	`maxRentalDays` int NOT NULL DEFAULT 30,
	`instantBooking` boolean NOT NULL DEFAULT false,
	`smokingAllowed` boolean NOT NULL DEFAULT false,
	`petsAllowed` boolean NOT NULL DEFAULT false,
	`status` enum('draft','pending_approval','active','inactive','suspended') NOT NULL DEFAULT 'draft',
	`isVerified` boolean NOT NULL DEFAULT false,
	`totalTrips` int NOT NULL DEFAULT 0,
	`averageRating` decimal(3,2),
	`totalEarnings` decimal(12,2) NOT NULL DEFAULT '0.00',
	`mainImageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','host','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `cpf` varchar(14);--> statement-breakpoint
ALTER TABLE `users` ADD `kycStatus` enum('pending','submitted','approved','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `verificationLevel` enum('basic','verified','premium') DEFAULT 'basic' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `facialVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `cnhVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `addressVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `dateOfBirth` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `addressStreet` text;--> statement-breakpoint
ALTER TABLE `users` ADD `addressNumber` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `addressComplement` text;--> statement-breakpoint
ALTER TABLE `users` ADD `addressNeighborhood` text;--> statement-breakpoint
ALTER TABLE `users` ADD `addressCity` text;--> statement-breakpoint
ALTER TABLE `users` ADD `addressState` varchar(2);--> statement-breakpoint
ALTER TABLE `users` ADD `addressZipCode` varchar(10);--> statement-breakpoint
ALTER TABLE `users` ADD `totalTripsAsRenter` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `totalTripsAsHost` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `averageRating` decimal(3,2);