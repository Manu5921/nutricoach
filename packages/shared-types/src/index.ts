// Shared Types for NutriCoach Ecosystem

// =============================================================================
// USER & PROFILE TYPES
// =============================================================================

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  nutritionGoals: NutritionGoals;
  restrictions: string[];
  preferences: string[];
  healthConditions?: string[];
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  createdAt: Date;
  updatedAt: Date;
}

export interface NutritionGoals {
  calories: number;
  macros: MacronutrientProfile;
  micronutrients?: Record<string, number>;
  hydration?: number; // ml per day
  objectives: ('weight-loss' | 'weight-gain' | 'maintenance' | 'muscle-gain' | 'health')[];
}

export interface MacronutrientProfile {
  protein: number; // percentage of total calories
  carbs: number;
  fat: number;
}

// =============================================================================
// RECIPE & NUTRITION TYPES
// =============================================================================

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: NutritionInfo;
  servings: number;
  prepTime: number; // minutes
  cookTime: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
  mealTypes: ('breakfast' | 'lunch' | 'dinner' | 'snack' | 'any')[];
  tags: string[];
  cuisine?: string;
  imageUrl?: string;
  rating?: number;
  antiInflammatoryScore: number; // 1-10
  popularityScore?: number;
  micronutrients?: Record<string, number>;
  allergens: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  nutrition?: NutritionInfo;
  cost?: number;
  season?: string[];
}

export interface NutritionInfo {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber?: number; // grams
  sugar?: number; // grams
  sodium?: number; // mg
  cholesterol?: number; // mg
}

// =============================================================================
// MEAL PLAN TYPES
// =============================================================================

export interface MealPlan {
  id: string;
  userId: string;
  title: string;
  description: string;
  duration: number; // days
  days: MealPlanDay[];
  nutrition: PlanNutrition;
  constraints: PlanConstraints;
  shoppingList?: ShoppingListItem[];
  cost?: PlanCost;
  createdAt: Date;
  updatedAt: Date;
}

export interface MealPlanDay {
  day: number;
  date?: Date;
  meals: PlannedMeal[];
  nutrition: DayNutrition;
  notes?: string;
}

export interface PlannedMeal {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipe: Recipe;
  portion: number; // multiplier for recipe servings
  scheduledTime?: string; // HH:MM
  completed?: boolean;
  notes?: string;
}

export interface PlanNutrition {
  averageCalories: number;
  averageMacros: MacronutrientProfile;
  averageMicronutrients: Record<string, number>;
  antiInflammatoryScore: number;
  diversityScore: number;
  complianceScore: number;
}

export interface DayNutrition {
  totalCalories: number;
  macros: MacronutrientProfile;
  micronutrients: Record<string, number>;
  antiInflammatoryScore: number;
  mealDistribution: Record<string, number>;
}

export interface PlanConstraints {
  calories: { min: number; max: number; target: number };
  macros: MacronutrientProfile;
  restrictions: string[];
  preferences: string[];
  antiInflammatory: boolean;
  budget?: { min: number; max: number };
  cookingTime?: { max: number };
  difficulty?: ('easy' | 'medium' | 'hard')[];
}

export interface PlanCost {
  total: number;
  perDay: number;
  perMeal: number;
  currency: string;
  breakdown: { category: string; amount: number }[];
}

// =============================================================================
// SHOPPING & LOGISTICS TYPES
// =============================================================================

export interface ShoppingListItem {
  ingredient: Ingredient;
  totalQuantity: number;
  estimatedCost?: number;
  category: string;
  priority: 'high' | 'medium' | 'low';
  alternatives?: string[];
  notes?: string;
}

export interface ShoppingList {
  id: string;
  planId: string;
  userId: string;
  items: ShoppingListItem[];
  totalCost?: number;
  stores?: ShoppingStore[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ShoppingStore {
  name: string;
  location?: string;
  items: string[]; // ingredient IDs
  estimatedCost: number;
  travelTime?: number;
}

// =============================================================================
// CONTENT & BLOG TYPES
// =============================================================================

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  author: Author;
  category: BlogCategory;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  seo: SEOMetadata;
  readingTime: number; // minutes
  views: number;
  likes: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Author {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  expertise: string[];
  social?: Record<string, string>;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  color?: string;
  icon?: string;
}

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonicalUrl?: string;
  schema?: Record<string, any>;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ListResponse<T> {
  items: T[];
  total: number;
  filters?: Record<string, any>;
  sorting?: { field: string; direction: 'asc' | 'desc' };
}

// =============================================================================
// NOTIFICATION & COMMUNICATION TYPES
// =============================================================================

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  category: string;
  active: boolean;
}

// =============================================================================
// ANALYTICS & TRACKING TYPES
// =============================================================================

export interface UserAnalytics {
  userId: string;
  metrics: {
    plansGenerated: number;
    recipesViewed: number;
    mealsCompleted: number;
    articlesRead: number;
    avgEngagementTime: number;
  };
  preferences: {
    favoriteRecipes: string[];
    favoriteCategories: string[];
    avgMealPrepTime: number;
    preferredDifficulty: string;
  };
  health: {
    weightLog?: { date: Date; weight: number }[];
    energyLevel?: { date: Date; level: number }[];
    adherenceScore: number;
  };
  lastActiveAt: Date;
  createdAt: Date;
}

export interface SystemMetrics {
  timestamp: Date;
  activeUsers: number;
  plansGenerated: number;
  recipesInDatabase: number;
  avgResponseTime: number;
  errorRate: number;
  popularTags: { tag: string; count: number }[];
  topRecipes: { recipeId: string; viewCount: number }[];
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type ID = string;
export type Timestamp = Date;
export type Currency = 'EUR' | 'USD' | 'GBP' | 'CAD';
export type Language = 'fr' | 'en' | 'es' | 'de' | 'it';
export type Theme = 'light' | 'dark' | 'auto';

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface Identifiable {
  id: string;
}

export interface Searchable {
  searchableContent: string;
  searchableKeywords: string[];
}

export interface Taggable {
  tags: string[];
}

export interface Rateable {
  rating: number;
  ratingCount: number;
}

// =============================================================================
// FORM & VALIDATION TYPES
// =============================================================================

export interface FormField {
  name: string;
  type: 'text' | 'email' | 'number' | 'select' | 'checkbox' | 'textarea' | 'file';
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => string | null;
  };
  options?: { value: string; label: string }[];
  defaultValue?: any;
  helpText?: string;
}

export interface FormData {
  [key: string]: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  data?: FormData;
}

// =============================================================================
// EXPORT COLLECTIONS
// =============================================================================

// User related exports
export type UserTypes = UserProfile | NutritionGoals | MacronutrientProfile;

// Recipe related exports
export type RecipeTypes = Recipe | Ingredient | NutritionInfo;

// Meal plan related exports
export type MealPlanTypes = MealPlan | MealPlanDay | PlannedMeal | PlanNutrition;

// Content related exports
export type ContentTypes = BlogPost | Author | BlogCategory | SEOMetadata;

// API related exports
export type ApiTypes = ApiResponse | ApiError | PaginatedResponse<any> | ListResponse<any>;

// All types combined
export type AllTypes = UserTypes | RecipeTypes | MealPlanTypes | ContentTypes | ApiTypes;