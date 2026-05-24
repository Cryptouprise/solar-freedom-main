CREATE TABLE `automationRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`automationId` int NOT NULL,
	`status` varchar(50) NOT NULL,
	`summary` text,
	`details` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`durationMs` int,
	CONSTRAINT `automationRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`spec` text NOT NULL,
	`cronExpression` varchar(100) NOT NULL,
	`cronLabel` varchar(100),
	`scheduleCronTaskUid` varchar(65),
	`isEnabled` tinyint NOT NULL DEFAULT 1,
	`lastRunAt` timestamp,
	`lastRunStatus` varchar(50),
	`lastRunSummary` text,
	`runCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `automations_id` PRIMARY KEY(`id`)
);
