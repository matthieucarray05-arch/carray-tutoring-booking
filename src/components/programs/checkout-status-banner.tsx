"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

/** Same isolation trick as Booking's CheckoutStatusBanner — keeps the
 * useSearchParams() call from opting the whole /programs page out of
 * static prerendering. */
export function ProgramsCheckoutStatusBanner() {
  const t = useTranslations("Programs");
  const checkoutStatus = useSearchParams().get("checkout");

  if (checkoutStatus === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-auto mt-6 max-w-2xl rounded-lg border border-accent bg-accent-soft px-4 py-3 text-sm text-foreground"
      >
        <p className="font-medium">{t("checkoutSuccessTitle")}</p>
        <p className="mt-0.5">{t("checkoutSuccessBody")}</p>
      </motion.div>
    );
  }

  if (checkoutStatus === "canceled") {
    return (
      <motion.p
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-auto mt-6 max-w-2xl rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground"
      >
        {t("checkoutCanceled")}
      </motion.p>
    );
  }

  return null;
}
