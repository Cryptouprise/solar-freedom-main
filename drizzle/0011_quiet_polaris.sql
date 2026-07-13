ALTER TABLE `exitIntentCaptures` ADD `marketingConsent` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `exitIntentCaptures` ADD `consentVersion` varchar(64);--> statement-breakpoint
ALTER TABLE `exitIntentCaptures` ADD `consentRecordedAt` timestamp;--> statement-breakpoint
ALTER TABLE `leads` ADD `contactConsent` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `smsConsent` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `consentVersion` varchar(64);--> statement-breakpoint
ALTER TABLE `leads` ADD `consentRecordedAt` timestamp;