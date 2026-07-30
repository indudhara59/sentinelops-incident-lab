import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@sentinelops/shared"],
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
