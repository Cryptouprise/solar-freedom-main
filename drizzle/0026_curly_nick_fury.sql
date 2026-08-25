ALTER TABLE `attorneyProspects` ADD `qualityTier` enum('unreviewed','priority','review','defer') DEFAULT 'unreviewed' NOT NULL;--> statement-breakpoint
ALTER TABLE `attorneyProspects` ADD `qualityConfidence` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `attorneyProspects` ADD `qualityExplanation` text;--> statement-breakpoint
ALTER TABLE `attorneyProspects` ADD `qualityGates` text;--> statement-breakpoint
ALTER TABLE `attorneyProspects` ADD `qualityReviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `attorneyProspects` ADD `linkedInSearchUrl` varchar(1000);--> statement-breakpoint
ALTER TABLE `attorneyProspects` ADD `linkedInProfileUrl` varchar(1000);--> statement-breakpoint
ALTER TABLE `attorneyProspects` ADD `linkedInResearchStatus` enum('not_started','research_ready','verified','not_found') DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE `attorneyProspects` ADD `linkedInOutreachStatus` enum('not_ready','drafted','approved','sent','replied','not_a_fit') DEFAULT 'not_ready' NOT NULL;--> statement-breakpoint
ALTER TABLE `attorneyProspects` ADD `linkedInDraft` text;--> statement-breakpoint
ALTER TABLE `attorneyProspects` ADD `outreachApprovedAt` timestamp;--> statement-breakpoint
ALTER TABLE `attorneyProspects` ADD `outreachSentAt` timestamp;--> statement-breakpoint
