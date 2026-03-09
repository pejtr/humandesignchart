CREATE TABLE `giftVouchers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`purchasedByUserId` int,
	`redeemedByUserId` int,
	`recipientEmail` varchar(320),
	`recipientName` varchar(255),
	`senderName` varchar(255),
	`personalMessage` text,
	`plan` enum('monthly','annual','credits') NOT NULL,
	`creditsAmount` int NOT NULL DEFAULT 0,
	`stripePaymentIntentId` varchar(64),
	`isRedeemed` boolean NOT NULL DEFAULT false,
	`expiresAt` timestamp,
	`redeemedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `giftVouchers_id` PRIMARY KEY(`id`),
	CONSTRAINT `giftVouchers_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` enum('active','canceled','past_due','trialing','none') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionPlan` enum('monthly','annual','none') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionCurrentPeriodEnd` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `aiReadingCredits` int DEFAULT 0 NOT NULL;