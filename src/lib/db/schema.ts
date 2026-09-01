import { pgTable, serial, integer, text, timestamp, date, jsonb } from "drizzle-orm/pg-core";

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
 * One row per completed Stripe Checkout payment. Billing details captured
 * by Checkout (address, optional company name / VAT ID) are stored here,
 * linked to whatever lesson credits and booking the payment produced.
 */
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  stripeCheckoutSessionId: text("stripe_checkout_session_id").notNull().unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  productId: text("product_id").notNull(),
  productType: text("product_type").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  creditsCount: integer("credits_count").notNull(),
  amountTotalCents: integer("amount_total_cents").notNull(),
  currency: text("currency").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name"),
  companyName: text("company_name"),
  vatId: text("vat_id"),
  billingAddress: jsonb("billing_address"),
  status: text("status").notNull().default("paid"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * One row per lesson credit. A single lesson purchase creates 1 (consumed
 * immediately); a package creates N (1 consumed for the first booked slot,
 * the rest left "available" for the customer to redeem later).
 */
export const lessonCredits = pgTable("lesson_credits", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),
  customerEmail: text("customer_email").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  status: text("status").notNull().default("available"),
  /** Not a DB-level FK (would be circular with bookings.credit_id) — set once the credit is consumed. */
  bookingId: integer("booking_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Confirmed bookings. Stored in UTC; converted to the tutor's or a
 * customer's timezone only for display. Only ever created by the Stripe
 * webhook after a payment actually succeeds.
 */
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),
  creditId: integer("credit_id")
    .notNull()
    .references(() => lessonCredits.id),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  customerTimezone: text("customer_timezone"),
  status: text("status").notNull().default("confirmed"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
