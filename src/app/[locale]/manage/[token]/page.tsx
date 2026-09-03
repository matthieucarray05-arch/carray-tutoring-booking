import { getTranslations, setRequestLocale } from "next-intl/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { bookings } from "@/lib/db/schema";
import type { Locale } from "@/i18n/routing";
import { CANCELLATION_WINDOW_HOURS, CONTACT_PHONE, TUTOR_TIMEZONE } from "@/lib/config";
import { formatInTz, resolveDateFnsLocale } from "@/lib/timezone";
import { formatBookingNumber } from "@/lib/booking-number";
import { CancelBookingButton } from "@/components/manage/cancel-booking-button";

export default async function ManageBookingPage({
  params,
}: {
  params: Promise<{ locale: Locale; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Manage");

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.manageToken, token));

  if (!booking) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-medium tracking-tight">
          {t("notFoundTitle")}
        </h1>
        <p className="mt-3 text-muted-foreground">{t("notFoundBody")}</p>
      </div>
    );
  }

  const timezone = booking.customerTimezone || TUTOR_TIMEZONE;
  const slotLabel = `${formatInTz(booking.startAt, timezone, "EEEE d MMMM yyyy, HH:mm", resolveDateFnsLocale(locale))} (${timezone})`;
  const bookingNumber = formatBookingNumber(booking.id);

  if (booking.status !== "confirmed") {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-medium tracking-tight">
          {t("alreadyCancelledTitle")}
        </h1>
        <p className="mt-3 text-muted-foreground">{t("alreadyCancelledBody")}</p>
      </div>
    );
  }

  const hoursUntilStart = (booking.startAt.getTime() - new Date().getTime()) / (1000 * 60 * 60);
  const canCancel = hoursUntilStart >= CANCELLATION_WINDOW_HOURS;

  return (
    <div className="mx-auto max-w-lg px-6 py-20 text-center">
      <h1 className="font-display text-2xl font-medium tracking-tight">
        {t("pageTitle")}
      </h1>

      <dl className="mt-8 space-y-3 text-left">
        <div className="rounded-2xl border border-border p-5">
          <dt className="text-sm text-muted-foreground">{t("whatLabel")}</dt>
          <dd className="mt-0.5 font-medium">{bookingNumber}</dd>
        </div>
        <div className="rounded-2xl border border-border p-5">
          <dt className="text-sm text-muted-foreground">{t("whenLabel")}</dt>
          <dd className="mt-0.5 font-medium">{slotLabel}</dd>
        </div>
      </dl>

      {canCancel ? (
        <CancelBookingButton token={token} canCancel={canCancel} />
      ) : (
        <div className="mt-6 rounded-2xl bg-muted p-5 text-left text-sm">
          <p className="font-medium">{t("tooLateTitle")}</p>
          <p className="mt-1 text-muted-foreground">
            {t("tooLateBody", { hours: CANCELLATION_WINDOW_HOURS, phone: CONTACT_PHONE })}
          </p>
        </div>
      )}
    </div>
  );
}
