import { addAvailabilityDate, deleteAvailabilityDate } from "@/lib/admin/actions";
import { formatInTz } from "@/lib/timezone";
import { TUTOR_TIMEZONE } from "@/lib/config";
import { formatBookingNumber } from "@/lib/booking-number";

interface AvailabilityEntry {
  id: number;
  startTime: string;
  endTime: string;
}

interface BookingEntry {
  id: number;
  startAt: Date;
  endAt: Date;
  customerName: string | null;
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function DayEditor({
  selectedDate,
  entries,
  bookingsForDay,
}: {
  selectedDate: string | null;
  entries: AvailabilityEntry[];
  bookingsForDay: BookingEntry[];
}) {
  if (!selectedDate) {
    return (
      <div className="rounded-2xl border border-border p-5 text-sm text-muted-foreground">
        Click a date on the calendar to set or edit its availability.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border p-5">
      <p className="font-medium">{formatDateLabel(selectedDate)}</p>

      {bookingsForDay.length > 0 && (
        <div className="mt-3 space-y-1.5 rounded-lg bg-accent-soft p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            Already booked
          </p>
          {bookingsForDay.map((b) => (
            <p key={b.id} className="text-sm">
              <span className="text-muted-foreground">{formatBookingNumber(b.id)} ·</span>{" "}
              {formatInTz(b.startAt, TUTOR_TIMEZONE, "HH:mm")}–
              {formatInTz(b.endAt, TUTOR_TIMEZONE, "HH:mm")}
              {b.customerName ? ` · ${b.customerName}` : ""}
            </p>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-2">
        {entries.length > 0 ? (
          entries.map((entry) => (
            <form
              key={entry.id}
              action={deleteAvailabilityDate}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
            >
              <input type="hidden" name="id" value={entry.id} />
              <span className="text-sm">
                {entry.startTime}–{entry.endTime}
              </span>
              <button type="submit" className="text-sm text-muted-foreground hover:text-accent">
                Remove
              </button>
            </form>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No availability set for this date yet.</p>
        )}
      </div>

      <form action={addAvailabilityDate} className="mt-4 flex flex-wrap items-end gap-2">
        <input type="hidden" name="date" value={selectedDate} />
        <div>
          <label className="block text-xs font-medium text-muted-foreground">From</label>
          <input
            type="time"
            name="startTime"
            required
            className="mt-1 rounded-lg border border-border px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground">To</label>
          <input
            type="time"
            name="endTime"
            required
            className="mt-1 rounded-lg border border-border px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-full border border-accent px-3 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent-soft"
        >
          + Add
        </button>
      </form>
    </div>
  );
}
