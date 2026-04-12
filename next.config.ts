import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    // 'api' resolves to the FastAPI container on the Docker internal network.
    // This is evaluated at build time — hardcoding avoids env-var baking issues.
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://api:8000/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
