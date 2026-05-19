CREATE TABLE `blogDrafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postSlug` varchar(300) NOT NULL,
	`name` varchar(200) NOT NULL DEFAULT 'autosave',
	`title` varchar(500),
	`content` text,
	`metaTitle` varchar(300),
	`metaDescription` text,
	`excerpt` text,
	`heroImage` varchar(1000),
	`targetKeyword` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blogDrafts_id` PRIMARY KEY(`id`)
);
