"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/** Reads ?intro=1 (used by the homepage CTA popup to land directly on the
 * free-intro tab) — isolated in its own component for the same reason as
 * CheckoutStatusBanner: keeps useSearchParams() from forcing the whole
 * booking page out of static prerendering. */
export function IntroQueryParamHandler({ onIntro }: { onIntro: () => void }) {
  const intro = useSearchParams().get("intro");

  useEffect(() => {
    if (intro === "1") onIntro();
  }, [intro, onIntro]);

  return null;
}
