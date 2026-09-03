-- Adds a per-booking random token used for the self-service manage/cancel
-- link sent in confirmation emails (see /[locale]/manage/[token]).

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "manage_token" text;

-- Backfill existing rows with a random token (no pgcrypto dependency needed).
UPDATE "bookings"
SET "manage_token" = md5(random()::text || clock_timestamp()::text || id::text)
WHERE "manage_token" IS NULL;

ALTER TABLE "bookings" ALTER COLUMN "manage_token" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "bookings_manage_token_unique" ON "bookings" ("manage_token");
