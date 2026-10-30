import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  agentRules: false,
  logging: { incomingRequests: false },
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
