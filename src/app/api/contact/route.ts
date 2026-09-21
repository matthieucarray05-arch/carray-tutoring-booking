import { NextRequest, NextResponse } from "next/server";
import { notifyContactMessage } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 5000;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const consent = body?.consent === true;
  const honeypot = typeof body?.honeypot === "string" ? body.honeypot.trim() : "";

  if (!name || !email || !EMAIL_PATTERN.test(email) || !message || !consent) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  // Honeypot tripped — pretend success so bots don't learn to avoid it,
  // but skip actually sending the email.
  if (honeypot) {
    return NextResponse.json({ ok: true });
  }

  await notifyContactMessage({
    name,
    email,
    message: message.slice(0, MAX_MESSAGE_LENGTH),
  });

  return NextResponse.json({ ok: true });
}
