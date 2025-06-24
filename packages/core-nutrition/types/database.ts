/**
 * Database Type Definitions
 * Auto-generated from Supabase schema - DO NOT EDIT MANUALLY
 */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
          // Profile information
          first_name?: string
          last_name?: string
          date_of_birth?: string
          phone?: string
          avatar_url?: string
          // Nutrition metrics
          height_cm?: number
          weight_kg?: number
          gender?: 'male' | 'female' | 'other'
          activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
          // Goals
          goal_type?: 'lose_weight' | 'maintain_weight' | 'gain_weight' | 'gain_muscle'
          target_weight_kg?: number
          // Preferences
          dietary_restrictions?: string[]
          allergies?: string[]
          cuisine_preferences?: string[]
          // Privacy
          is_profile_public: boolean
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
          first_name?: string
          last_name?: string
          date_of_birth?: string
          phone?: string
          avatar_url?: string
          height_cm?: number
          weight_kg?: number
          gender?: 'male' | 'female' | 'other'
          activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
          goal_type?: 'lose_weight' | 'maintain_weight' | 'gain_weight' | 'gain_muscle'
          target_weight_kg?: number
          dietary_restrictions?: string[]
          allergies?: string[]
          cuisine_preferences?: string[]
          is_profile_public?: boolean
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
          first_name?: string
          last_name?: string
          date_of_birth?: string
          phone?: string
          avatar_url?: string
          height_cm?: number
          weight_kg?: number
          gender?: 'male' | 'female' | 'other'
          activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
          goal_type?: 'lose_weight' | 'maintain_weight' | 'gain_weight' | 'gain_muscle'
          target_weight_kg?: number
          dietary_restrictions?: string[]
          allergies?: string[]
          cuisine_preferences?: string[]
          is_profile_public?: boolean
        }
      }
      recipes: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          // Basic info
          title: string
          description?: string
          image_url?: string
          // Recipe details
          ingredients: RecipeIngredient[]
          instructions: string[]
          // Time and servings
          prep_time_minutes?: number
          cook_time_minutes?: number
          total_time_minutes?: number
          servings: number
          // Nutrition (calculated)
          calories_per_serving?: number
          protein_g?: number
          carbs_g?: number
          fat_g?: number
          fiber_g?: number
          sugar_g?: number
          sodium_mg?: number
          // Categorization
          cuisine_type?: string
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert'
          dietary_tags?: string[]
          difficulty_level?: 'easy' | 'medium' | 'hard'
          // Visibility
          is_public: boolean
          // Engagement
          likes_count: number
          rating_average?: number
          rating_count: number
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
          title: string
          description?: string
          image_url?: string
          ingredients: RecipeIngredient[]
          instructions: string[]
          prep_time_minutes?: number
          cook_time_minutes?: number
          total_time_minutes?: number
          servings: number
          calories_per_serving?: number
          protein_g?: number
          carbs_g?: number
          fat_g?: number
          fiber_g?: number
          sugar_g?: number
          sodium_mg?: number
          cuisine_type?: string
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert'
          dietary_tags?: string[]
          difficulty_level?: 'easy' | 'medium' | 'hard'
          is_public?: boolean
          likes_count?: number
          rating_average?: number
          rating_count?: number
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string
          image_url?: string
          ingredients?: RecipeIngredient[]
          instructions?: string[]
          prep_time_minutes?: number
          cook_time_minutes?: number
          total_time_minutes?: number
          servings?: number
          calories_per_serving?: number
          protein_g?: number
          carbs_g?: number
          fat_g?: number
          fiber_g?: number
          sugar_g?: number
          sodium_mg?: number
          cuisine_type?: string
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert'
          dietary_tags?: string[]
          difficulty_level?: 'easy' | 'medium' | 'hard'
          is_public?: boolean
          likes_count?: number
          rating_average?: number
          rating_count?: number
        }
      }
      nutrition_goals: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          // Daily targets
          target_calories: number
          target_protein_g: number
          target_carbs_g: number
          target_fat_g: number
          target_fiber_g?: number
          target_sugar_g?: number
          target_sodium_mg?: number
          // Calculated values
          bmr?: number
          tdee?: number
          // Goal settings
          weekly_weight_change_kg?: number
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
          target_calories: number
          target_protein_g: number
          target_carbs_g: number
          target_fat_g: number
          target_fiber_g?: number
          target_sugar_g?: number
          target_sodium_mg?: number
          bmr?: number
          tdee?: number
          weekly_weight_change_kg?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          target_calories?: number
          target_protein_g?: number
          target_carbs_g?: number
          target_fat_g?: number
          target_fiber_g?: number
          target_sugar_g?: number
          target_sodium_mg?: number
          bmr?: number
          tdee?: number
          weekly_weight_change_kg?: number
          is_active?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Additional type definitions
export interface RecipeIngredient {
  name: string
  amount: number
  unit: string
  notes?: string
  // Nutrition per unit (optional, for calculation)
  calories_per_unit?: number
  protein_g_per_unit?: number
  carbs_g_per_unit?: number
  fat_g_per_unit?: number
}

// Type aliases for convenience
export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type Recipe = Database['public']['Tables']['recipes']['Row']
export type RecipeInsert = Database['public']['Tables']['recipes']['Insert']
export type RecipeUpdate = Database['public']['Tables']['recipes']['Update']

export type NutritionGoals = Database['public']['Tables']['nutrition_goals']['Row']
export type NutritionGoalsInsert = Database['public']['Tables']['nutrition_goals']['Insert']
export type NutritionGoalsUpdate = Database['public']['Tables']['nutrition_goals']['Update']

// Enums
export type Gender = 'male' | 'female' | 'other'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type GoalType = 'lose_weight' | 'maintain_weight' | 'gain_weight' | 'gain_muscle'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert'
export type DifficultyLevel = 'easy' | 'medium' | 'hard'