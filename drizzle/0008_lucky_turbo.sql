ALTER TABLE `blogPosts` ADD `podcastAudioUrl` text;--> statement-breakpoint
ALTER TABLE `blogPosts` ADD `podcastTitle` varchar(500);--> statement-breakpoint
ALTER TABLE `blogPosts` ADD `podcastDescription` text;--> statement-breakpoint
ALTER TABLE `blogPosts` ADD `podcastTranscript` text;--> statement-breakpoint
ALTER TABLE `blogPosts` ADD `podcastDuration` varchar(20);--> statement-breakpoint
ALTER TABLE `blogPosts` ADD `podcastEmbedUrl` text;--> statement-breakpoint
ALTER TABLE `blogPosts` ADD `videoUrl` text;--> statement-breakpoint
ALTER TABLE `blogPosts` ADD `videoTitle` varchar(500);--> statement-breakpoint
ALTER TABLE `blogPosts` ADD `videoDescription` text;--> statement-breakpoint
ALTER TABLE `blogPosts` ADD `videoThumbnail` text;--> statement-breakpoint
ALTER TABLE `blogPosts` ADD `videoDuration` varchar(20);--> statement-breakpoint
ALTER TABLE `blogPosts` ADD `galleryImages` text;--> statement-breakpoint
ALTER TABLE `blogPosts` ADD `targetKeyword` varchar(255);--> statement-breakpoint
ALTER TABLE `blogPosts` ADD `seoScore` int;