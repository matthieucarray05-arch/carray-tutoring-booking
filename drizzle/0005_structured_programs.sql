-- Adds structured-program support (Carray Starter/Progress/Fluency).
-- Programs reuse the existing lesson_credits/bookings machinery — a
-- program purchase just creates credits tagged with program_id/
-- program_language instead of untagged ones. Fully nullable, no backfill:
-- existing rows are simply not program-related.

ALTER TABLE "lesson_credits" ADD COLUMN IF NOT EXISTS "program_id" text;
ALTER TABLE "lesson_credits" ADD COLUMN IF NOT EXISTS "program_language" text;

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "program_id" text;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "program_language" text;
