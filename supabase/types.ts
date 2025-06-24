// =============================================
// NutriCoach Database Types
// =============================================
// Generated TypeScript types for Supabase schema
// Use with: supabase gen types typescript

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          age: number | null;
          gender: 'male' | 'female' | 'other' | null;
          height_cm: number | null;
          weight_kg: number | null;
          activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active' | null;
          primary_goal: 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'maintenance' | 'anti_inflammatory' | null;
          health_conditions: string[] | null;
          dietary_preferences: string[] | null;
          food_allergies: string[] | null;
          disliked_foods: string[] | null;
          daily_calories_target: number | null;
          daily_protein_target_g: number | null;
          daily_carbs_target_g: number | null;
          daily_fat_target_g: number | null;
          daily_fiber_target_g: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          age?: number | null;
          gender?: 'male' | 'female' | 'other' | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active' | null;
          primary_goal?: 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'maintenance' | 'anti_inflammatory' | null;
          health_conditions?: string[] | null;
          dietary_preferences?: string[] | null;
          food_allergies?: string[] | null;
          disliked_foods?: string[] | null;
          daily_calories_target?: number | null;
          daily_protein_target_g?: number | null;
          daily_carbs_target_g?: number | null;
          daily_fat_target_g?: number | null;
          daily_fiber_target_g?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          age?: number | null;
          gender?: 'male' | 'female' | 'other' | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active' | null;
          primary_goal?: 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'maintenance' | 'anti_inflammatory' | null;
          health_conditions?: string[] | null;
          dietary_preferences?: string[] | null;
          food_allergies?: string[] | null;
          disliked_foods?: string[] | null;
          daily_calories_target?: number | null;
          daily_protein_target_g?: number | null;
          daily_carbs_target_g?: number | null;
          daily_fat_target_g?: number | null;
          daily_fiber_target_g?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ingredients: {
        Row: {
          id: string;
          name: string;
          name_scientific: string | null;
          category: 'vegetables' | 'fruits' | 'grains' | 'legumes' | 'nuts_seeds' | 'proteins' | 'dairy' | 'fats_oils' | 'herbs_spices' | 'beverages' | 'other';
          calories_per_100g: number;
          protein_g_per_100g: number;
          carbs_g_per_100g: number;
          fat_g_per_100g: number;
          fiber_g_per_100g: number;
          sugar_g_per_100g: number;
          sodium_mg_per_100g: number;
          vitamin_c_mg_per_100g: number | null;
          vitamin_d_mcg_per_100g: number | null;
          vitamin_e_mg_per_100g: number | null;
          omega3_g_per_100g: number | null;
          omega6_g_per_100g: number | null;
          anti_inflammatory_score: number | null;
          antioxidant_compounds: string[] | null;
          glycemic_index: number | null;
          common_serving_sizes: Record<string, any> | null;
          storage_tips: string | null;
          seasonality: string[] | null;
          data_source: string;
          verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_scientific?: string | null;
          category: 'vegetables' | 'fruits' | 'grains' | 'legumes' | 'nuts_seeds' | 'proteins' | 'dairy' | 'fats_oils' | 'herbs_spices' | 'beverages' | 'other';
          calories_per_100g: number;
          protein_g_per_100g?: number;
          carbs_g_per_100g?: number;
          fat_g_per_100g?: number;
          fiber_g_per_100g?: number;
          sugar_g_per_100g?: number;
          sodium_mg_per_100g?: number;
          vitamin_c_mg_per_100g?: number | null;
          vitamin_d_mcg_per_100g?: number | null;
          vitamin_e_mg_per_100g?: number | null;
          omega3_g_per_100g?: number | null;
          omega6_g_per_100g?: number | null;
          anti_inflammatory_score?: number | null;
          antioxidant_compounds?: string[] | null;
          glycemic_index?: number | null;
          common_serving_sizes?: Record<string, any> | null;
          storage_tips?: string | null;
          seasonality?: string[] | null;
          data_source?: string;
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          name_scientific?: string | null;
          category?: 'vegetables' | 'fruits' | 'grains' | 'legumes' | 'nuts_seeds' | 'proteins' | 'dairy' | 'fats_oils' | 'herbs_spices' | 'beverages' | 'other';
          calories_per_100g?: number;
          protein_g_per_100g?: number;
          carbs_g_per_100g?: number;
          fat_g_per_100g?: number;
          fiber_g_per_100g?: number;
          sugar_g_per_100g?: number;
          sodium_mg_per_100g?: number;
          vitamin_c_mg_per_100g?: number | null;
          vitamin_d_mcg_per_100g?: number | null;
          vitamin_e_mg_per_100g?: number | null;
          omega3_g_per_100g?: number | null;
          omega6_g_per_100g?: number | null;
          anti_inflammatory_score?: number | null;
          antioxidant_compounds?: string[] | null;
          glycemic_index?: number | null;
          common_serving_sizes?: Record<string, any> | null;
          storage_tips?: string | null;
          seasonality?: string[] | null;
          data_source?: string;
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      recipes: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          instructions: string;
          servings: number;
          prep_time_minutes: number | null;
          cook_time_minutes: number | null;
          difficulty_level: 'easy' | 'medium' | 'hard' | null;
          meal_type: string[];
          cuisine_type: string | null;
          dietary_tags: string[] | null;
          anti_inflammatory_score: number | null;
          inflammation_category: 'anti_inflammatory' | 'neutral' | 'inflammatory' | null;
          calories_per_serving: number | null;
          protein_g_per_serving: number | null;
          carbs_g_per_serving: number | null;
          fat_g_per_serving: number | null;
          fiber_g_per_serving: number | null;
          image_url: string | null;
          video_url: string | null;
          created_by: string | null;
          is_public: boolean;
          rating_average: number | null;
          rating_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          instructions: string;
          servings: number;
          prep_time_minutes?: number | null;
          cook_time_minutes?: number | null;
          difficulty_level?: 'easy' | 'medium' | 'hard' | null;
          meal_type: string[];
          cuisine_type?: string | null;
          dietary_tags?: string[] | null;
          anti_inflammatory_score?: number | null;
          inflammation_category?: 'anti_inflammatory' | 'neutral' | 'inflammatory' | null;
          calories_per_serving?: number | null;
          protein_g_per_serving?: number | null;
          carbs_g_per_serving?: number | null;
          fat_g_per_serving?: number | null;
          fiber_g_per_serving?: number | null;
          image_url?: string | null;
          video_url?: string | null;
          created_by?: string | null;
          is_public?: boolean;
          rating_average?: number | null;
          rating_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          instructions?: string;
          servings?: number;
          prep_time_minutes?: number | null;
          cook_time_minutes?: number | null;
          difficulty_level?: 'easy' | 'medium' | 'hard' | null;
          meal_type?: string[];
          cuisine_type?: string | null;
          dietary_tags?: string[] | null;
          anti_inflammatory_score?: number | null;
          inflammation_category?: 'anti_inflammatory' | 'neutral' | 'inflammatory' | null;
          calories_per_serving?: number | null;
          protein_g_per_serving?: number | null;
          carbs_g_per_serving?: number | null;
          fat_g_per_serving?: number | null;
          fiber_g_per_serving?: number | null;
          image_url?: string | null;
          video_url?: string | null;
          created_by?: string | null;
          is_public?: boolean;
          rating_average?: number | null;
          rating_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      recipe_ingredients: {
        Row: {
          id: string;
          recipe_id: string;
          ingredient_id: string;
          quantity: number;
          unit: string;
          quantity_in_grams: number | null;
          preparation_notes: string | null;
          ingredient_order: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          ingredient_id: string;
          quantity: number;
          unit: string;
          quantity_in_grams?: number | null;
          preparation_notes?: string | null;
          ingredient_order?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipe_id?: string;
          ingredient_id?: string;
          quantity?: number;
          unit?: string;
          quantity_in_grams?: number | null;
          preparation_notes?: string | null;
          ingredient_order?: number | null;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          type: 'ingredient' | 'recipe' | 'health_condition' | 'dietary_preference';
          description: string | null;
          icon: string | null;
          color: string | null;
          parent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: 'ingredient' | 'recipe' | 'health_condition' | 'dietary_preference';
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          parent_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: 'ingredient' | 'recipe' | 'health_condition' | 'dietary_preference';
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          parent_id?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      calculate_recipe_nutrition: {
        Args: {
          recipe_uuid: string;
        };
        Returns: Record<string, any>;
      };
      calculate_recipe_anti_inflammatory_score: {
        Args: {
          recipe_uuid: string;
        };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// =============================================
// Helper Types for Frontend Usage
// =============================================

export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

export type Ingredient = Database['public']['Tables']['ingredients']['Row'];
export type IngredientInsert = Database['public']['Tables']['ingredients']['Insert'];
export type IngredientUpdate = Database['public']['Tables']['ingredients']['Update'];

export type Recipe = Database['public']['Tables']['recipes']['Row'];
export type RecipeInsert = Database['public']['Tables']['recipes']['Insert'];
export type RecipeUpdate = Database['public']['Tables']['recipes']['Update'];

export type RecipeIngredient = Database['public']['Tables']['recipe_ingredients']['Row'];
export type RecipeIngredientInsert = Database['public']['Tables']['recipe_ingredients']['Insert'];
export type RecipeIngredientUpdate = Database['public']['Tables']['recipe_ingredients']['Update'];

export type Category = Database['public']['Tables']['categories']['Row'];
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
export type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

// =============================================
// Composite Types for Complex Queries
// =============================================

export interface RecipeWithIngredients extends Recipe {
  recipe_ingredients: (RecipeIngredient & {
    ingredients: Ingredient;
  })[];
}

export interface IngredientWithNutrition extends Ingredient {
  nutrition_per_serving?: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  };
}

export interface UserProfileWithPreferences extends UserProfile {
  preferred_recipes?: Recipe[];
  avoided_ingredients?: Ingredient[];
}

// =============================================
// Enums for Type Safety
// =============================================

export enum ActivityLevel {
  SEDENTARY = 'sedentary',
  LIGHTLY_ACTIVE = 'lightly_active',
  MODERATELY_ACTIVE = 'moderately_active',
  VERY_ACTIVE = 'very_active',
  EXTRA_ACTIVE = 'extra_active',
}

export enum PrimaryGoal {
  WEIGHT_LOSS = 'weight_loss',
  WEIGHT_GAIN = 'weight_gain',
  MUSCLE_GAIN = 'muscle_gain',
  MAINTENANCE = 'maintenance',
  ANTI_INFLAMMATORY = 'anti_inflammatory',
}

export enum IngredientCategory {
  VEGETABLES = 'vegetables',
  FRUITS = 'fruits',
  GRAINS = 'grains',
  LEGUMES = 'legumes',
  NUTS_SEEDS = 'nuts_seeds',
  PROTEINS = 'proteins',
  DAIRY = 'dairy',
  FATS_OILS = 'fats_oils',
  HERBS_SPICES = 'herbs_spices',
  BEVERAGES = 'beverages',
  OTHER = 'other',
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum InflammationCategory {
  ANTI_INFLAMMATORY = 'anti_inflammatory',
  NEUTRAL = 'neutral',
  INFLAMMATORY = 'inflammatory',
}

// =============================================
// Utility Types
// =============================================

export interface NutritionData {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g?: number;
  sodium_mg?: number;
}

export interface AntiInflammatoryData {
  score: number;
  category: InflammationCategory;
  compounds: string[];
}

export interface ServingSize {
  description: string;
  grams: number;
}

// =============================================
// API Response Types
// =============================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  count?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Search and filter types
export interface IngredientFilters {
  category?: IngredientCategory[];
  anti_inflammatory_score_min?: number;
  anti_inflammatory_score_max?: number;
  verified_only?: boolean;
  search_term?: string;
}

export interface RecipeFilters {
  meal_type?: string[];
  dietary_tags?: string[];
  difficulty_level?: DifficultyLevel[];
  prep_time_max?: number;
  anti_inflammatory_only?: boolean;
  search_term?: string;
}

// =============================================
// Frontend Integration Helpers
// =============================================

export const DIETARY_PREFERENCES = [
  'vegetarian',
  'vegan',
  'gluten_free',
  'dairy_free',
  'keto',
  'mediterranean',
  'paleo',
  'low_carb',
  'high_protein',
] as const;

export const COMMON_ALLERGIES = [
  'nuts',
  'shellfish',
  'eggs',
  'soy',
  'wheat',
  'dairy',
  'fish',
  'sesame',
] as const;

export const HEALTH_CONDITIONS = [
  'arthritis',
  'diabetes',
  'hypertension',
  'heart_disease',
  'autoimmune',
  'ibs',
  'crohns',
  'fibromyalgia',
] as const;

export type DietaryPreference = typeof DIETARY_PREFERENCES[number];
export type CommonAllergy = typeof COMMON_ALLERGIES[number];
export type HealthCondition = typeof HEALTH_CONDITIONS[number];