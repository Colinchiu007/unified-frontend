import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
});

const nextConfig: NextConfig = {
  output: "standalone",
  /** Enable HTTP compression for smaller responses */
  compress: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/:path*`,
      },
    ];
  },
};

// Bundle analyzer (ANALYZE=true next build or ANALYZE=true ANALYZE_MODE=static next build)
const withBundleAnalyzer =
  process.env.ANALYZE === "true"
    ? require("@next/bundle-analyzer")({
        enabled: true,
        openAnalyzer: process.env.ANALYZE_MODE !== "static",
      })
    : (config: NextConfig) => config;

export default withBundleAnalyzer(withSerwist(nextConfig));
