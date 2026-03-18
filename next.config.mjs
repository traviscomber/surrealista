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
  // Explicitly define experimental as empty object to prevent invalid keys from being recognized
  experimental: {},
  webpack: (config, { isServer, dev }) => {
    // Completely disable webpack cache to prevent large string serialization issues
    // This resolves: "Serializing big strings (131kiB) impacts deserialization performance"
    config.cache = false

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
