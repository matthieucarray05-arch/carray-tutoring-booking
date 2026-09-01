import Link from "next/link";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { formatInTz } from "@/lib/timezone";
import { TUTOR_TIMEZONE } from "@/lib/config";

interface AvailabilityEntry {
  date: string;
}

interface BookingEntry {
  startAt: Date;
}

export function AvailabilityCalendar({
  monthStart,
  selectedDate,
  availabilityDates,
  bookings,
}: {
  monthStart: Date;
  selectedDate: string | null;
  availabilityDates: AvailabilityEntry[];
  bookings: BookingEntry[];
}) {
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const weekdayLabels = eachDayOfInterval({
    start: gridStart,
    end: addDays(gridStart, 6),
  }).map((day) => format(day, "EEEEEE"));

  const datesWithAvailability = new Set(availabilityDates.map((d) => d.date));
  const datesWithBookings = new Set(
    bookings.map((b) => formatInTz(b.startAt, TUTOR_TIMEZONE, "yyyy-MM-dd")),
  );

  const monthValue = format(monthStart, "yyyy-MM");
  const prevMonthValue = format(subMonths(monthStart, 1), "yyyy-MM");
  const nextMonthValue = format(addMonths(monthStart, 1), "yyyy-MM");

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <Link
          href={`?month=${prevMonthValue}`}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          aria-label="previous month"
        >
          ‹
        </Link>
        <p className="text-sm font-medium capitalize">{format(monthStart, "LLLL yyyy")}</p>
        <Link
          href={`?month=${nextMonthValue}`}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          aria-label="next month"
        >
          ›
        </Link>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {weekdayLabels.map((label, i) => (
          <div key={i}>{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, monthStart);
          const hasAvailability = datesWithAvailability.has(dateStr);
          const hasBooking = datesWithBookings.has(dateStr);
          const isSelected = selectedDate === dateStr;

          return (
            <Link
              key={dateStr}
              href={`?month=${monthValue}&date=${dateStr}`}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                !inMonth ? "text-muted-foreground/40" : ""
              } ${isSelected ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
            >
              {format(day, "d")}
              {(hasAvailability || hasBooking) && (
                <span className="absolute bottom-1.5 flex gap-0.5">
                  {hasAvailability && (
                    <span
                      className={`h-1 w-1 rounded-full ${isSelected ? "bg-accent-foreground" : "bg-accent"}`}
                    />
                  )}
                  {hasBooking && (
                    <span
                      className={`h-1 w-1 rounded-full ${isSelected ? "bg-accent-foreground" : "bg-foreground"}`}
                    />
                  )}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Availability set
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground" /> Has booking(s)
        </span>
      </div>
    </div>
  );
}
