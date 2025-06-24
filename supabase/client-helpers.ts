// =============================================
// NutriCoach Supabase Client Helpers
// =============================================
// Ready-to-use functions for frontend integration

import { createClient } from '@supabase/supabase-js'
import { Database } from './types'
import type { UserProfile } from './types' // Import UserProfile for internal use

// Initialize typed Supabase client
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Type exports for convenience
export type {
  UserProfile,
  Ingredient,
  Recipe,
  RecipeWithIngredients,
  RecipeIngredient,
  Category,
  Database
} from './types'

// =============================================
// INGREDIENT HELPERS
// =============================================

export const ingredientHelpers = {
  // Get top anti-inflammatory ingredients
  async getTopAntiInflammatory(limit = 10) {
    return await supabase
      .from('ingredients')
      .select('*')
      .gte('anti_inflammatory_score', 7)
      .order('anti_inflammatory_score', { ascending: false })
      .limit(limit)
  },

  // Search ingredients by name or category
  async searchIngredients(query: string, category?: string) {
    let queryBuilder = supabase
      .from('ingredients')
      .select('*')
      .ilike('name', `%${query}%`)
    
    if (category) {
      queryBuilder = queryBuilder.eq('category', category)
    }

    return await queryBuilder
      .order('anti_inflammatory_score', { ascending: false })
      .limit(20)
  },

  // Get ingredients by category
  async getByCategory(category: string) {
    return await supabase
      .from('ingredients')
      .select('*')
      .eq('category', category)
      .order('name')
  },

  // Get detailed nutrition for ingredient
  async getNutritionDetails(ingredientId: string) {
    return await supabase
      .from('ingredients')
      .select(`
        *,
        common_serving_sizes,
        antioxidant_compounds
      `)
      .eq('id', ingredientId)
      .single()
  }
}

// =============================================
// RECIPE HELPERS
// =============================================

export const recipeHelpers = {
  // Get recipes with complete ingredient details
  async getRecipeWithIngredients(recipeId: string) {
    return await supabase
      .from('recipes')
      .select(`
        *,
        recipe_ingredients (
          *,
          ingredients (*)
        )
      `)
      .eq('id', recipeId)
      .single()
  },

  // Search recipes by dietary preferences
  async getByDietaryPreferences(preferences: string[], antiInflammatoryOnly = false) {
    let queryBuilder = supabase
      .from('recipes')
      .select('*')
      .eq('is_public', true)

    // Filter by dietary tags
    for (const pref of preferences) {
      queryBuilder = queryBuilder.contains('dietary_tags', [pref])
    }

    // Filter by anti-inflammatory category if requested
    if (antiInflammatoryOnly) {
      queryBuilder = queryBuilder.eq('inflammation_category', 'anti_inflammatory')
    }

    return await queryBuilder
      .order('anti_inflammatory_score', { ascending: false })
      .limit(20)
  },

  // Get quick recipes (under 30 minutes)
  async getQuickRecipes(maxTime = 30) {
    return await supabase
      .from('recipes')
      .select('*')
      .lte('prep_time_minutes', maxTime)
      .eq('is_public', true)
      .order('prep_time_minutes')
  },

  // Get recipes by meal type
  async getByMealType(mealType: string) {
    return await supabase
      .from('recipes')
      .select('*')
      .contains('meal_type', [mealType])
      .eq('is_public', true)
      .order('rating_average', { ascending: false })
  },

  // Calculate recipe nutrition (using database function)
  async calculateNutrition(recipeId: string) {
    return await supabase.rpc('calculate_recipe_nutrition', {
      recipe_uuid: recipeId
    })
  },

  // Get recipes avoiding specific ingredients
  async getRecipesAvoidingIngredients(avoidIngredients: string[]) {
    // First get recipe IDs that contain avoided ingredients
    const { data: recipesToAvoid } = await supabase
      .from('recipe_ingredients')
      .select('recipe_id')
      .in('ingredient_id', avoidIngredients)

    const recipeIdsToAvoid = recipesToAvoid?.map(r => r.recipe_id) || []

    // Then get recipes that don't contain those IDs
    return await supabase
      .from('recipes')
      .select('*')
      .not('id', 'in', `(${recipeIdsToAvoid.join(',')})`)
      .eq('is_public', true)
      .order('anti_inflammatory_score', { ascending: false })
  }
}

// =============================================
// USER PROFILE HELPERS
// =============================================

export const userHelpers = {
  // Get current user's profile
  async getCurrentUserProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Not authenticated' }

    return await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
  },

  // Update user profile
  async updateProfile(updates: Partial<UserProfile>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    return await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
  },

  // Create initial profile for new user
  async createInitialProfile(userData: {
    email: string
    full_name?: string
    dietary_preferences?: string[]
    food_allergies?: string[]
    primary_goal?: string
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    return await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        email: userData.email,
        full_name: userData.full_name,
        dietary_preferences: userData.dietary_preferences || [],
        food_allergies: userData.food_allergies || [],
        primary_goal: userData.primary_goal || 'maintenance'
      })
      .select()
      .single()
  },

  // Get personalized recipe recommendations
  async getPersonalizedRecipes(limit = 10) {
    const { data: profile } = await this.getCurrentUserProfile()
    if (!profile.data) return { data: [], error: 'No profile found' }

    const userProfile = profile.data
    const preferences = userProfile.dietary_preferences || []
    const allergies = userProfile.food_allergies || []

    // Get recipes matching preferences and avoiding allergies
    return await recipeHelpers.getByDietaryPreferences(preferences, 
      userProfile.primary_goal === 'anti_inflammatory')
  }
}

// =============================================
// CATEGORY HELPERS
// =============================================

export const categoryHelpers = {
  // Get all categories by type
  async getByType(type: 'ingredient' | 'recipe' | 'health_condition' | 'dietary_preference') {
    return await supabase
      .from('categories')
      .select('*')
      .eq('type', type)
      .order('name')
  },

  // Get hierarchical categories (with parent-child relationships)
  async getHierarchical(type: string) {
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .eq('type', type)
      .order('name')

    if (!categories) return { data: [], error: 'No categories found' }

    // Group by parent
    const hierarchy = categories.reduce((acc, cat) => {
      if (!cat.parent_id) {
        acc.push({
          ...cat,
          children: categories.filter(c => c.parent_id === cat.id)
        })
      }
      return acc
    }, [] as any[])

    return { data: hierarchy, error: null }
  }
}

// =============================================
// SEARCH HELPERS
// =============================================

export const searchHelpers = {
  // Global search across ingredients and recipes
  async globalSearch(query: string) {
    const [ingredientsResult, recipesResult] = await Promise.all([
      ingredientHelpers.searchIngredients(query),
      supabase
        .from('recipes')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('is_public', true)
        .limit(10)
    ])

    return {
      ingredients: ingredientsResult.data || [],
      recipes: recipesResult.data || [],
      error: ingredientsResult.error || recipesResult.error
    }
  },

  // Advanced recipe filter
  async advancedRecipeFilter(filters: {
    dietary_tags?: string[]
    max_prep_time?: number
    difficulty_level?: string
    anti_inflammatory_only?: boolean
    search_term?: string
  }) {
    let queryBuilder = supabase
      .from('recipes')
      .select('*')
      .eq('is_public', true)

    // Apply filters
    if (filters.dietary_tags?.length) {
      for (const tag of filters.dietary_tags) {
        queryBuilder = queryBuilder.contains('dietary_tags', [tag])
      }
    }

    if (filters.max_prep_time) {
      queryBuilder = queryBuilder.lte('prep_time_minutes', filters.max_prep_time)
    }

    if (filters.difficulty_level) {
      queryBuilder = queryBuilder.eq('difficulty_level', filters.difficulty_level)
    }

    if (filters.anti_inflammatory_only) {
      queryBuilder = queryBuilder.eq('inflammation_category', 'anti_inflammatory')
    }

    if (filters.search_term) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${filters.search_term}%,description.ilike.%${filters.search_term}%`
      )
    }

    return await queryBuilder
      .order('anti_inflammatory_score', { ascending: false })
      .limit(20)
  }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

export const utils = {
  // Calculate BMR and daily calorie needs
  calculateDailyCalories(profile: {
    age: number
    gender: 'male' | 'female'
    height_cm: number
    weight_kg: number
    activity_level: string
  }) {
    // Mifflin-St Jeor Equation
    let bmr: number
    if (profile.gender === 'male') {
      bmr = 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age + 5
    } else {
      bmr = 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age - 161
    }

    // Activity multipliers
    const activityMultipliers = {
      'sedentary': 1.2,
      'lightly_active': 1.375,
      'moderately_active': 1.55,
      'very_active': 1.725,
      'extra_active': 1.9
    }

    const multiplier = activityMultipliers[profile.activity_level as keyof typeof activityMultipliers] || 1.2
    return Math.round(bmr * multiplier)
  },

  // Format nutrition values for display
  formatNutrition(value: number, unit: string, decimals = 1) {
    return `${value.toFixed(decimals)}${unit}`
  },

  // Get inflammation category color
  getInflammationColor(category: string) {
    const colors = {
      'anti_inflammatory': '#22c55e', // green
      'neutral': '#94a3b8',           // gray
      'inflammatory': '#ef4444'       // red
    }
    return colors[category as keyof typeof colors] || colors.neutral
  },

  // Get difficulty level emoji
  getDifficultyEmoji(level: string) {
    const emojis = {
      'easy': '👶',
      'medium': '👨‍🍳',
      'hard': '👨‍🔬'
    }
    return emojis[level as keyof typeof emojis] || '🍳'
  }
}

// =============================================
// REAL-TIME SUBSCRIPTIONS
// =============================================

export const subscriptions = {
  // Subscribe to recipe changes
  subscribeToRecipes(callback: (payload: any) => void) {
    return supabase
      .channel('recipes-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'recipes' }, 
        callback
      )
      .subscribe()
  },

  // Subscribe to user profile changes
  subscribeToUserProfile(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`profile-${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_profiles',
          filter: `id=eq.${userId}`
        }, 
        callback
      )
      .subscribe()
  }
}

// Default export with all helpers
export default {
  supabase,
  ingredients: ingredientHelpers,
  recipes: recipeHelpers,
  users: userHelpers,
  categories: categoryHelpers,
  search: searchHelpers,
  subscriptions,
  utils
}