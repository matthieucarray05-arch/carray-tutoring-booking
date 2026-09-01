import { addMinutes, differenceInCalendarDays } from "date-fns";
import { zonedToUtc } from "./timezone";

const SLOT_STEP_MINUTES = 30;
const MIN_NOTICE_HOURS = 12;

export interface AvailableSlot {
  startUtc: Date;
  endUtc: Date;
}

export interface AvailabilityRuleInput {
  /** ISO weekday: 1 = Monday ... 7 = Sunday, evaluated in tutorTimezone. */
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface BlockedDateInput {
  date: string;
  /** Omit both times to block the whole day. */
  startTime?: string | null;
  endTime?: string | null;
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

/** 1 = Monday ... 7 = Sunday. Uses a fixed UTC noon to sidestep DST edge cases. */
function isoWeekday(dateStr: string): number {
  const day = new Date(`${dateStr}T12:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

function intervalsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Computes bookable slots between fromDate and toDate (inclusive, by
 * calendar day) for a given lesson duration, applying the tutor's recurring
 * availability, blocked dates, minimum notice and already-booked slots.
 * Returns UTC instants — convert to the customer's timezone only for display.
 *
 * Pure function: rules/blockedDates/bookings are passed in (from the DB in
 * production) rather than imported, so this has no data-source dependency.
 */
export function getAvailableSlots({
  fromDate,
  toDate,
  durationMinutes,
  tutorTimezone,
  rules,
  blockedDates,
  bookings,
  now = new Date(),
}: {
  fromDate: Date;
  toDate: Date;
  durationMinutes: number;
  tutorTimezone: string;
  rules: AvailabilityRuleInput[];
  blockedDates: BlockedDateInput[];
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
    const weekday = isoWeekday(dateStr);

    const dayRules = rules.filter((rule) => rule.weekday === weekday);
    if (dayRules.length === 0) continue;

    const blockedForDay = blockedDates.filter((blocked) => blocked.date === dateStr);
    const isFullDayBlocked = blockedForDay.some(
      (blocked) => !blocked.startTime && !blocked.endTime,
    );
    if (isFullDayBlocked) continue;

    for (const rule of dayRules) {
      const ruleStart = timeToMinutes(rule.startTime);
      const ruleEnd = timeToMinutes(rule.endTime);

      for (
        let start = ruleStart;
        start + durationMinutes <= ruleEnd;
        start += SLOT_STEP_MINUTES
      ) {
        const end = start + durationMinutes;

        const overlapsBlock = blockedForDay.some((blocked) => {
          if (!blocked.startTime || !blocked.endTime) return true;
          return intervalsOverlap(
            start,
            end,
            timeToMinutes(blocked.startTime),
            timeToMinutes(blocked.endTime),
          );
        });
        if (overlapsBlock) continue;

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
