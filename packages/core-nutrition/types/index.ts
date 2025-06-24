/**
 * Types Index - Central export point for all types
 */

// Database types
export type {
  Database,
  User,
  UserInsert,
  UserUpdate,
  Recipe,
  RecipeInsert,
  RecipeUpdate,
  NutritionGoals,
  NutritionGoalsInsert,
  NutritionGoalsUpdate,
  RecipeIngredient,
  Gender,
  ActivityLevel,
  GoalType,
  MealType,
  DifficultyLevel,
} from './database.js'

// Service types
export type {
  TypedSupabaseClient,
  ServiceResponse,
  ServiceError,
  AuthCredentials,
  SignupData,
  AuthUser,
  UserProfile,
  UserMetrics,
  UserGoalsCalculation,
  RecipeWithNutrition,
  NutritionInfo,
  RecipeSearchFilters,
  RecipeSortOptions,
  PaginationOptions,
  PaginatedResponse,
  UserSearchFilters,
  UserSortOptions,
  NutritionCalculationRequest,
  NutritionCalculationResponse,
  ServiceConfig,
  ValidationContext,
  DeepPartial,
  RequiredFields,
} from './service.js'

export { ErrorCodes, HttpStatusCodes } from './service.js'

// API types
export type {
  ApiResponse,
  ApiError,
  ApiPaginationQuery,
  ApiSearchQuery,
  ApiSortQuery,
  ApiQuery,
  ValidationResult,
  ValidationError,
  AuthApiRequest,
  SignupApiRequest,
  AuthApiResponse,
  UserApiResponse,
  UserUpdateApiRequest,
  RecipeApiResponse,
  RecipeCreateApiRequest,
  RecipeUpdateApiRequest,
  RecipeSearchApiQuery,
  NutritionGoalsApiResponse,
  NutritionGoalsApiRequest,
  NutritionCalculationApiRequest,
  NutritionCalculationApiResponse,
  HealthCheckApiResponse,
  ServiceToApiResponse,
  ServiceToApiError,
  PaginatedApiResponse,
  RequestContext,
  AuthenticatedRequestContext,
} from './api.js'