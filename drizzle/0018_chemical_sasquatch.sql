ALTER TABLE `aiReadings` ADD `model` varchar(100);--> statement-breakpoint
ALTER TABLE `aiReadings` ADD `promptVersion` varchar(100);--> statement-breakpoint
ALTER TABLE `aiReadings` ADD `latencyMs` int;--> statement-breakpoint
ALTER TABLE `aiReadings` ADD `inputTokens` int;--> statement-breakpoint
ALTER TABLE `aiReadings` ADD `outputTokens` int;--> statement-breakpoint
ALTER TABLE `aiReadings` ADD `estimatedCostMicros` int;--> statement-breakpoint
ALTER TABLE `aiReadings` ADD `groundingStatus` enum('legacy','verified') DEFAULT 'legacy' NOT NULL;