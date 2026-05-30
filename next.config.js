/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "vercel-blob.com" },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs"],
  },
}

module.exports = nextConfig
