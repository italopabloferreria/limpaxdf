CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`object_key` text NOT NULL,
	`mime` text NOT NULL,
	`bytes` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_attachments_lead` ON `attachments` (`lead_id`);--> statement-breakpoint
CREATE TABLE `events` (
	`day` text NOT NULL,
	`event` text NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_events_day_event` ON `events` (`day`,`event`);--> statement-breakpoint
CREATE TABLE `leads` (
	`seq` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id` text NOT NULL,
	`idempotency` text NOT NULL,
	`payload_hash` text NOT NULL,
	`payload` text NOT NULL,
	`mode` text NOT NULL,
	`status` text DEFAULT 'novo' NOT NULL,
	`created_at` integer NOT NULL,
	`privacy_version` text NOT NULL,
	`marketing` integer NOT NULL,
	`upload_hash` text NOT NULL,
	`upload_expires` integer NOT NULL,
	`upload_count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leads_id_unique` ON `leads` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `leads_idempotency_unique` ON `leads` (`idempotency`);--> statement-breakpoint
CREATE INDEX `idx_leads_created` ON `leads` (`created_at`);--> statement-breakpoint
CREATE TABLE `outbox` (
	`lead_id` text PRIMARY KEY NOT NULL,
	`state` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`next_attempt` integer DEFAULT 0 NOT NULL,
	`lease_until` integer DEFAULT 0 NOT NULL,
	`delivered_at` integer,
	`last_error` text,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_outbox_pending` ON `outbox` (`state`,`next_attempt`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_rates_expires` ON `rate_limits` (`expires`);--> statement-breakpoint
CREATE TABLE `service_records` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text,
	`completed_at` integer,
	`category` text,
	`vehicle_id` text,
	`next_review` integer,
	`interval_days` integer,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE set null
);
