import Link from "next/link";

/** Root-level fallback — only reached for a path that doesn't even match
 * the [locale] segment (e.g. an unknown multi-segment path). The far more
 * common case (a missing page under a valid locale) is handled by
 * src/app/[locale]/not-found.tsx instead, which is fully translated. Uses
 * plain next/link (not next-intl's) since this renders outside any
 * NextIntlClientProvider. */
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <p className="font-display text-3xl font-medium tracking-tight">404</p>
      <p className="mt-3 text-muted-foreground">Page not found.</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
      >
        Back to homepage
      </Link>
    </div>
  );
}
