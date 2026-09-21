import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function SiteFooter() {
  const t = useTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {year} Carray Tutoring. {t("rights")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link
            href="/impressum"
            className="font-medium text-foreground transition-colors hover:text-accent"
          >
            {t("impressum")}
          </Link>
          <Link
            href="/refund-policy"
            className="font-medium text-foreground transition-colors hover:text-accent"
          >
            {t("refundPolicy")}
          </Link>
          <Link
            href="/cookie-policy"
            className="font-medium text-foreground transition-colors hover:text-accent"
          >
            {t("cookiePolicy")}
          </Link>
          <Link
            href="/contact"
            className="font-medium text-foreground transition-colors hover:text-accent"
          >
            {t("contact")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
