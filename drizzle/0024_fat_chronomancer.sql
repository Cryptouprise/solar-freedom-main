CREATE TABLE `seoScorecardSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`capturedAt` timestamp NOT NULL DEFAULT (now()),
	`periodStart` varchar(10) NOT NULL,
	`periodEnd` varchar(10) NOT NULL,
	`pageRows` int NOT NULL DEFAULT 0,
	`clicks` int NOT NULL DEFAULT 0,
	`impressions` int NOT NULL DEFAULT 0,
	`durableLeads` int NOT NULL DEFAULT 0,
	`crmDeliveries` int NOT NULL DEFAULT 0,
	`verifiedBacklinks` int NOT NULL DEFAULT 0,
	`alerts` text,
	CONSTRAINT `seoScorecardSnapshots_id` PRIMARY KEY(`id`)
);
