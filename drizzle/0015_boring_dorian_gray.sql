CREATE TABLE `cities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`state` varchar(2) NOT NULL,
	`latitude` decimal(10,8) NOT NULL,
	`longitude` decimal(11,8) NOT NULL,
	`population` int,
	`region` varchar(50),
	`vehicleCount` int NOT NULL DEFAULT 0,
	`averagePrice` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_location_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`latitude` decimal(10,8) NOT NULL,
	`longitude` decimal(11,8) NOT NULL,
	`city` varchar(100),
	`state` varchar(2),
	`accuracy` int,
	`source` enum('gps','ip','manual','geofence') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_location_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicle_location_index` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` int NOT NULL,
	`latitude` decimal(10,8) NOT NULL,
	`longitude` decimal(11,8) NOT NULL,
	`geohash` varchar(8) NOT NULL,
	`gridX` int NOT NULL,
	`gridY` int NOT NULL,
	`city` varchar(100) NOT NULL,
	`state` varchar(2) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicle_location_index_id` PRIMARY KEY(`id`),
	CONSTRAINT `vehicle_location_index_vehicleId_unique` UNIQUE(`vehicleId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `latitude` decimal(10,8);--> statement-breakpoint
ALTER TABLE `users` ADD `longitude` decimal(11,8);--> statement-breakpoint
ALTER TABLE `users` ADD `lastLocationUpdate` timestamp;