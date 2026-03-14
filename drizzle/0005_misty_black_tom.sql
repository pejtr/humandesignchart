CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerId` int NOT NULL,
	`referredUserId` int NOT NULL,
	`referralCode` varchar(16) NOT NULL,
	`status` enum('pending','completed') NOT NULL DEFAULT 'pending',
	`referrerCredited` boolean NOT NULL DEFAULT false,
	`referredCredited` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `referrals_referredUserId_unique` UNIQUE(`referredUserId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `referralCode` varchar(16);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_referralCode_unique` UNIQUE(`referralCode`);