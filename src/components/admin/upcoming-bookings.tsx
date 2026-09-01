import { formatInTz } from "@/lib/timezone";
import { TUTOR_TIMEZONE } from "@/lib/config";

interface Booking {
  id: number;
  startAt: Date;
  endAt: Date;
  durationMinutes: number;
  customerName: string | null;
  customerEmail: string | null;
}

export function UpcomingBookings({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        No upcoming bookings yet — they’ll show up here once customers can pay online.
      </p>
    );
  }

  return (
    <ul className="mt-4 space-y-2">
      {bookings.map((b) => (
        <li key={b.id} className="rounded-xl border border-border p-4">
          <p className="font-medium">
            {formatInTz(b.startAt, TUTOR_TIMEZONE, "EEEE d MMMM yyyy, HH:mm")} · {b.durationMinutes}{" "}
            min
          </p>
          <p className="text-sm text-muted-foreground">
            {b.customerName ?? "Unnamed customer"}
            {b.customerEmail ? ` · ${b.customerEmail}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
