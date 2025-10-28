import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  devIndicators: false,
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
}

export default nextConfig
