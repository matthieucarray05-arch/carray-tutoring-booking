/**
 * The tutor's own fixed timezone. Availability rules and blocked dates are
 * entered and displayed in this zone in the admin panel — it's a one-time
 * setup value, not something that changes day to day, so it lives here as a
 * constant rather than an admin-editable setting.
 */
export const TUTOR_TIMEZONE = "Europe/Berlin";

/** Public base URL — used for absolute asset links in emails (e.g. the
 * logo), which can't reference a relative/local path since email clients
 * load images externally. */
export const SITE_URL = "https://carraytutoring.de";

/** Shown in the footer of outgoing emails. */
export const CONTACT_PHONE = "+39 351 7173870";

/** Fixed Google Meet room, reused for every lesson — see lib/notifications.ts. */
export const MEET_LINK = "https://meet.google.com/fzc-aewd-kyj";

/** A booking can be self-service cancelled up to this many hours before its start time. */
export const CANCELLATION_WINDOW_HOURS = 12;
