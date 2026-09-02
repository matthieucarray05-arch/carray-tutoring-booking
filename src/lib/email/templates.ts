import { formatInTz } from "@/lib/timezone";

export interface BookingEmailDetails {
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
  remainingCredits: number;
}

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(
    cents / 100,
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Admin notification — always in English, mirrors the previous console.log content. */
export function buildAdminNotificationEmail(details: BookingEmailDetails): {
  subject: string;
  html: string;
  text: string;
} {
  const slotLabel = `${formatInTz(details.bookingStartAt, details.customerTimezone, "EEEE d MMMM yyyy, HH:mm")}–${formatInTz(details.bookingEndAt, details.customerTimezone, "HH:mm")} (${details.customerTimezone})`;

  const rows: [string, string][] = [
    ["Customer", `${details.customerName ?? "(no name)"} <${details.customerEmail}>`],
    ...(details.companyName ? ([["Company", details.companyName]] as [string, string][]) : []),
    ...(details.vatId ? ([["VAT ID", details.vatId]] as [string, string][]) : []),
    ["Billing address", JSON.stringify(details.billingAddress)],
    ["Product", `${details.productId} (${details.productType}, ${details.creditsCount} credit(s))`],
    ["Amount", formatAmount(details.amountTotalCents, details.currency)],
    ["Booked slot", slotLabel],
    ["Remaining unused credits", String(details.remainingCredits)],
  ];

  const subject = `New booking: ${details.customerName ?? details.customerEmail} — ${formatInTz(details.bookingStartAt, details.customerTimezone, "d MMM yyyy, HH:mm")}`;

  const text = ["New booking paid", "", ...rows.map(([k, v]) => `${k}: ${v}`)].join("\n");

  const html = `
    <h2 style="margin:0 0 16px;font-family:sans-serif;">New booking paid</h2>
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top;">${escapeHtml(k)}</td><td style="padding:4px 0;">${escapeHtml(v)}</td></tr>`,
        )
        .join("")}
    </table>
  `;

  return { subject, html, text };
}

interface CustomerCopy {
  subject: string;
  greeting: (name: string) => string;
  intro: string;
  slotLabel: string;
  productLabel: string;
  amountLabel: string;
  creditsRemaining: (count: number) => string;
  closing: string;
}

const CUSTOMER_COPY: Record<string, CustomerCopy> = {
  en: {
    subject: "Your lesson is confirmed",
    greeting: (name) => `Hi ${name},`,
    intro: "Thanks for your payment — your lesson is confirmed!",
    slotLabel: "When",
    productLabel: "Lesson",
    amountLabel: "Amount paid",
    creditsRemaining: (count) =>
      count > 0
        ? `You have ${count} more lesson${count === 1 ? "" : "s"} left from this package — get in touch whenever you're ready to book them.`
        : "",
    closing: "See you soon!\nCarray Tutoring",
  },
  it: {
    subject: "La tua lezione è confermata",
    greeting: (name) => `Ciao ${name},`,
    intro: "Grazie per il pagamento — la tua lezione è confermata!",
    slotLabel: "Quando",
    productLabel: "Lezione",
    amountLabel: "Importo pagato",
    creditsRemaining: (count) =>
      count > 0
        ? `Hai ancora ${count} lezion${count === 1 ? "e" : "i"} da questo pacchetto — scrivici quando vuoi prenotarle.`
        : "",
    closing: "A presto!\nCarray Tutoring",
  },
  fr: {
    subject: "Votre cours est confirmé",
    greeting: (name) => `Bonjour ${name},`,
    intro: "Merci pour votre paiement — votre cours est confirmé !",
    slotLabel: "Quand",
    productLabel: "Cours",
    amountLabel: "Montant payé",
    creditsRemaining: (count) =>
      count > 0
        ? `Il vous reste ${count} cours de ce forfait — contactez-nous quand vous voulez les réserver.`
        : "",
    closing: "À bientôt !\nCarray Tutoring",
  },
  de: {
    subject: "Deine Unterrichtsstunde ist bestätigt",
    greeting: (name) => `Hallo ${name},`,
    intro: "Danke für deine Zahlung — deine Unterrichtsstunde ist bestätigt!",
    slotLabel: "Wann",
    productLabel: "Unterricht",
    amountLabel: "Bezahlter Betrag",
    creditsRemaining: (count) =>
      count > 0
        ? `Du hast noch ${count} Stunde${count === 1 ? "" : "n"} aus diesem Paket übrig — melde dich, wenn du sie buchen möchtest.`
        : "",
    closing: "Bis bald!\nCarray Tutoring",
  },
};

export interface FreeIntroEmailDetails {
  customerName: string;
  customerEmail: string;
  bookingStartAt: Date;
  bookingEndAt: Date;
  customerTimezone: string;
}

/** Admin notification for a free intro consultation — always in English. */
export function buildAdminFreeIntroEmail(details: FreeIntroEmailDetails): {
  subject: string;
  html: string;
  text: string;
} {
  const slotLabel = `${formatInTz(details.bookingStartAt, details.customerTimezone, "EEEE d MMMM yyyy, HH:mm")}–${formatInTz(details.bookingEndAt, details.customerTimezone, "HH:mm")} (${details.customerTimezone})`;

  const rows: [string, string][] = [
    ["Customer", `${details.customerName} <${details.customerEmail}>`],
    ["Type", "Free intro consultation"],
    ["Booked slot", slotLabel],
  ];

  const subject = `New free intro consultation: ${details.customerName} — ${formatInTz(details.bookingStartAt, details.customerTimezone, "d MMM yyyy, HH:mm")}`;
  const text = ["New free intro consultation booked", "", ...rows.map(([k, v]) => `${k}: ${v}`)].join("\n");
  const html = `
    <h2 style="margin:0 0 16px;font-family:sans-serif;">New free intro consultation booked</h2>
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top;">${escapeHtml(k)}</td><td style="padding:4px 0;">${escapeHtml(v)}</td></tr>`,
        )
        .join("")}
    </table>
  `;

  return { subject, html, text };
}

interface FreeIntroCopy {
  subject: string;
  greeting: (name: string) => string;
  intro: string;
  slotLabel: string;
  closing: string;
}

const FREE_INTRO_COPY: Record<string, FreeIntroCopy> = {
  en: {
    subject: "Your free intro consultation is confirmed",
    greeting: (name) => `Hi ${name},`,
    intro:
      "Thanks for booking your free intro consultation! It's a chance for us to get to know each other, talk about your goals and see how I can help you improve — no cost, no obligation.",
    slotLabel: "When",
    closing: "See you soon!\nCarray Tutoring",
  },
  it: {
    subject: "La tua consulenza gratuita è confermata",
    greeting: (name) => `Ciao ${name},`,
    intro:
      "Grazie per aver prenotato la tua consulenza gratuita! È un'occasione per conoscerci, parlare dei tuoi obiettivi e capire come posso aiutarti a migliorare — senza costi né impegno.",
    slotLabel: "Quando",
    closing: "A presto!\nCarray Tutoring",
  },
  fr: {
    subject: "Votre consultation gratuite est confirmée",
    greeting: (name) => `Bonjour ${name},`,
    intro:
      "Merci d'avoir réservé votre consultation gratuite ! C'est l'occasion de faire connaissance, de parler de vos objectifs et de voir comment je peux vous aider à progresser — sans frais ni engagement.",
    slotLabel: "Quand",
    closing: "À bientôt !\nCarray Tutoring",
  },
  de: {
    subject: "Deine kostenlose Kennenlernstunde ist bestätigt",
    greeting: (name) => `Hallo ${name},`,
    intro:
      "Danke, dass du deine kostenlose Kennenlernstunde gebucht hast! Das ist eine Gelegenheit, uns kennenzulernen, über deine Ziele zu sprechen und zu sehen, wie ich dir helfen kann — ohne Kosten und ohne Verpflichtung.",
    slotLabel: "Wann",
    closing: "Bis bald!\nCarray Tutoring",
  },
};

export function buildCustomerFreeIntroEmail(
  locale: string,
  details: FreeIntroEmailDetails,
): { subject: string; html: string; text: string } {
  const copy = FREE_INTRO_COPY[locale] ?? FREE_INTRO_COPY.en;
  const slot = `${formatInTz(details.bookingStartAt, details.customerTimezone, "EEEE d MMMM yyyy, HH:mm")}–${formatInTz(details.bookingEndAt, details.customerTimezone, "HH:mm")} (${details.customerTimezone})`;

  const text = [
    copy.greeting(details.customerName),
    "",
    copy.intro,
    "",
    `${copy.slotLabel}: ${slot}`,
    "",
    copy.closing,
  ].join("\n");

  const html = `
    <div style="font-family:sans-serif;font-size:15px;color:#1a1a1a;line-height:1.5;">
      <p>${escapeHtml(copy.greeting(details.customerName))}</p>
      <p>${escapeHtml(copy.intro)}</p>
      <table style="border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:4px 12px 4px 0;color:#666;">${escapeHtml(copy.slotLabel)}</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(slot)}</td></tr>
      </table>
      <p style="white-space:pre-line;">${escapeHtml(copy.closing)}</p>
    </div>
  `;

  return { subject: copy.subject, html, text };
}

export function buildCustomerConfirmationEmail(
  locale: string,
  details: BookingEmailDetails,
): { subject: string; html: string; text: string } {
  const copy = CUSTOMER_COPY[locale] ?? CUSTOMER_COPY.en;
  const slot = `${formatInTz(details.bookingStartAt, details.customerTimezone, "EEEE d MMMM yyyy, HH:mm")}–${formatInTz(details.bookingEndAt, details.customerTimezone, "HH:mm")} (${details.customerTimezone})`;
  const productLine =
    details.creditsCount > 1
      ? `${details.creditsCount} × 60 min`
      : "60 min";
  const remainingLine = copy.creditsRemaining(details.remainingCredits);

  const textLines = [
    copy.greeting(details.customerName ?? ""),
    "",
    copy.intro,
    "",
    `${copy.slotLabel}: ${slot}`,
    `${copy.productLabel}: ${productLine}`,
    `${copy.amountLabel}: ${formatAmount(details.amountTotalCents, details.currency)}`,
    ...(remainingLine ? ["", remainingLine] : []),
    "",
    copy.closing,
  ];

  const html = `
    <div style="font-family:sans-serif;font-size:15px;color:#1a1a1a;line-height:1.5;">
      <p>${escapeHtml(copy.greeting(details.customerName ?? ""))}</p>
      <p>${escapeHtml(copy.intro)}</p>
      <table style="border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:4px 12px 4px 0;color:#666;">${escapeHtml(copy.slotLabel)}</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(slot)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">${escapeHtml(copy.productLabel)}</td><td style="padding:4px 0;">${escapeHtml(productLine)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">${escapeHtml(copy.amountLabel)}</td><td style="padding:4px 0;">${escapeHtml(formatAmount(details.amountTotalCents, details.currency))}</td></tr>
      </table>
      ${remainingLine ? `<p>${escapeHtml(remainingLine)}</p>` : ""}
      <p style="white-space:pre-line;">${escapeHtml(copy.closing)}</p>
    </div>
  `;

  return { subject: copy.subject, html, text: textLines.join("\n") };
}
