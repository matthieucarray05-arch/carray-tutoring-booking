"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";

/**
 * Renders /public/logo.png once it exists. Until that file is added, falls
 * back to a text wordmark so the header never shows a broken image.
 *
 * The server-rendered <img> can start (and fail) loading before React
 * hydrates and attaches onError, so we also check naturalWidth on mount to
 * catch a failure that already happened.
 */
export function Logo() {
  const [imageFailed, setImageFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) {
      setImageFailed(true);
    }
  }, []);

  return (
    <Link href="/" aria-label="Carray Tutoring" className="flex items-center">
      {imageFailed ? (
        <span className="flex items-center gap-2">
          <span className="text-xl font-bold leading-none text-accent">CT</span>
          <span className="text-lg font-semibold leading-none tracking-tight">
            Carray Tutoring
          </span>
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- small static brand asset from /public, no need for next/image processing
        <img
          ref={imgRef}
          src="/logo.png"
          alt="Carray Tutoring"
          className="h-9 w-auto sm:h-10"
          onError={() => setImageFailed(true)}
        />
      )}
    </Link>
  );
}
