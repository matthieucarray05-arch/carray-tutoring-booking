import { pgTable, serial, integer, text, timestamp, date } from "drizzle-orm/pg-core";

/**
 * Recurring weekly availability, e.g. "every Monday 09:00-12:00". Times are
 * "HH:mm" strings in the tutor's fixed timezone (see lib/config.ts) — no
 * timezone math happens on this side, only when computing customer-facing
 * slots.
 */
export const availabilityRules = pgTable("availability_rules", {
  id: serial("id").primaryKey(),
  /** ISO weekday: 1 = Monday ... 7 = Sunday. */
  weekday: integer("weekday").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * One-off exceptions to the recurring schedule: a full blocked day, or a
 * specific time range on a specific date. Also in the tutor's timezone.
 */
export const blockedDates = pgTable("blocked_dates", {
  id: serial("id").primaryKey(),
  date: date("date", { mode: "string" }).notNull(),
  /** Null start/end = the entire day is blocked. */
  startTime: text("start_time"),
  endTime: text("end_time"),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Confirmed bookings. Stored in UTC; converted to the tutor's or a
 * customer's timezone only for display.
 */
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  customerTimezone: text("customer_timezone"),
  status: text("status").notNull().default("confirmed"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
