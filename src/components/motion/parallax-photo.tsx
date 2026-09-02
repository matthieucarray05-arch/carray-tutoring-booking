"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

/** A photo that drifts slightly slower than the page as you scroll past it —
 * a subtle parallax used in the hero and the About section. */
export function ParallaxPhoto({
  src,
  alt,
  className,
  range = 60,
}: {
  src: string;
  alt: string;
  className?: string;
  range?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-range, range]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className ?? ""}`}>
      <motion.div
        style={{ y }}
        className="absolute inset-x-0 -top-16 -bottom-16"
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 40vw, 90vw"
          className="object-cover"
          priority
        />
      </motion.div>
    </div>
  );
}
