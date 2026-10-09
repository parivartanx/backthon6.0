import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  // Reverse proxy API calls to backend server
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://localhost:8000/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
