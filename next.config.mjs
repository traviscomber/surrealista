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
    // Disable webpack cache for filesystem to prevent large string serialization issues
    // This resolves: "Serializing big strings (131kiB) impacts deserialization performance"
    if (!isServer) {
      config.cache = false
    }

    // Optimize build output
    config.optimization = {
      ...config.optimization,
      // Use single runtime chunk to reduce code duplication
      runtimeChunk: 'single',
      // Minimize code efficiently
      minimize: !dev,
    }

    return config
  },
}

export default nextConfig
