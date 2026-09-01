import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { availabilityRules, blockedDates, bookings } from "@/lib/db/schema";
import { getAvailableSlots } from "@/lib/availability";
import { TUTOR_TIMEZONE } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const durationMinutes = Number(searchParams.get("duration"));
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || !fromParam || !toParam) {
    return NextResponse.json({ error: "Missing or invalid parameters" }, { status: 400 });
  }

  const fromDate = new Date(fromParam);
  const toDate = new Date(toParam);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  const [rules, blocked, confirmedBookings] = await Promise.all([
    db.select().from(availabilityRules),
    db.select().from(blockedDates),
    db.select().from(bookings).where(eq(bookings.status, "confirmed")),
  ]);

  const slots = getAvailableSlots({
    fromDate,
    toDate,
    durationMinutes,
    tutorTimezone: TUTOR_TIMEZONE,
    rules,
    blockedDates: blocked,
    bookings: confirmedBookings,
  });

  return NextResponse.json(
    slots.map((slot) => ({
      startUtc: slot.startUtc.toISOString(),
      endUtc: slot.endUtc.toISOString(),
    })),
  );
}
