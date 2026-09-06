import { formatInTz, resolveDateFnsLocale } from "@/lib/timezone";
import { SITE_URL, CONTACT_PHONE, MEET_LINK, CANCELLATION_WINDOW_HOURS } from "@/lib/config";
import { formatBookingNumber } from "@/lib/booking-number";

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
  manageToken: string;
  bookingId: number;
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

/** Logo + phone number, left-aligned at the bottom of every outgoing email. */
function emailFooterHtml(): string {
  return `
    <table style="margin-top:28px;border-collapse:collapse;">
      <tr>
        <td>
          <img src="${SITE_URL}/logo.png" alt="Carray Tutoring" height="36" style="display:block;height:36px;width:auto;" />
        </td>
      </tr>
      <tr>
        <td style="padding-top:8px;font-family:sans-serif;font-size:13px;color:#666;">
          ${escapeHtml(CONTACT_PHONE)}
        </td>
      </tr>
    </table>
  `;
}

function emailFooterText(): string {
  return `\n\nCarray Tutoring\n${CONTACT_PHONE}`;
}

const BOOKING_NUMBER_LABEL: Record<string, string> = {
  en: "Booking number",
  it: "Numero di prenotazione",
  fr: "Numéro de réservation",
  de: "Buchungsnummer",
};

interface SessionInfoCopy {
  joinTitle: string;
  joinBody: string;
  joinEarly: string;
  cancelTitle: string;
  cancelBody: (manageUrl: string, phone: string) => string;
  cancelLinkLabel: string;
  lateTitle: string;
  lateBody: string;
  staffNote: string;
}

const SESSION_INFO_COPY: Record<string, SessionInfoCopy> = {
  en: {
    joinTitle: "How to join",
    joinBody: "Click the link below and turn on your mic and camera to join the session:",
    joinEarly: "Please join at least 15 minutes early to test your audio and video.",
    cancelTitle: "Cancellation policy",
    cancelBody: (manageUrl, phone) =>
      `You can cancel or move your session up to ${CANCELLATION_WINDOW_HOURS} hours before the scheduled time here: ${manageUrl}. After that, please message us on WhatsApp at ${phone} to let us know you won't be attending.`,
    cancelLinkLabel: "Cancel or reschedule your session",
    lateTitle: "Running late",
    lateBody: "If you arrive late, the session will not be extended beyond its originally scheduled end time.",
    staffNote:
      "Carray Tutoring reserves the right to modify or cancel this appointment at any time for scheduling reasons, with advance notice.",
  },
  it: {
    joinTitle: "Come collegarti",
    joinBody: "Clicca sul link qui sotto e attiva microfono e webcam per partecipare alla sessione:",
    joinEarly: "Ti consigliamo di collegarti almeno 15 minuti prima per sistemare audio e video.",
    cancelTitle: "Policy di cancellazione",
    cancelBody: (manageUrl, phone) =>
      `Puoi cancellare o spostare la tua sessione fino a ${CANCELLATION_WINDOW_HOURS} ore prima dell'orario prenotato qui: ${manageUrl}. Oltre questo limite, scrivici su WhatsApp al ${phone} per avvisarci della tua assenza.`,
    cancelLinkLabel: "Cancella o sposta la tua sessione",
    lateTitle: "Ritardo",
    lateBody: "In caso di ritardo, la sessione non verrà prolungata oltre l'orario originariamente prenotato.",
    staffNote:
      "Carray Tutoring si riserva il diritto di modificare o cancellare l'appuntamento in qualsiasi momento per esigenze di servizio, con comunicazione preventiva.",
  },
  fr: {
    joinTitle: "Comment se connecter",
    joinBody: "Cliquez sur le lien ci-dessous et activez votre micro et votre caméra pour rejoindre la séance :",
    joinEarly: "Merci de vous connecter au moins 15 minutes à l'avance pour tester l'audio et la vidéo.",
    cancelTitle: "Politique d'annulation",
    cancelBody: (manageUrl, phone) =>
      `Vous pouvez annuler ou déplacer votre séance jusqu'à ${CANCELLATION_WINDOW_HOURS} heures avant l'horaire prévu ici : ${manageUrl}. Passé ce délai, merci de nous écrire sur WhatsApp au ${phone} pour nous prévenir de votre absence.`,
    cancelLinkLabel: "Annuler ou déplacer votre séance",
    lateTitle: "Retard",
    lateBody: "En cas de retard, la séance ne sera pas prolongée au-delà de l'heure de fin initialement prévue.",
    staffNote:
      "Carray Tutoring se réserve le droit de modifier ou d'annuler ce rendez-vous à tout moment pour des raisons d'organisation, avec préavis.",
  },
  de: {
    joinTitle: "So nimmst du teil",
    joinBody: "Klicke auf den Link unten und schalte Mikrofon und Kamera ein, um an der Sitzung teilzunehmen:",
    joinEarly: "Bitte melde dich mindestens 15 Minuten vorher an, um Audio und Video zu testen.",
    cancelTitle: "Stornierungsrichtlinie",
    cancelBody: (manageUrl, phone) =>
      `Du kannst deine Sitzung bis ${CANCELLATION_WINDOW_HOURS} Stunden vor dem geplanten Termin hier stornieren oder verschieben: ${manageUrl}. Danach schreibe uns bitte auf WhatsApp an ${phone}, um uns über dein Fernbleiben zu informieren.`,
    cancelLinkLabel: "Sitzung stornieren oder verschieben",
    lateTitle: "Verspätung",
    lateBody: "Bei Verspätung wird die Sitzung nicht über die ursprünglich geplante Endzeit hinaus verlängert.",
    staffNote:
      "Carray Tutoring behält sich das Recht vor, diesen Termin jederzeit aus organisatorischen Gründen mit vorheriger Ankündigung zu ändern oder abzusagen.",
  },
};

/** Meet link + join reminder + cancellation/lateness policy — appended to every customer-facing booking confirmation email. */
function sessionInfoBlock(locale: string, manageToken: string): { html: string; text: string } {
  const copy = SESSION_INFO_COPY[locale] ?? SESSION_INFO_COPY.en;
  const manageUrl = `${SITE_URL}/${locale}/manage/${manageToken}`;
  const cancelBody = copy.cancelBody(manageUrl, CONTACT_PHONE);

  const text = [
    "",
    `${copy.joinTitle}:`,
    copy.joinBody,
    MEET_LINK,
    copy.joinEarly,
    "",
    `${copy.cancelTitle}:`,
    cancelBody,
    "",
    `${copy.lateTitle}:`,
    copy.lateBody,
    "",
    copy.staffNote,
  ].join("\n");

  const html = `
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e5e5e5;font-family:sans-serif;font-size:14px;color:#333;line-height:1.5;">
      <p style="font-weight:600;margin:0 0 4px;">${escapeHtml(copy.joinTitle)}</p>
      <p style="margin:0 0 8px;">${escapeHtml(copy.joinBody)} <a href="${MEET_LINK}">${escapeHtml(MEET_LINK)}</a></p>
      <p style="margin:0 0 16px;color:#666;">${escapeHtml(copy.joinEarly)}</p>

      <p style="font-weight:600;margin:0 0 4px;">${escapeHtml(copy.cancelTitle)}</p>
      <p style="margin:0 0 16px;">${cancelBody.replace(manageUrl, `<a href="${manageUrl}">${escapeHtml(copy.cancelLinkLabel)}</a>`)}</p>

      <p style="font-weight:600;margin:0 0 4px;">${escapeHtml(copy.lateTitle)}</p>
      <p style="margin:0 0 16px;">${escapeHtml(copy.lateBody)}</p>

      <p style="margin:0;color:#888;font-size:12px;">${escapeHtml(copy.staffNote)}</p>
    </div>
  `;

  return { html, text };
}

/** Admin notification — always in English, mirrors the previous console.log content. */
export function buildAdminNotificationEmail(details: BookingEmailDetails): {
  subject: string;
  html: string;
  text: string;
} {
  const slotLabel = `${formatInTz(details.bookingStartAt, details.customerTimezone, "EEEE d MMMM yyyy, HH:mm")}–${formatInTz(details.bookingEndAt, details.customerTimezone, "HH:mm")} (${details.customerTimezone})`;

  const rows: [string, string][] = [
    ["Booking number", formatBookingNumber(details.bookingId)],
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

  const text = ["New booking paid", "", ...rows.map(([k, v]) => `${k}: ${v}`)].join("\n") + emailFooterText();

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
    ${emailFooterHtml()}
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
  manageToken: string;
  bookingId: number;
}

/** Admin notification for a free intro consultation — always in English. */
export function buildAdminFreeIntroEmail(details: FreeIntroEmailDetails): {
  subject: string;
  html: string;
  text: string;
} {
  const slotLabel = `${formatInTz(details.bookingStartAt, details.customerTimezone, "EEEE d MMMM yyyy, HH:mm")}–${formatInTz(details.bookingEndAt, details.customerTimezone, "HH:mm")} (${details.customerTimezone})`;

  const rows: [string, string][] = [
    ["Booking number", formatBookingNumber(details.bookingId)],
    ["Customer", `${details.customerName} <${details.customerEmail}>`],
    ["Type", "Free intro consultation"],
    ["Booked slot", slotLabel],
  ];

  const subject = `New free intro consultation: ${details.customerName} — ${formatInTz(details.bookingStartAt, details.customerTimezone, "d MMM yyyy, HH:mm")}`;
  const text = ["New free intro consultation booked", "", ...rows.map(([k, v]) => `${k}: ${v}`)].join("\n") + emailFooterText();
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
    ${emailFooterHtml()}
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
  const dateFnsLocale = resolveDateFnsLocale(locale);
  const slot = `${formatInTz(details.bookingStartAt, details.customerTimezone, "EEEE d MMMM yyyy, HH:mm", dateFnsLocale)}–${formatInTz(details.bookingEndAt, details.customerTimezone, "HH:mm")} (${details.customerTimezone})`;
  const subjectDate = formatInTz(details.bookingStartAt, details.customerTimezone, "d MMM yyyy, HH:mm", dateFnsLocale);

  const session = sessionInfoBlock(locale, details.manageToken);
  const bookingNumberLabel = BOOKING_NUMBER_LABEL[locale] ?? BOOKING_NUMBER_LABEL.en;
  const bookingNumber = formatBookingNumber(details.bookingId);

  const text = [
    copy.greeting(details.customerName),
    "",
    copy.intro,
    "",
    `${bookingNumberLabel}: ${bookingNumber}`,
    `${copy.slotLabel}: ${slot}`,
    "",
    copy.closing,
  ].join("\n") + session.text + emailFooterText();

  const html = `
    <div style="font-family:sans-serif;font-size:15px;color:#1a1a1a;line-height:1.5;">
      <p>${escapeHtml(copy.greeting(details.customerName))}</p>
      <p>${escapeHtml(copy.intro)}</p>
      <table style="border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:4px 12px 4px 0;color:#666;">${escapeHtml(bookingNumberLabel)}</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(bookingNumber)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">${escapeHtml(copy.slotLabel)}</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(slot)}</td></tr>
      </table>
      <p style="white-space:pre-line;">${escapeHtml(copy.closing)}</p>
      ${session.html}
      ${emailFooterHtml()}
    </div>
  `;

  return { subject: `${copy.subject} — ${subjectDate}`, html, text };
}

export interface CreditBookingEmailDetails {
  customerName: string;
  customerEmail: string;
  bookingStartAt: Date;
  bookingEndAt: Date;
  customerTimezone: string;
  remainingCredits: number;
  manageToken: string;
  bookingId: number;
}

/** Admin notification for a credit redemption — always in English. */
export function buildAdminCreditBookingEmail(details: CreditBookingEmailDetails): {
  subject: string;
  html: string;
  text: string;
} {
  const slotLabel = `${formatInTz(details.bookingStartAt, details.customerTimezone, "EEEE d MMMM yyyy, HH:mm")}–${formatInTz(details.bookingEndAt, details.customerTimezone, "HH:mm")} (${details.customerTimezone})`;

  const rows: [string, string][] = [
    ["Booking number", formatBookingNumber(details.bookingId)],
    ["Customer", `${details.customerName} <${details.customerEmail}>`],
    ["Type", "Lesson credit redeemed (no payment)"],
    ["Booked slot", slotLabel],
    ["Remaining unused credits", String(details.remainingCredits)],
  ];

  const subject = `Credit lesson booked: ${details.customerName} — ${formatInTz(details.bookingStartAt, details.customerTimezone, "d MMM yyyy, HH:mm")}`;
  const text = ["Lesson credit redeemed", "", ...rows.map(([k, v]) => `${k}: ${v}`)].join("\n") + emailFooterText();
  const html = `
    <h2 style="margin:0 0 16px;font-family:sans-serif;">Lesson credit redeemed</h2>
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top;">${escapeHtml(k)}</td><td style="padding:4px 0;">${escapeHtml(v)}</td></tr>`,
        )
        .join("")}
    </table>
    ${emailFooterHtml()}
  `;

  return { subject, html, text };
}

interface CreditBookingCopy {
  subject: string;
  greeting: (name: string) => string;
  intro: string;
  slotLabel: string;
  remaining: (count: number) => string;
  closing: string;
}

const CREDIT_BOOKING_COPY: Record<string, CreditBookingCopy> = {
  en: {
    subject: "Your lesson is confirmed",
    greeting: (name) => `Hi ${name},`,
    intro: "Your lesson is confirmed — no payment needed, it's from your package.",
    slotLabel: "When",
    remaining: (count) =>
      count > 0
        ? `You have ${count} more lesson${count === 1 ? "" : "s"} left from this package — get in touch whenever you're ready to book them.`
        : "This was your last lesson from this package — get in touch if you'd like to book a new one.",
    closing: "See you soon!\nCarray Tutoring",
  },
  it: {
    subject: "La tua lezione è confermata",
    greeting: (name) => `Ciao ${name},`,
    intro: "La tua lezione è confermata — nessun pagamento necessario, fa parte del tuo pacchetto.",
    slotLabel: "Quando",
    remaining: (count) =>
      count > 0
        ? `Hai ancora ${count} lezion${count === 1 ? "e" : "i"} da questo pacchetto — scrivici quando vuoi prenotarle.`
        : "Questa era l'ultima lezione di questo pacchetto — scrivici se vuoi prenotarne uno nuovo.",
    closing: "A presto!\nCarray Tutoring",
  },
  fr: {
    subject: "Votre cours est confirmé",
    greeting: (name) => `Bonjour ${name},`,
    intro: "Votre cours est confirmé — aucun paiement nécessaire, il fait partie de votre forfait.",
    slotLabel: "Quand",
    remaining: (count) =>
      count > 0
        ? `Il vous reste ${count} cours de ce forfait — contactez-nous quand vous voulez les réserver.`
        : "C'était le dernier cours de ce forfait — contactez-nous si vous souhaitez en réserver un nouveau.",
    closing: "À bientôt !\nCarray Tutoring",
  },
  de: {
    subject: "Deine Unterrichtsstunde ist bestätigt",
    greeting: (name) => `Hallo ${name},`,
    intro: "Deine Unterrichtsstunde ist bestätigt — keine Zahlung nötig, sie stammt aus deinem Paket.",
    slotLabel: "Wann",
    remaining: (count) =>
      count > 0
        ? `Du hast noch ${count} Stunde${count === 1 ? "" : "n"} aus diesem Paket übrig — melde dich, wenn du sie buchen möchtest.`
        : "Das war die letzte Stunde aus diesem Paket — melde dich, wenn du ein neues buchen möchtest.",
    closing: "Bis bald!\nCarray Tutoring",
  },
};

export function buildCustomerCreditBookingEmail(
  locale: string,
  details: CreditBookingEmailDetails,
): { subject: string; html: string; text: string } {
  const copy = CREDIT_BOOKING_COPY[locale] ?? CREDIT_BOOKING_COPY.en;
  const dateFnsLocale = resolveDateFnsLocale(locale);
  const slot = `${formatInTz(details.bookingStartAt, details.customerTimezone, "EEEE d MMMM yyyy, HH:mm", dateFnsLocale)}–${formatInTz(details.bookingEndAt, details.customerTimezone, "HH:mm")} (${details.customerTimezone})`;
  const subjectDate = formatInTz(details.bookingStartAt, details.customerTimezone, "d MMM yyyy, HH:mm", dateFnsLocale);
  const remainingLine = copy.remaining(details.remainingCredits);
  const session = sessionInfoBlock(locale, details.manageToken);
  const bookingNumberLabel = BOOKING_NUMBER_LABEL[locale] ?? BOOKING_NUMBER_LABEL.en;
  const bookingNumber = formatBookingNumber(details.bookingId);

  const text = [
    copy.greeting(details.customerName),
    "",
    copy.intro,
    "",
    `${bookingNumberLabel}: ${bookingNumber}`,
    `${copy.slotLabel}: ${slot}`,
    "",
    remainingLine,
    "",
    copy.closing,
  ].join("\n") + session.text + emailFooterText();

  const html = `
    <div style="font-family:sans-serif;font-size:15px;color:#1a1a1a;line-height:1.5;">
      <p>${escapeHtml(copy.greeting(details.customerName))}</p>
      <p>${escapeHtml(copy.intro)}</p>
      <table style="border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:4px 12px 4px 0;color:#666;">${escapeHtml(bookingNumberLabel)}</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(bookingNumber)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">${escapeHtml(copy.slotLabel)}</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(slot)}</td></tr>
      </table>
      <p>${escapeHtml(remainingLine)}</p>
      <p style="white-space:pre-line;">${escapeHtml(copy.closing)}</p>
      ${session.html}
      ${emailFooterHtml()}
    </div>
  `;

  return { subject: `${copy.subject} — ${subjectDate}`, html, text };
}

export function buildCustomerConfirmationEmail(
  locale: string,
  details: BookingEmailDetails,
): { subject: string; html: string; text: string } {
  const copy = CUSTOMER_COPY[locale] ?? CUSTOMER_COPY.en;
  const dateFnsLocale = resolveDateFnsLocale(locale);
  const slot = `${formatInTz(details.bookingStartAt, details.customerTimezone, "EEEE d MMMM yyyy, HH:mm", dateFnsLocale)}–${formatInTz(details.bookingEndAt, details.customerTimezone, "HH:mm")} (${details.customerTimezone})`;
  const subjectDate = formatInTz(details.bookingStartAt, details.customerTimezone, "d MMM yyyy, HH:mm", dateFnsLocale);
  const productLine =
    details.creditsCount > 1
      ? `${details.creditsCount} × 60 min`
      : "60 min";
  const remainingLine = copy.creditsRemaining(details.remainingCredits);
  const session = sessionInfoBlock(locale, details.manageToken);
  const bookingNumberLabel = BOOKING_NUMBER_LABEL[locale] ?? BOOKING_NUMBER_LABEL.en;
  const bookingNumber = formatBookingNumber(details.bookingId);

  const textLines = [
    copy.greeting(details.customerName ?? ""),
    "",
    copy.intro,
    "",
    `${bookingNumberLabel}: ${bookingNumber}`,
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
        <tr><td style="padding:4px 12px 4px 0;color:#666;">${escapeHtml(bookingNumberLabel)}</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(bookingNumber)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">${escapeHtml(copy.slotLabel)}</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(slot)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">${escapeHtml(copy.productLabel)}</td><td style="padding:4px 0;">${escapeHtml(productLine)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">${escapeHtml(copy.amountLabel)}</td><td style="padding:4px 0;">${escapeHtml(formatAmount(details.amountTotalCents, details.currency))}</td></tr>
      </table>
      ${remainingLine ? `<p>${escapeHtml(remainingLine)}</p>` : ""}
      <p style="white-space:pre-line;">${escapeHtml(copy.closing)}</p>
      ${session.html}
      ${emailFooterHtml()}
    </div>
  `;

  return {
    subject: `${copy.subject} — ${subjectDate}`,
    html,
    text: textLines.join("\n") + session.text + emailFooterText(),
  };
}

export interface ProgramPurchaseEmailDetails {
  customerName: string | null;
  customerEmail: string;
  companyName: string | null;
  vatId: string | null;
  billingAddress: unknown;
  programId: string;
  programLanguage: string;
  totalLessons: number;
  amountTotalCents: number;
  currency: string;
}

const PROGRAM_DISPLAY_NAMES: Record<string, string> = {
  starter: "Carray Starter",
  progress: "Carray Progress",
  fluency: "Carray Fluency",
};

const PROGRAM_LANGUAGE_NAMES: Record<string, Record<string, string>> = {
  en: { it: "Italian", en: "English" },
  it: { it: "Italiano", en: "Inglese" },
  fr: { it: "italien", en: "anglais" },
  de: { it: "Italienisch", en: "Englisch" },
};

/** Admin notification for a structured-program purchase — always in English. */
export function buildAdminProgramPurchaseEmail(details: ProgramPurchaseEmailDetails): {
  subject: string;
  html: string;
  text: string;
} {
  const programName = PROGRAM_DISPLAY_NAMES[details.programId] ?? details.programId;

  const rows: [string, string][] = [
    ["Customer", `${details.customerName ?? "(no name)"} <${details.customerEmail}>`],
    ...(details.companyName ? ([["Company", details.companyName]] as [string, string][]) : []),
    ...(details.vatId ? ([["VAT ID", details.vatId]] as [string, string][]) : []),
    ["Billing address", JSON.stringify(details.billingAddress)],
    ["Program", programName],
    ["Lesson language", details.programLanguage === "it" ? "Italian" : "English"],
    ["Lessons included", `${details.totalLessons} + 1 free assessment`],
    ["Amount", formatAmount(details.amountTotalCents, details.currency)],
  ];

  const subject = `New program purchase: ${details.customerName ?? details.customerEmail} — ${programName}`;
  const text = ["New program purchased", "", ...rows.map(([k, v]) => `${k}: ${v}`)].join("\n") + emailFooterText();
  const html = `
    <h2 style="margin:0 0 16px;font-family:sans-serif;">New program purchased</h2>
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top;">${escapeHtml(k)}</td><td style="padding:4px 0;">${escapeHtml(v)}</td></tr>`,
        )
        .join("")}
    </table>
    ${emailFooterHtml()}
  `;

  return { subject, html, text };
}

interface ProgramPurchaseCopy {
  subject: string;
  greeting: (name: string) => string;
  intro: (programName: string, totalLessons: number) => string;
  languageLabel: string;
  whatNextTitle: string;
  whatNextBody: string;
  ctaLabel: string;
  closing: string;
}

const PROGRAM_PURCHASE_COPY: Record<string, ProgramPurchaseCopy> = {
  en: {
    subject: "Your program is confirmed",
    greeting: (name) => `Hi ${name},`,
    intro: (programName, totalLessons) =>
      `Thanks for your payment — your ${programName} program is confirmed! You now have ${totalLessons} lessons plus a free 30-minute level-assessment consultation ready to book.`,
    languageLabel: "Lesson language",
    whatNextTitle: "What's next",
    whatNextBody:
      'Head to the booking page and use "Use a Credit" with this email address to book your free assessment first — we\'ll use it to plan your personalized path, then you can book the rest of your lessons whenever suits you.',
    ctaLabel: "Book your first session",
    closing: "See you soon!\nCarray Tutoring",
  },
  it: {
    subject: "Il tuo programma è confermato",
    greeting: (name) => `Ciao ${name},`,
    intro: (programName, totalLessons) =>
      `Grazie per il pagamento — il tuo programma ${programName} è confermato! Hai ora ${totalLessons} lezioni più una consulenza gratuita di 30 minuti per la valutazione del livello, pronte da prenotare.`,
    languageLabel: "Lingua delle lezioni",
    whatNextTitle: "Prossimi passi",
    whatNextBody:
      'Vai alla pagina di prenotazione e usa "Usa un credito" con questa email per prenotare prima la tua consulenza gratuita — la useremo per pianificare il tuo percorso personalizzato, poi potrai prenotare le altre lezioni quando preferisci.',
    ctaLabel: "Prenota la tua prima sessione",
    closing: "A presto!\nCarray Tutoring",
  },
  fr: {
    subject: "Votre programme est confirmé",
    greeting: (name) => `Bonjour ${name},`,
    intro: (programName, totalLessons) =>
      `Merci pour votre paiement — votre programme ${programName} est confirmé ! Vous avez maintenant ${totalLessons} cours plus une consultation gratuite de 30 minutes pour évaluer votre niveau, prêts à réserver.`,
    languageLabel: "Langue des cours",
    whatNextTitle: "Prochaines étapes",
    whatNextBody:
      "Rendez-vous sur la page de réservation et utilisez « Utiliser un crédit » avec cette adresse email pour réserver d'abord votre consultation gratuite — elle nous permettra de planifier votre parcours personnalisé, puis vous pourrez réserver le reste de vos cours quand vous le souhaitez.",
    ctaLabel: "Réserver votre première séance",
    closing: "À bientôt !\nCarray Tutoring",
  },
  de: {
    subject: "Dein Programm ist bestätigt",
    greeting: (name) => `Hallo ${name},`,
    intro: (programName, totalLessons) =>
      `Danke für deine Zahlung — dein ${programName}-Programm ist bestätigt! Du hast jetzt ${totalLessons} Unterrichtsstunden plus eine kostenlose 30-minütige Einstufungsberatung zum Buchen.`,
    languageLabel: "Unterrichtssprache",
    whatNextTitle: "Nächste Schritte",
    whatNextBody:
      'Gehe zur Buchungsseite und nutze "Guthaben nutzen" mit dieser E-Mail-Adresse, um zuerst deine kostenlose Beratung zu buchen — wir nutzen sie, um deinen persönlichen Lernweg zu planen. Danach kannst du die restlichen Stunden buchen, wann es dir passt.',
    ctaLabel: "Erste Sitzung buchen",
    closing: "Bis bald!\nCarray Tutoring",
  },
};

export function buildCustomerProgramPurchaseEmail(
  locale: string,
  details: ProgramPurchaseEmailDetails,
): { subject: string; html: string; text: string } {
  const copy = PROGRAM_PURCHASE_COPY[locale] ?? PROGRAM_PURCHASE_COPY.en;
  const programName = PROGRAM_DISPLAY_NAMES[details.programId] ?? details.programId;
  const languageName =
    (PROGRAM_LANGUAGE_NAMES[locale] ?? PROGRAM_LANGUAGE_NAMES.en)[details.programLanguage] ??
    details.programLanguage;
  const bookingUrl = `${SITE_URL}/${locale}/booking`;
  const intro = copy.intro(programName, details.totalLessons);

  const text = [
    copy.greeting(details.customerName ?? ""),
    "",
    intro,
    "",
    `${copy.languageLabel}: ${languageName}`,
    "",
    `${copy.whatNextTitle}: ${copy.whatNextBody}`,
    bookingUrl,
    "",
    copy.closing,
  ].join("\n") + emailFooterText();

  const html = `
    <div style="font-family:sans-serif;font-size:15px;color:#1a1a1a;line-height:1.5;">
      <p>${escapeHtml(copy.greeting(details.customerName ?? ""))}</p>
      <p>${escapeHtml(intro)}</p>
      <table style="border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:4px 12px 4px 0;color:#666;">${escapeHtml(copy.languageLabel)}</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(languageName)}</td></tr>
      </table>
      <p style="font-weight:600;margin:0 0 4px;">${escapeHtml(copy.whatNextTitle)}</p>
      <p style="margin:0 0 16px;">${escapeHtml(copy.whatNextBody)}</p>
      <p style="margin:0 0 16px;"><a href="${bookingUrl}" style="color:#e1261c;">${escapeHtml(copy.ctaLabel)}</a></p>
      <p style="white-space:pre-line;">${escapeHtml(copy.closing)}</p>
      ${emailFooterHtml()}
    </div>
  `;

  return { subject: copy.subject, html, text };
}
