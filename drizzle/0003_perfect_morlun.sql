CREATE TABLE `apiKeys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`keyHash` varchar(255) NOT NULL,
	`keyPrefix` varchar(10) NOT NULL,
	`permissions` text NOT NULL,
	`lastUsedAt` timestamp,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `apiKeys_id` PRIMARY KEY(`id`),
	CONSTRAINT `apiKeys_keyHash_unique` UNIQUE(`keyHash`)
);
--> statement-breakpoint
CREATE TABLE `blogPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(255) NOT NULL,
	`title` varchar(500) NOT NULL,
	`metaTitle` varchar(500),
	`metaDescription` text,
	`heroImage` text,
	`category` varchar(100),
	`tags` text,
	`content` text NOT NULL,
	`excerpt` text,
	`readTime` varchar(20),
	`relatedSlugs` text,
	`faqItems` text,
	`canonicalUrl` varchar(500),
	`published` int NOT NULL DEFAULT 1,
	`publishedAt` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blogPosts_id` PRIMARY KEY(`id`),
	CONSTRAINT `blogPosts_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(100) NOT NULL,
	`name` varchar(200) NOT NULL,
	`legalName` varchar(200),
	`status` enum('active','bankrupt','acquired','dissolved') NOT NULL DEFAULT 'active',
	`bbbRating` varchar(10),
	`complaintCount` varchar(50),
	`avgMonthlyPayment` varchar(50),
	`avgContractLength` varchar(50),
	`founded` varchar(10),
	`headquarters` varchar(200),
	`contractTypes` text,
	`heroHeadline` varchar(500),
	`heroSubheadline` varchar(500),
	`problemSummary` text,
	`customerComplaints` text,
	`documentedIssues` text,
	`legalGrounds` text,
	`lawsuits` text,
	`statesCovered` text,
	`relatedSlugs` text,
	`published` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`),
	CONSTRAINT `companies_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `siteConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`description` varchar(500),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `siteConfig_key_unique` UNIQUE(`key`)
);
