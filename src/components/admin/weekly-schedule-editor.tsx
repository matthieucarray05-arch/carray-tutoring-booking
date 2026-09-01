import { addAvailabilityRule, deleteAvailabilityRule } from "@/lib/admin/actions";

const WEEKDAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

interface Rule {
  id: number;
  weekday: number;
  startTime: string;
  endTime: string;
}

export function WeeklyScheduleEditor({ rules }: { rules: Rule[] }) {
  return (
    <div className="mt-4 divide-y divide-border rounded-2xl border border-border">
      {WEEKDAYS.map((day) => {
        const dayRules = rules
          .filter((r) => r.weekday === day.value)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));

        return (
          <div
            key={day.value}
            className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between"
          >
            <p className="w-28 shrink-0 pt-1.5 font-medium">{day.label}</p>
            <div className="flex-1 space-y-3">
              {dayRules.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {dayRules.map((rule) => (
                    <form key={rule.id} action={deleteAvailabilityRule}>
                      <input type="hidden" name="id" value={rule.id} />
                      <button
                        type="submit"
                        className="group flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-sm"
                        title="Remove this time range"
                      >
                        {rule.startTime}–{rule.endTime}
                        <span className="text-muted-foreground group-hover:text-accent">×</span>
                      </button>
                    </form>
                  ))}
                </div>
              )}

              <form action={addAvailabilityRule} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="weekday" value={day.value} />
                <input
                  type="time"
                  name="startTime"
                  required
                  className="rounded-lg border border-border px-2 py-1.5 text-sm"
                />
                <span className="text-sm text-muted-foreground">to</span>
                <input
                  type="time"
                  name="endTime"
                  required
                  className="rounded-lg border border-border px-2 py-1.5 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-full border border-accent px-3 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent-soft"
                >
                  + Add
                </button>
              </form>
            </div>
          </div>
        );
      })}
    </div>
  );
}
