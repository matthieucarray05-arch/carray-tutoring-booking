import { addDays, addMinutes, format } from "date-fns";
import { zonedToUtc } from "./timezone";

/**
 * Placeholder data for the booking UI module. Availability rules, blocked
 * dates and bookings will move to Postgres once the DB module lands; the
 * shapes here mirror the planned `tutor_availability_rules`,
 * `tutor_blocked_dates` and `bookings` tables so the swap is mechanical.
 */

export const TUTOR_TIMEZONE = "Europe/Berlin";

export type ProductType = "single_lesson" | "lesson_package";

export interface Product {
  id: string;
  type: ProductType;
  durationMinutes: 45 | 60;
  creditsCount: number;
  priceCents: number;
  currency: "EUR";
}

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "single-45",
    type: "single_lesson",
    durationMinutes: 45,
    creditsCount: 1,
    priceCents: 3000,
    currency: "EUR",
  },
  {
    id: "single-60",
    type: "single_lesson",
    durationMinutes: 60,
    creditsCount: 1,
    priceCents: 4000,
    currency: "EUR",
  },
  {
    id: "package-45-5",
    type: "lesson_package",
    durationMinutes: 45,
    creditsCount: 5,
    priceCents: 13500,
    currency: "EUR",
  },
  {
    id: "package-45-10",
    type: "lesson_package",
    durationMinutes: 45,
    creditsCount: 10,
    priceCents: 24000,
    currency: "EUR",
  },
  {
    id: "package-60-5",
    type: "lesson_package",
    durationMinutes: 60,
    creditsCount: 5,
    priceCents: 18000,
    currency: "EUR",
  },
  {
    id: "package-60-10",
    type: "lesson_package",
    durationMinutes: 60,
    creditsCount: 10,
    priceCents: 32000,
    currency: "EUR",
  },
];

export interface AvailabilityRule {
  /** ISO weekday: 1 = Monday ... 7 = Sunday, evaluated in TUTOR_TIMEZONE. */
  weekday: number;
  startTime: string;
  endTime: string;
}

export const MOCK_AVAILABILITY_RULES: AvailabilityRule[] = [
  { weekday: 1, startTime: "09:00", endTime: "12:00" },
  { weekday: 1, startTime: "14:00", endTime: "18:00" },
  { weekday: 2, startTime: "09:00", endTime: "12:00" },
  { weekday: 2, startTime: "14:00", endTime: "18:00" },
  { weekday: 3, startTime: "14:00", endTime: "18:00" },
  { weekday: 3, startTime: "19:00", endTime: "20:30" },
  { weekday: 4, startTime: "09:00", endTime: "12:00" },
  { weekday: 4, startTime: "14:00", endTime: "18:00" },
  { weekday: 5, startTime: "09:00", endTime: "13:00" },
];

export interface BlockedDate {
  date: string;
  /** Omit both times to block the whole day. */
  startTime?: string;
  endTime?: string;
  reason?: string;
}

function daysFromNow(n: number): string {
  return format(addDays(new Date(), n), "yyyy-MM-dd");
}

export const MOCK_BLOCKED_DATES: BlockedDate[] = [
  { date: daysFromNow(7), reason: "Giorno bloccato" },
  {
    date: daysFromNow(10),
    startTime: "14:00",
    endTime: "18:00",
    reason: "Impegno personale",
  },
];

export interface ExistingBooking {
  startAt: Date;
  endAt: Date;
}

function bookingSlot(
  daysAhead: number,
  time: string,
  durationMinutes: number,
): ExistingBooking {
  const startAt = zonedToUtc(
    `${daysFromNow(daysAhead)}T${time}:00`,
    TUTOR_TIMEZONE,
  );
  return { startAt, endAt: addMinutes(startAt, durationMinutes) };
}

export const MOCK_BOOKINGS: ExistingBooking[] = [
  bookingSlot(2, "09:00", 60),
  bookingSlot(2, "10:30", 45),
  bookingSlot(4, "14:30", 60),
  bookingSlot(5, "09:30", 45),
];
