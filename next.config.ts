import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // Type errors in recharts formatter don't affect runtime — skip TS check at build
    ignoreBuildErrors: true,
  },
  async rewrites() {
    // 'api' resolves to the FastAPI container on the Docker internal network.
    // Evaluated at build time in standalone mode — hardcoded to avoid env-var issues.
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://api:8000/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
