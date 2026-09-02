import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { ReviewsSection } from "@/components/reviews/reviews-section";
import { Reveal } from "@/components/motion/reveal";
import { HoverLift, HoverScale } from "@/components/motion/hover-lift";
import { IconBook, IconCalendar, IconCard } from "@/components/icons";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Home");

  const steps = [
    { title: t("step1Title"), body: t("step1Body"), Icon: IconBook },
    { title: t("step2Title"), body: t("step2Body"), Icon: IconCalendar },
    { title: t("step3Title"), body: t("step3Body"), Icon: IconCard },
  ];

  return (
    <div>
      <section className="mx-auto max-w-4xl px-6 pb-20 pt-24 text-center sm:pb-28 sm:pt-32">
        <Reveal trigger="mount">
          <p className="kicker justify-center">Carray Tutoring</p>
        </Reveal>
        <Reveal trigger="mount" delay={0.08}>
          <h1 className="font-display mt-5 text-4xl font-medium leading-[1.08] tracking-tight sm:text-6xl">
            {t("heroTitle")}
          </h1>
        </Reveal>
        <Reveal trigger="mount" delay={0.16}>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {t("heroSubtitle")}
          </p>
        </Reveal>
        <Reveal trigger="mount" delay={0.24}>
          <HoverScale className="inline-block">
            <Link
              href="/booking"
              className="mt-9 inline-block rounded-full bg-accent px-9 py-3.5 text-sm font-medium tracking-wide text-accent-foreground transition-colors hover:bg-accent-hover"
            >
              {t("heroCta")}
            </Link>
          </HoverScale>
          <p className="mt-4 text-sm font-light italic text-muted-foreground">
            {t("heroTagline")}
          </p>
        </Reveal>
      </section>

      <section className="bg-muted">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <Reveal>
            <p className="kicker">{t("howItWorksTitle")}</p>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {steps.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.1}>
                <HoverLift className="rounded-2xl border border-border bg-background p-7 shadow-[0_1px_2px_rgba(21,17,15,0.03),0_16px_32px_-24px_rgba(21,17,15,0.18)]">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <step.Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display mt-4 text-lg font-medium tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </HoverLift>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-2xl px-6 py-16 text-center sm:py-20">
          <Reveal>
            <p className="kicker justify-center">{t("languagesTitle")}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mx-auto mt-6 max-w-xl space-y-4 text-justify text-[15px] leading-relaxed text-foreground">
              {t("languagesBody")
                .split("\n\n")
                .map((paragraph) => (
                  <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-muted">
        <div className="mx-auto max-w-2xl px-6 py-16 text-center sm:py-20">
          <Reveal>
            <p className="kicker justify-center">{t("aboutTitle")}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative mx-auto mt-6 aspect-square w-36 overflow-hidden rounded-full shadow-[0_16px_36px_-18px_rgba(21,17,15,0.35)] sm:w-40">
              <Image
                src="/tutor-photo.jpg"
                alt="Matthieu Carray"
                fill
                sizes="160px"
                className="object-cover"
                style={{ objectPosition: "center 12%" }}
              />
            </div>
          </Reveal>
          <Reveal delay={0.18}>
            <h3 className="font-display mt-6 text-2xl font-medium tracking-tight">
              {t("aboutName")}
            </h3>
            <p className="mt-1 text-sm font-medium uppercase tracking-wide text-accent">
              {t("aboutRole")}
            </p>
            <p className="mx-auto mt-5 max-w-xl text-justify text-[15px] leading-relaxed text-foreground">
              {t("aboutBody")}
            </p>
          </Reveal>
        </div>
      </section>

      <ReviewsSection />
    </div>
  );
}
