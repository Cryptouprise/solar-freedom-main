CREATE TABLE `agentChatThreads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentSlug` varchar(64) NOT NULL,
	`runId` int,
	`role` enum('agent','system','user') NOT NULL DEFAULT 'agent',
	`message` text NOT NULL,
	`messageType` enum('analysis','action','result','error','directive','summary') NOT NULL DEFAULT 'analysis',
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `agentChatThreads_id` PRIMARY KEY(`id`)
);
