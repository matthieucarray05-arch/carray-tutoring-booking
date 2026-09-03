import { formatInTz } from "@/lib/timezone";
import { TUTOR_TIMEZONE } from "@/lib/config";
import { getResend } from "@/lib/email/client";
import {
  buildAdminNotificationEmail,
  buildCustomerConfirmationEmail,
  buildAdminFreeIntroEmail,
  buildCustomerFreeIntroEmail,
  buildAdminCreditBookingEmail,
  buildCustomerCreditBookingEmail,
  type BookingEmailDetails,
  type FreeIntroEmailDetails,
  type CreditBookingEmailDetails,
} from "@/lib/email/templates";

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
  customerTimezone: string;
  locale: string;
  remainingCredits: number;
  manageToken: string;
}

/**
 * Sends the admin notification email and the customer confirmation email
 * for a newly paid booking. Failures are logged but never thrown — the
 * booking itself is already committed to the DB by the time this runs, so
 * an email provider hiccup shouldn't be treated as a failed webhook
 * (Stripe would otherwise retry and re-run the whole handler).
 */
export async function notifyNewBooking(
  details: NewBookingNotification,
): Promise<void> {
  const emailDetails: BookingEmailDetails = details;
  const adminEmail = process.env.ADMIN_EMAIL;
  const from = process.env.EMAIL_FROM;

  if (!adminEmail || !from) {
    console.warn(
      "notifyNewBooking: ADMIN_EMAIL or EMAIL_FROM not set — skipping email, logging instead.",
      JSON.stringify({ ...details, billingAddress: details.billingAddress }),
    );
    return;
  }

  const resend = getResend();
  const admin = buildAdminNotificationEmail(emailDetails);
  const customer = buildCustomerConfirmationEmail(details.locale, emailDetails);

  const results = await Promise.allSettled([
    resend.emails.send({
      from,
      to: adminEmail,
      subject: admin.subject,
      html: admin.html,
      text: admin.text,
    }),
    resend.emails.send({
      from,
      to: details.customerEmail,
      subject: customer.subject,
      html: customer.html,
      text: customer.text,
    }),
  ]);

  for (const [i, result] of results.entries()) {
    if (result.status === "rejected") {
      console.error(
        `notifyNewBooking: failed to send ${i === 0 ? "admin" : "customer"} email`,
        result.reason,
      );
    }
  }
}

export interface FreeIntroBookingNotification {
  customerName: string;
  customerEmail: string;
  bookingStartAt: Date;
  bookingEndAt: Date;
  customerTimezone: string;
  locale: string;
  manageToken: string;
}

/**
 * Sends the admin notification and customer confirmation emails for a free
 * intro consultation booking — same delivery pattern as notifyNewBooking,
 * just with the free-intro copy (no billing/pricing details to show).
 */
export async function notifyFreeIntroBooking(
  details: FreeIntroBookingNotification,
): Promise<void> {
  const emailDetails: FreeIntroEmailDetails = details;
  const adminEmail = process.env.ADMIN_EMAIL;
  const from = process.env.EMAIL_FROM;

  if (!adminEmail || !from) {
    console.warn(
      "notifyFreeIntroBooking: ADMIN_EMAIL or EMAIL_FROM not set — skipping email, logging instead.",
      JSON.stringify(details),
    );
    return;
  }

  const resend = getResend();
  const admin = buildAdminFreeIntroEmail(emailDetails);
  const customer = buildCustomerFreeIntroEmail(details.locale, emailDetails);

  const results = await Promise.allSettled([
    resend.emails.send({
      from,
      to: adminEmail,
      subject: admin.subject,
      html: admin.html,
      text: admin.text,
    }),
    resend.emails.send({
      from,
      to: details.customerEmail,
      subject: customer.subject,
      html: customer.html,
      text: customer.text,
    }),
  ]);

  for (const [i, result] of results.entries()) {
    if (result.status === "rejected") {
      console.error(
        `notifyFreeIntroBooking: failed to send ${i === 0 ? "admin" : "customer"} email`,
        result.reason,
      );
    }
  }
}

export interface CreditBookingNotification {
  customerName: string;
  customerEmail: string;
  bookingStartAt: Date;
  bookingEndAt: Date;
  customerTimezone: string;
  locale: string;
  remainingCredits: number;
  manageToken: string;
}

/**
 * Sends the admin notification and customer confirmation emails when a
 * customer redeems an existing lesson credit (no payment involved) —
 * same delivery pattern as notifyNewBooking/notifyFreeIntroBooking.
 */
export async function notifyCreditBooking(
  details: CreditBookingNotification,
): Promise<void> {
  const emailDetails: CreditBookingEmailDetails = details;
  const adminEmail = process.env.ADMIN_EMAIL;
  const from = process.env.EMAIL_FROM;

  if (!adminEmail || !from) {
    console.warn(
      "notifyCreditBooking: ADMIN_EMAIL or EMAIL_FROM not set — skipping email, logging instead.",
      JSON.stringify(details),
    );
    return;
  }

  const resend = getResend();
  const admin = buildAdminCreditBookingEmail(emailDetails);
  const customer = buildCustomerCreditBookingEmail(details.locale, emailDetails);

  const results = await Promise.allSettled([
    resend.emails.send({
      from,
      to: adminEmail,
      subject: admin.subject,
      html: admin.html,
      text: admin.text,
    }),
    resend.emails.send({
      from,
      to: details.customerEmail,
      subject: customer.subject,
      html: customer.html,
      text: customer.text,
    }),
  ]);

  for (const [i, result] of results.entries()) {
    if (result.status === "rejected") {
      console.error(
        `notifyCreditBooking: failed to send ${i === 0 ? "admin" : "customer"} email`,
        result.reason,
      );
    }
  }
}

/**
 * Logged when a payment succeeded but the selected slot was taken by
 * someone else in the meantime (rare race condition at low volume). The
 * customer's credits are still created — this just flags that the first
 * slot needs manual follow-up (rebook or refund that one lesson). Also
 * emails the admin directly, since this needs a human to act on it.
 */
export async function notifySlotConflict(details: {
  customerEmail: string;
  requestedStartAt: Date;
  requestedEndAt: Date;
  stripeCheckoutSessionId: string;
}): Promise<void> {
  const message = [
    "=== BOOKING CONFLICT — needs manual follow-up ===",
    `Customer: ${details.customerEmail}`,
    `Requested slot: ${formatInTz(details.requestedStartAt, TUTOR_TIMEZONE, "EEEE d MMMM yyyy, HH:mm")}–${formatInTz(details.requestedEndAt, TUTOR_TIMEZONE, "HH:mm")} (${TUTOR_TIMEZONE})`,
    `Stripe Checkout Session: ${details.stripeCheckoutSessionId}`,
    "This slot was already booked by someone else before this payment's webhook arrived.",
    "The customer's credits were created and are safe to use — rebook them for a different slot,",
    "or refund this one lesson if that's easier.",
    "===================================================",
  ].join("\n");

  console.warn(message);

  const adminEmail = process.env.ADMIN_EMAIL;
  const from = process.env.EMAIL_FROM;
  if (!adminEmail || !from) return;

  try {
    const resend = getResend();
    await resend.emails.send({
      from,
      to: adminEmail,
      subject: `Booking conflict needs follow-up — ${details.customerEmail}`,
      text: message,
    });
  } catch (err) {
    console.error("notifySlotConflict: failed to send admin alert email", err);
  }
}

/**
 * Emailed to the admin only when a customer self-service cancels a booking
 * via the manage link — the customer already sees a confirmation on the
 * cancel page itself, so this is just so the tutor knows the slot freed up.
 */
export async function notifyBookingCancelled(details: {
  customerName: string | null;
  customerEmail: string;
  bookingStartAt: Date;
  bookingEndAt: Date;
  customerTimezone: string;
  bookingType: string;
}): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const from = process.env.EMAIL_FROM;

  const slotLabel = `${formatInTz(details.bookingStartAt, details.customerTimezone, "EEEE d MMMM yyyy, HH:mm")}–${formatInTz(details.bookingEndAt, details.customerTimezone, "HH:mm")} (${details.customerTimezone})`;
  const message = [
    "=== BOOKING CANCELLED BY CUSTOMER ===",
    `Customer: ${details.customerName ?? "(no name)"} <${details.customerEmail}>`,
    `Type: ${details.bookingType}`,
    `Was booked for: ${slotLabel}`,
    "This slot is now free again.",
    "=======================================",
  ].join("\n");

  if (!adminEmail || !from) {
    console.warn("notifyBookingCancelled: ADMIN_EMAIL or EMAIL_FROM not set — logging instead.", message);
    return;
  }

  try {
    const resend = getResend();
    await resend.emails.send({
      from,
      to: adminEmail,
      subject: `Booking cancelled: ${details.customerName ?? details.customerEmail}`,
      text: message,
    });
  } catch (err) {
    console.error("notifyBookingCancelled: failed to send admin alert email", err);
  }
}
