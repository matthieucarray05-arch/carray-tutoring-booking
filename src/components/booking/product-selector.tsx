"use client";

import { useLocale, useTranslations } from "next-intl";
import { MOCK_PRODUCTS, type Product } from "@/lib/mock-data";
import { formatPrice } from "@/lib/format";

const DURATIONS = [45, 60] as const;
const CREDIT_COUNTS = [5, 10] as const;

export function ProductSelector({
  value,
  onChange,
}: {
  value: Product | null;
  onChange: (product: Product) => void;
}) {
  const t = useTranslations("Booking");
  const locale = useLocale();

  const type = value?.type ?? "single_lesson";
  const duration = value?.durationMinutes ?? 45;
  const creditsCount = value?.type === "lesson_package" ? value.creditsCount : 5;

  function select(
    nextType: Product["type"],
    nextDuration: 45 | 60,
    nextCredits: number,
  ) {
    const product = MOCK_PRODUCTS.find(
      (p) =>
        p.type === nextType &&
        p.durationMinutes === nextDuration &&
        (nextType === "single_lesson" || p.creditsCount === nextCredits),
    );
    if (product) onChange(product);
  }

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-full border border-border p-1 text-sm">
        {(["single_lesson", "lesson_package"] as const).map((t2) => (
          <button
            key={t2}
            type="button"
            onClick={() => select(t2, duration, creditsCount)}
            className={`rounded-full px-4 py-1.5 font-medium transition-colors ${
              type === t2
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t2 === "single_lesson" ? t("singleLesson") : t("package")}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {DURATIONS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => select(type, d, creditsCount)}
            className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors ${
              duration === d
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {d === 45 ? t("duration45") : t("duration60")}
          </button>
        ))}
      </div>

      {type === "lesson_package" && (
        <div className="flex flex-wrap gap-3">
          {CREDIT_COUNTS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => select(type, duration, c)}
              className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors ${
                creditsCount === c
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("creditsLabel", { count: c })}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-3">
        {MOCK_PRODUCTS.filter((p) => p.type === type).map((product) => {
          const isSelected = value?.id === product.id;
          const perLesson = product.priceCents / product.creditsCount;
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => onChange(product)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                isSelected
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/50"
              }`}
            >
              <p className="text-sm text-muted-foreground">
                {product.durationMinutes === 45
                  ? t("duration45")
                  : t("duration60")}
                {product.type === "lesson_package" &&
                  ` · ${t("creditsLabel", { count: product.creditsCount })}`}
              </p>
              <p className="mt-1 text-lg font-semibold">
                {formatPrice(product.priceCents, product.currency, locale)}
              </p>
              {product.type === "lesson_package" && (
                <p className="text-xs text-muted-foreground">
                  {formatPrice(perLesson, product.currency, locale)}{" "}
                  {t("perLesson")}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
