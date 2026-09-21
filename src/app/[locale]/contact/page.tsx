"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Spinner } from "@/components/ui/spinner";

export default function ContactPage() {
  const t = useTranslations("Contact");

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  // Hidden from real visitors via CSS, not display:none (some bots skip
  // display:none fields) — any value here means a bot filled it in.
  const [honeypot, setHoneypot] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit =
    form.name.trim() && form.email.trim() && form.message.trim() && consent;

  async function handleSubmit() {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(false);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
          consent,
          honeypot,
        }),
      });

      if (!res.ok) {
        setError(true);
        setIsSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError(true);
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mx-auto max-w-2xl px-6 py-20 text-center"
      >
        <h1 className="font-display text-3xl font-medium tracking-tight">
          {t("confirmTitle")}
        </h1>
        <p className="mt-4 text-muted-foreground">{t("confirmBody")}</p>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-display text-3xl font-medium tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="mt-8 space-y-4"
      >
        <input
          type="text"
          name="company"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden"
        />

        <input
          type="text"
          required
          autoComplete="name"
          placeholder={t("nameLabel")}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
        <input
          type="email"
          required
          autoComplete="email"
          placeholder={t("emailLabel")}
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
        <textarea
          required
          rows={6}
          placeholder={t("messageLabel")}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />

        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-accent focus:ring-2 focus:ring-accent/30"
          />
          <span>
            {t("consentPrefix")}{" "}
            <Link
              href="/privacy"
              className="font-medium text-foreground underline underline-offset-2 hover:text-accent"
            >
              {t("consentLinkLabel")}
            </Link>
          </span>
        </label>

        {error && <p className="text-sm text-accent">{t("formError")}</p>}

        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={!canSubmit || isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting && <Spinner className="h-4 w-4" />}
          {isSubmitting ? t("submitLoading") : t("submitLabel")}
        </motion.button>
      </form>
    </div>
  );
}
