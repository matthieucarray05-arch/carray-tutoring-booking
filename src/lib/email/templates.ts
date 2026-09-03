import { formatInTz, resolveDateFnsLocale } from "@/lib/timezone";
import { SITE_URL, CONTACT_PHONE, MEET_LINK, CANCELLATION_WINDOW_HOURS } from "@/lib/config";

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
    joinBody: "Click the link below and turn on your mic and camera to join the lesson:",
    joinEarly: "Please join at least 15 minutes early to test your audio and video.",
    cancelTitle: "Cancellation policy",
    cancelBody: (manageUrl, phone) =>
      `You can cancel or move your lesson up to ${CANCELLATION_WINDOW_HOURS} hours before the scheduled time here: ${manageUrl}. After that, please message us on WhatsApp at ${phone} to let us know you won't be attending.`,
    cancelLinkLabel: "Cancel or reschedule your lesson",
    lateTitle: "Running late",
    lateBody: "If you arrive late, the lesson will not be extended beyond its originally scheduled end time.",
    staffNote:
      "Carray Tutoring reserves the right to modify or cancel this appointment at any time for scheduling reasons, with advance notice.",
  },
  it: {
    joinTitle: "Come collegarti",
    joinBody: "Clicca sul link qui sotto e attiva microfono e webcam per partecipare alla lezione:",
    joinEarly: "Ti consigliamo di collegarti almeno 15 minuti prima per sistemare audio e video.",
    cancelTitle: "Policy di cancellazione",
    cancelBody: (manageUrl, phone) =>
      `Puoi cancellare o spostare la tua lezione fino a ${CANCELLATION_WINDOW_HOURS} ore prima dell'orario prenotato qui: ${manageUrl}. Oltre questo limite, scrivici su WhatsApp al ${phone} per avvisarci della tua assenza.`,
    cancelLinkLabel: "Cancella o sposta la tua lezione",
    lateTitle: "Ritardo",
    lateBody: "In caso di ritardo, la lezione non verrà prolungata oltre l'orario originariamente prenotato.",
    staffNote:
      "Carray Tutoring si riserva il diritto di modificare o cancellare l'appuntamento in qualsiasi momento per esigenze di servizio, con comunicazione preventiva.",
  },
  fr: {
    joinTitle: "Comment se connecter",
    joinBody: "Cliquez sur le lien ci-dessous et activez votre micro et votre caméra pour rejoindre le cours :",
    joinEarly: "Merci de vous connecter au moins 15 minutes à l'avance pour tester l'audio et la vidéo.",
    cancelTitle: "Politique d'annulation",
    cancelBody: (manageUrl, phone) =>
      `Vous pouvez annuler ou déplacer votre cours jusqu'à ${CANCELLATION_WINDOW_HOURS} heures avant l'horaire prévu ici : ${manageUrl}. Passé ce délai, merci de nous écrire sur WhatsApp au ${phone} pour nous prévenir de votre absence.`,
    cancelLinkLabel: "Annuler ou déplacer votre cours",
    lateTitle: "Retard",
    lateBody: "En cas de retard, le cours ne sera pas prolongé au-delà de l'heure de fin initialement prévue.",
    staffNote:
      "Carray Tutoring se réserve le droit de modifier ou d'annuler ce rendez-vous à tout moment pour des raisons d'organisation, avec préavis.",
  },
  de: {
    joinTitle: "So nimmst du teil",
    joinBody: "Klicke auf den Link unten und schalte Mikrofon und Kamera ein, um an der Stunde teilzunehmen:",
    joinEarly: "Bitte melde dich mindestens 15 Minuten vorher an, um Audio und Video zu testen.",
    cancelTitle: "Stornierungsrichtlinie",
    cancelBody: (manageUrl, phone) =>
      `Du kannst deine Stunde bis ${CANCELLATION_WINDOW_HOURS} Stunden vor dem geplanten Termin hier stornieren oder verschieben: ${manageUrl}. Danach schreibe uns bitte auf WhatsApp an ${phone}, um uns über dein Fernbleiben zu informieren.`,
    cancelLinkLabel: "Stunde stornieren oder verschieben",
    lateTitle: "Verspätung",
    lateBody: "Bei Verspätung wird die Stunde nicht über die ursprünglich geplante Endzeit hinaus verlängert.",
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

  const text = [
    copy.greeting(details.customerName),
    "",
    copy.intro,
    "",
    `${copy.slotLabel}: ${slot}`,
    "",
    copy.closing,
  ].join("\n") + session.text + emailFooterText();

  const html = `
    <div style="font-family:sans-serif;font-size:15px;color:#1a1a1a;line-height:1.5;">
      <p>${escapeHtml(copy.greeting(details.customerName))}</p>
      <p>${escapeHtml(copy.intro)}</p>
      <table style="border-collapse:collapse;margin:16px 0;">
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
}

/** Admin notification for a credit redemption — always in English. */
export function buildAdminCreditBookingEmail(details: CreditBookingEmailDetails): {
  subject: string;
  html: string;
  text: string;
} {
  const slotLabel = `${formatInTz(details.bookingStartAt, details.customerTimezone, "EEEE d MMMM yyyy, HH:mm")}–${formatInTz(details.bookingEndAt, details.customerTimezone, "HH:mm")} (${details.customerTimezone})`;

  const rows: [string, string][] = [
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

  const text = [
    copy.greeting(details.customerName),
    "",
    copy.intro,
    "",
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
