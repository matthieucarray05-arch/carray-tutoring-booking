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
        <div className="flex items-center gap-5">
          <Link
            href="/impressum"
            className="font-medium text-foreground transition-colors hover:text-accent"
          >
            {t("impressum")}
          </Link>
          <a
            href="mailto:info@carraytutoring.com"
            className="font-medium text-foreground transition-colors hover:text-accent"
          >
            {t("contact")}
          </a>
        </div>
      </div>
    </footer>
  );
}
