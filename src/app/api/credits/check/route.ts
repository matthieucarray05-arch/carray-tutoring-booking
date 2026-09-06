import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { lessonCredits } from "@/lib/db/schema";
import { PROGRAM_ASSESSMENT_DURATION_MINUTES } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!email || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  // Ordered oldest-first (id as a tiebreaker on top of createdAt, since a
  // program purchase inserts several credits in the same transaction/
  // timestamp) — this is the same order /api/credits/book redeems in, so
  // "next" here always matches what actually gets booked next.
  const available = await db
    .select({
      id: lessonCredits.id,
      durationMinutes: lessonCredits.durationMinutes,
      programId: lessonCredits.programId,
    })
    .from(lessonCredits)
    .where(
      and(
        eq(lessonCredits.status, "available"),
        sql`lower(${lessonCredits.customerEmail}) = lower(${email})`,
      ),
    )
    .orderBy(asc(lessonCredits.createdAt), asc(lessonCredits.id));

  const next = available[0];

  return NextResponse.json({
    available: available.length,
    nextDurationMinutes: next?.durationMinutes ?? null,
    nextIsAssessment: Boolean(next?.programId) && next?.durationMinutes === PROGRAM_ASSESSMENT_DURATION_MINUTES,
  });
}
