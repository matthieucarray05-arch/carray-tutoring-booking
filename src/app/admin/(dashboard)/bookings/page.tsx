import { desc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { orders, lessonCredits } from "@/lib/db/schema";
import { formatBookingNumber, formatProgramReference } from "@/lib/booking-number";
import { formatInTz } from "@/lib/timezone";
import { TUTOR_TIMEZONE } from "@/lib/config";
import { PROGRAMS, PROGRAM_ASSESSMENT_DURATION_MINUTES } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

const PRODUCT_NAMES: Record<string, string> = {
  "single-60": "Single 60-minute lesson",
  "package-60-4": "4-lesson package",
  "package-60-8": "8-lesson package",
};

const PROGRAM_NAMES: Record<string, string> = {
  starter: "Carray Starter",
  progress: "Carray Progress",
  fluency: "Carray Fluency",
};

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(cents / 100);
}

export default async function AdminBookingsPage() {
  const [flexibleOrders, programOrders] = await Promise.all([
    db.select().from(orders).where(ne(orders.productType, "program")).orderBy(desc(orders.createdAt)),
    db.select().from(orders).where(eq(orders.productType, "program")).orderBy(desc(orders.createdAt)),
  ]);

  const allOrderIds = [...flexibleOrders, ...programOrders].map((o) => o.id);
  const credits = allOrderIds.length
    ? await db.select().from(lessonCredits).where(inArray(lessonCredits.orderId, allOrderIds))
    : [];

  const availableCountByOrder = new Map<number, number>();
  // Programs only: available lesson credits, excluding the free assessment —
  // shown against the program's total lesson count (8/16/24), not
  // creditsCount (which also includes that +1 assessment credit).
  const availableLessonsByProgramOrder = new Map<number, number>();
  for (const credit of credits) {
    if (credit.status !== "available") continue;
    availableCountByOrder.set(credit.orderId, (availableCountByOrder.get(credit.orderId) ?? 0) + 1);
    if (credit.programId && credit.durationMinutes !== PROGRAM_ASSESSMENT_DURATION_MINUTES) {
      availableLessonsByProgramOrder.set(
        credit.orderId,
        (availableLessonsByProgramOrder.get(credit.orderId) ?? 0) + 1,
      );
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="kicker">Admin</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Bookings &amp; Customers</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Snapshot as of this page load — refresh for the latest data.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Flexible bookings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Single sessions, 4-packs and 8-packs — one row per purchase.
        </p>
        {flexibleOrders.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No flexible orders yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {flexibleOrders.map((order) => {
              const remaining = availableCountByOrder.get(order.id) ?? 0;
              return (
                <li key={order.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">
                      <span className="text-muted-foreground">{formatBookingNumber(order.id)} ·</span>{" "}
                      {PRODUCT_NAMES[order.productId] ?? order.productId}
                    </p>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {remaining} / {order.creditsCount} credits remaining
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.customerName ?? "Unnamed customer"}
                    {order.customerEmail ? ` · ${order.customerEmail}` : ""}
                    {order.customerPhone ? ` · ${order.customerPhone}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Purchased {formatInTz(order.createdAt, TUTOR_TIMEZONE, "d MMMM yyyy, HH:mm")} ·{" "}
                    {formatAmount(order.amountTotalCents, order.currency)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-12 pb-16">
        <h2 className="text-lg font-medium">Programs</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Carray Starter / Progress / Fluency — one row per purchase.
        </p>
        {programOrders.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No program orders yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {programOrders.map((order) => {
              const remaining = availableLessonsByProgramOrder.get(order.id) ?? 0;
              const totalLessons =
                PROGRAMS.find((p) => p.id === order.productId)?.totalLessons ?? order.creditsCount - 1;
              return (
                <li key={order.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">
                      <span className="text-muted-foreground">{formatProgramReference(order)} ·</span>{" "}
                      {PROGRAM_NAMES[order.productId] ?? order.productId}
                    </p>
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
                      {remaining} / {totalLessons} lessons remaining
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.customerName ?? "Unnamed customer"}
                    {order.customerEmail ? ` · ${order.customerEmail}` : ""}
                    {order.customerPhone ? ` · ${order.customerPhone}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Purchased {formatInTz(order.createdAt, TUTOR_TIMEZONE, "d MMMM yyyy, HH:mm")} ·{" "}
                    {formatAmount(order.amountTotalCents, order.currency)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
