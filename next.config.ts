import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Node.js-only packages out of the client/edge bundles
  serverExternalPackages: ['pikud-haoref-api', 'node-cache'],
};

export default nextConfig;
