/**
 * Vitest Unit Tests Setup
 * Configuration for isolated unit tests
 */

import { beforeAll, afterAll, beforeEach, afterEach, expect } from 'vitest' // Added expect
import { vi } from 'vitest'

// Mock console methods in CI
if (process.env.CI) {
  global.console = {
    ...console,
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: console.error // Keep errors visible
  }
}

// Setup global test utilities
beforeAll(() => {
  // Set timezone for consistent date testing
  process.env.TZ = 'UTC'
  
  // Mock environment variables
  // process.env.NODE_ENV = 'test'; // Should be set by Vitest config or test runner
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
})

// Clean up after each test
afterEach(() => {
  // Clear all mocks
  vi.clearAllMocks()
  vi.clearAllTimers()
  vi.restoreAllMocks()
})

// Global cleanup
afterAll(() => {
  vi.resetModules()
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn()
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/'
}))

// Mock Next.js headers
vi.mock('next/headers', () => ({
  headers: () => new Map(),
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn()
  })
}))

// Mock fetch globally
global.fetch = vi.fn()

// Extend expect with custom matchers
expect.extend({
  toBeValidNutrition(received: any) {
    const pass = 
      typeof received === 'object' &&
      typeof received.calories === 'number' &&
      typeof received.protein === 'number' &&
      typeof received.carbs === 'number' &&
      typeof received.fat === 'number' &&
      received.calories >= 0 &&
      received.protein >= 0 &&
      received.carbs >= 0 &&
      received.fat >= 0

    return {
      pass,
      message: () => pass 
        ? `Expected ${received} not to be valid nutrition data`
        : `Expected ${received} to be valid nutrition data with calories, protein, carbs, and fat as non-negative numbers`
    }
  }
})

// Type declarations for custom matchers
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeValidNutrition(): T
  }
  interface AsymmetricMatchersContaining {
    toBeValidNutrition(): any
  }
}

// Test utilities
export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  created_at: new Date().toISOString(),
  ...overrides
})

export const createMockRecipe = (overrides: Partial<any> = {}) => ({
  id: 'test-recipe-id',
  title: 'Test Recipe',
  description: 'A test recipe',
  ingredients: [],
  instructions: [],
  nutrition: {
    calories: 100,
    protein: 10,
    carbs: 10,
    fat: 5
  },
  created_at: new Date().toISOString(),
  ...overrides
})