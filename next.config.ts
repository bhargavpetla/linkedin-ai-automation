import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure Turbopack uses the project folder as the root
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'img.omdbapi.com' },
      { protocol: 'https', hostname: 'image.tmdb.org' }
    ]
  }
};

export default nextConfig;
