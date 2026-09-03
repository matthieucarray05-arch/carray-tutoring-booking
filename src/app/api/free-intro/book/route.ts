import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { availabilityDates, bookings } from "@/lib/db/schema";
import { getAvailableSlots } from "@/lib/availability";
import { FREE_INTRO_DURATION_MINUTES } from "@/lib/mock-data";
import { TUTOR_TIMEZONE } from "@/lib/config";
import { routing } from "@/i18n/routing";
import { notifyFreeIntroBooking } from "@/lib/notifications";
import { formatBookingNumber } from "@/lib/booking-number";

export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Postgres unique_violation error code. */
const UNIQUE_VIOLATION = "23505";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const slotStartUtc = body?.slotStartUtc;
  const slotEndUtc = body?.slotEndUtc;
  const customerTimezone = typeof body?.customerTimezone === "string" ? body.customerTimezone : "";
  const locale = routing.locales.includes(body?.locale) ? body.locale : routing.defaultLocale;

  if (!firstName || !lastName || !email || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const slotStart = new Date(slotStartUtc);
  const slotEnd = new Date(slotEndUtc);
  if (Number.isNaN(slotStart.getTime()) || Number.isNaN(slotEnd.getTime())) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  // Fast-path check: has this email already used its one free intro call?
  const existingIntro = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.bookingType, "free_intro"),
        eq(bookings.status, "confirmed"),
        sql`lower(${bookings.customerEmail}) = lower(${email})`,
      ),
    );
  if (existingIntro.length > 0) {
    return NextResponse.json({ error: "already_used" }, { status: 409 });
  }

  // Re-validate the slot server-side — never trust the client's idea of
  // availability. Same narrow day-window check the Stripe checkout route uses.
  const dayStart = new Date(slotStart);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const [dates, confirmedBookings] = await Promise.all([
    db.select().from(availabilityDates),
    db
      .select()
      .from(bookings)
      .where(
        and(eq(bookings.status, "confirmed"), lt(bookings.startAt, dayEnd), gt(bookings.endAt, dayStart)),
      ),
  ]);

  const candidateSlots = getAvailableSlots({
    fromDate: dayStart,
    toDate: dayEnd,
    durationMinutes: FREE_INTRO_DURATION_MINUTES,
    tutorTimezone: TUTOR_TIMEZONE,
    availabilityDates: dates,
    bookings: confirmedBookings,
  });

  const isStillAvailable = candidateSlots.some(
    (slot) => slot.startUtc.getTime() === slotStart.getTime() && slot.endUtc.getTime() === slotEnd.getTime(),
  );
  if (!isStillAvailable) {
    return NextResponse.json({ error: "slot_taken" }, { status: 409 });
  }

  const customerName = `${firstName} ${lastName}`;
  const manageToken = randomUUID();

  let booking;
  try {
    [booking] = await db
      .insert(bookings)
      .values({
        bookingType: "free_intro",
        startAt: slotStart,
        endAt: slotEnd,
        durationMinutes: FREE_INTRO_DURATION_MINUTES,
        customerName,
        customerEmail: email,
        customerTimezone: customerTimezone || null,
        status: "confirmed",
        manageToken,
      })
      .returning();
  } catch (err) {
    // A concurrent request for the same email slipped past the check above —
    // the DB's partial unique index is the real guard against that race.
    const code = (err as { cause?: { code?: string } })?.cause?.code;
    if (code === UNIQUE_VIOLATION) {
      return NextResponse.json({ error: "already_used" }, { status: 409 });
    }
    throw err;
  }

  await notifyFreeIntroBooking({
    customerName,
    customerEmail: email,
    bookingStartAt: booking.startAt,
    bookingEndAt: booking.endAt,
    customerTimezone: customerTimezone || TUTOR_TIMEZONE,
    locale,
    manageToken,
    bookingId: booking.id,
  });

  return NextResponse.json({
    startUtc: booking.startAt.toISOString(),
    endUtc: booking.endAt.toISOString(),
    bookingNumber: formatBookingNumber(booking.id),
  });
}
