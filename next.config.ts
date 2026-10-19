import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // capas e banners vêm do CDN da AniList
    remotePatterns: [{ protocol: "https", hostname: "s4.anilist.co" }],
  },
  turbopack: {
    // existe um package-lock.json solto em C:\Users\User; fixa a raiz no projeto
    root: path.join(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
