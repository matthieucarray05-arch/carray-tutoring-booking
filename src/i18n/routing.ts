import { defineRouting } from "next-intl/routing";

export const locales = ["it", "de", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "it";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
});
