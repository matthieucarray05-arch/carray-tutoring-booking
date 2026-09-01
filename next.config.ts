import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    // Skips writing the dev cache to .next/dev/cache/turbopack — trades a
    // slightly slower rebuild on restart for not filling up disks that are
    // already tight on space.
    turbopackFileSystemCacheForDev: false,
  },
};

export default withNextIntl(nextConfig);
