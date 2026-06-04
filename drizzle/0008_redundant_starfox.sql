ALTER TABLE `vehicles` ADD `crlvUrl` text;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `crlvFileKey` varchar(255);--> statement-breakpoint
ALTER TABLE `vehicles` ADD `crlvValidated` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `crlvOwnerName` text;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `insuranceUrl` text;--> statement-breakpoint
ALTER TABLE `vehicles` ADD `insuranceFileKey` varchar(255);