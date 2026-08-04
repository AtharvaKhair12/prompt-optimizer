import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable server external packages that need Node.js APIs
  serverExternalPackages: ["mongodb"],

  // Turbopack configuration (Next.js 16 default bundler)
  turbopack: {
    // Resolve aliases for WASM and native modules not available in browser
    resolveAlias: {
      fs: { browser: "" },
      path: { browser: "" },
      os: { browser: "" },
      crypto: { browser: "" },
    },
  },
};

export default nextConfig;
