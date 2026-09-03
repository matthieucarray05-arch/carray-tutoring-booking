import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { CONTACT_PHONE, SITE_URL } from "@/lib/config";

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split("\n\n").map((paragraph) => (
        <p key={paragraph.slice(0, 24)} className="mt-3 leading-relaxed text-foreground">
          {paragraph}
        </p>
      ))}
    </>
  );
}

export default async function ImpressumPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Impressum");

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl font-medium tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>

      <section className="mt-10">
        <h2 className="text-lg font-medium">{t("providerHeading")}</h2>
        <p className="mt-3">{t("providerName")}</p>
        <p>{t("providerAddress")}</p>
        <Paragraphs text={t("soleProprietorBody")} />
        <p className="mt-3">
          <span className="text-muted-foreground">{t("taxNumberLabel")}:</span>{" "}
          {t("taxNumberValue")}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">{t("contactHeading")}</h2>
        <p className="mt-3">
          <span className="text-muted-foreground">{t("phoneLabel")}:</span> {CONTACT_PHONE}
        </p>
        {/* TODO: swap in info@carraytutoring.de once that mailbox is active — update
            emailValue in messages/{en,it,fr,de}.json (Impressum namespace) at the same time. */}
        <p>
          <span className="text-muted-foreground">{t("emailLabel")}:</span> {t("emailValue")}
        </p>
        <p>
          <span className="text-muted-foreground">{t("websiteLabel")}:</span>{" "}
          <a
            href={SITE_URL}
            className="text-accent underline underline-offset-2"
          >
            {SITE_URL.replace("https://", "")}
          </a>
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">{t("editorialHeading")}</h2>
        <p className="mt-3">{t("providerName")}</p>
        <p>{t("providerAddress")}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">{t("liabilityContentHeading")}</h2>
        <Paragraphs text={t("liabilityContentBody")} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">{t("liabilityLinksHeading")}</h2>
        <Paragraphs text={t("liabilityLinksBody")} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">{t("copyrightHeading")}</h2>
        <Paragraphs text={t("copyrightBody")} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">{t("disputeHeading")}</h2>
        <Paragraphs text={t("disputeBody")} />
      </section>

      <p className="mt-10 text-sm text-muted-foreground">{t("footerNote")}</p>
    </div>
  );
}
