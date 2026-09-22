CREATE TABLE `crm_audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`author` text NOT NULL,
	`data` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_entity` ON `crm_audit_log` (`entity_type`,`entity_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_author` ON `crm_audit_log` (`author`,`created_at`);--> statement-breakpoint
CREATE TABLE `crm_user_profiles` (
	`email` text PRIMARY KEY NOT NULL,
	`display_name` text,
	`role` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`last_seen_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_crm_users_role_active` ON `crm_user_profiles` (`role`,`active`);--> statement-breakpoint
CREATE TABLE `customer_contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`name` text NOT NULL,
	`role` text,
	`phone` text,
	`phone_normalized` text,
	`email` text,
	`is_primary` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_contacts_customer` ON `customer_contacts` (`customer_id`);--> statement-breakpoint
CREATE INDEX `idx_contacts_phone` ON `customer_contacts` (`phone_normalized`);--> statement-breakpoint
CREATE INDEX `idx_contacts_email` ON `customer_contacts` (`email`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`trade_name` text,
	`tax_id` text,
	`tax_id_normalized` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`archived_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_customers_name` ON `customers` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_customers_tax_id` ON `customers` (`tax_id_normalized`);--> statement-breakpoint
CREATE TABLE `lead_customer_links` (
	`lead_id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`contact_id` text,
	`location_id` text,
	`linked_at` integer NOT NULL,
	`linked_by` text NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contact_id`) REFERENCES `customer_contacts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`location_id`) REFERENCES `service_locations`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_lead_customer_customer` ON `lead_customer_links` (`customer_id`);--> statement-breakpoint
CREATE TABLE `service_locations` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`label` text NOT NULL,
	`postal_code` text,
	`address` text,
	`number` text,
	`complement` text,
	`district` text,
	`city` text,
	`state` text,
	`reference` text,
	`access_notes` text,
	`is_primary` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_locations_customer` ON `service_locations` (`customer_id`);