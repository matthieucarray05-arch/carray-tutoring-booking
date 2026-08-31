import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { ReviewsSection } from "@/components/reviews/reviews-section";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Home");

  const steps = [
    { title: t("step1Title"), body: t("step1Body") },
    { title: t("step2Title"), body: t("step2Body") },
    { title: t("step3Title"), body: t("step3Body") },
  ];

  return (
    <div>
      <section className="mx-auto max-w-4xl px-6 pb-20 pt-24 text-center sm:pb-28 sm:pt-32">
        <p className="kicker justify-center">Carray Tutoring</p>
        <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
          {t("heroTitle")}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          {t("heroSubtitle")}
        </p>
        <Link
          href="/booking"
          className="mt-9 inline-block rounded-full bg-accent px-9 py-3.5 text-sm font-medium tracking-wide text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          {t("heroCta")}
        </Link>
      </section>

      <section className="bg-muted">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <p className="kicker">{t("howItWorksTitle")}</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border border-border bg-background p-7 shadow-[0_1px_2px_rgba(21,17,15,0.03),0_16px_32px_-24px_rgba(21,17,15,0.18)]"
              >
                <h3 className="font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-24">
          <p className="kicker justify-center">{t("languagesTitle")}</p>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {t("languagesBody")}
          </p>
        </div>
      </section>

      <ReviewsSection />
    </div>
  );
}
