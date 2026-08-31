"use client";

import { useLocale, useTranslations } from "next-intl";
import { MOCK_PRODUCTS, type Product } from "@/lib/mock-data";
import { formatPrice } from "@/lib/format";

const CREDIT_COUNTS = [4, 8] as const;

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
  const creditsCount = value?.type === "lesson_package" ? value.creditsCount : 4;

  function selectType(nextType: Product["type"]) {
    const product =
      nextType === "single_lesson"
        ? MOCK_PRODUCTS.find((p) => p.type === "single_lesson")
        : (MOCK_PRODUCTS.find(
            (p) => p.type === "lesson_package" && p.creditsCount === creditsCount,
          ) ?? MOCK_PRODUCTS.find((p) => p.type === "lesson_package"));
    if (product) onChange(product);
  }

  function selectCredits(count: number) {
    const product = MOCK_PRODUCTS.find(
      (p) => p.type === "lesson_package" && p.creditsCount === count,
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
            onClick={() => selectType(t2)}
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

      {type === "lesson_package" && (
        <div className="flex flex-wrap gap-3">
          {CREDIT_COUNTS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => selectCredits(c)}
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

      <div className="grid gap-2 sm:grid-cols-2">
        {MOCK_PRODUCTS.filter((p) => p.type === type).map((product) => {
          const isSelected = value?.id === product.id;
          const perLesson = product.priceCents / product.creditsCount;
          const savingsCents = product.compareAtPriceCents
            ? product.compareAtPriceCents - product.priceCents
            : 0;

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
                {t("duration60")}
                {product.type === "lesson_package" &&
                  ` · ${t("creditsLabel", { count: product.creditsCount })}`}
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-lg font-semibold">
                  {formatPrice(product.priceCents, product.currency, locale)}
                </p>
                {product.compareAtPriceCents && (
                  <p className="text-sm text-muted-foreground line-through">
                    {formatPrice(
                      product.compareAtPriceCents,
                      product.currency,
                      locale,
                    )}
                  </p>
                )}
              </div>
              {savingsCents > 0 && (
                <span className="mt-1.5 inline-block rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                  {t("save", {
                    amount: formatPrice(savingsCents, product.currency, locale),
                  })}
                </span>
              )}
              {product.type === "lesson_package" && (
                <p className="mt-1 text-xs text-muted-foreground">
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
