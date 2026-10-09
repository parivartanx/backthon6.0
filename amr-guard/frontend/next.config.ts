import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  trailingSlash: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Reverse proxy API calls to backend server
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "https://nine-peaches-wash.loca.lt/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
