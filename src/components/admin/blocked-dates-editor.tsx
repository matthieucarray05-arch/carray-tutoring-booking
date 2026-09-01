import { addBlockedDate, deleteBlockedDate } from "@/lib/admin/actions";

interface BlockedDate {
  id: number;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function BlockedDatesEditor({ blockedDates }: { blockedDates: BlockedDate[] }) {
  return (
    <div className="mt-4 space-y-6">
      {blockedDates.length > 0 ? (
        <ul className="space-y-2">
          {blockedDates.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-border p-4"
            >
              <div>
                <p className="font-medium">{formatDateLabel(b.date)}</p>
                <p className="text-sm text-muted-foreground">
                  {b.startTime && b.endTime ? `${b.startTime}–${b.endTime}` : "Whole day"}
                  {b.reason ? ` · ${b.reason}` : ""}
                </p>
              </div>
              <form action={deleteBlockedDate}>
                <input type="hidden" name="id" value={b.id} />
                <button
                  type="submit"
                  className="shrink-0 text-sm text-muted-foreground hover:text-accent"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No blocked dates yet.</p>
      )}

      <form
        action={addBlockedDate}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-border p-5"
      >
        <div>
          <label className="block text-xs font-medium text-muted-foreground">Date</label>
          <input
            type="date"
            name="date"
            required
            className="mt-1 rounded-lg border border-border px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground">
            From (optional)
          </label>
          <input
            type="time"
            name="startTime"
            className="mt-1 rounded-lg border border-border px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground">To (optional)</label>
          <input
            type="time"
            name="endTime"
            className="mt-1 rounded-lg border border-border px-2 py-1.5 text-sm"
          />
        </div>
        <div className="min-w-40 flex-1">
          <label className="block text-xs font-medium text-muted-foreground">
            Reason (optional)
          </label>
          <input
            type="text"
            name="reason"
            placeholder="e.g. Holiday"
            className="mt-1 w-full rounded-lg border border-border px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          Block
        </button>
      </form>
      <p className="text-xs text-muted-foreground">
        Leave “From” / “To” empty to block the entire day.
      </p>
    </div>
  );
}
