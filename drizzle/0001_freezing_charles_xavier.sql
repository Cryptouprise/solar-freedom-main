CREATE TABLE `exitIntentCaptures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`sourcePage` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exitIntentCaptures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(100),
	`lastName` varchar(100),
	`email` varchar(320),
	`phone` varchar(30),
	`solarCompany` varchar(100),
	`problemType` varchar(200),
	`contractType` varchar(100),
	`monthlyPayment` varchar(50),
	`intent` varchar(100),
	`formName` varchar(100),
	`sourcePage` varchar(255),
	`sourceUrl` text,
	`status` enum('new','contacted','qualified','closed_won','closed_lost') NOT NULL DEFAULT 'new',
	`ghlWebhookSent` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
