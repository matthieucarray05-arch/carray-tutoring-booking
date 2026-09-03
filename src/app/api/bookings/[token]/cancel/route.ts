import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { bookings, lessonCredits } from "@/lib/db/schema";
import { CANCELLATION_WINDOW_HOURS, TUTOR_TIMEZONE } from "@/lib/config";
import { notifyBookingCancelled } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.manageToken, token));

  if (!booking) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (booking.status !== "confirmed") {
    return NextResponse.json({ error: "already_cancelled" }, { status: 409 });
  }

  const hoursUntilStart = (booking.startAt.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntilStart < CANCELLATION_WINDOW_HOURS) {
    return NextResponse.json({ error: "too_late" }, { status: 409 });
  }

  await db.transaction(async (tx) => {
    await tx
      .update(bookings)
      .set({ status: "cancelled" })
      .where(eq(bookings.id, booking.id));

    if (booking.creditId) {
      await tx
        .update(lessonCredits)
        .set({ status: "available", bookingId: null })
        .where(eq(lessonCredits.id, booking.creditId));
    }
  });

  await notifyBookingCancelled({
    customerName: booking.customerName,
    customerEmail: booking.customerEmail ?? "",
    bookingStartAt: booking.startAt,
    bookingEndAt: booking.endAt,
    customerTimezone: booking.customerTimezone || TUTOR_TIMEZONE,
    bookingType: booking.bookingType,
  });

  return NextResponse.json({ ok: true });
}
