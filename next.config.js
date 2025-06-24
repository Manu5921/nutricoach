/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output configuration for production deployment
  // output: 'standalone', // Commented out as Vercel handles this optimally by default
  
  // Enable production browser source maps for debugging
  productionBrowserSourceMaps: false, // Disabled for security in production
  
  // Environment variables embedded at build time
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || 'default',
  },
  
  // Experimental features
  experimental: {
    // Optimize memory usage during build
    webpackBuildWorker: true,
    nodeMiddleware: true, // Added as per user feedback
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
  
  // Ignore build errors for smooth deployment (configure based on needs)
  eslint: {
    // Warning: This allows production builds to complete even with ESLint errors
    ignoreDuringBuilds: false, // Keep false for quality control
  },
  
  typescript: {
    // Warning: This allows production builds to complete even with TypeScript errors
    ignoreBuildErrors: false, // Keep false for quality control
  },
  
  // Image optimization
  images: {
    domains: [
      'localhost',
      'nutricoach.app',
      'vercel.app',
    ],
    formats: ['image/webp', 'image/avif'],
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

module.exports = nextConfig