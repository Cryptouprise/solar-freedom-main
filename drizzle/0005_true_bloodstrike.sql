CREATE TABLE `pressReleaseLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topicId` int NOT NULL,
	`headline` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`boilerplate` text,
	`modelUsed` varchar(100),
	`tokensUsed` int,
	`site` varchar(100) NOT NULL,
	`siteLabel` varchar(200),
	`submittedAt` timestamp,
	`publishedUrl` varchar(1000),
	`status` enum('success','failed','skipped') NOT NULL DEFAULT 'failed',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pressReleaseLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pressReleaseSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pressReleaseSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `pressReleaseSettings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `pressReleaseTopics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`angle` text,
	`targetKeywords` varchar(500),
	`targetUrl` varchar(500),
	`sortOrder` int NOT NULL DEFAULT 0,
	`status` enum('pending','running','published','failed') NOT NULL DEFAULT 'pending',
	`scheduledFor` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pressReleaseTopics_id` PRIMARY KEY(`id`)
);
