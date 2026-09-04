CREATE TABLE `seoIndexCoverageSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`capturedAt` timestamp NOT NULL DEFAULT (now()),
	`source` varchar(100) NOT NULL,
	`indexedUrlCount` int NOT NULL,
	`notIndexedUrlCount` int NOT NULL,
	`trackedArticleCount` int NOT NULL,
	`articleIndexedCount` int,
	`articleInspectionStatus` enum('verified','unavailable','partial') NOT NULL,
	`notes` text,
	CONSTRAINT `seoIndexCoverageSnapshots_id` PRIMARY KEY(`id`)
);
