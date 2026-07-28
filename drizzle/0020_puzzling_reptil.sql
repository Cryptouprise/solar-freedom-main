CREATE TABLE `agentGoalRetryConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentSlug` varchar(64) NOT NULL,
	`maxRetries` int NOT NULL DEFAULT 3,
	`retryIntervalMinutes` int NOT NULL DEFAULT 30,
	`goalSuccessCriteria` text,
	`enabled` tinyint NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agentGoalRetryConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `agentGoalRetryConfig_agentSlug_unique` UNIQUE(`agentSlug`)
);
--> statement-breakpoint
CREATE TABLE `agentModelConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentSlug` varchar(64) NOT NULL,
	`modelId` varchar(128) NOT NULL,
	`modelLabel` varchar(128) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agentModelConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `agentModelConfig_agentSlug_unique` UNIQUE(`agentSlug`)
);
