CREATE TABLE `socialAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platform` enum('facebook','instagram','linkedin','pinterest') NOT NULL,
	`accountId` varchar(128) NOT NULL,
	`accountName` varchar(255) NOT NULL,
	`accountHandle` varchar(128),
	`accountAvatar` text,
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`pageId` varchar(128),
	`pageName` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `socialAccounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `socialPostAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`accountId` int NOT NULL,
	`status` enum('pending','published','failed') NOT NULL DEFAULT 'pending',
	`platformPostId` varchar(255),
	`errorMessage` text,
	`publishedAt` timestamp,
	CONSTRAINT `socialPostAccounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `socialPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255),
	`caption` text NOT NULL,
	`imageUrl` text,
	`imagePrompt` text,
	`postType` enum('hd_type','quote','infographic','transit','iching','promo','custom') NOT NULL DEFAULT 'custom',
	`locale` enum('cs','en') NOT NULL DEFAULT 'cs',
	`hashtags` text,
	`scheduledAt` timestamp,
	`publishedAt` timestamp,
	`status` enum('draft','scheduled','publishing','published','failed') NOT NULL DEFAULT 'draft',
	`errorMessage` text,
	`platforms` json NOT NULL,
	`platformPostIds` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `socialPosts_id` PRIMARY KEY(`id`)
);
