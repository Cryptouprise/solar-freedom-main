CREATE TABLE `siteEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`pagePath` varchar(500) NOT NULL,
	`formName` varchar(200),
	`ctaLabel` varchar(200),
	`scrollDepth` int,
	`sessionId` varchar(64),
	`referrer` varchar(500),
	`userAgent` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `siteEvents_id` PRIMARY KEY(`id`)
);
