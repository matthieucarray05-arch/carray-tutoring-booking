import { addMinutes, differenceInCalendarDays } from "date-fns";
import { zonedToUtc } from "./timezone";

const SLOT_STEP_MINUTES = 30;
const MIN_NOTICE_HOURS = 12;

export interface AvailableSlot {
  startUtc: Date;
  endUtc: Date;
}

export interface AvailabilityDateInput {
  date: string;
  startTime: string;
  endTime: string;
}

export interface ExistingBookingInput {
  startAt: Date;
  endAt: Date;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (totalMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Computes bookable slots between fromDate and toDate (inclusive, by
 * calendar day) for a given lesson duration, applying the tutor's
 * per-date availability, minimum notice and already-booked slots.
 * Returns UTC instants — convert to the customer's timezone only for display.
 *
 * Pure function: availabilityDates/bookings are passed in (from the DB in
 * production) rather than imported, so this has no data-source dependency.
 */
export function getAvailableSlots({
  fromDate,
  toDate,
  durationMinutes,
  tutorTimezone,
  availabilityDates,
  bookings,
  now = new Date(),
}: {
  fromDate: Date;
  toDate: Date;
  durationMinutes: number;
  tutorTimezone: string;
  availabilityDates: AvailabilityDateInput[];
  bookings: ExistingBookingInput[];
  now?: Date;
}): AvailableSlot[] {
  const slots: AvailableSlot[] = [];
  const dayCount = Math.max(0, differenceInCalendarDays(toDate, fromDate));
  const earliestStart = addMinutes(now, MIN_NOTICE_HOURS * 60);

  for (let i = 0; i <= dayCount; i++) {
    const day = new Date(
      Date.UTC(
        fromDate.getUTCFullYear(),
        fromDate.getUTCMonth(),
        fromDate.getUTCDate() + i,
      ),
    );
    const dateStr = day.toISOString().slice(0, 10);

    const dayEntries = availabilityDates.filter((entry) => entry.date === dateStr);
    if (dayEntries.length === 0) continue;

    for (const entry of dayEntries) {
      const entryStart = timeToMinutes(entry.startTime);
      const entryEnd = timeToMinutes(entry.endTime);

      for (
        let start = entryStart;
        start + durationMinutes <= entryEnd;
        start += SLOT_STEP_MINUTES
      ) {
        const startUtc = zonedToUtc(
          `${dateStr}T${minutesToTime(start)}:00`,
          tutorTimezone,
        );
        if (startUtc < earliestStart) continue;

        const endUtc = addMinutes(startUtc, durationMinutes);

        const overlapsBooking = bookings.some(
          (booking) =>
            startUtc.getTime() < booking.endAt.getTime() &&
            booking.startAt.getTime() < endUtc.getTime(),
        );
        if (overlapsBooking) continue;

        slots.push({ startUtc, endUtc });
      }
    }
  }

  return slots;
}
