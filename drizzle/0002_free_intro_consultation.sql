-- Adds support for free intro consultation bookings, which have no
-- Stripe order/credit behind them.

ALTER TABLE "bookings" ALTER COLUMN "order_id" DROP NOT NULL;
ALTER TABLE "bookings" ALTER COLUMN "credit_id" DROP NOT NULL;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "booking_type" text;

-- Backfill existing rows (paid bookings only exist before this migration)
-- from their order's product type.
UPDATE "bookings" b
SET "booking_type" = CASE
  WHEN o.product_type = 'lesson_package' THEN 'pack'
  WHEN o.product_type = 'single_lesson' THEN 'single_session'
  ELSE 'single_session'
END
FROM "orders" o
WHERE b.order_id = o.id AND b.booking_type IS NULL;

-- Any row that still has no order (shouldn't happen before this feature
-- shipped, but keeps the NOT NULL below safe either way).
UPDATE "bookings" SET "booking_type" = 'single_session' WHERE "booking_type" IS NULL;

ALTER TABLE "bookings" ALTER COLUMN "booking_type" SET NOT NULL;

-- Enforces "one free intro consultation per email" atomically at the DB
-- level (case-insensitive), so two near-simultaneous submissions with the
-- same email can't both slip past the application-level check.
CREATE UNIQUE INDEX IF NOT EXISTS "bookings_free_intro_email_unique"
  ON "bookings" (lower("customer_email"))
  WHERE "booking_type" = 'free_intro' AND "status" = 'confirmed';
