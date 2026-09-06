import { formatInTz } from "@/lib/timezone";
import { TUTOR_TIMEZONE } from "@/lib/config";
import { formatBookingNumber } from "@/lib/booking-number";

interface Booking {
  id: number;
  startAt: Date;
  endAt: Date;
  durationMinutes: number;
  bookingType: string;
  customerName: string | null;
  customerEmail: string | null;
  programId: string | null;
  programLanguage: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  free_intro: "Free intro",
  single_session: "Single lesson",
  pack: "Package",
  program: "Program",
};

const PROGRAM_NAMES: Record<string, string> = {
  starter: "Starter",
  progress: "Progress",
  fluency: "Fluency",
};

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
          <div className="flex items-center gap-2">
            <p className="font-medium">
              <span className="text-muted-foreground">{formatBookingNumber(b.id)} ·</span>{" "}
              {formatInTz(b.startAt, TUTOR_TIMEZONE, "EEEE d MMMM yyyy, HH:mm")} · {b.durationMinutes}{" "}
              min
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                b.bookingType === "free_intro"
                  ? "bg-accent-soft text-accent"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {TYPE_LABELS[b.bookingType] ?? b.bookingType}
              {b.programId
                ? ` · ${PROGRAM_NAMES[b.programId] ?? b.programId}${
                    b.programLanguage ? ` (${b.programLanguage.toUpperCase()})` : ""
                  }${b.durationMinutes === 30 ? " · Assessment" : ""}`
                : ""}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {b.customerName ?? "Unnamed customer"}
            {b.customerEmail ? ` · ${b.customerEmail}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
