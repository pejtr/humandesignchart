CREATE TABLE `aiReadings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`chartId` int NOT NULL,
	`readingType` varchar(50) NOT NULL,
	`content` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiReadings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `celebrities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`birthDate` varchar(30) NOT NULL,
	`birthTime` varchar(10) NOT NULL,
	`birthPlace` varchar(500) NOT NULL,
	`latitude` varchar(30) NOT NULL,
	`longitude` varchar(30) NOT NULL,
	`timezone` varchar(100) NOT NULL,
	`category` varchar(100),
	`imageUrl` text,
	`chartData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `celebrities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `charts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`birthDate` varchar(30) NOT NULL,
	`birthTime` varchar(10) NOT NULL,
	`birthPlace` varchar(500) NOT NULL,
	`latitude` varchar(30) NOT NULL,
	`longitude` varchar(30) NOT NULL,
	`timezone` varchar(100) NOT NULL,
	`category` enum('self','family','friend','client','celebrity','other') NOT NULL DEFAULT 'other',
	`chartData` json,
	`isFavorite` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `charts_id` PRIMARY KEY(`id`)
);
