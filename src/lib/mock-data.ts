/**
 * Placeholder product catalog. Pricing/Stripe integration is a separate
 * module, so this stays hardcoded for now — availability, blocked dates and
 * bookings moved to Postgres (see lib/db/schema.ts and /api/availability).
 */

export type ProductType =
  | "single_lesson"
  | "lesson_package"
  | "free_intro"
  | "use_credit";

/** All paid lessons are 60 minutes — the only duration currently sold. */
export const LESSON_DURATION_MINUTES = 60;

/** The free intro consultation is shorter than a real lesson. */
export const FREE_INTRO_DURATION_MINUTES = 30;

export interface Product {
  id: string;
  type: ProductType;
  durationMinutes: number;
  creditsCount: number;
  priceCents: number;
  /** Set when the pack is discounted vs. buying that many single lessons — used for the strikethrough price. */
  compareAtPriceCents?: number;
  currency: "EUR";
}

/** Not a real purchase — booking it skips Stripe entirely (see /api/free-intro/book). */
export const FREE_INTRO_PRODUCT: Product = {
  id: "free-intro",
  type: "free_intro",
  durationMinutes: FREE_INTRO_DURATION_MINUTES,
  creditsCount: 1,
  priceCents: 0,
  currency: "EUR",
};

/** Not a real purchase — redeems an existing lesson credit instead of paying (see /api/credits/book). */
export const USE_CREDIT_PRODUCT: Product = {
  id: "use-credit",
  type: "use_credit",
  durationMinutes: LESSON_DURATION_MINUTES,
  creditsCount: 1,
  priceCents: 0,
  currency: "EUR",
};

/**
 * Structured programs — a fixed-length, fixed-cadence offering sold
 * alongside (not instead of) the flexible single/package/free-intro/
 * use-credit system above. Only available with lessons in Italian or
 * English (see ProgramLanguage) — the /programs marketing page itself is
 * shown in all 4 site languages, but the language track chosen at
 * purchase is independent of that site locale.
 *
 * Technically, a program purchase just creates lessonCredits like a
 * regular package does (see the Stripe webhook), tagged with
 * programId/programLanguage plus one extra 30-minute assessment credit —
 * no separate scheduling engine, reuses the existing credit-redemption
 * booking flow end to end.
 */
export type ProgramId = "starter" | "progress" | "fluency";

/** The language lessons are conducted in — independent of site UI locale. */
export type ProgramLanguage = "it" | "en";

/** Every program includes one of these before the regular lessons start. */
export const PROGRAM_ASSESSMENT_DURATION_MINUTES = 30;

export interface Program {
  id: ProgramId;
  weeks: number;
  lessonsPerWeek: number;
  totalLessons: number;
  priceCents: number;
  currency: "EUR";
  isBestSeller?: boolean;
}

export const PROGRAMS: Program[] = [
  {
    id: "starter",
    weeks: 4,
    lessonsPerWeek: 2,
    totalLessons: 8,
    priceCents: 14900,
    currency: "EUR",
  },
  {
    id: "progress",
    weeks: 8,
    lessonsPerWeek: 2,
    totalLessons: 16,
    priceCents: 26900,
    currency: "EUR",
    isBestSeller: true,
  },
  {
    id: "fluency",
    weeks: 12,
    lessonsPerWeek: 2,
    totalLessons: 24,
    priceCents: 39900,
    currency: "EUR",
  },
];

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
