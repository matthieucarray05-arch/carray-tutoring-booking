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

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Privacy");

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl font-medium tracking-tight">{t("title")}</h1>
      <p className={`mt-2 ${BODY_TEXT} text-muted-foreground`}>{t("subtitle")}</p>

      <section className="mt-10">
        <h2 className="text-lg font-medium">{t("controllerHeading")}</h2>
        <Paragraphs text={t("controllerBody")} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">{t("collectionHeading")}</h2>
        <Paragraphs text={t("collectionBody")} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">{t("purposeHeading")}</h2>
        <Paragraphs text={t("purposeBody")} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">{t("thirdPartiesHeading")}</h2>
        <Paragraphs text={t("thirdPartiesBody")} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">{t("retentionHeading")}</h2>
        <Paragraphs text={t("retentionBody")} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">{t("rightsHeading")}</h2>
        <Paragraphs text={t("rightsBody")} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">{t("contactHeading")}</h2>
        <Paragraphs text={t("contactBody")} />
      </section>

      <p className={`mt-10 ${BODY_TEXT} text-muted-foreground`}>{t("footerNote")}</p>
    </div>
  );
}
