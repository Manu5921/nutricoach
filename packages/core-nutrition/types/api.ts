/**
 * API Types and Interfaces for Next.js App Router
 */

import type { ServiceResponse, PaginatedResponse, ServiceError } from './service.js'

// Standard API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
  timestamp: string
  requestId?: string
}

// API Error interface
export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
  statusCode: number
  path?: string
  timestamp: string
}

// Pagination query parameters
export interface ApiPaginationQuery {
  page?: string
  limit?: string
  offset?: string
}

// Search query parameters
export interface ApiSearchQuery {
  q?: string
  search?: string
  query?: string
}

// Sorting query parameters
export interface ApiSortQuery {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  orderBy?: string
}

// Combined query parameters
export interface ApiQuery extends ApiPaginationQuery, ApiSearchQuery, ApiSortQuery {
  [key: string]: string | string[] | undefined
}

// Request validation result
export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: ValidationError[]
}

export interface ValidationError {
  field: string
  code: string
  message: string
  value?: unknown
}

// Authentication API types
export interface AuthApiRequest {
  email: string
  password: string
}

export interface SignupApiRequest extends AuthApiRequest {
  firstName?: string
  lastName?: string
  confirmPassword: string
}

export interface AuthApiResponse {
  user: {
    id: string
    email: string
    emailConfirmed: boolean
  }
  session?: {
    accessToken: string
    refreshToken: string
    expiresAt: number
  }
}

// User API types
export interface UserApiResponse {
  id: string
  email: string
  firstName?: string
  lastName?: string
  createdAt: string
  updatedAt: string
  profile?: {
    dateOfBirth?: string
    phone?: string
    avatarUrl?: string
    heightCm?: number
    weightKg?: number
    gender?: string
    activityLevel?: string
    goalType?: string
    targetWeightKg?: number
    dietaryRestrictions?: string[]
    allergies?: string[]
    cuisinePreferences?: string[]
    isProfilePublic: boolean
  }
  metrics?: {
    age?: number
    bmi?: number
    bmr?: number
    tdee?: number
  }
}

export interface UserUpdateApiRequest {
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  phone?: string
  avatarUrl?: string
  heightCm?: number
  weightKg?: number
  gender?: 'male' | 'female' | 'other'
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  goalType?: 'lose_weight' | 'maintain_weight' | 'gain_weight' | 'gain_muscle'
  targetWeightKg?: number
  dietaryRestrictions?: string[]
  allergies?: string[]
  cuisinePreferences?: string[]
  isProfilePublic?: boolean
}

// Recipe API types
export interface RecipeApiResponse {
  id: string
  userId: string
  title: string
  description?: string
  imageUrl?: string
  ingredients: Array<{
    name: string
    amount: number
    unit: string
    notes?: string
  }>
  instructions: string[]
  prepTimeMinutes?: number
  cookTimeMinutes?: number
  totalTimeMinutes?: number
  servings: number
  nutrition?: {
    caloriesPerServing?: number
    proteinG?: number
    carbsG?: number
    fatG?: number
    fiberG?: number
    sugarG?: number
    sodiumMg?: number
  }
  cuisineType?: string
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert'
  dietaryTags?: string[]
  difficultyLevel?: 'easy' | 'medium' | 'hard'
  isPublic: boolean
  likesCount: number
  ratingAverage?: number
  ratingCount: number
  createdAt: string
  updatedAt: string
  isOwner?: boolean
  isLiked?: boolean
}

export interface RecipeCreateApiRequest {
  title: string
  description?: string
  imageUrl?: string
  ingredients: Array<{
    name: string
    amount: number
    unit: string
    notes?: string
  }>
  instructions: string[]
  prepTimeMinutes?: number
  cookTimeMinutes?: number
  servings: number
  cuisineType?: string
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert'
  dietaryTags?: string[]
  difficultyLevel?: 'easy' | 'medium' | 'hard'
  isPublic?: boolean
}

export interface RecipeUpdateApiRequest extends Partial<RecipeCreateApiRequest> {}

export interface RecipeSearchApiQuery extends ApiQuery {
  cuisineType?: string
  mealType?: string
  dietaryTags?: string
  maxPrepTime?: string
  maxCookTime?: string
  difficulty?: string
  minRating?: string
  isPublic?: string
  userId?: string
}

// Nutrition API types
export interface NutritionGoalsApiResponse {
  id: string
  userId: string
  targetCalories: number
  targetProteinG: number
  targetCarbsG: number
  targetFatG: number
  targetFiberG?: number
  targetSugarG?: number
  targetSodiumMg?: number
  bmr?: number
  tdee?: number
  weeklyWeightChangeKg?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface NutritionGoalsApiRequest {
  targetCalories: number
  targetProteinG: number
  targetCarbsG: number
  targetFatG: number
  targetFiberG?: number
  targetSugarG?: number
  targetSodiumMg?: number
  weeklyWeightChangeKg?: number
}

export interface NutritionCalculationApiRequest {
  ingredients: Array<{
    name: string
    amount: number
    unit: string
  }>
  servings?: number
}

export interface NutritionCalculationApiResponse {
  ingredients: Array<{
    name: string
    amount: number
    unit: string
    nutrition: {
      calories: number
      protein: number
      carbs: number
      fat: number
      fiber?: number
      sugar?: number
      sodium?: number
    }
  }>
  totalNutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber?: number
    sugar?: number
    sodium?: number
  }
  nutritionPerServing?: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber?: number
    sugar?: number
    sodium?: number
  }
}

// Health check API types
export interface HealthCheckApiResponse {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  version: string
  uptime: number
  services: {
    database: {
      status: 'up' | 'down'
      responseTime?: number
    }
    auth: {
      status: 'up' | 'down'
      responseTime?: number
    }
  }
  environment: string
}

// Utility type for converting service responses to API responses
export type ServiceToApiResponse<T> = T extends ServiceResponse<infer U>
  ? ApiResponse<U>
  : never

export type ServiceToApiError = (error: ServiceError) => ApiError

// Helper type for paginated API responses
export type PaginatedApiResponse<T> = ApiResponse<PaginatedResponse<T>>

// Request handler types for Next.js
export interface RequestContext {
  params?: Record<string, string>
  searchParams?: Record<string, string | string[]>
  headers?: Record<string, string>
  user?: {
    id: string
    email: string
  }
}

export interface AuthenticatedRequestContext extends RequestContext {
  user: {
    id: string
    email: string
  }
}