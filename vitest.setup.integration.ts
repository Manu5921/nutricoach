/**
 * Vitest Integration Tests Setup
 * Configuration for integration tests with database
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Integration test database setup
const supabaseUrl = process.env.SUPABASE_TEST_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_TEST_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

export const supabase = createClient(supabaseUrl, supabaseKey)

beforeAll(async () => {
  // Set test environment
  // process.env.NODE_ENV = 'test'; // Should be set by Vitest config or test runner
  process.env.TZ = 'UTC'
  
  // Verify Supabase connection
  try {
    const { error } = await supabase.from('_health').select('*').limit(1)
    if (error && !error.message.includes('relation "_health" does not exist')) {
      console.warn('Supabase connection issue:', error.message)
    }
  } catch (err) {
    console.warn('Supabase health check failed:', err)
  }
})

beforeEach(async () => {
  // Clean up test data before each test
  await cleanupTestData()
  
  // Reset all mocks
  vi.clearAllMocks()
})

afterEach(async () => {
  // Clean up test data after each test
  await cleanupTestData()
})

afterAll(async () => {
  // Final cleanup
  await cleanupTestData()
  vi.resetModules()
})

// Helper function to clean up test data
async function cleanupTestData() {
  try {
    // Delete test users (cascade will handle related data)
    await supabase
      .from('users')
      .delete()
      .like('email', '%test%')
    
    // Delete test recipes
    await supabase
      .from('recipes')
      .delete()
      .like('title', '%test%')
    
    // Delete test nutrition goals
    await supabase
      .from('nutrition_goals')
      .delete()
      .like('user_id', '%test%')
      
  } catch (error) {
    // Ignore cleanup errors in test environment
    if (process.env.VITEST_DEBUG) {
      console.warn('Test cleanup warning:', error)
    }
  }
}

// Test data factories for integration tests
export const createTestUser = async (overrides: Partial<any> = {}) => {
  const userData = {
    id: `test-user-${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    ...overrides
  }
  
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single()
    
  if (error) throw error
  return data
}

export const createTestRecipe = async (userId: string, overrides: Partial<any> = {}) => {
  const recipeData = {
    title: `Test Recipe ${Date.now()}`,
    description: 'Integration test recipe',
    ingredients: ['1 cup test ingredient'],
    instructions: ['Mix test ingredients'],
    user_id: userId,
    nutrition_calories: 100,
    nutrition_protein: 10,
    nutrition_carbs: 10,
    nutrition_fat: 5,
    ...overrides
  }
  
  const { data, error } = await supabase
    .from('recipes')
    .insert(recipeData)
    .select()
    .single()
    
  if (error) throw error
  return data
}

export const createTestNutritionGoal = async (userId: string, overrides: Partial<any> = {}) => {
  const goalData = {
    user_id: userId,
    daily_calories: 2000,
    daily_protein: 150,
    daily_carbs: 250,
    daily_fat: 67,
    ...overrides
  }
  
  const { data, error } = await supabase
    .from('nutrition_goals')
    .insert(goalData)
    .select()
    .single()
    
  if (error) throw error
  return data
}

// Database transaction helper for tests
export const withTransaction = async <T>(
  fn: (client: typeof supabase) => Promise<T>
): Promise<T> => {
  // Note: Supabase doesn't support nested transactions in the JS client
  // This is a simplified version for test isolation
  return fn(supabase)
}

// Wait for database operations to complete
export const waitForDb = (ms: number = 100) => 
  new Promise(resolve => setTimeout(resolve, ms))