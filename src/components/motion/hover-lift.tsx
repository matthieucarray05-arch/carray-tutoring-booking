"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Lifts children slightly on hover — for cards inside server components. */
export function HoverLift({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className={className}>
      {children}
    </motion.div>
  );
}

/** Scales children slightly on hover/tap — for buttons and links inside server components. */
export function HoverScale({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
