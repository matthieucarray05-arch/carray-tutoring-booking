"use client";

import { motion } from "framer-motion";
import { StarRating } from "./star-rating";

export function ReviewCard({
  name,
  quote,
  rating,
}: {
  name: string;
  quote: string;
  rating: number;
}) {
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-border bg-background p-7 shadow-[0_1px_2px_rgba(21,17,15,0.03),0_16px_32px_-24px_rgba(21,17,15,0.18)]"
    >
      <StarRating rating={rating} />
      <p className="mt-4 text-[15px] leading-relaxed text-foreground">
        “{quote}”
      </p>
      <div className="mt-6 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
          {initial}
        </span>
        <span className="text-sm font-medium">{name}</span>
      </div>
    </motion.div>
  );
}
