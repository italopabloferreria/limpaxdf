CREATE TABLE `crm_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`title` text NOT NULL,
	`due_at` integer,
	`assignee` text,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_tasks_lead` ON `crm_tasks` (`lead_id`,`completed_at`);--> statement-breakpoint
CREATE TABLE `lead_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`kind` text NOT NULL,
	`body` text NOT NULL,
	`author` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_activities_lead` ON `lead_activities` (`lead_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `leads` ADD `updated_at` integer;--> statement-breakpoint
ALTER TABLE `leads` ADD `assigned_to` text;--> statement-breakpoint
ALTER TABLE `leads` ADD `next_action_at` integer;