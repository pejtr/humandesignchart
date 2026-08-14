CREATE TABLE `entitlement_ledger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paymentEventId` int NOT NULL,
	`userId` int NOT NULL,
	`entitlementKey` varchar(100) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`status` enum('pending','active','reversed','manual_review') NOT NULL DEFAULT 'pending',
	`metadata` json,
	`appliedAt` timestamp,
	`reversedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `entitlement_ledger_id` PRIMARY KEY(`id`),
	CONSTRAINT `entitlement_ledger_event_key_unique` UNIQUE(`paymentEventId`,`entitlementKey`)
);
--> statement-breakpoint
CREATE TABLE `payment_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` enum('stripe','comgate') NOT NULL,
	`eventId` varchar(255) NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`status` enum('received','processing','fulfilled','failed','audit','reversed') NOT NULL DEFAULT 'received',
	`attemptCount` int NOT NULL DEFAULT 0,
	`userId` int,
	`productKey` varchar(64),
	`paymentRef` varchar(255),
	`amountMinor` int,
	`expectedAmountMinor` int,
	`currency` varchar(3),
	`reversalOfPaymentEventId` int,
	`rawPayload` json,
	`errorCode` varchar(100),
	`errorMessage` text,
	`claimedAt` timestamp,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_events_provider_eventId_unique` UNIQUE(`provider`,`eventId`)
);
--> statement-breakpoint
ALTER TABLE `affiliateConversions` ADD `paymentEventId` int;--> statement-breakpoint
ALTER TABLE `affiliateConversions` ADD CONSTRAINT `affiliateConversions_paymentEventId_unique` UNIQUE(`paymentEventId`);