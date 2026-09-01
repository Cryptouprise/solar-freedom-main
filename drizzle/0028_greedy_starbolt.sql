CREATE TABLE `seoPageMetricSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`capturedAt` timestamp NOT NULL DEFAULT (now()),
	`periodStart` varchar(10) NOT NULL,
	`periodEnd` varchar(10) NOT NULL,
	`pageUrl` varchar(1000) NOT NULL,
	`pageSlug` varchar(500) NOT NULL,
	`clicks` int NOT NULL DEFAULT 0,
	`impressions` int NOT NULL DEFAULT 0,
	`ctrPercent` decimal(8,4) NOT NULL DEFAULT '0',
	`avgPosition` decimal(8,2) NOT NULL DEFAULT '0',
	CONSTRAINT `seoPageMetricSnapshots_id` PRIMARY KEY(`id`)
);
