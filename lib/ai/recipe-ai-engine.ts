/**
 * AI Recipe Engine
 * Advanced recipe modification with intelligent ingredient substitution,
 * nutritional equivalence, and cooking method optimization
 */

import { Ingredient, Recipe, RecipeIngredient } from '@/lib/services/menu-generator'
import { UserProfile } from '@/lib/auth/types'
import { createClient } from '@/lib/supabase-client'

export interface IngredientSubstitution {
  original_ingredient: Ingredient
  substitute_ingredient: Ingredient
  substitution_ratio: number // How much substitute to use (1.0 = same amount)
  nutrition_similarity_score: number // 0-100 how similar nutritionally
  flavor_compatibility_score: number // 0-100 how well flavors match
  cooking_method_compatibility: number // 0-100 how well it works in cooking method
  allergen_safety: boolean // True if substitute doesn't introduce new allergens
  substitution_reason: string
  confidence_score: number // 0-100 overall confidence in substitution
}

export interface RecipeModification {
  original_recipe: Recipe
  modified_recipe: Recipe
  modifications_made: ModificationDetail[]
  nutrition_impact: NutritionImpactAnalysis
  difficulty_change: number // -2 to +2 change in difficulty
  time_impact: number // Minutes added/removed
  cost_impact: number // -1 to +1 relative cost change
  success_probability: number // 0-100 likelihood of successful outcome
}

export interface ModificationDetail {
  type: 'ingredient_substitution' | 'portion_adjustment' | 'cooking_method' | 'preparation_modification'
  description: string
  substitution?: IngredientSubstitution
  impact_level: 'minor' | 'moderate' | 'major'
}

export interface NutritionImpactAnalysis {
  calories_change: number
  protein_change: number
  carbs_change: number
  fat_change: number
  fiber_change: number
  micronutrient_changes: Record<string, number>
  anti_inflammatory_score_change: number
  overall_nutrition_score: number // 0-100 how nutrition compares
}

export interface CookingMethodOptimization {
  current_method: string
  optimized_method: string
  nutrient_retention_improvement: number // 0-100 percentage improvement
  time_change: number // Minutes
  equipment_required: string[]
  difficulty_change: number
  reasoning: string
}

export interface AllergensAndRestrictions {
  allergens: string[]
  dietary_restrictions: string[]
  disliked_ingredients: string[]
  preferred_substitutes?: Record<string, string[]>
}

class RecipeAIEngine {
  private supabase = createClient()
  private nutritionDatabase: Map<string, any> = new Map()
  private substitutionDatabase: Map<string, IngredientSubstitution[]> = new Map()
  private flavorProfiles: Map<string, string[]> = new Map()

  constructor() {
    this.initializeSubstitutionDatabase()
    this.initializeFlavorProfiles()
  }

  /**
   * Modify recipe based on user restrictions and preferences
   */
  async modifyRecipe(
    recipe: Recipe,
    userProfile: UserProfile,
    restrictions: AllergensAndRestrictions,
    optimizationGoals?: string[]
  ): Promise<RecipeModification> {
    console.log('🔧 Starting AI recipe modification...')

    try {
      const modifications: ModificationDetail[] = []
      let modifiedRecipe = { ...recipe }
      
      // 1. Handle allergen substitutions (highest priority)
      const allergenSubstitutions = await this.handleAllergenSubstitutions(
        modifiedRecipe,
        restrictions.allergens
      )
      modifications.push(...allergenSubstitutions.modifications)
      modifiedRecipe = allergenSubstitutions.recipe

      // 2. Handle dietary restrictions
      const dietarySubstitutions = await this.handleDietaryRestrictions(
        modifiedRecipe,
        restrictions.dietary_restrictions
      )
      modifications.push(...dietarySubstitutions.modifications)
      modifiedRecipe = dietarySubstitutions.recipe

      // 3. Handle disliked ingredients
      const preferenceSubstitutions = await this.handlePreferenceSubstitutions(
        modifiedRecipe,
        restrictions.disliked_ingredients,
        restrictions.preferred_substitutes
      )
      modifications.push(...preferenceSubstitutions.modifications)
      modifiedRecipe = preferenceSubstitutions.recipe

      // 4. Optimize for goals (health, time, cost, etc.)
      if (optimizationGoals) {
        const optimizations = await this.optimizeForGoals(
          modifiedRecipe,
          optimizationGoals,
          userProfile
        )
        modifications.push(...optimizations.modifications)
        modifiedRecipe = optimizations.recipe
      }

      // 5. Recalculate nutrition for modified recipe
      const nutritionImpact = await this.calculateNutritionImpact(recipe, modifiedRecipe)

      // 6. Calculate overall impact metrics
      const difficultyChange = this.calculateDifficultyChange(modifications)
      const timeImpact = this.calculateTimeImpact(modifications)
      const costImpact = this.calculateCostImpact(modifications)
      const successProbability = this.calculateSuccessProbability(modifications, modifiedRecipe)

      return {
        original_recipe: recipe,
        modified_recipe: modifiedRecipe,
        modifications_made: modifications,
        nutrition_impact: nutritionImpact,
        difficulty_change: difficultyChange,
        time_impact: timeImpact,
        cost_impact: costImpact,
        success_probability: successProbability
      }

    } catch (error) {
      console.error('❌ Recipe modification failed:', error)
      throw new Error(`Recipe modification failed: ${error.message}`)
    }
  }

  /**
   * Find best ingredient substitution for specific ingredient
   */
  async findBestSubstitute(
    ingredient: Ingredient,
    restrictions: AllergensAndRestrictions,
    cookingMethod: string,
    nutritionPriority: 'maintain' | 'improve' | 'reduce_calories' = 'maintain'
  ): Promise<IngredientSubstitution | null> {
    
    // Get potential substitutes from database
    const potentialSubstitutes = await this.getPotentialSubstitutes(ingredient, restrictions)
    
    if (potentialSubstitutes.length === 0) {
      return null
    }

    // Score each substitute
    const scoredSubstitutes = await Promise.all(
      potentialSubstitutes.map(async (substitute) => {
        const substitution = await this.evaluateSubstitution(
          ingredient,
          substitute,
          cookingMethod,
          nutritionPriority
        )
        return substitution
      })
    )

    // Return best substitute (highest confidence score)
    return scoredSubstitutes
      .filter(sub => sub.confidence_score > 60) // Minimum confidence threshold
      .sort((a, b) => b.confidence_score - a.confidence_score)[0] || null
  }

  /**
   * Optimize cooking method for nutrient retention
   */
  async optimizeCookingMethod(
    recipe: Recipe,
    optimizationGoal: 'nutrient_retention' | 'time_efficiency' | 'flavor_enhancement' = 'nutrient_retention'
  ): Promise<CookingMethodOptimization | null> {
    
    const currentMethod = this.extractCookingMethod(recipe.instructions)
    
    if (!currentMethod) {
      return null
    }

    const optimizationStrategies = {
      nutrient_retention: {
        'boiling': 'steaming',
        'deep_frying': 'air_frying',
        'overcooking': 'gentle_cooking',
        'high_heat': 'medium_heat'
      },
      time_efficiency: {
        'slow_cooking': 'pressure_cooking',
        'oven_baking': 'air_frying',
        'stovetop': 'microwave'
      },
      flavor_enhancement: {
        'boiling': 'roasting',
        'steaming': 'sautéing',
        'microwaving': 'grilling'
      }
    }

    const strategies = optimizationStrategies[optimizationGoal]
    let optimizedMethod = currentMethod

    for (const [current, optimized] of Object.entries(strategies)) {
      if (currentMethod.toLowerCase().includes(current)) {
        optimizedMethod = optimized
        break
      }
    }

    if (optimizedMethod === currentMethod) {
      return null // No optimization needed
    }

    // Calculate impact of optimization
    const nutrientRetentionImprovement = this.calculateNutrientRetentionImprovement(
      currentMethod,
      optimizedMethod
    )
    
    const timeChange = this.calculateCookingTimeChange(currentMethod, optimizedMethod)
    const equipmentRequired = this.getRequiredEquipment(optimizedMethod)
    const difficultyChange = this.calculateCookingDifficultyChange(currentMethod, optimizedMethod)

    return {
      current_method: currentMethod,
      optimized_method: optimizedMethod,
      nutrient_retention_improvement: nutrientRetentionImprovement,
      time_change: timeChange,
      equipment_required: equipmentRequired,
      difficulty_change: difficultyChange,
      reasoning: `Optimization pour ${optimizationGoal.replace('_', ' ')}`
    }
  }

  /**
   * Adjust recipe portions while maintaining nutritional balance
   */
  async adjustPortions(
    recipe: Recipe,
    targetServings: number,
    nutritionalConstraints?: { maxCalories?: number; minProtein?: number }
  ): Promise<Recipe> {
    
    const scalingFactor = targetServings / recipe.servings
    const adjustedRecipe = { ...recipe }

    // Scale ingredient quantities
    if (adjustedRecipe.ingredients) {
      adjustedRecipe.ingredients = adjustedRecipe.ingredients.map(recipeIngredient => ({
        ...recipeIngredient,
        quantity: recipeIngredient.quantity * scalingFactor
      }))
    }

    // Scale nutrition values
    adjustedRecipe.calories_per_serving = recipe.calories_per_serving
    adjustedRecipe.protein_g_per_serving = recipe.protein_g_per_serving
    adjustedRecipe.carbs_g_per_serving = recipe.carbs_g_per_serving
    adjustedRecipe.fat_g_per_serving = recipe.fat_g_per_serving
    adjustedRecipe.fiber_g_per_serving = recipe.fiber_g_per_serving
    adjustedRecipe.servings = targetServings

    // Apply nutritional constraints if provided
    if (nutritionalConstraints) {
      if (nutritionalConstraints.maxCalories && 
          adjustedRecipe.calories_per_serving > nutritionalConstraints.maxCalories) {
        // Reduce portions to meet calorie constraint
        const calorieReductionFactor = nutritionalConstraints.maxCalories / adjustedRecipe.calories_per_serving
        adjustedRecipe.ingredients = adjustedRecipe.ingredients?.map(ri => ({
          ...ri,
          quantity: ri.quantity * calorieReductionFactor
        }))
        adjustedRecipe.calories_per_serving = nutritionalConstraints.maxCalories
      }
    }

    return adjustedRecipe
  }

  /**
   * Handle allergen substitutions
   */
  private async handleAllergenSubstitutions(
    recipe: Recipe,
    allergens: string[]
  ): Promise<{ recipe: Recipe; modifications: ModificationDetail[] }> {
    
    const modifications: ModificationDetail[] = []
    let modifiedRecipe = { ...recipe }

    if (!modifiedRecipe.ingredients || allergens.length === 0) {
      return { recipe: modifiedRecipe, modifications }
    }

    const modifiedIngredients = [...modifiedRecipe.ingredients]

    for (let i = 0; i < modifiedIngredients.length; i++) {
      const recipeIngredient = modifiedIngredients[i]
      const ingredient = recipeIngredient.ingredient

      // Check if ingredient contains allergens
      const containsAllergen = allergens.some(allergen =>
        ingredient.name.toLowerCase().includes(allergen.toLowerCase()) ||
        (ingredient.category && ingredient.category.toLowerCase().includes(allergen.toLowerCase()))
      )

      if (containsAllergen) {
        const substitute = await this.findBestSubstitute(
          ingredient,
          { allergens, dietary_restrictions: [], disliked_ingredients: [] },
          'general'
        )

        if (substitute) {
          modifiedIngredients[i] = {
            ...recipeIngredient,
            ingredient: substitute.substitute_ingredient,
            quantity: recipeIngredient.quantity * substitute.substitution_ratio
          }

          modifications.push({
            type: 'ingredient_substitution',
            description: `Substitution allergène: ${ingredient.name} → ${substitute.substitute_ingredient.name}`,
            substitution: substitute,
            impact_level: 'major'
          })
        }
      }
    }

    modifiedRecipe.ingredients = modifiedIngredients
    return { recipe: modifiedRecipe, modifications }
  }

  /**
   * Handle dietary restriction substitutions
   */
  private async handleDietaryRestrictions(
    recipe: Recipe,
    dietaryRestrictions: string[]
  ): Promise<{ recipe: Recipe; modifications: ModificationDetail[] }> {
    
    const modifications: ModificationDetail[] = []
    let modifiedRecipe = { ...recipe }

    if (!modifiedRecipe.ingredients || dietaryRestrictions.length === 0) {
      return { recipe: modifiedRecipe, modifications }
    }

    const restrictionSubstitutes = {
      'vegetarian': {
        exclude: ['meat', 'fish', 'seafood'],
        substitutes: { 'beef': 'tofu', 'chicken': 'tempeh', 'fish': 'mushrooms' }
      },
      'vegan': {
        exclude: ['meat', 'fish', 'seafood', 'dairy', 'eggs'],
        substitutes: { 'milk': 'almond_milk', 'butter': 'olive_oil', 'eggs': 'flax_eggs' }
      },
      'gluten_free': {
        exclude: ['wheat', 'barley', 'rye'],
        substitutes: { 'wheat_flour': 'rice_flour', 'bread': 'gluten_free_bread' }
      },
      'dairy_free': {
        exclude: ['milk', 'cheese', 'butter', 'cream'],
        substitutes: { 'milk': 'oat_milk', 'cheese': 'nutritional_yeast', 'butter': 'coconut_oil' }
      }
    }

    const modifiedIngredients = [...modifiedRecipe.ingredients]

    for (const restriction of dietaryRestrictions) {
      const restrictionConfig = restrictionSubstitutes[restriction as keyof typeof restrictionSubstitutes]
      if (!restrictionConfig) continue

      for (let i = 0; i < modifiedIngredients.length; i++) {
        const recipeIngredient = modifiedIngredients[i]
        const ingredient = recipeIngredient.ingredient

        const violatesRestriction = restrictionConfig.exclude.some(excluded =>
          ingredient.name.toLowerCase().includes(excluded) ||
          ingredient.category?.toLowerCase().includes(excluded)
        )

        if (violatesRestriction) {
          // Find appropriate substitute
          const substituteName = Object.entries(restrictionConfig.substitutes).find(([original]) =>
            ingredient.name.toLowerCase().includes(original)
          )?.[1]

          if (substituteName) {
            // Get substitute ingredient from database
            const substitute = await this.getIngredientByName(substituteName)
            if (substitute) {
              const substitution: IngredientSubstitution = {
                original_ingredient: ingredient,
                substitute_ingredient: substitute,
                substitution_ratio: 1.0,
                nutrition_similarity_score: 75,
                flavor_compatibility_score: 70,
                cooking_method_compatibility: 85,
                allergen_safety: true,
                substitution_reason: `Restriction diététique: ${restriction}`,
                confidence_score: 80
              }

              modifiedIngredients[i] = {
                ...recipeIngredient,
                ingredient: substitute,
                quantity: recipeIngredient.quantity * substitution.substitution_ratio
              }

              modifications.push({
                type: 'ingredient_substitution',
                description: `Substitution ${restriction}: ${ingredient.name} → ${substitute.name}`,
                substitution: substitution,
                impact_level: 'moderate'
              })
            }
          }
        }
      }
    }

    modifiedRecipe.ingredients = modifiedIngredients
    return { recipe: modifiedRecipe, modifications }
  }

  /**
   * Handle user preference substitutions
   */
  private async handlePreferenceSubstitutions(
    recipe: Recipe,
    dislikedIngredients: string[],
    preferredSubstitutes?: Record<string, string[]>
  ): Promise<{ recipe: Recipe; modifications: ModificationDetail[] }> {
    
    const modifications: ModificationDetail[] = []
    let modifiedRecipe = { ...recipe }

    if (!modifiedRecipe.ingredients || dislikedIngredients.length === 0) {
      return { recipe: modifiedRecipe, modifications }
    }

    const modifiedIngredients = [...modifiedRecipe.ingredients]

    for (let i = 0; i < modifiedIngredients.length; i++) {
      const recipeIngredient = modifiedIngredients[i]
      const ingredient = recipeIngredient.ingredient

      const isDisliked = dislikedIngredients.some(disliked =>
        ingredient.name.toLowerCase().includes(disliked.toLowerCase())
      )

      if (isDisliked) {
        // Try to use preferred substitute if available
        let substitute: Ingredient | null = null
        
        if (preferredSubstitutes) {
          for (const [disliked, preferredList] of Object.entries(preferredSubstitutes)) {
            if (ingredient.name.toLowerCase().includes(disliked.toLowerCase())) {
              substitute = await this.getIngredientByName(preferredList[0])
              break
            }
          }
        }

        // If no preferred substitute, find best alternative
        if (!substitute) {
          const substitution = await this.findBestSubstitute(
            ingredient,
            { allergens: [], dietary_restrictions: [], disliked_ingredients: [] },
            'general'
          )
          substitute = substitution?.substitute_ingredient || null
        }

        if (substitute) {
          const substitution: IngredientSubstitution = {
            original_ingredient: ingredient,
            substitute_ingredient: substitute,
            substitution_ratio: 1.0,
            nutrition_similarity_score: 70,
            flavor_compatibility_score: 65,
            cooking_method_compatibility: 80,
            allergen_safety: true,
            substitution_reason: 'Préférence utilisateur',
            confidence_score: 75
          }

          modifiedIngredients[i] = {
            ...recipeIngredient,
            ingredient: substitute,
            quantity: recipeIngredient.quantity * substitution.substitution_ratio
          }

          modifications.push({
            type: 'ingredient_substitution',
            description: `Substitution préférence: ${ingredient.name} → ${substitute.name}`,
            substitution: substitution,
            impact_level: 'minor'
          })
        }
      }
    }

    modifiedRecipe.ingredients = modifiedIngredients
    return { recipe: modifiedRecipe, modifications }
  }

  /**
   * Optimize recipe for specific goals
   */
  private async optimizeForGoals(
    recipe: Recipe,
    goals: string[],
    userProfile: UserProfile
  ): Promise<{ recipe: Recipe; modifications: ModificationDetail[] }> {
    
    const modifications: ModificationDetail[] = []
    let modifiedRecipe = { ...recipe }

    for (const goal of goals) {
      switch (goal) {
        case 'reduce_sodium':
          const sodiumOptimization = await this.reduceSodium(modifiedRecipe)
          modifiedRecipe = sodiumOptimization.recipe
          modifications.push(...sodiumOptimization.modifications)
          break

        case 'increase_protein':
          const proteinOptimization = await this.increaseProtein(modifiedRecipe)
          modifiedRecipe = proteinOptimization.recipe
          modifications.push(...proteinOptimization.modifications)
          break

        case 'reduce_calories':
          const calorieOptimization = await this.reduceCalories(modifiedRecipe)
          modifiedRecipe = calorieOptimization.recipe
          modifications.push(...calorieOptimization.modifications)
          break

        case 'anti_inflammatory':
          const inflammationOptimization = await this.enhanceAntiInflammatory(modifiedRecipe)
          modifiedRecipe = inflammationOptimization.recipe
          modifications.push(...inflammationOptimization.modifications)
          break
      }
    }

    return { recipe: modifiedRecipe, modifications }
  }

  /**
   * Get potential substitutes for an ingredient
   */
  private async getPotentialSubstitutes(
    ingredient: Ingredient,
    restrictions: AllergensAndRestrictions
  ): Promise<Ingredient[]> {
    
    // Query database for ingredients in same category
    const { data: ingredients, error } = await this.supabase
      .from('ingredients')
      .select('*')
      .eq('category', ingredient.category)
      .neq('id', ingredient.id)
      .limit(20)

    if (error || !ingredients) {
      console.error('Error fetching substitute ingredients:', error)
      return []
    }

    // Filter out ingredients that violate restrictions
    return ingredients.filter(ing => {
      // Check allergens
      const hasAllergen = restrictions.allergens.some(allergen =>
        ing.name.toLowerCase().includes(allergen.toLowerCase())
      )
      
      // Check dislikes
      const isDisliked = restrictions.disliked_ingredients.some(disliked =>
        ing.name.toLowerCase().includes(disliked.toLowerCase())
      )

      return !hasAllergen && !isDisliked
    })
  }

  /**
   * Evaluate substitution quality
   */
  private async evaluateSubstitution(
    original: Ingredient,
    substitute: Ingredient,
    cookingMethod: string,
    nutritionPriority: string
  ): Promise<IngredientSubstitution> {
    
    // Calculate nutrition similarity
    const nutritionSimilarity = this.calculateNutritionSimilarity(original, substitute)
    
    // Calculate flavor compatibility
    const flavorCompatibility = this.calculateFlavorCompatibility(original, substitute)
    
    // Calculate cooking method compatibility
    const cookingCompatibility = this.calculateCookingCompatibility(original, substitute, cookingMethod)
    
    // Calculate substitution ratio
    const substitutionRatio = this.calculateSubstitutionRatio(original, substitute)
    
    // Calculate overall confidence
    const confidence = (nutritionSimilarity + flavorCompatibility + cookingCompatibility) / 3

    return {
      original_ingredient: original,
      substitute_ingredient: substitute,
      substitution_ratio: substitutionRatio,
      nutrition_similarity_score: nutritionSimilarity,
      flavor_compatibility_score: flavorCompatibility,
      cooking_method_compatibility: cookingCompatibility,
      allergen_safety: true, // Would need allergen database check
      substitution_reason: `Substitution pour ${nutritionPriority}`,
      confidence_score: confidence
    }
  }

  /**
   * Calculate nutrition similarity between ingredients
   */
  private calculateNutritionSimilarity(original: Ingredient, substitute: Ingredient): number {
    const metrics = [
      'calories_per_100g',
      'protein_g_per_100g',
      'carbs_g_per_100g',
      'fat_g_per_100g',
      'fiber_g_per_100g'
    ]

    let totalScore = 0
    let validMetrics = 0

    for (const metric of metrics) {
      const originalValue = original[metric as keyof Ingredient] as number || 0
      const substituteValue = substitute[metric as keyof Ingredient] as number || 0

      if (originalValue > 0 || substituteValue > 0) {
        const maxValue = Math.max(originalValue, substituteValue)
        const difference = Math.abs(originalValue - substituteValue)
        const similarity = Math.max(0, 100 - (difference / maxValue) * 100)
        totalScore += similarity
        validMetrics++
      }
    }

    return validMetrics > 0 ? totalScore / validMetrics : 50
  }

  /**
   * Calculate flavor compatibility
   */
  private calculateFlavorCompatibility(original: Ingredient, substitute: Ingredient): number {
    const originalFlavors = this.flavorProfiles.get(original.name.toLowerCase()) || []
    const substituteFlavors = this.flavorProfiles.get(substitute.name.toLowerCase()) || []

    if (originalFlavors.length === 0 || substituteFlavors.length === 0) {
      return 50 // Default when no flavor data
    }

    const commonFlavors = originalFlavors.filter(flavor => 
      substituteFlavors.includes(flavor)
    )

    const compatibility = (commonFlavors.length / originalFlavors.length) * 100
    return Math.min(100, compatibility)
  }

  /**
   * Calculate cooking method compatibility
   */
  private calculateCookingCompatibility(
    original: Ingredient,
    substitute: Ingredient,
    cookingMethod: string
  ): number {
    // Simplified cooking compatibility based on ingredient properties
    // In a real implementation, this would use a comprehensive cooking database
    
    const cookingCompatibility = {
      'roasting': { vegetables: 90, meats: 95, grains: 60 },
      'boiling': { vegetables: 85, grains: 95, pasta: 100 },
      'frying': { vegetables: 80, meats: 90, tofu: 85 },
      'steaming': { vegetables: 95, fish: 90, grains: 70 }
    }

    const method = cookingMethod.toLowerCase()
    const category = original.category?.toLowerCase() || 'general'

    return cookingCompatibility[method as keyof typeof cookingCompatibility]?.[category as keyof any] || 75
  }

  /**
   * Calculate substitution ratio
   */
  private calculateSubstitutionRatio(original: Ingredient, substitute: Ingredient): number {
    // Base ratio on density and nutritional content
    const originalCalories = original.calories_per_100g || 100
    const substituteCalories = substitute.calories_per_100g || 100

    // Adjust ratio to maintain similar caloric content
    return originalCalories / substituteCalories
  }

  /**
   * Calculate nutrition impact of modifications
   */
  private async calculateNutritionImpact(
    original: Recipe,
    modified: Recipe
  ): Promise<NutritionImpactAnalysis> {
    
    return {
      calories_change: (modified.calories_per_serving || 0) - (original.calories_per_serving || 0),
      protein_change: (modified.protein_g_per_serving || 0) - (original.protein_g_per_serving || 0),
      carbs_change: (modified.carbs_g_per_serving || 0) - (original.carbs_g_per_serving || 0),
      fat_change: (modified.fat_g_per_serving || 0) - (original.fat_g_per_serving || 0),
      fiber_change: (modified.fiber_g_per_serving || 0) - (original.fiber_g_per_serving || 0),
      micronutrient_changes: {}, // Would calculate micronutrient differences
      anti_inflammatory_score_change: (modified.anti_inflammatory_score || 0) - (original.anti_inflammatory_score || 0),
      overall_nutrition_score: 85 // Would calculate based on overall nutritional improvement
    }
  }

  // Helper methods for various calculations
  private calculateDifficultyChange(modifications: ModificationDetail[]): number {
    return modifications.reduce((change, mod) => {
      switch (mod.impact_level) {
        case 'minor': return change + 0.1
        case 'moderate': return change + 0.3
        case 'major': return change + 0.5
        default: return change
      }
    }, 0)
  }

  private calculateTimeImpact(modifications: ModificationDetail[]): number {
    return modifications.reduce((time, mod) => {
      // Estimate time impact based on modification type
      switch (mod.type) {
        case 'ingredient_substitution': return time + 2
        case 'cooking_method': return time + 5
        case 'preparation_modification': return time + 3
        default: return time
      }
    }, 0)
  }

  private calculateCostImpact(modifications: ModificationDetail[]): number {
    // Simplified cost impact calculation
    return modifications.length * 0.1 // Small increase per modification
  }

  private calculateSuccessProbability(modifications: ModificationDetail[], recipe: Recipe): number {
    let baseProbability = 90
    
    // Reduce probability for each major modification
    const majorModifications = modifications.filter(mod => mod.impact_level === 'major').length
    baseProbability -= majorModifications * 10

    // Adjust for recipe complexity
    const complexityPenalty = recipe.difficulty_level === 'hard' ? 10 : 0
    baseProbability -= complexityPenalty

    return Math.max(50, Math.min(100, baseProbability))
  }

  // Optimization methods
  private async reduceSodium(recipe: Recipe): Promise<{ recipe: Recipe; modifications: ModificationDetail[] }> {
    // Implementation for sodium reduction
    return { recipe, modifications: [] }
  }

  private async increaseProtein(recipe: Recipe): Promise<{ recipe: Recipe; modifications: ModificationDetail[] }> {
    // Implementation for protein increase
    return { recipe, modifications: [] }
  }

  private async reduceCalories(recipe: Recipe): Promise<{ recipe: Recipe; modifications: ModificationDetail[] }> {
    // Implementation for calorie reduction
    return { recipe, modifications: [] }
  }

  private async enhanceAntiInflammatory(recipe: Recipe): Promise<{ recipe: Recipe; modifications: ModificationDetail[] }> {
    // Implementation for anti-inflammatory enhancement
    return { recipe, modifications: [] }
  }

  // Utility methods
  private extractCookingMethod(instructions: string): string {
    const methods = ['roasting', 'boiling', 'frying', 'steaming', 'grilling', 'baking']
    const lowerInstructions = instructions.toLowerCase()
    
    return methods.find(method => lowerInstructions.includes(method)) || 'general'
  }

  private calculateNutrientRetentionImprovement(current: string, optimized: string): number {
    const retentionRates = {
      'steaming': 95,
      'air_frying': 85,
      'roasting': 80,
      'sautéing': 75,
      'boiling': 60,
      'deep_frying': 50
    }

    const currentRate = retentionRates[current as keyof typeof retentionRates] || 70
    const optimizedRate = retentionRates[optimized as keyof typeof retentionRates] || 70

    return optimizedRate - currentRate
  }

  private calculateCookingTimeChange(current: string, optimized: string): number {
    const timings = {
      'pressure_cooking': -15,
      'air_frying': -10,
      'microwave': -20,
      'steaming': +5,
      'roasting': +10
    }

    return timings[optimized as keyof typeof timings] || 0
  }

  private getRequiredEquipment(method: string): string[] {
    const equipment = {
      'air_frying': ['Air fryer'],
      'pressure_cooking': ['Pressure cooker'],
      'steaming': ['Steamer basket'],
      'roasting': ['Oven'],
      'grilling': ['Grill or grill pan']
    }

    return equipment[method as keyof typeof equipment] || []
  }

  private calculateCookingDifficultyChange(current: string, optimized: string): number {
    const difficulty = {
      'microwave': 1,
      'steaming': 2,
      'boiling': 2,
      'air_frying': 3,
      'sautéing': 3,
      'roasting': 4,
      'grilling': 4,
      'pressure_cooking': 5
    }

    const currentDiff = difficulty[current as keyof typeof difficulty] || 3
    const optimizedDiff = difficulty[optimized as keyof typeof difficulty] || 3

    return optimizedDiff - currentDiff
  }

  private async getIngredientByName(name: string): Promise<Ingredient | null> {
    const { data, error } = await this.supabase
      .from('ingredients')
      .select('*')
      .ilike('name', `%${name}%`)
      .limit(1)
      .single()

    if (error || !data) {
      console.error('Error fetching ingredient:', error)
      return null
    }

    return data
  }

  private initializeSubstitutionDatabase(): void {
    // Initialize common substitutions
    // This would typically be loaded from a comprehensive database
  }

  private initializeFlavorProfiles(): void {
    // Initialize flavor profiles for ingredients
    this.flavorProfiles.set('tomato', ['umami', 'sweet', 'acidic'])
    this.flavorProfiles.set('onion', ['sweet', 'pungent', 'savory'])
    this.flavorProfiles.set('garlic', ['pungent', 'savory', 'spicy'])
    this.flavorProfiles.set('basil', ['herbal', 'sweet', 'peppery'])
    // ... more flavor profiles
  }
}

export const recipeAIEngine = new RecipeAIEngine()