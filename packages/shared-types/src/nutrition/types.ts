/**
 * Nutrition-specific types and interfaces
 */

import { BaseEntity, TimestampedEntity, TaggableEntity, ImageInfo } from '../common/base.js';

/**
 * Basic nutrition information
 */
export interface NutritionInfo {
  calories: number;
  protein: number; // grams
  carbohydrates: number; // grams
  fat: number; // grams
  fiber: number; // grams
  sugar?: number; // grams
  sodium?: number; // mg
  cholesterol?: number; // mg
  saturatedFat?: number; // grams
  transFat?: number; // grams
  unsaturatedFat?: number; // grams
  potassium?: number; // mg
  calcium?: number; // mg
  iron?: number; // mg
  vitaminA?: number; // mcg
  vitaminC?: number; // mg
  vitaminD?: number; // mcg
  vitaminE?: number; // mg
  vitaminK?: number; // mcg
  thiamine?: number; // mg (B1)
  riboflavin?: number; // mg (B2)
  niacin?: number; // mg (B3)
  vitaminB6?: number; // mg
  folate?: number; // mcg
  vitaminB12?: number; // mcg
  biotin?: number; // mcg
  pantothenicAcid?: number; // mg (B5)
  phosphorus?: number; // mg
  magnesium?: number; // mg
  zinc?: number; // mg
  selenium?: number; // mcg
  copper?: number; // mg
  manganese?: number; // mg
  chromium?: number; // mcg
  molybdenum?: number; // mcg
  iodine?: number; // mcg
}

/**
 * Detailed nutrition facts (like food labels)
 */
export interface NutritionFacts extends NutritionInfo {
  servingSize: {
    amount: number;
    unit: string;
    description?: string;
  };
  servingsPerContainer?: number;
  dailyValues?: {
    [key in keyof NutritionInfo]?: number; // Percentage of daily value
  };
}

/**
 * Personal metrics for nutrition calculations
 */
export interface PersonalMetrics {
  age: number;
  gender: 'male' | 'female' | 'other';
  weight: number; // kg
  height: number; // cm
  activityLevel: ActivityLevel;
  bodyFatPercentage?: number;
  muscleMassPercentage?: number;
  metabolicRate?: number; // BMR in calories
}

export type ActivityLevel = 
  | 'sedentary'      // Little to no exercise
  | 'light'          // Light exercise 1-3 days/week
  | 'moderate'       // Moderate exercise 3-5 days/week
  | 'active'         // Heavy exercise 6-7 days/week
  | 'very_active';   // Very heavy exercise, physical job

/**
 * Nutrition goals and targets
 */
export interface NutritionGoals {
  goalType: GoalType;
  targetWeight?: number; // kg
  targetWeightChange?: number; // kg per week (positive for gain, negative for loss)
  targetDate?: string;
  targetBodyFat?: number; // percentage
  activityLevel: ActivityLevel;
  dietaryApproach?: DietaryApproach;
  calorieCycling?: boolean;
  restrictions: string[];
  allergies: string[];
  preferences: string[];
}

export type GoalType = 
  | 'weight_loss'
  | 'weight_gain'
  | 'maintenance'
  | 'muscle_gain'
  | 'fat_loss'
  | 'endurance'
  | 'strength'
  | 'health';

export type DietaryApproach = 
  | 'standard'
  | 'keto'
  | 'low_carb'
  | 'high_protein'
  | 'mediterranean'
  | 'paleo'
  | 'vegan'
  | 'vegetarian'
  | 'intermittent_fasting'
  | 'custom';

/**
 * Macro targets and distribution
 */
export interface MacroTargets {
  calories: number;
  protein: number; // grams
  carbohydrates: number; // grams
  fat: number; // grams
  fiber: number; // grams
  distribution: {
    protein: number; // percentage
    carbohydrates: number; // percentage
    fat: number; // percentage
  };
}

/**
 * Daily nutrition targets
 */
export interface DailyNutritionTargets extends MacroTargets {
  micronutrients: Partial<NutritionInfo>;
  hydration: number; // liters
  timing?: MealTiming;
}

/**
 * Meal timing and distribution
 */
export interface MealTiming {
  mealsPerDay: number;
  distribution: {
    [key in MealType]?: number; // percentage of daily calories
  };
  preworkout?: Partial<MacroTargets>;
  postworkout?: Partial<MacroTargets>;
  schedule?: {
    [key in MealType]?: string; // Time in HH:MM format
  };
}

export type MealType = 
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'pre_workout'
  | 'post_workout'
  | 'morning_snack'
  | 'afternoon_snack'
  | 'evening_snack';

/**
 * Food and ingredient types
 */
export interface Food extends BaseEntity, TaggableEntity {
  name: string;
  description?: string;
  brand?: string;
  barcode?: string;
  category: FoodCategory;
  nutrition: NutritionFacts;
  allergens: string[];
  certifications: string[]; // organic, non-gmo, etc.
  images: ImageInfo[];
  verified: boolean;
  dataSource: string;
}

export type FoodCategory = 
  | 'protein'
  | 'dairy'
  | 'grains'
  | 'vegetables'
  | 'fruits'
  | 'nuts_seeds'
  | 'oils_fats'
  | 'beverages'
  | 'snacks'
  | 'condiments'
  | 'spices'
  | 'supplements'
  | 'prepared_foods'
  | 'other';

/**
 * Recipe types
 */
export interface Recipe extends BaseEntity, TaggableEntity {
  name: string;
  description: string;
  summary?: string;
  author: string;
  servings: number;
  difficulty: DifficultyLevel;
  prepTime: number; // minutes
  cookTime: number; // minutes
  totalTime: number; // minutes
  cuisine: string;
  mealTypes: MealType[];
  dietaryTags: string[];
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  nutrition: NutritionInfo;
  images: ImageInfo[];
  rating?: number;
  reviewCount?: number;
  featured: boolean;
  verified: boolean;
}

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface RecipeIngredient {
  id: string;
  foodId: string;
  name: string;
  amount: number;
  unit: string;
  preparation?: string; // "diced", "chopped", etc.
  optional: boolean;
  alternatives?: string[];
  notes?: string;
}

export interface RecipeInstruction {
  step: number;
  instruction: string;
  duration?: number; // minutes
  temperature?: number; // celsius
  equipment?: string[];
  tips?: string;
  images?: ImageInfo[];
}

/**
 * Meal planning types
 */
export interface MealPlan extends BaseEntity {
  name: string;
  description?: string;
  userId: string;
  startDate: string;
  endDate: string;
  targetNutrition: DailyNutritionTargets;
  days: MealPlanDay[];
  shoppingList?: ShoppingListItem[];
  adherenceScore?: number;
  notes?: string;
}

export interface MealPlanDay {
  date: string;
  meals: {
    [key in MealType]?: MealPlanMeal;
  };
  totalNutrition: NutritionInfo;
  waterIntake?: number; // liters
  notes?: string;
}

export interface MealPlanMeal {
  recipes: MealPlanRecipe[];
  totalNutrition: NutritionInfo;
  notes?: string;
}

export interface MealPlanRecipe {
  recipeId: string;
  recipe: Recipe;
  servings: number;
  adjustments?: {
    [ingredientId: string]: {
      amount: number;
      unit: string;
    };
  };
}

export interface ShoppingListItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: FoodCategory;
  purchased: boolean;
  notes?: string;
  estimatedCost?: number;
  recipeIds: string[];
}

/**
 * Nutrition tracking types
 */
export interface NutritionEntry extends BaseEntity {
  userId: string;
  date: string;
  mealType: MealType;
  foods: NutritionEntryFood[];
  totalNutrition: NutritionInfo;
  notes?: string;
}

export interface NutritionEntryFood {
  foodId: string;
  food: Food;
  amount: number;
  unit: string;
  nutrition: NutritionInfo;
  notes?: string;
}

export interface DailyNutritionSummary {
  date: string;
  userId: string;
  targetNutrition: DailyNutritionTargets;
  actualNutrition: NutritionInfo;
  adherence: {
    calories: number; // percentage
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    overall: number;
  };
  meals: {
    [key in MealType]?: NutritionInfo;
  };
  waterIntake: number;
  notes?: string;
}

/**
 * Nutrition analysis types
 */
export interface NutritionAnalysis {
  period: {
    start: string;
    end: string;
  };
  averages: NutritionInfo;
  targets: DailyNutritionTargets;
  adherence: {
    overall: number;
    calories: number;
    macros: number;
    micros: number;
  };
  trends: {
    [key in keyof NutritionInfo]?: {
      direction: 'up' | 'down' | 'stable';
      change: number; // percentage
    };
  };
  recommendations: string[];
}

/**
 * Supplement types
 */
export interface Supplement extends BaseEntity, TaggableEntity {
  name: string;
  description: string;
  brand: string;
  form: SupplementForm;
  servingSize: {
    amount: number;
    unit: string;
  };
  nutrition: Partial<NutritionInfo>;
  ingredients: string[];
  allergens: string[];
  certifications: string[];
  dosageInstructions: string;
  warnings?: string[];
  thirdPartyTested: boolean;
  images: ImageInfo[];
}

export type SupplementForm = 
  | 'capsule'
  | 'tablet'
  | 'powder'
  | 'liquid'
  | 'gummy'
  | 'soft_gel'
  | 'spray'
  | 'drops';

export interface SupplementSchedule extends BaseEntity {
  userId: string;
  supplementId: string;
  supplement: Supplement;
  dosage: {
    amount: number;
    unit: string;
  };
  frequency: SupplementFrequency;
  timing: string[]; // Times of day in HH:MM format
  duration?: {
    start: string;
    end?: string;
  };
  active: boolean;
  notes?: string;
}

export type SupplementFrequency = 
  | 'daily'
  | 'every_other_day'
  | 'weekly'
  | 'as_needed'
  | 'custom';

/**
 * Search and filter types
 */
export interface NutritionSearchFilters {
  calories?: {
    min?: number;
    max?: number;
  };
  protein?: {
    min?: number;
    max?: number;
  };
  carbs?: {
    min?: number;
    max?: number;
  };
  fat?: {
    min?: number;
    max?: number;
  };
  dietaryTags?: string[];
  allergens?: string[];
  mealTypes?: MealType[];
  difficulty?: DifficultyLevel[];
  prepTime?: {
    max?: number;
  };
  rating?: {
    min?: number;
  };
}

/**
 * Common nutrition constants
 */
export const CALORIES_PER_GRAM = {
  protein: 4,
  carbohydrates: 4,
  fat: 9,
  alcohol: 7,
} as const;

export const RECOMMENDED_DAILY_VALUES = {
  fiber: 25, // grams for adults
  sodium: 2300, // mg
  cholesterol: 300, // mg
  saturatedFat: 20, // grams (based on 2000 cal diet)
} as const;

export const BMR_FORMULAS = {
  mifflinStJeor: 'Most accurate for general population',
  harrisBenedict: 'Traditional formula',
  katchMcArdle: 'Best for lean individuals with known body fat %',
} as const;

/**
 * Utility types for nutrition
 */
export type NutritionMetric = keyof NutritionInfo;
export type MacroNutrient = 'protein' | 'carbohydrates' | 'fat';
export type MicroNutrient = Exclude<NutritionMetric, MacroNutrient | 'calories'>;

/**
 * Validation types
 */
export interface NutritionValidation {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
  }[];
  warnings: {
    field: string;
    message: string;
  }[];
}