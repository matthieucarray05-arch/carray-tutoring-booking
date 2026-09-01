import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, lt } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/lib/db/client";
import { orders, lessonCredits, bookings } from "@/lib/db/schema";
import { getStripe } from "@/lib/stripe/client";
import { notifyNewBooking, notifySlotConflict } from "@/lib/notifications";

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
  const productId = metadata.productId;
  const productType = metadata.productType;
  const durationMinutes = Number(metadata.durationMinutes);
  const creditsCount = Number(metadata.creditsCount);
  const slotStartUtc = metadata.slotStartUtc;
  const slotEndUtc = metadata.slotEndUtc;
  const customerTimezone = metadata.customerTimezone || null;

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
  const billingAddress = session.customer_details?.address ?? null;

  const customFields = session.custom_fields ?? [];
  const companyName =
    customFields.find((f) => f.key === "company_name")?.text?.value || null;
  const vatId = customFields.find((f) => f.key === "vat_id")?.text?.value || null;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  const [order] = await db
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
      companyName,
      vatId,
      billingAddress,
    })
    .returning();

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
    notifySlotConflict({
      customerEmail,
      requestedStartAt: slotStart,
      requestedEndAt: slotEnd,
      stripeCheckoutSessionId: session.id,
    });
    return;
  }

  const firstCredit = createdCredits[0];

  const [booking] = await db
    .insert(bookings)
    .values({
      orderId: order.id,
      creditId: firstCredit.id,
      startAt: slotStart,
      endAt: slotEnd,
      durationMinutes,
      customerName,
      customerEmail,
      customerTimezone,
      status: "confirmed",
    })
    .returning();

  await db
    .update(lessonCredits)
    .set({ status: "used", bookingId: booking.id })
    .where(eq(lessonCredits.id, firstCredit.id));

  notifyNewBooking({
    customerName,
    customerEmail,
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
    remainingCredits: creditsCount - 1,
  });
}
