CREATE TABLE `affiliateConversions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliateUserId` int NOT NULL,
	`convertedUserId` int NOT NULL,
	`stripeSubscriptionId` varchar(64),
	`amount` float NOT NULL,
	`commissionRate` float NOT NULL,
	`commissionAmount` float NOT NULL,
	`status` enum('pending','paid','cancelled') NOT NULL DEFAULT 'pending',
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliateConversions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliatePayouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliateUserId` int NOT NULL,
	`amount` float NOT NULL,
	`paymentMethod` enum('bank_transfer','paypal') NOT NULL DEFAULT 'bank_transfer',
	`paymentDetails` text,
	`status` enum('requested','processing','paid','rejected') NOT NULL DEFAULT 'requested',
	`note` text,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliatePayouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creditTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`reason` varchar(100) NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creditTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `currentStreak` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `longestStreak` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lastLoginDate` varchar(10);--> statement-breakpoint
ALTER TABLE `users` ADD `lastDailyRewardAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `level` enum('searcher','awakened','initiated','guide','master') DEFAULT 'searcher' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `totalCreditsEarned` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `isAffiliate` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `affiliateCode` varchar(16);--> statement-breakpoint
ALTER TABLE `users` ADD `affiliateTier` enum('bronze','silver','gold') DEFAULT 'bronze' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `affiliateTotalEarned` float DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `affiliatePendingPayout` float DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_affiliateCode_unique` UNIQUE(`affiliateCode`);