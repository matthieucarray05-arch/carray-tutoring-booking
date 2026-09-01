-- Adds orders + lesson_credits for the Stripe Checkout integration, and
-- links bookings to the order/credit that paid for them.
--
-- Assumes the "bookings" table is currently empty (true until this feature
-- shipped, since nothing could create a real booking before). If it isn't,
-- the two SET NOT NULL statements below will fail — backfill order_id /
-- credit_id on existing rows first in that case.

CREATE TABLE IF NOT EXISTS "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"stripe_checkout_session_id" text NOT NULL,
	"stripe_payment_intent_id" text,
	"product_id" text NOT NULL,
	"product_type" text NOT NULL,
	"duration_minutes" integer NOT NULL,
	"credits_count" integer NOT NULL,
	"amount_total_cents" integer NOT NULL,
	"currency" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_name" text,
	"company_name" text,
	"vat_id" text,
	"billing_address" jsonb,
	"status" text DEFAULT 'paid' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_stripe_checkout_session_id_unique" UNIQUE("stripe_checkout_session_id")
);

CREATE TABLE IF NOT EXISTS "lesson_credits" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"customer_email" text NOT NULL,
	"duration_minutes" integer NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"booking_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "order_id" integer;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "credit_id" integer;
ALTER TABLE "bookings" ALTER COLUMN "order_id" SET NOT NULL;
ALTER TABLE "bookings" ALTER COLUMN "credit_id" SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE "lesson_credits" ADD CONSTRAINT "lesson_credits_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "bookings" ADD CONSTRAINT "bookings_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "bookings" ADD CONSTRAINT "bookings_credit_id_lesson_credits_id_fk" FOREIGN KEY ("credit_id") REFERENCES "public"."lesson_credits"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
