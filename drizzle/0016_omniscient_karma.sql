CREATE TABLE `ghlPipelineEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ghlContactId` varchar(64) NOT NULL,
	`ghlOpportunityId` varchar(64),
	`pipelineId` varchar(64),
	`pipelineName` varchar(200),
	`stageId` varchar(64),
	`stageName` varchar(200),
	`eventType` varchar(50) NOT NULL,
	`assignedTo` varchar(200),
	`performedBy` varchar(200),
	`monetaryValue` decimal(10,2),
	`paymentStatus` varchar(50),
	`occurredAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ghlPipelineEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leadJourneyEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`leadId` int,
	`eventType` varchar(50) NOT NULL,
	`page` varchar(500) NOT NULL,
	`pageTitle` varchar(300),
	`timeOnPageMs` int DEFAULT 0,
	`scrollDepthPct` int DEFAULT 0,
	`detail` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leadJourneyEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leadSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`utmSource` varchar(100),
	`utmMedium` varchar(100),
	`utmCampaign` varchar(200),
	`referrer` text,
	`firstPage` varchar(500),
	`lastPage` varchar(500),
	`totalPages` int NOT NULL DEFAULT 0,
	`totalTimeMs` int NOT NULL DEFAULT 0,
	`leadId` int,
	`ghlContactId` varchar(64),
	`userAgent` text,
	`deviceType` varchar(20),
	`submittedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leadSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `leadSessions_sessionId_unique` UNIQUE(`sessionId`)
);
