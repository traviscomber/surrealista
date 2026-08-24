/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { dev }) => {
    config.cache = false
    config.optimization = {
      ...config.optimization,
      runtimeChunk: 'single',
      minimize: !dev,
    }
    return config
  },
}

export default nextConfig
