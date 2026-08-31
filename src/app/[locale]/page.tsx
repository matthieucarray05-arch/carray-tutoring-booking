import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

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
      <section className="mx-auto max-w-5xl px-6 py-20 text-center sm:py-28">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {t("heroTitle")}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          {t("heroSubtitle")}
        </p>
        <Link
          href="/booking"
          className="mt-8 inline-block rounded-full bg-accent px-8 py-3 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          {t("heroCta")}
        </Link>
      </section>

      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("howItWorksTitle")}
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.title}>
                <h3 className="font-medium">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("languagesTitle")}
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {t("languagesBody")}
          </p>
        </div>
      </section>
    </div>
  );
}
