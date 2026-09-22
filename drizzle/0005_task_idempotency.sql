ALTER TABLE `crm_tasks` ADD `idempotency_key` text;--> statement-breakpoint
ALTER TABLE `crm_tasks` ADD `request_hash` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_tasks_idempotency` ON `crm_tasks` (`lead_id`,`idempotency_key`);