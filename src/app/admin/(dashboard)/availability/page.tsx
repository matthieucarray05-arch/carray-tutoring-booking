import { and, asc, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { availabilityRules, blockedDates, bookings } from "@/lib/db/schema";
import { TUTOR_TIMEZONE } from "@/lib/config";
import { WeeklyScheduleEditor } from "@/components/admin/weekly-schedule-editor";
import { BlockedDatesEditor } from "@/components/admin/blocked-dates-editor";
import { UpcomingBookings } from "@/components/admin/upcoming-bookings";

export const dynamic = "force-dynamic";

export default async function AdminAvailabilityPage() {
  const [rules, blocked, upcomingBookings] = await Promise.all([
    db
      .select()
      .from(availabilityRules)
      .orderBy(asc(availabilityRules.weekday), asc(availabilityRules.startTime)),
    db.select().from(blockedDates).orderBy(asc(blockedDates.date)),
    db
      .select()
      .from(bookings)
      .where(and(eq(bookings.status, "confirmed"), gte(bookings.startAt, new Date())))
      .orderBy(asc(bookings.startAt)),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="kicker">Admin</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Availability</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        All times below are in your timezone ({TUTOR_TIMEZONE}). Changes appear on the public
        booking page immediately.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Weekly recurring hours</h2>
        <WeeklyScheduleEditor rules={rules} />
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-medium">Blocked dates</h2>
        <BlockedDatesEditor blockedDates={blocked} />
      </section>

      <section className="mt-12 pb-16">
        <h2 className="text-lg font-medium">Upcoming bookings</h2>
        <UpcomingBookings bookings={upcomingBookings} />
      </section>
    </div>
  );
}
