import { useTranslations } from "next-intl";

export function SiteFooter() {
  const t = useTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {year} Carray Tutoring. {t("rights")}
        </p>
        <a href="mailto:info@carraytutoring.com" className="hover:text-foreground">
          {t("contact")}
        </a>
      </div>
    </footer>
  );
}
