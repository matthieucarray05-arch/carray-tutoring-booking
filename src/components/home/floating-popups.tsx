"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const SHOW_DELAY_MS = 7000;
const SCROLL_THRESHOLD_PX = 300;
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

const TESTIMONIAL_STORAGE_KEY = "ct_popup_testimonial_seen_until";
const CTA_STORAGE_KEY = "ct_popup_cta_seen_until";

function isSnoozed(key: string): boolean {
  try {
    const raw = window.localStorage.getItem(key);
    return raw != null && Number(raw) > Date.now();
  } catch {
    return false;
  }
}

function snooze(key: string): void {
  try {
    window.localStorage.setItem(key, String(Date.now() + SNOOZE_MS));
  } catch {
    // localStorage unavailable (private mode, disabled storage) — the
    // popup will just show again next visit, which is an acceptable
    // fallback rather than breaking the page.
  }
}

/** Bottom-corner testimonial teaser + free-intro CTA bubbles — homepage only
 * (mounted directly in the homepage, not the shared layout, so it never
 * shows on /booking, /programs, etc.). Each bubble tracks its own 7-day
 * "already seen" snooze in localStorage, independently of the other. */
export function HomeFloatingPopups() {
  const t = useTranslations("HomePopups");
  const tReviews = useTranslations("Reviews");

  const [showTestimonial, setShowTestimonial] = useState(false);
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    const testimonialSnoozed = isSnoozed(TESTIMONIAL_STORAGE_KEY);
    const ctaSnoozed = isSnoozed(CTA_STORAGE_KEY);
    if (testimonialSnoozed && ctaSnoozed) return;

    let hasTriggered = false;

    function reveal() {
      if (hasTriggered) return;
      hasTriggered = true;
      if (!testimonialSnoozed) {
        setShowTestimonial(true);
        snooze(TESTIMONIAL_STORAGE_KEY);
      }
      if (!ctaSnoozed) {
        setShowCta(true);
        snooze(CTA_STORAGE_KEY);
      }
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    }

    function onScroll() {
      if (window.scrollY > SCROLL_THRESHOLD_PX) reveal();
    }

    const timer = setTimeout(reveal, SHOW_DELAY_MS);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const quote = (tReviews.raw("items") as { quote: string }[])[2]?.quote ?? "";

  return (
    <>
      <AnimatePresence>
        {showTestimonial && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-28 right-5 z-50 max-w-[78vw] sm:bottom-5 sm:left-5 sm:right-auto sm:max-w-[280px]"
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" });
                  setShowTestimonial(false);
                }}
                className="block w-full rounded-2xl border border-border bg-background p-3.5 pr-7 text-left shadow-[0_1px_2px_rgba(21,17,15,0.03),0_16px_32px_-24px_rgba(21,17,15,0.18)] transition-transform hover:-translate-y-0.5"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-accent">
                  {tReviews("title")}
                </p>
                <p className="mt-1 text-xs font-semibold text-foreground">
                  {t("testimonialName")}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
                  &ldquo;{quote}&rdquo;
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTestimonial(false);
                  snooze(TESTIMONIAL_STORAGE_KEY);
                }}
                aria-label="Close"
                className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
              >
                <CloseIcon />
              </button>
              <span className="absolute -bottom-1.5 left-6 h-3 w-3 rotate-45 border-b border-r border-border bg-background" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCta && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="fixed bottom-5 right-5 z-50 max-w-[78vw] sm:max-w-[280px]"
          >
            <div className="relative">
              <Link
                href={{ pathname: "/booking", query: { intro: "1" } }}
                className="block w-full rounded-2xl bg-accent p-3.5 pr-7 text-left text-accent-foreground shadow-[0_1px_2px_rgba(21,17,15,0.03),0_16px_32px_-24px_rgba(21,17,15,0.18)] transition-transform hover:-translate-y-0.5"
              >
                <p className="text-xs font-semibold leading-snug">{t("ctaHeadline")}</p>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setShowCta(false);
                  snooze(CTA_STORAGE_KEY);
                }}
                aria-label="Close"
                className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-accent-foreground/80 transition-colors hover:text-accent-foreground"
              >
                <CloseIcon />
              </button>
              <span className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 bg-accent" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
    </svg>
  );
}
