"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function CancelBookingButton({
  token,
  canCancel,
}: {
  token: string;
  canCancel: boolean;
}) {
  const t = useTranslations("Manage");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleCancel() {
    setStatus("loading");
    try {
      const res = await fetch(`/api/bookings/${token}/cancel`, { method: "POST" });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-6 rounded-2xl border border-border bg-muted p-6 text-center"
      >
        <h2 className="font-display text-xl font-medium tracking-tight">
          {t("cancelSuccessTitle")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("cancelSuccessBody")}</p>
        <Link
          href="/booking"
          className="mt-5 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          {t("rebookCta")}
        </Link>
      </motion.div>
    );
  }

  if (!canCancel) {
    return null;
  }

  return (
    <div className="mt-6">
      {status === "error" && (
        <p className="mb-3 text-sm text-accent">{t("cancelError")}</p>
      )}
      <motion.button
        type="button"
        onClick={handleCancel}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={status === "loading"}
        className="rounded-full border border-accent px-6 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-40"
      >
        {status === "loading" ? t("cancelling") : t("cancelButton")}
      </motion.button>
    </div>
  );
}
