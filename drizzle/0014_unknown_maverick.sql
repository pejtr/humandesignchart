ALTER TABLE `socialPosts` MODIFY COLUMN `postType` enum('hd_type','quote','infographic','transit','iching','promo','custom','tiktok_script','story') NOT NULL DEFAULT 'custom';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','moderator','admin') NOT NULL DEFAULT 'user';
