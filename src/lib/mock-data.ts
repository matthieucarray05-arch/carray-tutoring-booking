/**
 * Placeholder product catalog. Pricing/Stripe integration is a separate
 * module, so this stays hardcoded for now — availability, blocked dates and
 * bookings moved to Postgres (see lib/db/schema.ts and /api/availability).
 */

export type ProductType = "single_lesson" | "lesson_package";

/** All lessons are 60 minutes — the only duration currently sold. */
export const LESSON_DURATION_MINUTES = 60;

export interface Product {
  id: string;
  type: ProductType;
  durationMinutes: typeof LESSON_DURATION_MINUTES;
  creditsCount: number;
  priceCents: number;
  /** Set when the pack is discounted vs. buying that many single lessons — used for the strikethrough price. */
  compareAtPriceCents?: number;
  currency: "EUR";
}

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "single-60",
    type: "single_lesson",
    durationMinutes: LESSON_DURATION_MINUTES,
    creditsCount: 1,
    priceCents: 1600,
    currency: "EUR",
  },
  {
    id: "package-60-4",
    type: "lesson_package",
    durationMinutes: LESSON_DURATION_MINUTES,
    creditsCount: 4,
    priceCents: 6400,
    currency: "EUR",
  },
  {
    id: "package-60-8",
    type: "lesson_package",
    durationMinutes: LESSON_DURATION_MINUTES,
    creditsCount: 8,
    priceCents: 11500,
    compareAtPriceCents: 12800,
    currency: "EUR",
  },
];
