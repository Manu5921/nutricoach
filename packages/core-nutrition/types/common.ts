/**
 * Common Types for NutriCoach Application
 * Based on Next.js 15 App Router and TypeScript strict mode patterns
 */

import type { Tables, Inserts, Updates, Enums, NutritionInfo, RecipeIngredient } from './database'

// User Types
export type User = Tables<'users'>
export type UserInsert = Inserts<'users'>
export type UserUpdate = Updates<'users'>

export type ActivityLevel = Enums<'activity_level'>
export type Gender = Enums<'gender'>

export interface UserProfile extends User {
  age?: number
  bmi?: number
  bmr?: number // Basal Metabolic Rate
  tdee?: number // Total Daily Energy Expenditure
}

// Recipe Types
export type Recipe = Tables<'recipes'>
export type RecipeInsert = Inserts<'recipes'>
export type RecipeUpdate = Updates<'recipes'>

export type DifficultyLevel = Enums<'difficulty_level'>
export type MealType = Enums<'meal_type'>

export interface RecipeWithDetails extends Recipe {
  total_time_minutes: number
  nutrition_per_100g?: NutritionInfo
  recipe_rating?: number
  recipe_reviews_count?: number
}

// Meal Logging Types
export type MealLog = Tables<'meal_logs'>
export type MealLogInsert = Inserts<'meal_logs'>
export type MealLogUpdate = Updates<'meal_logs'>

export interface MealLogWithRecipe extends MealLog {
  recipe?: Recipe
  total_nutrition?: NutritionInfo
}

// Nutrition Types
export type NutritionGoals = Tables<'nutrition_goals'>
export type NutritionGoalsInsert = Inserts<'nutrition_goals'>
export type NutritionGoalsUpdate = Updates<'nutrition_goals'>

export interface DailyNutritionSummary {
  date: string
  total_calories: number
  total_protein_g: number
  total_carbs_g: number
  total_fat_g: number
  total_fiber_g: number
  total_sugar_g: number
  total_sodium_mg: number
  meals_by_type: {
    breakfast: MealLogWithRecipe[]
    lunch: MealLogWithRecipe[]
    dinner: MealLogWithRecipe[]
    snack: MealLogWithRecipe[]
  }
  goals?: NutritionGoals
  progress_percentage: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

// Service Response Types
export interface ServiceResponse<T> {
  data: T | null
  error: ServiceError | null
  success: boolean
}

export interface ServiceError {
  code: string
  message: string
  details?: Record<string, unknown>
  statusCode?: number
}

// Pagination Types
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Search and Filter Types
export interface RecipeFilters {
  cuisine_type?: string[]
  dietary_tags?: string[]
  difficulty_level?: DifficultyLevel[]
  max_prep_time?: number
  max_cook_time?: number
  min_rating?: number
  is_public?: boolean
}

export interface RecipeSearchParams extends PaginationParams {
  query?: string
  filters?: RecipeFilters
}

// Auth Types
export interface AuthUser {
  id: string
  email: string
  email_confirmed_at?: string
  last_sign_in_at?: string
  created_at: string
  updated_at: string
}

export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  user: AuthUser
}

// API Types for Next.js 15 App Router
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: Record<string, unknown>
  }
  meta?: {
    timestamp: string
    requestId?: string
  }
}

export interface ApiError {
  message: string
  code: string
  statusCode: number
  details?: Record<string, unknown>
}

// Validation Types
export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: ValidationError[]
}

// Configuration Types
export interface DatabaseConfig {
  url: string
  anonKey: string
  serviceRoleKey?: string
}

export interface AppConfig {
  database: DatabaseConfig
  environment: 'development' | 'staging' | 'production'
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  features: {
    enableRecipeSharing: boolean
    enableNutritionTracking: boolean
    enableMealPlanning: boolean
  }
}

// Utility Types
export type NonNullable<T> = T extends null | undefined ? never : T

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Export commonly used types
export type { NutritionInfo, RecipeIngredient }