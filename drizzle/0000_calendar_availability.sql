-- Initial schema for the calendar-based availability system.
-- If your database still has the old recurring-availability tables
-- (availability_rules, blocked_dates) from an earlier version, this drops
-- them first — that data is intentionally discarded.

DROP TABLE IF EXISTS "availability_rules";
DROP TABLE IF EXISTS "blocked_dates";

CREATE TABLE IF NOT EXISTS "availability_dates" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer NOT NULL,
	"customer_name" text,
	"customer_email" text,
	"customer_timezone" text,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
