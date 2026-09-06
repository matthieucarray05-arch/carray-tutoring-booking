import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/lib/db/client";
import { orders, lessonCredits, bookings } from "@/lib/db/schema";
import { getStripe } from "@/lib/stripe/client";
import { notifyNewBooking, notifySlotConflict, notifyProgramPurchase } from "@/lib/notifications";
import { routing } from "@/i18n/routing";
import { TUTOR_TIMEZONE } from "@/lib/config";
import { formatProgramReference } from "@/lib/booking-number";
import { PROGRAMS, PROGRAM_ASSESSMENT_DURATION_MINUTES, LESSON_DURATION_MINUTES, type ProgramLanguage } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid") {
      await handleCheckoutCompleted(session);
    }
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Idempotency: Stripe can redeliver the same event.
  const existing = await db
    .select()
    .from(orders)
    .where(eq(orders.stripeCheckoutSessionId, session.id));
  if (existing.length > 0) {
    return;
  }

  const metadata = session.metadata ?? {};

  if (metadata.programId) {
    return handleProgramCheckoutCompleted(session, metadata);
  }

  const productId = metadata.productId;
  const productType = metadata.productType;
  const durationMinutes = Number(metadata.durationMinutes);
  const creditsCount = Number(metadata.creditsCount);
  const slotStartUtc = metadata.slotStartUtc;
  const slotEndUtc = metadata.slotEndUtc;
  const customerTimezone = metadata.customerTimezone || null;
  const locale = routing.locales.includes(
    metadata.locale as (typeof routing.locales)[number],
  )
    ? metadata.locale
    : routing.defaultLocale;

  if (
    !productId ||
    !productType ||
    !slotStartUtc ||
    !slotEndUtc ||
    !Number.isFinite(durationMinutes) ||
    !Number.isFinite(creditsCount) ||
    creditsCount < 1
  ) {
    console.error("Stripe webhook: missing/invalid metadata on session", session.id, metadata);
    return;
  }

  const customerEmail = session.customer_details?.email ?? "";
  const customerName = session.customer_details?.name ?? null;
  const customerPhone = session.customer_details?.phone ?? null;
  const billingAddress = session.customer_details?.address ?? null;

  const customFields = session.custom_fields ?? [];
  const companyName =
    customFields.find((f) => f.key === "company_name")?.text?.value || null;
  const vatId = customFields.find((f) => f.key === "vat_id")?.text?.value || null;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  // The plain SELECT above is just a fast path — Stripe (or a slow response,
  // e.g. while we're waiting on the email calls below) can redeliver this
  // event a second time before the first delivery's insert has committed.
  // onConflictDoNothing makes the insert itself the source of truth: if a
  // concurrent delivery already created this order, ours returns no row and
  // we bail out below instead of crashing on the unique constraint.
  const insertedOrders = await db
    .insert(orders)
    .values({
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      productId,
      productType,
      durationMinutes,
      creditsCount,
      amountTotalCents: session.amount_total ?? 0,
      currency: (session.currency ?? "eur").toUpperCase(),
      customerEmail,
      customerName,
      customerPhone,
      companyName,
      vatId,
      billingAddress,
    })
    .onConflictDoNothing({ target: orders.stripeCheckoutSessionId })
    .returning();

  if (insertedOrders.length === 0) {
    return;
  }
  const order = insertedOrders[0];

  const createdCredits = await db
    .insert(lessonCredits)
    .values(
      Array.from({ length: creditsCount }, () => ({
        orderId: order.id,
        customerEmail,
        durationMinutes,
        status: "available" as const,
      })),
    )
    .returning();

  const slotStart = new Date(slotStartUtc);
  const slotEnd = new Date(slotEndUtc);

  // Re-check for a conflicting confirmed booking: rare, but two customers
  // could both complete payment for the same slot before either webhook
  // arrives. The credits above are kept either way — nothing is lost.
  const conflicting = await db
    .select()
    .from(bookings)
    .where(
      and(eq(bookings.status, "confirmed"), lt(bookings.startAt, slotEnd), gt(bookings.endAt, slotStart)),
    );

  if (conflicting.length > 0) {
    await notifySlotConflict({
      customerEmail,
      requestedStartAt: slotStart,
      requestedEndAt: slotEnd,
      stripeCheckoutSessionId: session.id,
    });
    return;
  }

  const firstCredit = createdCredits[0];

  const manageToken = randomUUID();

  const [booking] = await db
    .insert(bookings)
    .values({
      orderId: order.id,
      creditId: firstCredit.id,
      bookingType: productType === "lesson_package" ? "pack" : "single_session",
      startAt: slotStart,
      endAt: slotEnd,
      durationMinutes,
      customerName,
      customerEmail,
      customerPhone,
      customerTimezone,
      status: "confirmed",
      manageToken,
    })
    .returning();

  await db
    .update(lessonCredits)
    .set({ status: "used", bookingId: booking.id })
    .where(eq(lessonCredits.id, firstCredit.id));

  await notifyNewBooking({
    customerName,
    customerEmail,
    customerPhone,
    companyName,
    vatId,
    billingAddress,
    productId,
    productType,
    creditsCount,
    amountTotalCents: session.amount_total ?? 0,
    currency: (session.currency ?? "eur").toUpperCase(),
    bookingStartAt: slotStart,
    bookingEndAt: slotEnd,
    customerTimezone: customerTimezone ?? TUTOR_TIMEZONE,
    locale,
    remainingCredits: creditsCount - 1,
    manageToken,
    bookingId: booking.id,
  });
}

/**
 * Structured programs don't reserve a slot at checkout, so there's no
 * "first booking created immediately" step here — just N+1 available
 * credits (1 free 30-min assessment + the program's regular lessons),
 * all redeemed later through the existing "use a credit" flow.
 */
async function handleProgramCheckoutCompleted(
  session: Stripe.Checkout.Session,
  metadata: Stripe.Metadata,
) {
  const program = PROGRAMS.find((p) => p.id === metadata.programId);
  const programLanguage: ProgramLanguage | null =
    metadata.programLanguage === "it" || metadata.programLanguage === "en"
      ? metadata.programLanguage
      : null;
  const locale = routing.locales.includes(
    metadata.locale as (typeof routing.locales)[number],
  )
    ? metadata.locale
    : routing.defaultLocale;

  if (!program || !programLanguage) {
    console.error("Stripe webhook: missing/invalid program metadata on session", session.id, metadata);
    return;
  }

  const customerEmail = session.customer_details?.email ?? "";
  const customerName = session.customer_details?.name ?? null;
  const customerPhone = session.customer_details?.phone ?? null;
  const billingAddress = session.customer_details?.address ?? null;

  const customFields = session.custom_fields ?? [];
  const companyName =
    customFields.find((f) => f.key === "company_name")?.text?.value || null;
  const vatId = customFields.find((f) => f.key === "vat_id")?.text?.value || null;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  const insertedOrders = await db
    .insert(orders)
    .values({
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      productId: program.id,
      productType: "program",
      durationMinutes: LESSON_DURATION_MINUTES,
      creditsCount: program.totalLessons + 1,
      amountTotalCents: session.amount_total ?? 0,
      currency: (session.currency ?? "eur").toUpperCase(),
      customerEmail,
      customerName,
      customerPhone,
      companyName,
      vatId,
      billingAddress,
    })
    .onConflictDoNothing({ target: orders.stripeCheckoutSessionId })
    .returning();

  if (insertedOrders.length === 0) {
    return;
  }
  const order = insertedOrders[0];
  const programReference = formatProgramReference(order);

  // The assessment credit is inserted first so it gets the lowest id —
  // credit redemption picks the oldest-by-(createdAt, id) available
  // credit, so this guarantees the assessment is booked before any
  // regular lesson even though every row in this insert shares the same
  // transaction timestamp.
  await db.insert(lessonCredits).values([
    {
      orderId: order.id,
      customerEmail,
      durationMinutes: PROGRAM_ASSESSMENT_DURATION_MINUTES,
      status: "available",
      programId: program.id,
      programLanguage,
    },
    ...Array.from({ length: program.totalLessons }, () => ({
      orderId: order.id,
      customerEmail,
      durationMinutes: LESSON_DURATION_MINUTES,
      status: "available" as const,
      programId: program.id,
      programLanguage,
    })),
  ]);

  await notifyProgramPurchase({
    customerName,
    customerEmail,
    customerPhone,
    companyName,
    vatId,
    billingAddress,
    programId: program.id,
    programLanguage,
    programReference,
    totalLessons: program.totalLessons,
    amountTotalCents: session.amount_total ?? 0,
    currency: (session.currency ?? "eur").toUpperCase(),
    locale,
  });
}
