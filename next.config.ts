import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  agentRules: false,
  logging: { incomingRequests: false },
  // Controlled photo URLs must never enter the optimizer's persistent cache.
  // PublicPhoto uses unoptimized delivery; only legacy static paths may optimize.
  images: { localPatterns: [{ pathname: "/cars/**", search: "" }] },
  outputFileTracingExcludes: {
    "/*": ["./.data/**/*", "./backups/**/*", "./.env", "./.env.*"],
  },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
    ] }];
  },
};

export default nextConfig;
