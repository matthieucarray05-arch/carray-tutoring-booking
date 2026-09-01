import { formatInTz } from "@/lib/timezone";
import { TUTOR_TIMEZONE } from "@/lib/config";

export interface NewBookingNotification {
  customerName: string | null;
  customerEmail: string;
  companyName: string | null;
  vatId: string | null;
  billingAddress: unknown;
  productId: string;
  productType: string;
  creditsCount: number;
  amountTotalCents: number;
  currency: string;
  bookingStartAt: Date;
  bookingEndAt: Date;
  remainingCredits: number;
}

/**
 * Internal notification for a new paid booking. Placeholder: logs a clear,
 * structured message. Swap the body for a Resend email call later — the
 * call site (webhook handler) doesn't need to change.
 */
export function notifyNewBooking(details: NewBookingNotification): void {
  const lines = [
    "=== New booking paid ===",
    `Customer: ${details.customerName ?? "(no name)"} <${details.customerEmail}>`,
    details.companyName ? `Company: ${details.companyName}` : null,
    details.vatId ? `VAT ID: ${details.vatId}` : null,
    `Billing address: ${JSON.stringify(details.billingAddress)}`,
    `Product: ${details.productId} (${details.productType}, ${details.creditsCount} credit(s))`,
    `Amount: ${(details.amountTotalCents / 100).toFixed(2)} ${details.currency.toUpperCase()}`,
    `Booked slot: ${formatInTz(details.bookingStartAt, TUTOR_TIMEZONE, "EEEE d MMMM yyyy, HH:mm")}–${formatInTz(details.bookingEndAt, TUTOR_TIMEZONE, "HH:mm")} (${TUTOR_TIMEZONE})`,
    `Remaining unused credits for this customer: ${details.remainingCredits}`,
    "=========================",
  ].filter(Boolean);

  console.log(lines.join("\n"));
}

/**
 * Logged when a payment succeeded but the selected slot was taken by
 * someone else in the meantime (rare race condition at low volume). The
 * customer's credits are still created — this just flags that the first
 * slot needs manual follow-up (rebook or refund that one lesson).
 */
export function notifySlotConflict(details: {
  customerEmail: string;
  requestedStartAt: Date;
  requestedEndAt: Date;
  stripeCheckoutSessionId: string;
}): void {
  console.warn(
    [
      "=== BOOKING CONFLICT — needs manual follow-up ===",
      `Customer: ${details.customerEmail}`,
      `Requested slot: ${formatInTz(details.requestedStartAt, TUTOR_TIMEZONE, "EEEE d MMMM yyyy, HH:mm")}–${formatInTz(details.requestedEndAt, TUTOR_TIMEZONE, "HH:mm")} (${TUTOR_TIMEZONE})`,
      `Stripe Checkout Session: ${details.stripeCheckoutSessionId}`,
      "This slot was already booked by someone else before this payment's webhook arrived.",
      "The customer's credits were created and are safe to use — rebook them for a different slot,",
      "or refund this one lesson if that's easier.",
      "===================================================",
    ].join("\n"),
  );
}
