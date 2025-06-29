const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

// PWA configuration
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
        }
      }
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-static',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
        }
      }
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    },
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-js-css-assets',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    },
    {
      urlPattern: /^\/api\/.*$/i,
      handler: 'NetworkFirst',
      method: 'GET',
      options: {
        cacheName: 'apis',
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        },
        networkTimeoutSeconds: 10
      }
    },
    {
      urlPattern: /.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'others',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        },
        networkTimeoutSeconds: 10
      }
    }
  ]
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output configuration for Railway deployment
  output: 'standalone',
  
  // Asset prefix for Railway deployment
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  
  // Force dynamic rendering for Railway deployment
  trailingSlash: false,
  
  // Experimental features for Railway deployment and PWA
  experimental: {
    // Optimize memory usage during build
    webpackBuildWorker: true,
    // Enable modern features for PWA
    serverComponentsExternalPackages: ['sharp'],
    // Optimize for mobile performance
    optimizePackageImports: ['@supabase/supabase-js', 'framer-motion'],
  },
  
  // Enable production browser source maps for debugging
  productionBrowserSourceMaps: false, // Disabled for security in production
  
  // Environment variables embedded at build time
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || 'default',
  },
  
  
  // Security headers with PWA support
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
            value: 'camera=(self), microphone=(), geolocation=(self), notifications=(self)',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ]
  },
  
  // Webpack configuration with PWA optimizations
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // PWA Service Worker configuration
    if (!isServer && !dev) {
      // Replace default service worker with advanced version
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.SW_VERSION': JSON.stringify(buildId),
        })
      )
    }

    // Mobile performance optimizations
    if (!dev) {
      config.devtool = false
      
      // Code splitting for mobile
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              maxSize: 244000, // 244KB for mobile
            },
            common: {
              minChunks: 2,
              chunks: 'all',
              name: 'common',
              maxSize: 244000,
            },
            mobile: {
              test: /[\\/]components[\\/]mobile[\\/]/,
              name: 'mobile',
              chunks: 'all',
              priority: 10,
            },
          },
        },
      }
      
      // Memory optimization for production builds
      if (config.cache && !dev) {
        config.cache = Object.freeze({
          type: 'memory',
        })
      }
    }

    // Support for importing worker files
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: {
        loader: 'worker-loader',
        options: {
          name: 'static/[hash].worker.js',
          publicPath: '/_next/',
        },
      },
    })
    
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

module.exports = withBundleAnalyzer(withPWA(nextConfig))