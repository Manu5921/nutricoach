module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
    },
    upload: {
      target: 'temporary-public-storage',
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Performance budget assertions
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        
        // Additional performance checks
        'render-blocking-resources': 'off', // We handle this with font optimization
        'unused-css-rules': ['warn', { maxLength: 1 }],
        'unused-javascript': ['warn', { maxLength: 1 }],
        'modern-image-formats': 'error',
        'uses-optimized-images': 'error',
        'uses-webp-images': 'error',
        'uses-responsive-images': 'error',
        
        // SEO and accessibility
        'meta-description': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',
        'image-alt': 'error',
        
        // Best practices
        'uses-https': 'error',
        'no-vulnerable-libraries': 'error',
      },
    },
  },
}