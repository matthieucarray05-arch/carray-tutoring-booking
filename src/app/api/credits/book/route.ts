import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { and, asc, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { availabilityDates, bookings, lessonCredits } from "@/lib/db/schema";
import { getAvailableSlots } from "@/lib/availability";
import { TUTOR_TIMEZONE } from "@/lib/config";
import { routing } from "@/i18n/routing";
import { notifyCreditBooking } from "@/lib/notifications";
import { formatBookingNumber } from "@/lib/booking-number";

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
  const customerTimezone = typeof body?.customerTimezone === "string" ? body.customerTimezone : "";
  const locale = routing.locales.includes(body?.locale) ? body.locale : routing.defaultLocale;

  if (!firstName || !lastName || !email || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const slotStart = new Date(slotStartUtc);
  if (Number.isNaN(slotStart.getTime())) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const customerName = `${firstName} ${lastName}`;

  let result: ClaimResult;
  try {
    result = await db.transaction(async (tx) => {
      // Row-lock the oldest available credit for this email so two
      // simultaneous requests can't both claim it (or overdraw the last
      // one). The credit's OWN duration — not a hardcoded constant —
      // drives everything below, since a program's free assessment
      // credit is 30 minutes while regular lesson credits are 60.
      const [credit] = await tx
        .select({
          id: lessonCredits.id,
          durationMinutes: lessonCredits.durationMinutes,
          programId: lessonCredits.programId,
          programLanguage: lessonCredits.programLanguage,
        })
        .from(lessonCredits)
        .where(
          and(
            eq(lessonCredits.status, "available"),
            sql`lower(${lessonCredits.customerEmail}) = lower(${email})`,
          ),
        )
        .orderBy(asc(lessonCredits.createdAt), asc(lessonCredits.id))
        .limit(1)
        .for("update", { skipLocked: true });

      if (!credit) {
        return { ok: false, reason: "no_credits" };
      }

      // The end time is always derived server-side from the locked
      // credit's duration — never trust a client-sent end time, since it
      // could be stale relative to which credit actually got claimed.
      const slotEnd = new Date(slotStart.getTime() + credit.durationMinutes * 60 * 1000);

      // Re-validate the slot server-side against THIS credit's duration —
      // same narrow day-window check the Stripe checkout and free-intro
      // routes use.
      const dayStart = new Date(slotStart);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

      const [dates, confirmedBookings] = await Promise.all([
        tx.select().from(availabilityDates),
        tx
          .select()
          .from(bookings)
          .where(
            and(eq(bookings.status, "confirmed"), lt(bookings.startAt, dayEnd), gt(bookings.endAt, dayStart)),
          ),
      ]);

      const candidateSlots = getAvailableSlots({
        fromDate: dayStart,
        toDate: dayEnd,
        durationMinutes: credit.durationMinutes,
        tutorTimezone: TUTOR_TIMEZONE,
        availabilityDates: dates,
        bookings: confirmedBookings,
      });

      const isStillAvailable = candidateSlots.some(
        (slot) => slot.startUtc.getTime() === slotStart.getTime() && slot.endUtc.getTime() === slotEnd.getTime(),
      );
      if (!isStillAvailable) {
        return { ok: false, reason: "slot_taken" };
      }

      const manageToken = randomUUID();

      const [booking] = await tx
        .insert(bookings)
        .values({
          creditId: credit.id,
          bookingType: credit.programId ? "program" : "pack",
          startAt: slotStart,
          endAt: slotEnd,
          durationMinutes: credit.durationMinutes,
          customerName,
          customerEmail: email,
          customerTimezone: customerTimezone || null,
          status: "confirmed",
          manageToken,
          programId: credit.programId,
          programLanguage: credit.programLanguage,
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

  const [booking] = await db
    .select({ startAt: bookings.startAt, endAt: bookings.endAt })
    .from(bookings)
    .where(eq(bookings.id, result.bookingId));

  await notifyCreditBooking({
    customerName,
    customerEmail: email,
    bookingStartAt: booking.startAt,
    bookingEndAt: booking.endAt,
    customerTimezone: customerTimezone || TUTOR_TIMEZONE,
    locale,
    remainingCredits: result.remainingCredits,
    manageToken: result.manageToken,
    bookingId: result.bookingId,
  });

  return NextResponse.json({
    startUtc: booking.startAt.toISOString(),
    endUtc: booking.endAt.toISOString(),
    remainingCredits: result.remainingCredits,
    bookingNumber: formatBookingNumber(result.bookingId),
  });
}
