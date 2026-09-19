"use client";

import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import {
  PROGRAMS,
  PROGRAM_ASSESSMENT_DURATION_MINUTES,
  type ProgramId,
  type ProgramLanguage,
} from "@/lib/mock-data";
import { formatPrice } from "@/lib/format";
import { ProgramsCheckoutStatusBanner } from "@/components/programs/checkout-status-banner";
import { IconStar } from "@/components/icons";
import { Spinner } from "@/components/ui/spinner";

interface ProgramCopy {
  name: string;
  what: string;
  duration: string;
  how: string;
  withWhom: string;
  condition?: string;
  whyLevel: string;
  extra?: string;
  extraNote?: string;
}

export default function ProgramsPage() {
  const t = useTranslations("Programs");
  const locale = useLocale();

  const defaultLanguage: ProgramLanguage = locale === "it" ? "it" : "en";

  const [languages, setLanguages] = useState<Record<ProgramId, ProgramLanguage>>({
    starter: defaultLanguage,
    progress: defaultLanguage,
    fluency: defaultLanguage,
  });
  const [checkingOutId, setCheckingOutId] = useState<ProgramId | null>(null);
  const [errorId, setErrorId] = useState<ProgramId | null>(null);

  async function handleBuy(programId: ProgramId) {
    setCheckingOutId(programId);
    setErrorId(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId,
          programLanguage: languages[programId],
          locale,
        }),
      });

      if (!res.ok) {
        setErrorId(programId);
        setCheckingOutId(null);
        return;
      }

      const data = (await res.json()) as { url: string };
      window.location.assign(data.url);
    } catch {
      setErrorId(programId);
      setCheckingOutId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-center">
        <p className="kicker justify-center">{t("title")}</p>
        <h1 className="font-display mt-5 text-4xl font-medium leading-[1.08] tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
          {t("subtitle")}
        </p>
        <span className="mt-5 inline-block rounded-full bg-accent-soft px-4 py-2 text-sm font-medium text-accent">
          {t("languageNotice")}
        </span>
      </div>

      <Suspense fallback={null}>
        <ProgramsCheckoutStatusBanner />
      </Suspense>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {PROGRAMS.map((program) => {
          const copy = t.raw(`programs.${program.id}`) as ProgramCopy;
          const fieldLabels = t.raw("fieldLabels") as Record<string, string>;
          const selectedLanguage = languages[program.id];

          const fields: { label: string; value: string; emphasize?: boolean }[] = [
            { label: fieldLabels.what, value: copy.what },
            { label: fieldLabels.duration, value: copy.duration },
            { label: fieldLabels.how, value: copy.how },
            { label: fieldLabels.withWhom, value: copy.withWhom },
            {
              label: fieldLabels.price,
              value: formatPrice(program.priceCents, program.currency, locale),
              emphasize: true,
            },
            ...(copy.condition ? [{ label: fieldLabels.condition, value: copy.condition }] : []),
          ];

          return (
            <div
              key={program.id}
              className={`flex flex-col items-center rounded-2xl border p-6 text-center shadow-[0_1px_2px_rgba(21,17,15,0.03),0_16px_32px_-24px_rgba(21,17,15,0.18)] ${
                program.isBestSeller ? "border-accent" : "border-border"
              }`}
            >
              <div className="mb-3 flex h-6 items-center justify-center">
                {program.isBestSeller && (
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                    <IconStar className="h-3 w-3" />
                    {t("bestSellerBadge")}
                  </span>
                )}
              </div>

              <h2 className="font-display text-xl font-medium uppercase tracking-tight">
                {copy.name}
              </h2>

              <span className="mt-3 inline-block rounded-full bg-info-soft px-3 py-1.5 text-xs font-semibold text-info">
                {t("assessmentIncluded", { minutes: PROGRAM_ASSESSMENT_DURATION_MINUTES })}
              </span>

              <dl className="mt-5 w-full space-y-3 text-left">
                {fields.map((field) => (
                  <div key={field.label}>
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      {field.label}
                    </dt>
                    <dd
                      className={
                        field.emphasize
                          ? "mt-0.5 text-base font-semibold text-accent"
                          : "mt-0.5 text-sm leading-snug text-foreground"
                      }
                    >
                      {field.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 w-full border-t border-border pt-5 text-left">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  {fieldLabels.whyLevel}
                </p>
                <p className="mt-1.5 text-justify text-sm leading-relaxed text-muted-foreground">
                  {copy.whyLevel}
                </p>
              </div>

              {copy.extra && (
                <div className="mt-5 w-full border-t border-border pt-5 text-left">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    {fieldLabels.extra}
                  </p>
                  <p className="mt-1.5 text-sm leading-snug text-foreground">{copy.extra}</p>
                  {copy.extraNote && (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {copy.extraNote}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-6">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("languageSelectLabel")}
                </p>
                <div className="mt-1.5 inline-flex rounded-full border border-border p-1 text-sm">
                  {(["it", "en"] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() =>
                        setLanguages((current) => ({ ...current, [program.id]: lang }))
                      }
                      className={`rounded-full px-3 py-1 font-medium transition-colors ${
                        selectedLanguage === lang
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {lang === "it" ? t("languageOptionIt") : t("languageOptionEn")}
                    </button>
                  ))}
                </div>
              </div>

              {errorId === program.id && (
                <p className="mt-3 text-sm text-accent">{t("checkoutError")}</p>
              )}

              <motion.button
                type="button"
                onClick={() => handleBuy(program.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={checkingOutId === program.id}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                {checkingOutId === program.id && <Spinner className="h-4 w-4" />}
                {checkingOutId === program.id ? t("ctaLoading") : t("ctaLabel")}
              </motion.button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
