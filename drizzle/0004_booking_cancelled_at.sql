-- Tracks when a booking was self-service cancelled, so the admin page can
-- show a "recently cancelled" list instead of the slot just silently
-- disappearing from "Upcoming bookings".

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp with time zone;
