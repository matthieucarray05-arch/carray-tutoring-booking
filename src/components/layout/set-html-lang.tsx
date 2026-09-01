"use client";

import { useEffect } from "react";

/** Keeps <html lang> in sync with the active locale (the root layout is shared across /admin and /[locale], so it can't set this statically per locale itself). */
export function SetHtmlLang({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
