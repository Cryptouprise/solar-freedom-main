ALTER TABLE `blogPosts` ADD `editorialReviewerName` varchar(200);--> statement-breakpoint
ALTER TABLE `blogPosts` ADD `editorialReviewerRole` varchar(200);--> statement-breakpoint
ALTER TABLE `blogPosts` ADD `editorialReviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `blogPosts` ADD `editorialPrimarySources` text;--> statement-breakpoint
ALTER TABLE `blogPosts` ADD `editorialUniqueValueSummary` text;--> statement-breakpoint
ALTER TABLE `blogPosts` ADD `editorialFunnelOnlyDuplicate` tinyint DEFAULT 1 NOT NULL;