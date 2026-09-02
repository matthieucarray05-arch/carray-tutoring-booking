import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";
import { de, enUS, fr, it, type Locale } from "date-fns/locale";

const DATE_FNS_LOCALES: Record<string, Locale> = { en: enUS, it, fr, de };

/** Resolves an app locale code ("en"/"it"/"fr"/"de") to its date-fns Locale, for month/weekday names. */
export function resolveDateFnsLocale(locale: string): Locale {
  return DATE_FNS_LOCALES[locale] ?? enUS;
}

/** Falls back to UTC if the browser can't tell us its timezone. */
export function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function listSupportedTimezones(): string[] {
  if (typeof Intl.supportedValuesOf === "function") {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      // fall through to the static list below
    }
  }
  return [
    "Europe/Berlin",
    "Europe/Rome",
    "Europe/London",
    "Europe/Paris",
    "Europe/Madrid",
    "Europe/Zurich",
    "America/New_York",
    "America/Los_Angeles",
    "UTC",
  ];
}

/** A UTC instant, formatted for display in the given IANA timezone. Pass a
 * date-fns Locale (see resolveDateFnsLocale) to localize month/weekday names. */
export function formatInTz(
  utcDate: Date,
  timeZone: string,
  pattern: string,
  locale?: Locale,
): string {
  return formatInTimeZone(utcDate, timeZone, pattern, locale ? { locale } : undefined);
}

/** A UTC instant, as a Date whose local fields reflect the given timezone (for calendar-grid math). */
export function toZoned(utcDate: Date, timeZone: string): Date {
  return toZonedTime(utcDate, timeZone);
}

/** Wall-clock date/time fields, interpreted in the given timezone, converted to the UTC instant. */
export function zonedToUtc(
  isoLocalDateTime: string,
  timeZone: string,
): Date {
  return fromZonedTime(isoLocalDateTime, timeZone);
}
