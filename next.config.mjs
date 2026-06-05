/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer, dev }) => {
    // Completely disable webpack cache to prevent large string serialization issues
    config.cache = false

    // Optimize build output
    config.optimization = {
      ...config.optimization,
      runtimeChunk: 'single',
      minimize: !dev,
    }

    return config
  },
}

export default nextConfig
