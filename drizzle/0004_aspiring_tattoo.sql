CREATE TABLE `site_config` (
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_config_key` PRIMARY KEY(`key`(255))
);
--> statement-breakpoint
INSERT INTO `site_config` (`key`, `value`, `updated_at`)
SELECT `key`, `value`, COALESCE(`updatedAt`, NOW())
FROM `siteConfig`
ON DUPLICATE KEY UPDATE
`value` = VALUES(`value`),
`updated_at` = VALUES(`updated_at`);
--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `status` enum('active','inactive','archived','bankrupt','acquired','dissolved') NOT NULL DEFAULT 'active';
--> statement-breakpoint
DELETE FROM `companies` WHERE `slug` = 'test-company-delete-me';
