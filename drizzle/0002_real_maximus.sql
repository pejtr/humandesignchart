CREATE TABLE `sharedCharts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(64) NOT NULL,
	`chartData` json NOT NULL,
	`ownerName` varchar(255),
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sharedCharts_id` PRIMARY KEY(`id`),
	CONSTRAINT `sharedCharts_token_unique` UNIQUE(`token`)
);
