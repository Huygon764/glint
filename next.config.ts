import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle in .next/standalone so the Docker
  // runner stage can ship without copying node_modules.
  output: "standalone",
};

export default nextConfig;
