"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { listSupportedTimezones } from "@/lib/timezone";

export function TimezoneSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (timeZone: string) => void;
}) {
  const t = useTranslations("Booking");
  const timezones = useMemo(() => listSupportedTimezones(), []);

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{t("timezoneLabel")}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-border bg-background px-2 py-1.5"
      >
        {!timezones.includes(value) && <option value={value}>{value}</option>}
        {timezones.map((tz) => (
          <option key={tz} value={tz}>
            {tz.replace(/_/g, " ")}
          </option>
        ))}
      </select>
    </label>
  );
}
