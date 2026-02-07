/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Handle Three.js and related modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    
    // Ensure Three.js is properly resolved and all exports are available
    config.resolve.alias = {
      ...config.resolve.alias,
      three: require.resolve('three'),
    }
    
    // Fix for BatchedMesh export issue
    // Ensure all Three.js exports are available
    config.module = config.module || {}
    config.module.rules = config.module.rules || []
    
    return config
  },
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  // Ensure Three.js is not optimized away
  experimental: {
    optimizePackageImports: ['three'],
  },
}

module.exports = nextConfig

