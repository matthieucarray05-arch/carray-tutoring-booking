import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Script from "next/script";
import { routing, type Locale } from "@/i18n/routing";
import { SITE_URL } from "@/lib/config";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SetHtmlLang } from "@/components/layout/set-html-lang";
import { CookieNotice } from "@/components/layout/cookie-notice";

const PLAUSIBLE_DOMAIN = SITE_URL.replace(/^https?:\/\//, "");

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home" });

  return {
    title: `Carray Tutoring — ${t("heroTitle")}`,
    description: t("heroSubtitle"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <NextIntlClientProvider>
      {process.env.NODE_ENV === "production" && (
        <Script
          defer
          data-domain={PLAUSIBLE_DOMAIN}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      )}
      <SetHtmlLang locale={locale} />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <CookieNotice />
    </NextIntlClientProvider>
  );
}
