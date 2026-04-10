import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Proxy /api/v1/* to the FastAPI backend (server-side, avoids CORS and port issues)
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
