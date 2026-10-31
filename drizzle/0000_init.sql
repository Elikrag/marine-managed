CREATE TABLE `activity_log` (
	`id` text PRIMARY KEY NOT NULL,
	`at` text DEFAULT (datetime('now')) NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`tool` text,
	`entity_type` text,
	`entity_id` text,
	`summary` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`key_hash` text NOT NULL,
	`prefix` text NOT NULL,
	`scope` text DEFAULT 'read' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`last_used_at` text,
	`revoked_at` text
);
--> statement-breakpoint
CREATE TABLE `boats` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`make` text,
	`model` text,
	`year` integer,
	`length_ft` real,
	`beam_ft` real,
	`hull_type` text,
	`hull_material` text,
	`hin` text,
	`registration_no` text,
	`registration_expires` text,
	`home_port` text,
	`purchase_date` text,
	`purchase_price` real,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cost_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`boat_id` text NOT NULL,
	`date` text NOT NULL,
	`category` text NOT NULL,
	`amount` real NOT NULL,
	`vendor` text,
	`note` text,
	`linked_type` text,
	`linked_id` text,
	`source` text DEFAULT 'manual' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`boat_id` text NOT NULL,
	`title` text NOT NULL,
	`kind` text DEFAULT 'other' NOT NULL,
	`filename` text NOT NULL,
	`mime_type` text,
	`size` integer,
	`text_extract` text,
	`attached_type` text,
	`attached_id` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `engines` (
	`id` text PRIMARY KEY NOT NULL,
	`boat_id` text NOT NULL,
	`make` text,
	`model` text,
	`year` integer,
	`serial` text,
	`hp` integer,
	`fuel_type` text,
	`drive_type` text,
	`current_hours` real DEFAULT 0 NOT NULL,
	`hours_updated_at` text,
	`prop` text,
	`gear_ratio` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `insurance_policies` (
	`id` text PRIMARY KEY NOT NULL,
	`boat_id` text NOT NULL,
	`covers` text DEFAULT 'boat' NOT NULL,
	`carrier` text NOT NULL,
	`policy_no` text,
	`agent_contact` text,
	`coverage_summary` text,
	`hull_value` real,
	`liability_limit` real,
	`deductible` real,
	`premium` real,
	`billing_period` text DEFAULT 'year',
	`starts` text,
	`renews` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `issue_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`issue_id` text NOT NULL,
	`author` text DEFAULT 'user' NOT NULL,
	`body` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `issues` (
	`id` text PRIMARY KEY NOT NULL,
	`boat_id` text NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`severity` text DEFAULT 'med' NOT NULL,
	`target_type` text DEFAULT 'boat' NOT NULL,
	`target_id` text,
	`first_noticed` text,
	`symptoms` text,
	`suspected_cause` text,
	`est_cost` text,
	`resolved_on` text,
	`resolution` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pending_writes` (
	`id` text PRIMARY KEY NOT NULL,
	`api_key_id` text,
	`tool` text NOT NULL,
	`args` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`result` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`resolved_at` text
);
--> statement-breakpoint
CREATE TABLE `service_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`boat_id` text NOT NULL,
	`date` text NOT NULL,
	`kind` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text,
	`title` text NOT NULL,
	`description` text,
	`performed_by` text,
	`engine_hours_at` real,
	`parts` text,
	`labor_cost` real,
	`total_cost` real,
	`resolves_issue_id` text,
	`source` text DEFAULT 'manual' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `service_intervals` (
	`id` text PRIMARY KEY NOT NULL,
	`engine_id` text NOT NULL,
	`item` text NOT NULL,
	`every_hours` real,
	`every_months` integer,
	`last_hours` real,
	`last_date` text
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `storage` (
	`id` text PRIMARY KEY NOT NULL,
	`boat_id` text NOT NULL,
	`target` text DEFAULT 'boat' NOT NULL,
	`kind` text NOT NULL,
	`location_name` text NOT NULL,
	`address` text,
	`contact` text,
	`cost` real,
	`billing_period` text DEFAULT 'season',
	`season_start` text,
	`season_end` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `systems` (
	`id` text PRIMARY KEY NOT NULL,
	`boat_id` text NOT NULL,
	`category` text NOT NULL,
	`name` text NOT NULL,
	`make` text,
	`model` text,
	`serial` text,
	`installed_on` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `trailers` (
	`id` text PRIMARY KEY NOT NULL,
	`boat_id` text NOT NULL,
	`make` text,
	`model` text,
	`year` integer,
	`vin` text,
	`axles` integer,
	`capacity_lbs` integer,
	`tire_size` text,
	`tire_pressure` text,
	`brake_type` text,
	`registration_no` text,
	`registration_expires` text,
	`last_bearing_service` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
