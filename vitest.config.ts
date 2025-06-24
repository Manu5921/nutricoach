/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // Environment
    environment: 'node',
    globals: true,
    
    // Test files
    include: [
      'apps/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'packages/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      '**/*.d.ts'
    ],

    // Projects for different test types
    // projects: [
    //   {
    //     name: 'unit',
    //     test: {
    //       include: ['**/*.unit.{test,spec}.{ts,tsx}'],
    //       environment: 'node',
    //       setupFiles: ['./vitest.setup.unit.ts']
    //     }
    //   },
    //   {
    //     name: 'integration',
    //     test: {
    //       include: ['**/*.integration.{test,spec}.{ts,tsx}'],
    //       environment: 'node',
    //       setupFiles: ['./vitest.setup.integration.ts'],
    //       testTimeout: 30000
    //     }
    //   },
    //   {
    //     name: 'e2e',
    //     test: {
    //       include: ['**/*.e2e.{test,spec}.{ts,tsx}'],
    //       environment: 'node',
    //       setupFiles: ['./vitest.setup.e2e.ts'],
    //       testTimeout: 60000
    //     }
    //   }
    // ],

    // Coverage configuration
    // coverage: {
    //   provider: 'v8',
    //   reporter: ['text', 'json', 'html', 'lcov'],
    //   exclude: [
    //     'coverage/**',
    //     'dist/**',
    //     '**/[.]**',
    //     'packages/*/test{,s}/**',
    //     '**/*.d.ts',
    //     '**/virtual:*',
    //     '**/__x00__*',
    //     '**/\x00*',
    //     'cypress/**',
    //     'test{,s}/**',
    //     'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
    //     '**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}',
    //     '**/*{.,-}spec.{js,cjs,mjs,ts,tsx,jsx}',
    //     '**/__tests__/**',
    //     '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
    //     '**/.{eslint,mocha,prettier}rc.{js,cjs,yml}',
    //     '**/next.config.{js,ts}',
    //     '**/postcss.config.{js,ts}',
    //     '**/tailwind.config.{js,ts}'
    //   ],
    //   thresholds: {
    //     global: {
    //       branches: 80,
    //       functions: 80,
    //       lines: 80,
    //       statements: 80
    //     },
    //     // Specific thresholds for core packages
    //     'packages/core-nutrition/**': {
    //       branches: 90,
    //       functions: 90,
    //       lines: 90,
    //       statements: 90
    //     }
    //   },
    //   reportsDirectory: './coverage'
    // },

    // Reporters for CI/CD
    // reporters: process.env.CI
    //   ? ['dot', 'junit', 'json']
    //   : ['verbose'],
    
    // outputFile: {
    //   junit: './test-results/junit.xml',
    //   json: './test-results/results.json'
    // },

    // Performance
    pool: 'threads', // Kept pool for basic structure
    // poolOptions: { // Commenting out to test TS2769
    //   threads: {
    //     singleThread: false,
    //     isolate: true
    //   }
    // },
    
    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Retry configuration
    // retry: process.env.CI ? 2 : 0,
    
    // Watch options
    // watch: {
    //   exclude: [
    //     '**/node_modules/**',
    //     '**/dist/**',
    //     '**/.next/**'
    //   ]
    // },

    // Custom configuration for CI
    // ...(process.env.CI && {
    //   reporters: ['dot', 'junit'], // Corrected from 'reporter' to 'reporters'
    //   coverage: {
    //     reporter: ['text', 'lcov', 'json-summary'] // This 'reporter' is correct for coverage
    //   }
    // })
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@/apps': resolve(__dirname, './apps'),
      '@/packages': resolve(__dirname, './packages'),
      '@nutricoach/core-nutrition': resolve(__dirname, './packages/core-nutrition/src'),
      '@nutricoach/ui': resolve(__dirname, './packages/ui/src')
    }
  },

  // Define custom matchers and utilities
  define: {
    __TEST__: true
  },

  // Provide global test utilities
  // provide: { // 'provide' is not a valid top-level option for Vitest config
  //   TEST_ENV: 'test',
  //   NODE_ENV: 'test'
  // }
})