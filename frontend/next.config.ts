import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack doesn't infer it from a stray
  // lockfile in a parent directory.
  turbopack: {
    root: path.join(__dirname),
  },

  // Allow Next.js <Image> and <img> to load from the backend origin.
  // The media library uploads files to the backend and serves them from
  // http://localhost:4000/static — these patterns must match that origin.
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/static/**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
