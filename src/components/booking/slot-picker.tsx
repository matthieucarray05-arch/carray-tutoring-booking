"use client";

import { useTranslations } from "next-intl";
import { formatInTz } from "@/lib/timezone";
import type { AvailableSlot } from "@/lib/availability";

export function SlotPicker({
  slots,
  timezone,
  selectedSlot,
  onSelect,
}: {
  slots: AvailableSlot[];
  timezone: string;
  selectedSlot: AvailableSlot | null;
  onSelect: (slot: AvailableSlot) => void;
}) {
  const t = useTranslations("Booking");

  if (slots.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noSlotsForDay")}</p>;
  }

  const groups = new Map<string, AvailableSlot[]>();
  for (const slot of slots) {
    const hour = Number(formatInTz(slot.startUtc, timezone, "H"));
    const bucket =
      hour < 12 ? t("morning") : hour < 18 ? t("afternoon") : t("evening");
    groups.set(bucket, [...(groups.get(bucket) ?? []), slot]);
  }

  return (
    <div className="space-y-4">
      {[...groups.entries()].map(([bucket, bucketSlots]) => (
        <div key={bucket}>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {bucket}
          </p>
          <div className="flex flex-wrap gap-2">
            {bucketSlots.map((slot) => {
              const isSelected =
                selectedSlot?.startUtc.getTime() === slot.startUtc.getTime();
              return (
                <button
                  key={slot.startUtc.toISOString()}
                  type="button"
                  onClick={() => onSelect(slot)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    isSelected
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border hover:border-accent/50"
                  }`}
                >
                  {formatInTz(slot.startUtc, timezone, "HH:mm")}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
