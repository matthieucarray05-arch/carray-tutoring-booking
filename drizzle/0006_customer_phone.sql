-- Adds a mandatory-going-forward phone number field, collected alongside
-- first/last name and email across every booking flow. Fully nullable,
-- no backfill: existing rows predate the requirement and are simply not
-- populated.

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_phone" text;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "customer_phone" text;
