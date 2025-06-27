import { createClient } from '@/lib/supabase-client'
import { UserProfile } from '@/lib/auth/types'

export interface Ingredient {
  id: string
  name: string
  category: string
  calories_per_100g: number
  protein_g_per_100g: number
  carbs_g_per_100g: number
  fat_g_per_100g: number
  fiber_g_per_100g: number
  anti_inflammatory_score: number
  antioxidant_compounds: string[]
}

export interface Recipe {
  id: string
  title: string
  description: string
  instructions: string
  servings: number
  prep_time_minutes: number
  cook_time_minutes: number
  difficulty_level: 'easy' | 'medium' | 'hard'
  meal_type: string[]
  dietary_tags: string[]
  anti_inflammatory_score: number
  calories_per_serving: number
  protein_g_per_serving: number
  carbs_g_per_serving: number
  fat_g_per_serving: number
  fiber_g_per_serving: number
  ingredients?: RecipeIngredient[]
}

export interface RecipeIngredient {
  ingredient: Ingredient
  quantity: number
  unit: string
  preparation_notes?: string
}

export interface MenuGenerationOptions {
  targetCalories?: number
  mealTypes: string[] // ['breakfast', 'lunch', 'dinner', 'snack']
  dietaryPreferences?: string[]
  excludeIngredients?: string[]
  maxPrepTime?: number
  difficultyLevel?: 'easy' | 'medium' | 'hard'
  antiInflammatoryFocus?: boolean
}

export interface GeneratedMenu {
  id: string
  date: string
  meals: {
    breakfast?: Recipe[]
    lunch?: Recipe[]
    dinner?: Recipe[]
    snack?: Recipe[]
  }
  totalNutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
  antiInflammatoryScore: number
  shoppingList: ShoppingListItem[]
}

export interface ShoppingListItem {
  ingredient: string
  totalQuantity: number
  unit: string
  category: string
}

export class MenuGeneratorService {
  private supabase = createClient()

  /**
   * Generate personalized menu based on user profile and options
   */
  async generateMenu(
    userProfile: UserProfile,
    options: MenuGenerationOptions
  ): Promise<GeneratedMenu> {
    try {
      console.log('🍽️ Generating menu for user:', userProfile.id)
      
      // Get user's dietary filters
      const dietaryFilters = this.buildDietaryFilters(userProfile, options)
      
      // Get available recipes matching criteria
      const availableRecipes = await this.getFilteredRecipes(dietaryFilters)
      
      if (availableRecipes.length === 0) {
        throw new Error('No recipes found matching criteria')
      }
      
      // Generate balanced menu
      const menu = await this.createBalancedMenu(
        availableRecipes,
        userProfile,
        options
      )
      
      // Calculate nutrition totals
      const totalNutrition = this.calculateTotalNutrition(menu.meals)
      
      // Generate shopping list
      const shoppingList = await this.generateShoppingList(menu.meals)
      
      // Calculate overall anti-inflammatory score
      const antiInflammatoryScore = this.calculateAntiInflammatoryScore(menu.meals)
      
      return {
        id: `menu-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        meals: menu.meals,
        totalNutrition,
        antiInflammatoryScore,
        shoppingList
      }
      
    } catch (error) {
      console.error('❌ Menu generation failed:', error)
      throw new Error(`Menu generation failed: ${error.message}`)
    }
  }

  /**
   * Get recipes from database with filters
   */
  private async getFilteredRecipes(filters: any): Promise<Recipe[]> {
    try {
      let query = this.supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            quantity,
            unit,
            preparation_notes,
            ingredients (*)
          )
        `)
        .eq('is_public', true)

      // Apply dietary filters
      if (filters.dietaryTags.length > 0) {
        query = query.overlaps('dietary_tags', filters.dietaryTags)
      }

      // Apply anti-inflammatory filter
      if (filters.antiInflammatoryFocus) {
        query = query.gte('anti_inflammatory_score', 3)
      }

      // Apply difficulty filter
      if (filters.maxDifficulty) {
        const difficultyOrder = { easy: 1, medium: 2, hard: 3 }
        const maxLevel = difficultyOrder[filters.maxDifficulty]
        query = query.lte('difficulty_level', maxLevel)
      }

      const { data, error } = await query

      if (error) {
        console.error('Database query error:', error)
        return []
      }

      return data?.map(recipe => ({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        instructions: recipe.instructions,
        servings: recipe.servings,
        prep_time_minutes: recipe.prep_time_minutes,
        cook_time_minutes: recipe.cook_time_minutes,
        difficulty_level: recipe.difficulty_level,
        meal_type: recipe.meal_type,
        dietary_tags: recipe.dietary_tags,
        anti_inflammatory_score: recipe.anti_inflammatory_score || 0,
        calories_per_serving: recipe.calories_per_serving || 0,
        protein_g_per_serving: recipe.protein_g_per_serving || 0,
        carbs_g_per_serving: recipe.carbs_g_per_serving || 0,
        fat_g_per_serving: recipe.fat_g_per_serving || 0,
        fiber_g_per_serving: recipe.fiber_g_per_serving || 0,
        ingredients: recipe.recipe_ingredients?.map((ri: any) => ({
          ingredient: ri.ingredients,
          quantity: ri.quantity,
          unit: ri.unit,
          preparation_notes: ri.preparation_notes
        }))
      })) || []

    } catch (error) {
      console.error('Error fetching recipes:', error)
      return []
    }
  }

  /**
   * Create balanced menu from available recipes
   */
  private async createBalancedMenu(
    availableRecipes: Recipe[],
    userProfile: UserProfile,
    options: MenuGenerationOptions
  ) {
    const targetCalories = options.targetCalories || userProfile.daily_calories_target || 2000
    const caloriesPerMeal = {
      breakfast: targetCalories * 0.25,
      lunch: targetCalories * 0.35,
      dinner: targetCalories * 0.35,
      snack: targetCalories * 0.05
    }

    const menu: { meals: any } = { meals: {} }

    // Generate meals for each requested type
    for (const mealType of options.mealTypes) {
      const mealRecipes = availableRecipes.filter(recipe => 
        recipe.meal_type.includes(mealType)
      )

      if (mealRecipes.length > 0) {
        // Select best recipe for this meal
        const selectedRecipe = this.selectBestRecipe(
          mealRecipes,
          caloriesPerMeal[mealType as keyof typeof caloriesPerMeal],
          userProfile
        )
        
        if (selectedRecipe) {
          menu.meals[mealType] = [selectedRecipe]
        }
      }
    }

    return menu
  }

  /**
   * Select best recipe based on nutritional targets and preferences
   */
  private selectBestRecipe(
    recipes: Recipe[],
    targetCalories: number,
    userProfile: UserProfile
  ): Recipe | null {
    if (recipes.length === 0) return null

    // Score each recipe
    const scoredRecipes = recipes.map(recipe => {
      let score = 0

      // Calorie proximity (closer to target = higher score)
      const calorieDistance = Math.abs(recipe.calories_per_serving - targetCalories)
      const calorieScore = Math.max(0, 100 - (calorieDistance / targetCalories) * 100)
      score += calorieScore * 0.4

      // Anti-inflammatory score
      score += (recipe.anti_inflammatory_score + 10) * 3 // Scale from -10/+10 to 0-60

      // Dietary preference bonus
      if (userProfile.dietary_preferences) {
        const matchingTags = recipe.dietary_tags.filter(tag =>
          userProfile.dietary_preferences!.includes(tag)
        ).length
        score += matchingTags * 10
      }

      // Difficulty penalty (easier = higher score)
      const difficultyScore = { easy: 10, medium: 5, hard: 0 }
      score += difficultyScore[recipe.difficulty_level] || 0

      return { recipe, score }
    })

    // Sort by score and return best
    scoredRecipes.sort((a, b) => b.score - a.score)
    return scoredRecipes[0].recipe
  }

  /**
   * Calculate total nutrition for all meals
   */
  private calculateTotalNutrition(meals: any) {
    let totalCalories = 0
    let totalProtein = 0
    let totalCarbs = 0
    let totalFat = 0
    let totalFiber = 0

    Object.values(meals).forEach((mealRecipes: any) => {
      if (Array.isArray(mealRecipes)) {
        mealRecipes.forEach((recipe: Recipe) => {
          totalCalories += recipe.calories_per_serving
          totalProtein += recipe.protein_g_per_serving
          totalCarbs += recipe.carbs_g_per_serving
          totalFat += recipe.fat_g_per_serving
          totalFiber += recipe.fiber_g_per_serving
        })
      }
    })

    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fat: Math.round(totalFat),
      fiber: Math.round(totalFiber)
    }
  }

  /**
   * Generate shopping list from selected meals
   */
  private async generateShoppingList(meals: any): Promise<ShoppingListItem[]> {
    const ingredientTotals = new Map()

    Object.values(meals).forEach((mealRecipes: any) => {
      if (Array.isArray(mealRecipes)) {
        mealRecipes.forEach((recipe: Recipe) => {
          recipe.ingredients?.forEach((ri: RecipeIngredient) => {
            const key = ri.ingredient.name
            const existing = ingredientTotals.get(key) || {
              ingredient: ri.ingredient.name,
              totalQuantity: 0,
              unit: ri.unit,
              category: ri.ingredient.category
            }
            
            existing.totalQuantity += ri.quantity
            ingredientTotals.set(key, existing)
          })
        })
      }
    })

    return Array.from(ingredientTotals.values())
  }

  /**
   * Calculate overall anti-inflammatory score
   */
  private calculateAntiInflammatoryScore(meals: any): number {
    let totalScore = 0
    let recipeCount = 0

    Object.values(meals).forEach((mealRecipes: any) => {
      if (Array.isArray(mealRecipes)) {
        mealRecipes.forEach((recipe: Recipe) => {
          totalScore += recipe.anti_inflammatory_score
          recipeCount++
        })
      }
    })

    return recipeCount > 0 ? Math.round(totalScore / recipeCount) : 0
  }

  /**
   * Build dietary filters from user profile and options
   */
  private buildDietaryFilters(userProfile: UserProfile, options: MenuGenerationOptions) {
    return {
      dietaryTags: [
        ...(userProfile.dietary_preferences || []),
        ...(options.dietaryPreferences || [])
      ],
      excludeIngredients: [
        ...(userProfile.food_allergies || []),
        ...(userProfile.disliked_foods || []),
        ...(options.excludeIngredients || [])
      ],
      antiInflammatoryFocus: options.antiInflammatoryFocus !== false,
      maxDifficulty: options.difficultyLevel || 'medium'
    }
  }

  /**
   * Get sample menu for demo purposes
   */
  async getSampleMenu(): Promise<GeneratedMenu> {
    return {
      id: 'sample-menu',
      date: new Date().toISOString().split('T')[0],
      meals: {
        breakfast: [],
        lunch: [],
        dinner: []
      },
      totalNutrition: {
        calories: 1800,
        protein: 90,
        carbs: 180,
        fat: 60,
        fiber: 30
      },
      antiInflammatoryScore: 7,
      shoppingList: []
    }
  }
}

export const menuGenerator = new MenuGeneratorService()