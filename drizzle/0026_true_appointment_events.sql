ALTER TABLE `ghlPipelineEvents` ADD `externalEventId` varchar(128);
CREATE UNIQUE INDEX `ghlPipelineEvents_externalEventId_unique` ON `ghlPipelineEvents` (`externalEventId`);
