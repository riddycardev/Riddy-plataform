-- Migration: 0018_etapa6_indexes
-- ETAPA 6: Adiciona índices secundários para performance
-- Tabelas: user_documents, vehicles, bookings, payments, conversations, messages, reviews
--> statement-breakpoint
CREATE INDEX `user_documents_userId_idx` ON `user_documents` (`userId`);
--> statement-breakpoint
CREATE INDEX `vehicles_hostId_idx` ON `vehicles` (`hostId`);
--> statement-breakpoint
CREATE INDEX `vehicles_status_city_idx` ON `vehicles` (`status`,`pickupCity`);
--> statement-breakpoint
CREATE INDEX `vehicles_vehicleType_idx` ON `vehicles` (`vehicleType`);
--> statement-breakpoint
CREATE INDEX `bookings_renterId_idx` ON `bookings` (`renterId`);
--> statement-breakpoint
CREATE INDEX `bookings_hostId_idx` ON `bookings` (`hostId`);
--> statement-breakpoint
CREATE INDEX `bookings_vehicleId_dates_idx` ON `bookings` (`vehicleId`,`startDate`,`endDate`);
--> statement-breakpoint
CREATE INDEX `bookings_status_idx` ON `bookings` (`status`);
--> statement-breakpoint
CREATE INDEX `payments_userId_idx` ON `payments` (`userId`);
--> statement-breakpoint
CREATE INDEX `payments_bookingId_idx` ON `payments` (`bookingId`);
--> statement-breakpoint
CREATE INDEX `payments_stripeSessionId_idx` ON `payments` (`stripeSessionId`);
--> statement-breakpoint
CREATE INDEX `conversations_participant1Id_idx` ON `conversations` (`participant1Id`);
--> statement-breakpoint
CREATE INDEX `conversations_participant2Id_idx` ON `conversations` (`participant2Id`);
--> statement-breakpoint
CREATE INDEX `messages_conversationId_idx` ON `messages` (`conversationId`);
--> statement-breakpoint
CREATE INDEX `messages_conversationId_isRead_idx` ON `messages` (`conversationId`,`isRead`);
--> statement-breakpoint
CREATE INDEX `reviews_vehicleId_idx` ON `reviews` (`vehicleId`);
--> statement-breakpoint
CREATE INDEX `reviews_isPublic_idx` ON `reviews` (`isPublic`);
