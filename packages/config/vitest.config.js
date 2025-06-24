/**
 * Shared Vitest Configuration for NutriCoach ecosystem
 * Universal testing setup for all packages
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Global test settings
    globals: true,
    
    // Setup files
    setupFiles: [
      './vitest.setup.ts',
      './vitest.setup.unit.ts',
      './vitest.setup.integration.ts',
      './vitest.setup.e2e.ts',
    ].filter(file => {
      try {
        require.resolve(file);
        return true;
      } catch {
        return false;
      }
    }),

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        'build/**',
        'coverage/**',
        '**/*.d.ts',
        '**/*.test.{ts,tsx,js,jsx}',
        '**/*.spec.{ts,tsx,js,jsx}',
        '**/test/**',
        '**/tests/**',
        '**/__tests__/**',
        '**/*.config.{ts,js}',
        '**/vitest.*.{ts,js}',
        'src/test-utils/**',
        'src/mocks/**',
        'src/__mocks__/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },

    // Test file patterns
    include: [
      '**/*.{test,spec}.{js,ts,jsx,tsx}',
      '**/test/**/*.{js,ts,jsx,tsx}',
      '**/tests/**/*.{js,ts,jsx,tsx}',
      '**/__tests__/**/*.{js,ts,jsx,tsx}',
    ],

    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
      '**/e2e/**',
    ],

    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,

    // Watch options
    watch: true,
    watchExclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
    ],

    // Reporter configuration
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/results.html',
    },

    // Pool options
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1,
      },
    },

    // Snapshot options
    resolveSnapshotPath: (testPath, snapExtension) => {
      return testPath.replace(/\.test\.([jt]sx?)$/, `.__snapshots__.$1${snapExtension}`);
    },

    // Mock options
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,

    // Retry configuration
    retry: 0,

    // Silent mode
    silent: false,

    // UI configuration
    ui: true,
    open: false,

    // API configuration
    api: {
      port: 51204,
      host: 'localhost',
    },
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/lib': resolve(__dirname, './src/lib'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/types': resolve(__dirname, './src/types'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/styles': resolve(__dirname, './src/styles'),
      '@/test-utils': resolve(__dirname, './src/test-utils'),
      '@/mocks': resolve(__dirname, './src/mocks'),
    },
  },

  // Define configuration for different environments
  define: {
    __DEV__: true,
    __TEST__: true,
    __PROD__: false,
  },

  // Plugins (add as needed)
  plugins: [],
});

/**
 * Configuration variants for different testing scenarios
 */

// Unit testing configuration
export const unitConfig = defineConfig({
  ...config,
  test: {
    ...config.test,
    name: 'unit',
    include: ['**/*.unit.{test,spec}.{js,ts,jsx,tsx}'],
    environment: 'node',
    setupFiles: ['./vitest.setup.unit.ts'],
    coverage: {
      ...config.test.coverage,
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
    },
  },
});

// Integration testing configuration
export const integrationConfig = defineConfig({
  ...config,
  test: {
    ...config.test,
    name: 'integration',
    include: ['**/*.integration.{test,spec}.{js,ts,jsx,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.integration.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      ...config.test.coverage,
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
  },
});

// E2E testing configuration
export const e2eConfig = defineConfig({
  ...config,
  test: {
    ...config.test,
    name: 'e2e',
    include: ['**/*.e2e.{test,spec}.{js,ts,jsx,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.e2e.ts'],
    testTimeout: 60000,
    hookTimeout: 60000,
    retry: 2,
    coverage: {
      enabled: false, // Usually not needed for E2E tests
    },
  },
});

// Performance testing configuration
export const performanceConfig = defineConfig({
  ...config,
  test: {
    ...config.test,
    name: 'performance',
    include: ['**/*.performance.{test,spec}.{js,ts,jsx,tsx}'],
    environment: 'node',
    testTimeout: 120000,
    hookTimeout: 120000,
    coverage: {
      enabled: false,
    },
  },
});

// Configuration for libraries
export const libraryConfig = defineConfig({
  ...config,
  test: {
    ...config.test,
    environment: 'node',
    coverage: {
      ...config.test.coverage,
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
    },
  },
});

// Configuration for React components
export const reactConfig = defineConfig({
  ...config,
  test: {
    ...config.test,
    environment: 'jsdom',
    setupFiles: ['@testing-library/jest-dom'],
  },
});

// Minimal configuration for quick testing
export const minimalConfig = defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      enabled: false,
    },
  },
});