import { Resend } from "resend";

let instance: Resend | undefined;

/** Lazy init, same pattern as db/client.ts and stripe/client.ts — only
 * throws at send time, never during Next.js's build-time page-data
 * collection (which would otherwise fail the whole Vercel build). */
export function getResend(): Resend {
  if (!instance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not set");
    instance = new Resend(apiKey);
  }
  return instance;
}
