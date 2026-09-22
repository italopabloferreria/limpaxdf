ALTER TABLE `customers` ADD `source_mode` text DEFAULT 'review' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `origin` text DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `import_batch` text;--> statement-breakpoint
CREATE INDEX `idx_customers_source_mode` ON `customers` (`source_mode`);--> statement-breakpoint
ALTER TABLE `leads` ADD `origin` text DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `import_batch` text;--> statement-breakpoint
CREATE INDEX `idx_leads_mode_origin` ON `leads` (`mode`,`origin`);