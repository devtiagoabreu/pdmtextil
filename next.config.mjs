/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['vercel-blob.com'],
  },
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
  },
}

export default nextConfig
