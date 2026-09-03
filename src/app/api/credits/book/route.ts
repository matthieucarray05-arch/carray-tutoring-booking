import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { and, asc, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { availabilityDates, bookings, lessonCredits } from "@/lib/db/schema";
import { getAvailableSlots } from "@/lib/availability";
import { LESSON_DURATION_MINUTES } from "@/lib/mock-data";
import { TUTOR_TIMEZONE } from "@/lib/config";
import { routing } from "@/i18n/routing";
import { notifyCreditBooking } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ClaimResult =
  | { ok: true; bookingId: number; remainingCredits: number; manageToken: string }
  | { ok: false; reason: "no_credits" | "slot_taken" };

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

  // Re-validate the slot server-side — same narrow day-window check the
  // Stripe checkout and free-intro routes use.
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
    durationMinutes: LESSON_DURATION_MINUTES,
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

  let result: ClaimResult;
  try {
    result = await db.transaction(async (tx) => {
      // Row-lock one available credit for this email so two simultaneous
      // requests can't both claim the same credit (or overdraw the last one).
      const [credit] = await tx
        .select({ id: lessonCredits.id })
        .from(lessonCredits)
        .where(
          and(
            eq(lessonCredits.status, "available"),
            sql`lower(${lessonCredits.customerEmail}) = lower(${email})`,
          ),
        )
        .orderBy(asc(lessonCredits.createdAt))
        .limit(1)
        .for("update", { skipLocked: true });

      if (!credit) {
        return { ok: false, reason: "no_credits" };
      }

      // Re-check inside the transaction: a concurrent request could have
      // just booked this exact slot.
      const conflicting = await tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(eq(bookings.status, "confirmed"), lt(bookings.startAt, slotEnd), gt(bookings.endAt, slotStart)),
        );
      if (conflicting.length > 0) {
        return { ok: false, reason: "slot_taken" };
      }

      const manageToken = randomUUID();

      const [booking] = await tx
        .insert(bookings)
        .values({
          creditId: credit.id,
          bookingType: "pack",
          startAt: slotStart,
          endAt: slotEnd,
          durationMinutes: LESSON_DURATION_MINUTES,
          customerName,
          customerEmail: email,
          customerTimezone: customerTimezone || null,
          status: "confirmed",
          manageToken,
        })
        .returning();

      await tx
        .update(lessonCredits)
        .set({ status: "used", bookingId: booking.id })
        .where(eq(lessonCredits.id, credit.id));

      const remaining = await tx
        .select({ id: lessonCredits.id })
        .from(lessonCredits)
        .where(
          and(
            eq(lessonCredits.status, "available"),
            sql`lower(${lessonCredits.customerEmail}) = lower(${email})`,
          ),
        );

      return { ok: true, bookingId: booking.id, remainingCredits: remaining.length, manageToken };
    });
  } catch (err) {
    console.error("credits/book: transaction failed", err);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 409 });
  }

  await notifyCreditBooking({
    customerName,
    customerEmail: email,
    bookingStartAt: slotStart,
    bookingEndAt: slotEnd,
    customerTimezone: customerTimezone || TUTOR_TIMEZONE,
    locale,
    remainingCredits: result.remainingCredits,
    manageToken: result.manageToken,
  });

  return NextResponse.json({
    startUtc: slotStart.toISOString(),
    endUtc: slotEnd.toISOString(),
    remainingCredits: result.remainingCredits,
  });
}
