import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { lessonCredits } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!email || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const available = await db
    .select({ id: lessonCredits.id })
    .from(lessonCredits)
    .where(
      and(
        eq(lessonCredits.status, "available"),
        sql`lower(${lessonCredits.customerEmail}) = lower(${email})`,
      ),
    );

  return NextResponse.json({ available: available.length });
}
