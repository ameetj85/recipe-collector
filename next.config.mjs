/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // Native module: load it from node_modules at runtime instead of bundling
  // it (also makes output tracing copy it into .next/standalone).
  serverExternalPackages: ["better-sqlite3"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "**",
      },
      // TODO(decommission, docs/SQLITE_MIGRATION.md §6 step 11): remove once
      // the SQLite cutover is verified. Nothing in the DB points here.
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "**",
      },
    ],
    // Recipe photos are stored at up to 2400px wide (utils/imageProcessing.mjs);
    // 2400 is added so a full-width header on a 1920px+ / 2x screen gets the
    // full stored resolution instead of jumping straight to 3840.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2400, 3840],
    // Stored images never change (a replaced image gets a new id).
    minimumCacheTTL: 2678400, // 31 days
  },

  experimental: {
    serverActions: {
      // Server Actions default to a 1 MB request body; recipe forms upload
      // up to 2 photos (resized server-side before storage).
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
