"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { resolveDateFnsLocale } from "@/lib/timezone";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

export function Calendar({
  selectedDate,
  onSelect,
  availableDates,
}: {
  selectedDate: string | null;
  onSelect: (dateStr: string) => void;
  availableDates: Set<string>;
}) {
  const locale = useLocale();
  const dateFnsLocale = resolveDateFnsLocale(locale);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const weekdayLabels = eachDayOfInterval({
    start: gridStart,
    end: addDays(gridStart, 6),
  }).map((day) => format(day, "EEEEEE", { locale: dateFnsLocale }));

  const today = startOfDay(new Date());
  const canGoBack = isBefore(today, endOfMonth(subMonths(month, 1)));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth(subMonths(month, 1))}
          disabled={!canGoBack}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="previous month"
        >
          ‹
        </button>
        <p className="text-sm font-medium capitalize">
          {format(month, "LLLL yyyy", { locale: dateFnsLocale })}
        </p>
        <button
          type="button"
          onClick={() => setMonth(addMonths(month, 1))}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          aria-label="next month"
        >
          ›
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {weekdayLabels.map((label, i) => (
          <div key={i}>{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, month);
          const isPast = isBefore(day, today);
          const hasSlots = availableDates.has(dateStr);
          const isSelected = selectedDate === dateStr;
          const disabled = isPast || !hasSlots;

          return (
            <button
              key={dateStr}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(dateStr)}
              className={`relative aspect-square rounded-lg text-sm transition-colors ${
                !inMonth ? "text-muted-foreground/40" : ""
              } ${
                isSelected
                  ? "bg-accent text-accent-foreground"
                  : disabled
                    ? "cursor-not-allowed text-muted-foreground/30"
                    : "hover:bg-muted"
              }`}
            >
              {format(day, "d")}
              {hasSlots && !isSelected && (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
