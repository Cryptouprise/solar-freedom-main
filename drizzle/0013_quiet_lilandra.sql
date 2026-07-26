CREATE TABLE `agentHealthLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentSlug` varchar(50) NOT NULL,
	`runId` int,
	`durationMs` int,
	`llmCalls` int NOT NULL DEFAULT 0,
	`tokensIn` int NOT NULL DEFAULT 0,
	`tokensOut` int NOT NULL DEFAULT 0,
	`costUsd` decimal(10,6) NOT NULL DEFAULT '0',
	`actionsCreated` int NOT NULL DEFAULT 0,
	`actionsApproved` int NOT NULL DEFAULT 0,
	`actionsRejected` int NOT NULL DEFAULT 0,
	`messagesCreated` int NOT NULL DEFAULT 0,
	`status` enum('success','partial','failed','skipped') NOT NULL,
	`errorMessage` text,
	`qualityScore` int,
	`improvementNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agentHealthLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `discoveredBacklinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceUrl` varchar(1000) NOT NULL,
	`sourceDomain` varchar(300) NOT NULL,
	`sourceType` enum('medium','press_release','directory','blog','forum','social','news','other') NOT NULL DEFAULT 'other',
	`targetUrl` varchar(1000) NOT NULL,
	`targetSlug` varchar(500),
	`anchorText` varchar(500),
	`doFollow` int NOT NULL DEFAULT 1,
	`domainAuthority` int,
	`domainRating` int,
	`firstDiscoveredAt` timestamp NOT NULL DEFAULT (now()),
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`isActive` int NOT NULL DEFAULT 1,
	`status` enum('new','verified','lost') NOT NULL DEFAULT 'new',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `discoveredBacklinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mediumArticles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mediumUrl` varchar(1000) NOT NULL,
	`title` varchar(500) NOT NULL,
	`publishedAt` timestamp,
	`canonicalUrl` varchar(1000),
	`outboundLinks` text,
	`outboundLinkCount` int NOT NULL DEFAULT 0,
	`lastCrawledAt` timestamp,
	`crawlStatus` enum('pending','crawled','error') NOT NULL DEFAULT 'pending',
	`crawlError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mediumArticles_id` PRIMARY KEY(`id`),
	CONSTRAINT `mediumArticles_mediumUrl_unique` UNIQUE(`mediumUrl`)
);
--> statement-breakpoint
CREATE TABLE `systemChangeLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actor` varchar(100) NOT NULL,
	`actorType` enum('agent','admin','cron','system') NOT NULL,
	`category` enum('agent_prompt','agent_model','content_published','content_updated','seo_change','lead_routing','automation_change','schema_change','config_change','press_release','backlink','error_fix','improvement','other') NOT NULL,
	`description` text NOT NULL,
	`details` text,
	`referenceType` varchar(50),
	`referenceId` int,
	`impactScore` int,
	`impactNotes` text,
	`measuredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `systemChangeLog_id` PRIMARY KEY(`id`)
);
