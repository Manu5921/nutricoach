/**
 * Recipe Service
 * Handles recipe CRUD operations and nutrition calculations
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { 
  Database, 
  ServiceResponse, 
  Recipe,
  RecipeWithDetails,
  PaginatedResponse,
  NutritionInfo,
  RecipeIngredient,
} from '../../types'
import type {
  RecipeInsert,
  RecipeUpdate,
  RecipeSearch,
  NutritionCalculation,
} from '../../validators'
import {
  RecipeInsertSchema,
  RecipeUpdateSchema,
  RecipeSearchSchema,
  RecipeBusinessRulesSchema,
  NutritionCalculationSchema,
  calculateTotalTime,
} from '../../validators'
import { 
  createLogger,
  ValidationErrorClass,
  NotFoundError,
  AuthorizationError,
  safeAsync,
} from '../../utils'

const logger = createLogger('recipe-service')

export class RecipeService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Create a new recipe
   */
  async createRecipe(data: RecipeInsert): Promise<ServiceResponse<RecipeWithDetails>> {
    return safeAsync(async () => {
      // Validate input data with business rules
      const validationResult = RecipeBusinessRulesSchema.safeParse(data)
      if (!validationResult.success) {
        throw new ValidationErrorClass(
          'Invalid recipe data',
          'recipe_data',
          { errors: validationResult.error.errors }
        )
      }

      const recipeData = {
        ...validationResult.data,
        id: validationResult.data.id || crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      logger.info('Creating new recipe', { 
        userId: recipeData.user_id,
        title: recipeData.title,
        isPublic: recipeData.is_public 
      })

      // Validate nutrition calculation
      const nutritionValidation = await this.validateNutritionCalculation(
        recipeData.ingredients,
        recipeData.servings,
        recipeData.nutrition_per_serving
      )

      if (!nutritionValidation) {
        logger.warn('Nutrition calculation appears inconsistent', {
          userId: recipeData.user_id,
          title: recipeData.title,
        })
      }

      const { data: recipe, error } = await this.supabase
        .from('recipes')
        .insert(recipeData)
        .select('*')
        .single()

      if (error) {
        logger.error('Failed to create recipe', error, { 
          userId: recipeData.user_id,
          title: recipeData.title 
        })
        throw new Error(`Failed to create recipe: ${error.message}`)
      }

      const enrichedRecipe = this.enrichRecipe(recipe)
      
      logger.info('Recipe created successfully', { 
        recipeId: recipe.id,
        userId: recipe.user_id,
        title: recipe.title 
      })

      return enrichedRecipe
    })
  }

  /**
   * Get recipe by ID
   */
  async getRecipeById(recipeId: string, userId?: string): Promise<ServiceResponse<RecipeWithDetails | null>> {
    return safeAsync(async () => {
      logger.debug('Getting recipe by ID', { recipeId, userId })

      const { data: recipe, error } = await this.supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          logger.warn('Recipe not found', { recipeId })
          return null
        }
        logger.error('Failed to get recipe', error, { recipeId })
        throw new Error(`Failed to get recipe: ${error.message}`)
      }

      // Check access permissions
      if (!recipe.is_public && recipe.user_id !== userId) {
        throw new AuthorizationError('Access denied to private recipe')
      }

      const enrichedRecipe = this.enrichRecipe(recipe)
      
      logger.debug('Recipe retrieved successfully', { recipeId })
      return enrichedRecipe
    })
  }

  /**
   * Update recipe
   */
  async updateRecipe(
    recipeId: string, 
    updates: RecipeUpdate, 
    userId: string
  ): Promise<ServiceResponse<RecipeWithDetails>> {
    return safeAsync(async () => {
      // Validate input data
      const validationResult = RecipeUpdateSchema.safeParse(updates)
      if (!validationResult.success) {
        throw new ValidationErrorClass(
          'Invalid recipe update data',
          'recipe_update_data',
          { errors: validationResult.error.errors }
        )
      }

      logger.info('Updating recipe', { recipeId, userId, updates: Object.keys(updates) })

      // Check if recipe exists and user has permission
      const existingRecipe = await this.getRecipeById(recipeId, userId)
      if (!existingRecipe.data) {
        throw new NotFoundError('Recipe not found')
      }

      if (existingRecipe.data.user_id !== userId) {
        throw new AuthorizationError('Cannot update recipe owned by another user')
      }

      const updateData = {
        ...validationResult.data,
        updated_at: new Date().toISOString(),
      }

      // Validate nutrition if ingredients or servings are being updated
      if (updates.ingredients || updates.servings || updates.nutrition_per_serving) {
        const ingredients = updates.ingredients || existingRecipe.data.ingredients
        const servings = updates.servings || existingRecipe.data.servings
        const nutrition = updates.nutrition_per_serving || existingRecipe.data.nutrition_per_serving

        const nutritionValidation = await this.validateNutritionCalculation(
          ingredients,
          servings,
          nutrition
        )

        if (!nutritionValidation) {
          logger.warn('Updated nutrition calculation appears inconsistent', { recipeId })
        }
      }

      const { data: recipe, error } = await this.supabase
        .from('recipes')
        .update(updateData)
        .eq('id', recipeId)
        .eq('user_id', userId) // Additional security check
        .select('*')
        .single()

      if (error) {
        logger.error('Failed to update recipe', error, { recipeId, userId })
        throw new Error(`Failed to update recipe: ${error.message}`)
      }

      const enrichedRecipe = this.enrichRecipe(recipe)
      
      logger.info('Recipe updated successfully', { recipeId, userId })
      return enrichedRecipe
    })
  }

  /**
   * Delete recipe
   */
  async deleteRecipe(recipeId: string, userId: string): Promise<ServiceResponse<void>> {
    return safeAsync(async () => {
      logger.info('Deleting recipe', { recipeId, userId })

      // Check if recipe exists and user has permission
      const existingRecipe = await this.getRecipeById(recipeId, userId)
      if (!existingRecipe.data) {
        throw new NotFoundError('Recipe not found')
      }

      if (existingRecipe.data.user_id !== userId) {
        throw new AuthorizationError('Cannot delete recipe owned by another user')
      }

      const { error } = await this.supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId)
        .eq('user_id', userId) // Additional security check

      if (error) {
        logger.error('Failed to delete recipe', error, { recipeId, userId })
        throw new Error(`Failed to delete recipe: ${error.message}`)
      }

      logger.info('Recipe deleted successfully', { recipeId, userId })
    })
  }

  /**
   * Search recipes with filters and pagination
   */
  async searchRecipes(searchParams: RecipeSearch): Promise<ServiceResponse<PaginatedResponse<RecipeWithDetails>>> {
    return safeAsync(async () => {
      // Validate search parameters
      const validationResult = RecipeSearchSchema.safeParse(searchParams)
      if (!validationResult.success) {
        throw new ValidationErrorClass(
          'Invalid search parameters',
          'search_params',
          { errors: validationResult.error.errors }
        )
      }

      const {
        page = 1,
        limit = 20,
        sortBy = 'created_at',
        sortOrder = 'desc',
        query,
        filters = {},
        user_id,
      } = validationResult.data

      logger.debug('Searching recipes', { 
        page, 
        limit, 
        sortBy, 
        sortOrder,
        hasQuery: !!query,
        userId: user_id,
        filtersCount: Object.keys(filters).length,
      })

      // Build query
      let queryBuilder = this.supabase
        .from('recipes')
        .select('*', { count: 'exact' })

      // Apply user filter
      if (user_id) {
        queryBuilder = queryBuilder.eq('user_id', user_id)
      } else {
        // For public searches, only show public recipes
        queryBuilder = queryBuilder.eq('is_public', true)
      }

      // Apply text search
      if (query) {
        queryBuilder = queryBuilder.or(
          `title.ilike.%${query}%,description.ilike.%${query}%,cuisine_type.ilike.%${query}%`
        )
      }

      // Apply filters
      if (filters.cuisine_type && filters.cuisine_type.length > 0) {
        queryBuilder = queryBuilder.in('cuisine_type', filters.cuisine_type)
      }

      if (filters.dietary_tags && filters.dietary_tags.length > 0) {
        // Check if recipe contains any of the specified dietary tags
        for (const tag of filters.dietary_tags) {
          queryBuilder = queryBuilder.contains('dietary_tags', [tag])
        }
      }

      if (filters.difficulty_level && filters.difficulty_level.length > 0) {
        queryBuilder = queryBuilder.in('difficulty_level', filters.difficulty_level)
      }

      if (filters.max_prep_time) {
        queryBuilder = queryBuilder.lte('prep_time_minutes', filters.max_prep_time)
      }

      if (filters.max_cook_time) {
        queryBuilder = queryBuilder.lte('cook_time_minutes', filters.max_cook_time)
      }

      if (filters.max_total_time) {
        // This requires a calculated field - we'll handle it after fetching
      }

      if (filters.max_calories_per_serving) {
        queryBuilder = queryBuilder.lte('nutrition_per_serving->calories', filters.max_calories_per_serving)
      }

      if (filters.min_protein_per_serving) {
        queryBuilder = queryBuilder.gte('nutrition_per_serving->protein_g', filters.min_protein_per_serving)
      }

      // Apply sorting
      const isAscending = sortOrder === 'asc'
      queryBuilder = queryBuilder.order(sortBy, { ascending: isAscending })

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      queryBuilder = queryBuilder.range(from, to)

      const { data, error, count } = await queryBuilder

      if (error) {
        logger.error('Failed to search recipes', error, { searchParams })
        throw new Error(`Failed to search recipes: ${error.message}`)
      }

      // Enrich recipes and apply additional filters
      let enrichedRecipes = data.map(recipe => this.enrichRecipe(recipe))

      // Apply total time filter if specified
      if (filters.max_total_time) {
        enrichedRecipes = enrichedRecipes.filter(
          recipe => recipe.total_time_minutes <= filters.max_total_time!
        )
      }

      const totalPages = Math.ceil((count || 0) / limit)
      const hasNext = page < totalPages
      const hasPrev = page > 1

      const result: PaginatedResponse<RecipeWithDetails> = {
        data: enrichedRecipes,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
          hasNext,
          hasPrev,
        },
      }

      logger.debug('Recipe search completed', { 
        page, 
        limit, 
        total: count, 
        resultsCount: data.length 
      })

      return result
    })
  }

  /**
   * Calculate nutrition for ingredients and servings
   */
  async calculateNutrition(data: NutritionCalculation): Promise<ServiceResponse<{
    per_serving: NutritionInfo;
    per_100g?: NutritionInfo;
  }>> {
    return safeAsync(async () => {
      // Validate input data
      const validationResult = NutritionCalculationSchema.safeParse(data)
      if (!validationResult.success) {
        throw new ValidationErrorClass(
          'Invalid nutrition calculation data',
          'nutrition_calculation_data',
          { errors: validationResult.error.errors }
        )
      }

      const { ingredients, servings, calculate_per_100g } = validationResult.data

      logger.debug('Calculating nutrition', { 
        ingredientCount: ingredients.length,
        servings,
        calculatePer100g: calculate_per_100g 
      })

      // Sum up nutrition from all ingredients
      const totalNutrition: NutritionInfo = {
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        fiber_g: 0,
        sugar_g: 0,
        sodium_mg: 0,
        vitamin_c_mg: 0,
        iron_mg: 0,
        calcium_mg: 0,
      }

      let totalWeight = 0

      for (const ingredient of ingredients) {
        if (ingredient.nutrition_per_unit) {
          const nutrition = ingredient.nutrition_per_unit
          const quantity = ingredient.quantity

          totalNutrition.calories += (nutrition.calories || 0) * quantity
          totalNutrition.protein_g += (nutrition.protein_g || 0) * quantity
          totalNutrition.carbs_g += (nutrition.carbs_g || 0) * quantity
          totalNutrition.fat_g += (nutrition.fat_g || 0) * quantity
          totalNutrition.fiber_g! += (nutrition.fiber_g || 0) * quantity
          totalNutrition.sugar_g! += (nutrition.sugar_g || 0) * quantity
          totalNutrition.sodium_mg! += (nutrition.sodium_mg || 0) * quantity
          totalNutrition.vitamin_c_mg! += (nutrition.vitamin_c_mg || 0) * quantity
          totalNutrition.iron_mg! += (nutrition.iron_mg || 0) * quantity
          totalNutrition.calcium_mg! += (nutrition.calcium_mg || 0) * quantity

          // Estimate weight (this is simplified - in reality, units vary)
          totalWeight += quantity * 100 // Assume 100g per unit as default
        }
      }

      // Calculate per serving
      const perServing: NutritionInfo = {
        calories: Math.round(totalNutrition.calories / servings),
        protein_g: Math.round((totalNutrition.protein_g / servings) * 10) / 10,
        carbs_g: Math.round((totalNutrition.carbs_g / servings) * 10) / 10,
        fat_g: Math.round((totalNutrition.fat_g / servings) * 10) / 10,
        fiber_g: Math.round((totalNutrition.fiber_g! / servings) * 10) / 10,
        sugar_g: Math.round((totalNutrition.sugar_g! / servings) * 10) / 10,
        sodium_mg: Math.round(totalNutrition.sodium_mg! / servings),
        vitamin_c_mg: Math.round((totalNutrition.vitamin_c_mg! / servings) * 10) / 10,
        iron_mg: Math.round((totalNutrition.iron_mg! / servings) * 10) / 10,
        calcium_mg: Math.round((totalNutrition.calcium_mg! / servings) * 10) / 10,
      }

      const result: { per_serving: NutritionInfo; per_100g?: NutritionInfo } = {
        per_serving: perServing,
      }

      // Calculate per 100g if requested
      if (calculate_per_100g && totalWeight > 0) {
        const per100g: NutritionInfo = {
          calories: Math.round((totalNutrition.calories / totalWeight) * 100),
          protein_g: Math.round(((totalNutrition.protein_g / totalWeight) * 100) * 10) / 10,
          carbs_g: Math.round(((totalNutrition.carbs_g / totalWeight) * 100) * 10) / 10,
          fat_g: Math.round(((totalNutrition.fat_g / totalWeight) * 100) * 10) / 10,
          fiber_g: Math.round(((totalNutrition.fiber_g! / totalWeight) * 100) * 10) / 10,
          sugar_g: Math.round(((totalNutrition.sugar_g! / totalWeight) * 100) * 10) / 10,
          sodium_mg: Math.round((totalNutrition.sodium_mg! / totalWeight) * 100),
          vitamin_c_mg: Math.round(((totalNutrition.vitamin_c_mg! / totalWeight) * 100) * 10) / 10,
          iron_mg: Math.round(((totalNutrition.iron_mg! / totalWeight) * 100) * 10) / 10,
          calcium_mg: Math.round(((totalNutrition.calcium_mg! / totalWeight) * 100) * 10) / 10,
        }

        result.per_100g = per100g
      }

      logger.debug('Nutrition calculation completed', { 
        perServingCalories: perServing.calories,
        totalWeight: totalWeight || 'unknown' 
      })

      return result
    })
  }

  /**
   * Get user's recipes
   */
  async getUserRecipes(
    userId: string,
    options: { limit?: number; page?: number } = {}
  ): Promise<ServiceResponse<PaginatedResponse<RecipeWithDetails>>> {
    return safeAsync(async () => {
      const { limit = 20, page = 1 } = options

      return this.searchRecipes({
        user_id: userId,
        page,
        limit,
        sortBy: 'updated_at',
        sortOrder: 'desc',
      })
    })
  }

  /**
   * Get recipe statistics for a user
   */
  async getRecipeStats(userId: string): Promise<ServiceResponse<any>> {
    return safeAsync(async () => {
      logger.debug('Getting recipe statistics', { userId })

      const [totalResult, publicResult, recentResult] = await Promise.all([
        this.supabase
          .from('recipes')
          .select('id', { count: 'exact' })
          .eq('user_id', userId),
        this.supabase
          .from('recipes')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .eq('is_public', true),
        this.supabase
          .from('recipes')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      ])

      const stats = {
        totalRecipes: totalResult.count || 0,
        publicRecipes: publicResult.count || 0,
        privateRecipes: (totalResult.count || 0) - (publicResult.count || 0),
        recentRecipes: recentResult.count || 0,
      }

      logger.debug('Recipe statistics retrieved', { userId, stats })
      return stats
    })
  }

  /**
   * Enrich recipe with calculated fields
   */
  private enrichRecipe(recipe: Recipe): RecipeWithDetails {
    const enriched: RecipeWithDetails = {
      ...recipe,
      total_time_minutes: calculateTotalTime(recipe.prep_time_minutes, recipe.cook_time_minutes),
    }

    return enriched
  }

  /**
   * Validate nutrition calculation consistency
   */
  private async validateNutritionCalculation(
    ingredients: RecipeIngredient[],
    servings: number,
    providedNutrition: NutritionInfo
  ): Promise<boolean> {
    // Calculate expected nutrition
    const calculationResult = await this.calculateNutrition({
      ingredients,
      servings,
      calculate_per_100g: false,
    })

    if (!calculationResult.data) {
      return false
    }

    const calculated = calculationResult.data.per_serving
    
    // Allow 10% variance in calculations
    const tolerance = 0.1
    
    const isClose = (calculated: number, provided: number): boolean => {
      if (calculated === 0 && provided === 0) return true
      if (calculated === 0) return provided <= 5 // Allow small absolute values
      return Math.abs((calculated - provided) / calculated) <= tolerance
    }

    return (
      isClose(calculated.calories, providedNutrition.calories) &&
      isClose(calculated.protein_g, providedNutrition.protein_g) &&
      isClose(calculated.carbs_g, providedNutrition.carbs_g) &&
      isClose(calculated.fat_g, providedNutrition.fat_g)
    )
  }
}