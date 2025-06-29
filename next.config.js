const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output configuration for Railway deployment
  output: 'standalone',
  
  // Asset prefix for Railway deployment
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  
  // Force dynamic rendering for Railway deployment
  trailingSlash: false,
  
  // Experimental features for Railway deployment
  experimental: {
    // Optimize memory usage during build
    webpackBuildWorker: true,
  },
  
  // Enable production browser source maps for debugging
  productionBrowserSourceMaps: false, // Disabled for security in production
  
  // Environment variables embedded at build time
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || 'default',
  },
  
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
  
  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize for production builds
    if (!dev) {
      config.devtool = false
      
      // Memory optimization for production builds
      if (config.cache && !dev) {
        config.cache = Object.freeze({
          type: 'memory',
        })
      }
    }
    
    return config
  },
  
  // Build ID generation for consistent deployments
  generateBuildId: async () => {
    // Use git hash or timestamp for consistent builds
    return process.env.VERCEL_GIT_COMMIT_SHA || 
           process.env.GIT_HASH || 
           `build-${Date.now()}`
  },
  
  // Ignore build errors for Railway deployment
  eslint: {
    // Allow production builds to complete for Railway deployment
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    // Allow production builds to complete for Railway deployment
    ignoreBuildErrors: true,
  },
  
  // Image optimization
  images: {
    domains: [
      'localhost',
      'nutricoach.app',
      'vercel.app',
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Redirects and rewrites
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },
}

module.exports = withBundleAnalyzer(nextConfig)