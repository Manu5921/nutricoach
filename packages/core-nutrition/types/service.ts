/**
 * Service Types and Interfaces
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, User, Recipe, NutritionGoals } from './database.js'

// Supabase client type
export type TypedSupabaseClient = SupabaseClient<Database>

// Standard service response wrapper
export interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: ServiceError
  message?: string
}

// Standardized error interface
export interface ServiceError {
  code: string
  message: string
  details?: Record<string, unknown>
  statusCode?: number
}

// Authentication interfaces
export interface AuthCredentials {
  email: string
  password: string
}

export interface SignupData extends AuthCredentials {
  firstName?: string
  lastName?: string
  confirmPassword: string
}

export interface AuthUser {
  id: string
  email: string
  emailConfirmed: boolean
  phone?: string
  createdAt: string
  updatedAt: string
}

// User Profile interfaces with computed fields
export interface UserProfile extends User {
  // Computed fields
  age?: number
  bmi?: number
  bmr?: number
  tdee?: number
  fullName?: string
}

export interface UserMetrics {
  bmi?: number
  bmr?: number
  tdee?: number
  age?: number
  idealWeight?: {
    min: number
    max: number
  }
}

export interface UserGoalsCalculation {
  targetCalories: number
  targetProtein: number
  targetCarbs: number
  targetFat: number
  targetFiber?: number
  weeklyWeightChange?: number
}

// Recipe interfaces with computed nutrition
export interface RecipeWithNutrition extends Recipe {
  totalNutrition: NutritionInfo
  nutritionPerServing: NutritionInfo
  isOwner?: boolean
  isLiked?: boolean
}

export interface NutritionInfo {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
}

export interface RecipeSearchFilters {
  query?: string
  cuisineType?: string
  mealType?: string
  dietaryTags?: string[]
  maxPrepTime?: number
  maxCookTime?: number
  difficulty?: string
  minRating?: number
  isPublic?: boolean
  userId?: string
}

export interface RecipeSortOptions {
  field: 'created_at' | 'updated_at' | 'rating_average' | 'likes_count' | 'prep_time_minutes' | 'title'
  direction: 'asc' | 'desc'
}

// Pagination interfaces
export interface PaginationOptions {
  page: number
  limit: number
  offset?: number
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

// Search and filter interfaces
export interface UserSearchFilters {
  query?: string
  isPublic?: boolean
  goalType?: string
  activityLevel?: string
}

export interface UserSortOptions {
  field: 'created_at' | 'updated_at' | 'first_name' | 'last_name'
  direction: 'asc' | 'desc'
}

// Nutrition calculation interfaces
export interface NutritionCalculationRequest {
  ingredients: Array<{
    name: string
    amount: number
    unit: string
  }>
  servings?: number
}

export interface NutritionCalculationResponse {
  ingredients: Array<{
    name: string
    amount: number
    unit: string
    nutrition: NutritionInfo
  }>
  totalNutrition: NutritionInfo
  nutritionPerServing?: NutritionInfo
}

// Configuration interfaces
export interface ServiceConfig {
  enableLogging: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  environment: 'development' | 'staging' | 'production'
  features: {
    enableCaching: boolean
    enableRateLimiting: boolean
    enableMetrics: boolean
  }
}

// Validation context for complex business rules
export interface ValidationContext {
  userId?: string
  userRole?: string
  environment: 'development' | 'staging' | 'production'
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Error codes enumeration
export enum ErrorCodes {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_USER_NOT_FOUND = 'AUTH_USER_NOT_FOUND',
  AUTH_EMAIL_NOT_CONFIRMED = 'AUTH_EMAIL_NOT_CONFIRMED',
  AUTH_PASSWORD_TOO_WEAK = 'AUTH_PASSWORD_TOO_WEAK',
  AUTH_EMAIL_ALREADY_EXISTS = 'AUTH_EMAIL_ALREADY_EXISTS',
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',

  // User errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_PROFILE_INCOMPLETE = 'USER_PROFILE_INCOMPLETE',
  USER_PERMISSION_DENIED = 'USER_PERMISSION_DENIED',
  USER_VALIDATION_ERROR = 'USER_VALIDATION_ERROR',

  // Recipe errors
  RECIPE_NOT_FOUND = 'RECIPE_NOT_FOUND',
  RECIPE_PERMISSION_DENIED = 'RECIPE_PERMISSION_DENIED',
  RECIPE_VALIDATION_ERROR = 'RECIPE_VALIDATION_ERROR',
  RECIPE_NUTRITION_CALCULATION_ERROR = 'RECIPE_NUTRITION_CALCULATION_ERROR',

  // Nutrition errors
  NUTRITION_GOALS_NOT_FOUND = 'NUTRITION_GOALS_NOT_FOUND',
  NUTRITION_CALCULATION_ERROR = 'NUTRITION_CALCULATION_ERROR',
  NUTRITION_INVALID_METRICS = 'NUTRITION_INVALID_METRICS',

  // Generic errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

// HTTP Status codes for API responses
export enum HttpStatusCodes {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}