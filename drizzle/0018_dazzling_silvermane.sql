CREATE TABLE `agentGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentSlug` varchar(50) NOT NULL,
	`date` varchar(10) NOT NULL,
	`goalType` varchar(100) NOT NULL,
	`metric` varchar(200) NOT NULL,
	`target` varchar(200) NOT NULL,
	`actual` varchar(200),
	`hit` tinyint,
	`directive` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agentGoals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agentLearning` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentSlug` varchar(50) NOT NULL,
	`lessonType` varchar(50) NOT NULL,
	`lesson` text NOT NULL,
	`impact` varchar(200),
	`relatedGoalId` int,
	`learnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agentLearning_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agentMemory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentSlug` varchar(50) NOT NULL,
	`key` varchar(200) NOT NULL,
	`value` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agentMemory_id` PRIMARY KEY(`id`)
);
