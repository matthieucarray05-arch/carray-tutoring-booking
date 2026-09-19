import Link from "next/link";

/** Reached only via LocaleLayout's own notFound() call for a genuinely
 * invalid locale segment (e.g. /xx/foo). Next.js's not-found.tsx boundary
 * does not receive route params at all (confirmed empirically — Next
 * 16.3.3), so there's no locale to translate into here even in principle;
 * hence plain English, matching the root fallback. The far more common
 * case — a missing page under a VALID locale — never reaches this file;
 * it's handled by the [locale]/[...rest] catch-all route instead, which
 * renders the fully translated 404 UI directly. */
export default function LocaleNotFound() {
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
