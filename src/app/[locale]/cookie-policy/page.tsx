import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

const BODY_TEXT = "text-[15px] leading-relaxed text-justify";

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split("\n\n").map((paragraph) => (
        <p key={paragraph.slice(0, 24)} className={`mt-3 ${BODY_TEXT} text-foreground whitespace-pre-line`}>
          {paragraph}
        </p>
      ))}
    </>
  );
}

export default async function CookiePolicyPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("CookiePolicy");

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl font-medium tracking-tight">{t("title")}</h1>
      <p className={`mt-2 ${BODY_TEXT} text-muted-foreground`}>{t("subtitle")}</p>

      <section className="mt-10">
        <h2 className="text-lg font-medium">{t("whatAreCookiesHeading")}</h2>
        <Paragraphs text={t("whatAreCookiesBody")} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">{t("analyticsHeading")}</h2>
        <Paragraphs text={t("analyticsBody")} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">{t("functionalHeading")}</h2>
        <Paragraphs text={t("functionalBody")} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">{t("paymentHeading")}</h2>
        <Paragraphs text={t("paymentBody")} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">{t("questionsHeading")}</h2>
        <Paragraphs text={t("questionsBody")} />
      </section>

      <p className={`mt-10 ${BODY_TEXT} text-muted-foreground`}>{t("footerNote")}</p>
    </div>
  );
}
