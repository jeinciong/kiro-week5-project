import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Next.js doesn't get confused
  // by lockfiles that may exist in parent directories on the build machine.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
