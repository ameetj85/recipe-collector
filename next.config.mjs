/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "**",
      },
    ],
  },

  experimental: {
    serverActions: {
      // Server Actions default to a 1 MB request body; recipe forms upload
      // up to 2 photos. (Vercel itself caps request bodies at 4.5 MB.)
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
