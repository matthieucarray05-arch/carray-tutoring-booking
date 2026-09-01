import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { availabilityDates, bookings } from "@/lib/db/schema";
import { TUTOR_TIMEZONE } from "@/lib/config";
import { formatInTz } from "@/lib/timezone";
import { AvailabilityCalendar } from "@/components/admin/availability-calendar";
import { DayEditor } from "@/components/admin/day-editor";
import { UpcomingBookings } from "@/components/admin/upcoming-bookings";

export const dynamic = "force-dynamic";

function parseMonthParam(month: string | undefined): Date {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, 1));
  }
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export default async function AdminAvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; date?: string }>;
}) {
  const { month: monthParam, date: selectedDate } = await searchParams;
  const monthStart = parseMonthParam(monthParam);

  const [dates, confirmedBookings] = await Promise.all([
    db
      .select()
      .from(availabilityDates)
      .orderBy(asc(availabilityDates.date), asc(availabilityDates.startTime)),
    db
      .select()
      .from(bookings)
      .where(eq(bookings.status, "confirmed"))
      .orderBy(asc(bookings.startAt)),
  ]);

  const now = new Date();
  const upcomingBookings = confirmedBookings.filter((b) => b.startAt >= now);
  const bookingsForSelectedDay = selectedDate
    ? confirmedBookings.filter(
        (b) => formatInTz(b.startAt, TUTOR_TIMEZONE, "yyyy-MM-dd") === selectedDate,
      )
    : [];
  const entriesForSelectedDay = selectedDate
    ? dates.filter((d) => d.date === selectedDate)
    : [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="kicker">Admin</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Availability</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        All times below are in your timezone ({TUTOR_TIMEZONE}). Changes appear on the public
        booking page immediately.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Calendar</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-[minmax(0,1fr)_18rem]">
          <AvailabilityCalendar
            monthStart={monthStart}
            selectedDate={selectedDate ?? null}
            availabilityDates={dates}
            bookings={confirmedBookings}
          />
          <DayEditor
            selectedDate={selectedDate ?? null}
            entries={entriesForSelectedDay}
            bookingsForDay={bookingsForSelectedDay}
          />
        </div>
      </section>

      <section className="mt-12 pb-16">
        <h2 className="text-lg font-medium">Upcoming bookings</h2>
        <UpcomingBookings bookings={upcomingBookings} />
      </section>
    </div>
  );
}
