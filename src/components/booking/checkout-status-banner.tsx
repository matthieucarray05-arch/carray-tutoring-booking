"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

/** Reads ?checkout=success|canceled — isolated in its own component so the
 * useSearchParams() call (which opts the tree into client-side rendering)
 * doesn't force that on the whole booking page during static prerendering. */
export function CheckoutStatusBanner() {
  const t = useTranslations("Booking");
  const checkoutStatus = useSearchParams().get("checkout");

  if (checkoutStatus === "success") {
    return (
      <div className="mt-4 rounded-lg border border-accent bg-accent-soft px-4 py-3 text-sm text-foreground">
        <p className="font-medium">{t("checkoutSuccessTitle")}</p>
        <p className="mt-0.5">{t("checkoutSuccessBody")}</p>
      </div>
    );
  }

  if (checkoutStatus === "canceled") {
    return (
      <p className="mt-4 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
        {t("checkoutCanceled")}
      </p>
    );
  }

  return null;
}
