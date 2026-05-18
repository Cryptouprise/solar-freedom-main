CREATE TABLE `aiCostLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`feature` varchar(100) NOT NULL,
	`callType` enum('text','image','embedding') NOT NULL,
	`model` varchar(200) NOT NULL,
	`tokensIn` int DEFAULT 0,
	`tokensOut` int DEFAULT 0,
	`imageCount` int DEFAULT 0,
	`costUsd` decimal(10,6) NOT NULL DEFAULT '0',
	`referenceId` int,
	`referenceType` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiCostLog_id` PRIMARY KEY(`id`)
);
