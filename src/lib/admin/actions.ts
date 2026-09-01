"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { availabilityDates } from "@/lib/db/schema";
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

export async function addAvailabilityDate(formData: FormData) {
  await assertAdmin();

  const date = String(formData.get("date") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");

  if (!DATE_RE.test(date)) {
    throw new Error("Invalid date");
  }
  if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
    throw new Error("Invalid time");
  }
  if (startTime >= endTime) {
    throw new Error("Start time must be before end time");
  }

  await db.insert(availabilityDates).values({ date, startTime, endTime });
  revalidatePath("/admin/availability");
}

export async function deleteAvailabilityDate(formData: FormData) {
  await assertAdmin();
  const id = Number(formData.get("id"));
  await db.delete(availabilityDates).where(eq(availabilityDates.id, id));
  revalidatePath("/admin/availability");
}
