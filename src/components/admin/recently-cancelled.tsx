import { formatInTz } from "@/lib/timezone";
import { TUTOR_TIMEZONE } from "@/lib/config";
import { formatBookingNumber } from "@/lib/booking-number";

interface CancelledBooking {
  id: number;
  startAt: Date;
  endAt: Date;
  durationMinutes: number;
  bookingType: string;
  customerName: string | null;
  customerEmail: string | null;
  cancelledAt: Date | null;
}

const TYPE_LABELS: Record<string, string> = {
  free_intro: "Free intro",
  single_session: "Single lesson",
  pack: "Package",
};

export function RecentlyCancelled({ bookings }: { bookings: CancelledBooking[] }) {
  if (bookings.length === 0) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        No cancellations yet — they’ll show up here when a customer cancels via their manage link.
      </p>
    );
  }

  return (
    <ul className="mt-4 space-y-2">
      {bookings.map((b) => (
        <li key={b.id} className="rounded-xl border border-border p-4 opacity-70">
          <div className="flex items-center gap-2">
            <p className="font-medium line-through decoration-muted-foreground/50">
              {formatBookingNumber(b.id)} · {formatInTz(b.startAt, TUTOR_TIMEZONE, "EEEE d MMMM yyyy, HH:mm")} ·{" "}
              {b.durationMinutes} min
            </p>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {TYPE_LABELS[b.bookingType] ?? b.bookingType}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {b.customerName ?? "Unnamed customer"}
            {b.customerEmail ? ` · ${b.customerEmail}` : ""}
            {b.cancelledAt
              ? ` · Cancelled ${formatInTz(b.cancelledAt, TUTOR_TIMEZONE, "d MMM yyyy, HH:mm")}`
              : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
