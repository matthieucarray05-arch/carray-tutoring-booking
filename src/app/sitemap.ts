import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";
import { routing } from "@/i18n/routing";

/** Every public, indexable path — extend this list as new public pages are
 * added. Deliberately excludes /admin (disallowed in robots.ts) and
 * /manage/[token] (private per-booking links, never meant to be indexed). */
const PUBLIC_PATHS = [
  "",
  "/booking",
  "/programs",
  "/impressum",
  "/refund-policy",
  "/cookie-policy",
  "/privacy",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return routing.locales.flatMap((locale) =>
    PUBLIC_PATHS.map((path) => ({
      url: `${SITE_URL}/${locale}${path}`,
      lastModified: now,
    })),
  );
}
