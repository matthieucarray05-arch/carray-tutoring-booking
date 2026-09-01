import { pgTable, serial, integer, text, timestamp, date } from "drizzle-orm/pg-core";

/**
 * Availability set per specific calendar date — not recurring. Each row is
 * one time range on one date, e.g. "2026-11-06, 18:00-20:00". Dates/times
 * are in the tutor's fixed timezone (see lib/config.ts) — no timezone math
 * happens on this side, only when computing customer-facing slots.
 */
export const availabilityDates = pgTable("availability_dates", {
  id: serial("id").primaryKey(),
  date: date("date", { mode: "string" }).notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
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
