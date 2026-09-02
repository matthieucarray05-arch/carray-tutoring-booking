"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Fades and slides content up into view once, as it scrolls in. A thin
 * client wrapper so the surrounding page can stay a server component —
 * only this leaf needs the animation hooks.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  /** "view": animates once when scrolled into view (default, for below-the-fold content).
   *  "mount": animates immediately on mount (for above-the-fold content, e.g. the hero). */
  trigger = "view",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  trigger?: "view" | "mount";
}) {
  const visible = { opacity: 1, y: 0 };
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      {...(trigger === "mount"
        ? { animate: visible }
        : { whileInView: visible, viewport: { once: true, margin: "-80px" } })}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
