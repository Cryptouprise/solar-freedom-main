CREATE TABLE `agentDailyChecklists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`agentSlug` varchar(64) NOT NULL,
	`runId` int,
	`status` enum('planned','running','passed','rework','blocked','failed') NOT NULL DEFAULT 'planned',
	`objective` varchar(500) NOT NULL,
	`revenuePath` text,
	`successCriteria` text NOT NULL,
	`evidence` text,
	`qaScore` int,
	`qaFeedback` text,
	`retryCount` int NOT NULL DEFAULT 0,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agentDailyChecklists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agentQualityReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`agentSlug` varchar(64) NOT NULL,
	`runId` int NOT NULL,
	`checklistId` int,
	`reviewerSlug` varchar(64) NOT NULL DEFAULT 'manager',
	`verdict` enum('passed','rework','blocked','failed') NOT NULL,
	`qualityScore` int NOT NULL,
	`dimensions` text,
	`feedback` text NOT NULL,
	`retryNumber` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agentQualityReviews_id` PRIMARY KEY(`id`)
);
