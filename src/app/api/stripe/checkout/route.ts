import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { availabilityDates, bookings } from "@/lib/db/schema";
import { getStripe } from "@/lib/stripe/client";
import { getAvailableSlots } from "@/lib/availability";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { TUTOR_TIMEZONE } from "@/lib/config";
import { routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";

const PRODUCT_NAMES: Record<string, string> = {
  "single-60": "Single 60-minute lesson",
  "package-60-4": "4-lesson package (60 min each)",
  "package-60-8": "8-lesson package (60 min each)",
};

const STRIPE_LOCALES: Record<string, string> = {
  en: "en",
  it: "it",
  fr: "fr",
  de: "de",
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const productId = body?.productId;
  const slotStartUtc = body?.slotStartUtc;
  const slotEndUtc = body?.slotEndUtc;
  const customerTimezone = typeof body?.customerTimezone === "string" ? body.customerTimezone : "";
  const locale = routing.locales.includes(body?.locale) ? body.locale : routing.defaultLocale;

  const product = MOCK_PRODUCTS.find((p) => p.id === productId);
  if (!product) {
    return NextResponse.json({ error: "Unknown product" }, { status: 400 });
  }

  const slotStart = new Date(slotStartUtc);
  const slotEnd = new Date(slotEndUtc);
  if (Number.isNaN(slotStart.getTime()) || Number.isNaN(slotEnd.getTime())) {
    return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
  }

  // Re-validate server-side: never trust the client's idea of price or
  // availability. Check a narrow window around the requested slot.
  const dayStart = new Date(slotStart);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const [dates, confirmedBookings] = await Promise.all([
    db.select().from(availabilityDates),
    db
      .select()
      .from(bookings)
      .where(
        and(eq(bookings.status, "confirmed"), lt(bookings.startAt, dayEnd), gt(bookings.endAt, dayStart)),
      ),
  ]);

  const candidateSlots = getAvailableSlots({
    fromDate: dayStart,
    toDate: dayEnd,
    durationMinutes: product.durationMinutes,
    tutorTimezone: TUTOR_TIMEZONE,
    availabilityDates: dates,
    bookings: confirmedBookings,
  });

  const isStillAvailable = candidateSlots.some(
    (slot) => slot.startUtc.getTime() === slotStart.getTime() && slot.endUtc.getTime() === slotEnd.getTime(),
  );
  if (!isStillAvailable) {
    return NextResponse.json({ error: "This slot is no longer available" }, { status: 409 });
  }

  const origin = new URL(request.url).origin;
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: product.currency.toLowerCase(),
          product_data: { name: PRODUCT_NAMES[product.id] ?? product.id },
          unit_amount: product.priceCents,
        },
        quantity: 1,
      },
    ],
    billing_address_collection: "required",
    custom_fields: [
      {
        key: "company_name",
        label: { type: "custom", custom: "Company name (optional)" },
        type: "text",
        optional: true,
      },
      {
        key: "vat_id",
        label: { type: "custom", custom: "VAT ID (optional)" },
        type: "text",
        optional: true,
      },
    ],
    metadata: {
      productId: product.id,
      productType: product.type,
      durationMinutes: String(product.durationMinutes),
      creditsCount: String(product.creditsCount),
      slotStartUtc: slotStart.toISOString(),
      slotEndUtc: slotEnd.toISOString(),
      customerTimezone,
    },
    locale: (STRIPE_LOCALES[locale] ?? "auto") as "en" | "it" | "fr" | "de" | "auto",
    success_url: `${origin}/${locale}/booking?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/${locale}/booking?checkout=canceled`,
  });

  if (!session.url) {
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
