CREATE TABLE IF NOT EXISTS `pushSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`locale` varchar(5) NOT NULL DEFAULT 'cs',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pushSubscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `testimonials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`hdType` varchar(50),
	`text` text NOT NULL,
	`rating` int NOT NULL DEFAULT 5,
	`locale` varchar(5) NOT NULL DEFAULT 'cs',
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `testimonials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `chatConversations` ADD `chartId` int NULL AFTER `userId`;--> statement-breakpoint
ALTER TABLE `chatConversations` ADD `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP AFTER `createdAt`;--> statement-breakpoint
ALTER TABLE `newsletter_subscribers` ADD `status` enum('pending','confirmed') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `newsletter_subscribers` ADD `confirmToken` varchar(64);--> statement-breakpoint
ALTER TABLE `newsletter_subscribers` ADD `confirmedAt` timestamp;
