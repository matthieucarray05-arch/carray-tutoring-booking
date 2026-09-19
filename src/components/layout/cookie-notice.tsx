"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export const COOKIE_NOTICE_STORAGE_KEY = "ct_cookie_notice_dismissed";
const STORAGE_KEY = COOKIE_NOTICE_STORAGE_KEY;

/** Lightweight, non-consent cookie notice — Plausible is cookieless and
 * the only other cookies are strictly necessary, so this just informs
 * visitors rather than asking for opt-in. Dismissal is remembered
 * indefinitely via localStorage (no expiry, unlike the homepage popups). */
export function CookieNotice() {
  const t = useTranslations("CookiePolicy");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (!window.localStorage.getItem(STORAGE_KEY)) {
          setVisible(true);
        }
      } catch {
        setVisible(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // localStorage unavailable — the notice will just show again next visit.
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background px-6 py-4 shadow-[0_-4px_16px_rgba(21,17,15,0.06)]">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="text-sm text-muted-foreground">
          {t("noticeBody")}{" "}
          <Link
            href="/cookie-policy"
            className="font-medium text-foreground underline underline-offset-2 hover:text-accent"
          >
            {t("noticeLink")}
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          {t("noticeDismiss")}
        </button>
      </div>
    </div>
  );
}
