import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

/** Catches any path that doesn't match a real page under a valid locale
 * (e.g. /it/some-typo). Renders the translated 404 UI directly (params
 * are always reliable in a normal page.tsx, unlike in not-found.tsx —
 * see the comment on that file) rather than calling notFound(), since
 * Next.js's not-found.tsx boundary does not receive route params at all
 * in this version and would crash trying to read the locale. Trade-off:
 * this returns HTTP 200, not a true 404 status. Deliberately no
 * generateStaticParams — arbitrary unmatched paths render on demand. */
export default async function CatchAll({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("NotFound");

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <p className="font-display text-3xl font-medium tracking-tight">{t("code")}</p>
      <h1 className="mt-2 text-xl font-medium">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("body")}</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
      >
        {t("cta")}
      </Link>
    </div>
  );
}
