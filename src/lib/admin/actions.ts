"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { availabilityRules, blockedDates } from "@/lib/db/schema";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin-auth";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function assertAdmin() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  const isValid = adminPassword ? await verifySessionToken(token, adminPassword) : false;
  if (!isValid) {
    throw new Error("Unauthorized");
  }
}

export async function addAvailabilityRule(formData: FormData) {
  await assertAdmin();

  const weekday = Number(formData.get("weekday"));
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");

  if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) {
    throw new Error("Invalid weekday");
  }
  if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
    throw new Error("Invalid time");
  }
  if (startTime >= endTime) {
    throw new Error("Start time must be before end time");
  }

  await db.insert(availabilityRules).values({ weekday, startTime, endTime });
  revalidatePath("/admin/availability");
}

export async function deleteAvailabilityRule(formData: FormData) {
  await assertAdmin();
  const id = Number(formData.get("id"));
  await db.delete(availabilityRules).where(eq(availabilityRules.id, id));
  revalidatePath("/admin/availability");
}

export async function addBlockedDate(formData: FormData) {
  await assertAdmin();

  const date = String(formData.get("date") ?? "");
  const startTime = String(formData.get("startTime") ?? "") || null;
  const endTime = String(formData.get("endTime") ?? "") || null;
  const reason = String(formData.get("reason") ?? "") || null;

  if (!DATE_RE.test(date)) {
    throw new Error("Invalid date");
  }
  if ((startTime && !TIME_RE.test(startTime)) || (endTime && !TIME_RE.test(endTime))) {
    throw new Error("Invalid time");
  }
  if (startTime && endTime && startTime >= endTime) {
    throw new Error("Start time must be before end time");
  }

  await db.insert(blockedDates).values({ date, startTime, endTime, reason });
  revalidatePath("/admin/availability");
}

export async function deleteBlockedDate(formData: FormData) {
  await assertAdmin();
  const id = Number(formData.get("id"));
  await db.delete(blockedDates).where(eq(blockedDates.id, id));
  revalidatePath("/admin/availability");
}
