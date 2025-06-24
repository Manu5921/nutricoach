/**
 * Vitest E2E Tests Setup
 * Configuration for end-to-end tests
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { vi } from 'vitest'

// E2E test configuration
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'
const TEST_TIMEOUT = 60000

beforeAll(async () => {
  // Set test environment
  // process.env.NODE_ENV = 'test'; // Should be set by Vitest config or test runner
  process.env.TZ = 'UTC'
  
  // Wait for application to be ready
  await waitForApp()
}, TEST_TIMEOUT)

beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks()
})

afterEach(() => {
  // Cleanup after each test
  vi.clearAllTimers()
})

afterAll(() => {
  vi.resetModules()
})

// Wait for application to be available
async function waitForApp(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/health`)
      if (response.ok) {
        console.log('Application is ready for E2E tests')
        return
      }
    } catch (error) {
      // App not ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  throw new Error('Application failed to start within timeout')
}

// Mock browser APIs for E2E tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// E2E test utilities
export const E2E_CONFIG = {
  BASE_URL,
  TIMEOUT: TEST_TIMEOUT,
  SELECTORS: {
    // Navigation
    NAV_HOME: '[data-testid="nav-home"]',
    NAV_RECIPES: '[data-testid="nav-recipes"]',
    NAV_PROFILE: '[data-testid="nav-profile"]',
    
    // Forms
    LOGIN_FORM: '[data-testid="login-form"]',
    RECIPE_FORM: '[data-testid="recipe-form"]',
    
    // Buttons
    SUBMIT_BTN: '[data-testid="submit-btn"]',
    CANCEL_BTN: '[data-testid="cancel-btn"]',
    
    // Common
    LOADING: '[data-testid="loading"]',
    ERROR: '[data-testid="error"]',
    SUCCESS: '[data-testid="success"]'
  }
}

// API test helpers
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${BASE_URL}/api${endpoint}`
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })
  
  const data = await response.json()
  return { response, data }
}

// Page navigation helpers
export const navigateTo = async (path: string) => {
  const url = `${BASE_URL}${path}`
  // In a real E2E setup, this would use a browser automation tool
  // For now, we'll simulate with fetch
  const response = await fetch(url)
  return response.ok
}

// Form interaction helpers
export const fillForm = async (formData: Record<string, string>) => {
  // Mock form filling logic
  console.log('Filling form with:', formData)
  return true
}

export const submitForm = async (selector: string) => {
  // Mock form submission
  console.log('Submitting form:', selector)
  return true
}

// Wait utilities
export const waitForElement = async (selector: string, timeout = 5000) => {
  // Mock element waiting
  console.log('Waiting for element:', selector)
  return new Promise(resolve => setTimeout(resolve, 100))
}

export const waitForNavigation = async (timeout = 5000) => {
  // Mock navigation waiting
  return new Promise(resolve => setTimeout(resolve, 100))
}

// Test data for E2E
export const E2E_TEST_DATA = {
  USER: {
    email: 'e2e-test@example.com',
    password: 'TestPassword123!',
    name: 'E2E Test User'
  },
  RECIPE: {
    title: 'E2E Test Recipe',
    description: 'A recipe for E2E testing',
    ingredients: ['1 cup test ingredient', '2 tbsp test spice'],
    instructions: ['Mix ingredients', 'Cook for 10 minutes']
  }
}