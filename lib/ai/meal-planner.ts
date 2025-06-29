/**
 * Advanced AI Meal Planner
 * Intelligent meal planning with predictive nutrition analysis,
 * health biomarker correlation, and adaptive learning
 */

import { UserProfile, HealthBiomarkers, AILearningProfile, BiomarkerEntry } from '@/lib/auth/types'
import { Recipe, Ingredient, MenuGenerationOptions, GeneratedMenu } from '@/lib/services/menu-generator'
import { createClient } from '@/lib/supabase-client'

export interface NutritionPrediction {
  predicted_energy_level: number // 1-10 scale
  inflammation_impact_score: number // -10 to +10 scale
  biomarker_improvement_probability: number // 0-1 probability
  micronutrient_adequacy_score: number // 0-100 percentage
  meal_satisfaction_prediction: number // 1-10 scale
}

export interface AIMenuOptions extends MenuGenerationOptions {
  // Enhanced AI parameters
  optimize_for_biomarkers?: boolean
  seasonal_preference_weight?: number // 0-1
  novelty_vs_familiarity?: number // 0-1 (0=familiar, 1=novel)
  health_goal_priority?: 'energy' | 'inflammation' | 'weight' | 'performance'
  learning_adaptation_enabled?: boolean
}

export interface EnhancedRecipe extends Recipe {
  // AI-enhanced fields
  personalization_score: number // 0-100 how well this matches user
  predicted_satisfaction: number // 1-10 predicted user satisfaction
  biomarker_benefits: Record<string, number> // biomarker -> expected improvement
  seasonal_appropriateness: number // 0-1 seasonal fit score
  novelty_score: number // 0-1 how new this is for the user
  learning_confidence: number // 0-1 confidence in predictions
  
  // Scientific backing
  scientific_evidence_score: number // 0-100 research support
  anti_inflammatory_compounds: string[]
  micronutrient_highlights: string[]
  health_claims: HealthClaim[]
}

export interface HealthClaim {
  claim: string
  evidence_level: 'preliminary' | 'moderate' | 'strong'
  research_citations: string[]
  confidence_score: number // 0-1
}

export interface MealPlanningContext {
  user_profile: UserProfile
  recent_meals: Recipe[] // last 7 days of meals
  seasonal_context: SeasonalContext
  health_trends: HealthTrend[]
  learning_insights: LearningInsight[]
}

export interface SeasonalContext {
  current_season: 'spring' | 'summer' | 'fall' | 'winter'
  local_ingredients: string[]
  seasonal_nutrition_focus: string[]
  cultural_seasonal_patterns: Record<string, number>
}

export interface HealthTrend {
  biomarker: string
  trend_direction: 'improving' | 'stable' | 'declining'
  correlation_with_nutrition: number // -1 to 1
  recommended_interventions: string[]
}

export interface LearningInsight {
  insight_type: 'preference' | 'timing' | 'portion' | 'preparation'
  description: string
  confidence: number // 0-1
  impact_on_planning: number // 0-1
}

export class AILearningMealPlanner {
  private supabase = createClient()
  private antiInflammatoryDatabase: Map<string, number> = new Map()
  private scientificReferences: Map<string, HealthClaim[]> = new Map()

  constructor() {
    this.initializeScientificDatabase()
  }

  /**
   * Generate AI-enhanced personalized meal plan
   */
  async generateIntelligentMenu(
    context: MealPlanningContext,
    options: AIMenuOptions
  ): Promise<{ menu: GeneratedMenu; predictions: NutritionPrediction; insights: LearningInsight[] }> {
    console.log('🧠 Starting AI meal planning with enhanced intelligence...')

    try {
      // 1. Analyze user context and preferences
      const preferenceAnalysis = await this.analyzeUserPreferences(context)
      
      // 2. Get biomarker-optimized ingredient recommendations
      const biomarkerOptimizedIngredients = await this.getBiomarkerOptimizedIngredients(
        context.user_profile.health_profile?.health_biomarkers
      )
      
      // 3. Generate recipe candidates with AI scoring
      const candidateRecipes = await this.generateRecipeCandidates(
        context,
        options,
        biomarkerOptimizedIngredients
      )
      
      // 4. Apply AI selection algorithm
      const selectedRecipes = await this.selectOptimalRecipes(
        candidateRecipes,
        context,
        options
      )
      
      // 5. Generate nutrition predictions
      const predictions = await this.generateNutritionPredictions(
        selectedRecipes,
        context.user_profile
      )
      
      // 6. Create menu structure
      const menu = await this.buildEnhancedMenu(selectedRecipes, context, predictions)
      
      // 7. Generate learning insights
      const insights = await this.generateLearningInsights(
        selectedRecipes,
        context,
        predictions
      )
      
      // 8. Update user learning profile
      if (options.learning_adaptation_enabled !== false) {
        await this.updateLearningProfile(context.user_profile, selectedRecipes, insights)
      }

      return { menu, predictions, insights }

    } catch (error) {
      console.error('❌ AI meal planning failed:', error)
      throw new Error(`AI meal planning failed: ${error.message}`)
    }
  }

  /**
   * Analyze user preferences using AI learning
   */
  private async analyzeUserPreferences(context: MealPlanningContext): Promise<any> {
    const { user_profile, recent_meals } = context
    const aiProfile = user_profile.ai_learning_profile || {}

    // Calculate preference scores based on historical data
    const ingredientPreferences = aiProfile.meal_preferences_learned || {}
    const seasonalPreferences = aiProfile.seasonal_preferences || {}
    const complianceScore = aiProfile.dietary_compliance_score || 75

    // Analyze recent meal patterns
    const recentIngredients = recent_meals.flatMap(meal => 
      meal.ingredients?.map(ri => ri.ingredient.name) || []
    )
    
    const ingredientFrequency = recentIngredients.reduce((acc, ingredient) => {
      acc[ingredient] = (acc[ingredient] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      learned_preferences: ingredientPreferences,
      seasonal_preferences: seasonalPreferences,
      compliance_score: complianceScore,
      recent_patterns: ingredientFrequency,
      novelty_tolerance: aiProfile.novelty_tolerance || 0.5
    }
  }

  /**
   * Get ingredients optimized for specific biomarkers
   */
  private async getBiomarkerOptimizedIngredients(
    biomarkers?: HealthBiomarkers
  ): Promise<Record<string, string[]>> {
    if (!biomarkers) return {}

    const optimizations: Record<string, string[]> = {}

    // CRP (Inflammation) optimization
    if (biomarkers.crp_level && biomarkers.crp_level > 3.0) {
      optimizations.anti_inflammatory = [
        'turmeric', 'ginger', 'fatty_fish', 'berries', 'leafy_greens',
        'nuts', 'olive_oil', 'tomatoes', 'cherries', 'green_tea'
      ]
    }

    // Cholesterol optimization
    if (biomarkers.cholesterol_total && biomarkers.cholesterol_total > 200) {
      optimizations.cholesterol_lowering = [
        'oats', 'beans', 'eggplant', 'okra', 'apples', 'grapes',
        'citrus_fruits', 'barley', 'soy', 'almonds'
      ]
    }

    // Blood sugar optimization
    if (biomarkers.glucose_fasting && biomarkers.glucose_fasting > 100) {
      optimizations.glucose_stabilizing = [
        'cinnamon', 'vinegar', 'whole_grains', 'legumes', 'non_starchy_vegetables',
        'lean_proteins', 'nuts', 'seeds', 'chromium_rich_foods'
      ]
    }

    // Vitamin D deficiency
    if (biomarkers.vitamin_d && biomarkers.vitamin_d < 30) {
      optimizations.vitamin_d_boosting = [
        'fatty_fish', 'egg_yolks', 'fortified_foods', 'mushrooms'
      ]
    }

    // Iron deficiency
    if (biomarkers.iron_serum && biomarkers.iron_serum < 60) {
      optimizations.iron_boosting = [
        'red_meat', 'spinach', 'lentils', 'quinoa', 'pumpkin_seeds',
        'dark_chocolate', 'tofu', 'cashews'
      ]
    }

    return optimizations
  }

  /**
   * Generate recipe candidates with AI enhancement
   */
  private async generateRecipeCandidates(
    context: MealPlanningContext,
    options: AIMenuOptions,
    biomarkerIngredients: Record<string, string[]>
  ): Promise<EnhancedRecipe[]> {
    
    // Get base recipes from database
    const { data: recipes, error } = await this.supabase
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
      .limit(500)

    if (error || !recipes) {
      throw new Error('Failed to fetch recipes for AI analysis')
    }

    // Convert to enhanced recipes with AI scoring
    const enhancedRecipes: EnhancedRecipe[] = []

    for (const recipe of recipes) {
      const enhanced = await this.enhanceRecipeWithAI(
        recipe,
        context,
        options,
        biomarkerIngredients
      )
      enhancedRecipes.push(enhanced)
    }

    return enhancedRecipes.sort((a, b) => b.personalization_score - a.personalization_score)
  }

  /**
   * Enhance recipe with AI analysis
   */
  private async enhanceRecipeWithAI(
    recipe: any,
    context: MealPlanningContext,
    options: AIMenuOptions,
    biomarkerIngredients: Record<string, string[]>
  ): Promise<EnhancedRecipe> {
    
    const { user_profile, seasonal_context } = context
    const aiProfile = user_profile.ai_learning_profile || {}

    // Calculate personalization score
    const personalizationScore = this.calculatePersonalizationScore(
      recipe,
      user_profile,
      aiProfile
    )

    // Calculate biomarker benefits
    const biomarkerBenefits = this.calculateBiomarkerBenefits(
      recipe,
      biomarkerIngredients
    )

    // Calculate seasonal appropriateness
    const seasonalAppropriatenessScore = this.calculateSeasonalScore(
      recipe,
      seasonal_context
    )

    // Calculate novelty score
    const noveltyScore = this.calculateNoveltyScore(
      recipe,
      context.recent_meals,
      aiProfile
    )

    // Get scientific evidence
    const scientificEvidence = this.getScientificEvidence(recipe)
    
    // Predict satisfaction
    const predictedSatisfaction = this.predictUserSatisfaction(
      recipe,
      user_profile,
      aiProfile
    )

    return {
      ...recipe,
      personalization_score: personalizationScore,
      predicted_satisfaction: predictedSatisfaction,
      biomarker_benefits: biomarkerBenefits,
      seasonal_appropriateness: seasonalAppropriatenessScore,
      novelty_score: noveltyScore,
      learning_confidence: aiProfile.preference_confidence || 0.5,
      scientific_evidence_score: scientificEvidence.score,
      anti_inflammatory_compounds: this.extractAntiInflammatoryCompounds(recipe),
      micronutrient_highlights: this.extractMicronutrientHighlights(recipe),
      health_claims: scientificEvidence.claims,
      // Convert recipe ingredients if needed
      ingredients: recipe.recipe_ingredients?.map((ri: any) => ({
        ingredient: ri.ingredients,
        quantity: ri.quantity,
        unit: ri.unit,
        preparation_notes: ri.preparation_notes
      })) || []
    }
  }

  /**
   * Calculate how well a recipe matches user preferences
   */
  private calculatePersonalizationScore(
    recipe: any,
    userProfile: UserProfile,
    aiProfile: AILearningProfile
  ): number {
    let score = 50 // Base score

    // Dietary preferences match
    const dietaryPreferences = userProfile.dietary_preferences || []
    const recipeTags = recipe.dietary_tags || []
    const dietaryMatch = dietaryPreferences.filter(pref => 
      recipeTags.includes(pref)
    ).length
    score += dietaryMatch * 10

    // Learned preferences
    const learnedPreferences = aiProfile.meal_preferences_learned || {}
    const recipeIngredients = recipe.recipe_ingredients?.map((ri: any) => 
      ri.ingredients?.name
    ).filter(Boolean) || []
    
    const preferenceScore = recipeIngredients.reduce((acc, ingredient) => {
      const preference = learnedPreferences[ingredient] || 0
      return acc + preference
    }, 0) / Math.max(recipeIngredients.length, 1)
    
    score += (preferenceScore * 30)

    // Difficulty preference
    const skillLevel = userProfile.cooking_skill_level || 'intermediate'
    const difficultyMap = { easy: 1, medium: 2, hard: 3 }
    const skillMap = { beginner: 1, intermediate: 2, advanced: 3 }
    
    if (difficultyMap[recipe.difficulty_level] <= skillMap[skillLevel]) {
      score += 10
    }

    // Time preference
    const mealPrepTime = userProfile.meal_prep_time || 'medium'
    const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)
    const timePreference = {
      quick: 30,
      medium: 60,
      elaborate: 120
    }
    
    if (totalTime <= timePreference[mealPrepTime]) {
      score += 10
    }

    return Math.min(100, Math.max(0, score))
  }

  /**
   * Calculate potential biomarker benefits
   */
  private calculateBiomarkerBenefits(
    recipe: any,
    biomarkerIngredients: Record<string, string[]>
  ): Record<string, number> {
    const benefits: Record<string, number> = {}
    const recipeIngredients = recipe.recipe_ingredients?.map((ri: any) => 
      ri.ingredients?.name?.toLowerCase()
    ).filter(Boolean) || []

    for (const [biomarker, beneficialIngredients] of Object.entries(biomarkerIngredients)) {
      const matchCount = recipeIngredients.filter(ingredient =>
        beneficialIngredients.some(beneficial => 
          ingredient.includes(beneficial.toLowerCase()) ||
          beneficial.toLowerCase().includes(ingredient)
        )
      ).length

      benefits[biomarker] = Math.min(100, (matchCount / beneficialIngredients.length) * 100)
    }

    return benefits
  }

  /**
   * Calculate seasonal appropriateness
   */
  private calculateSeasonalScore(
    recipe: any,
    seasonalContext: SeasonalContext
  ): number {
    const recipeIngredients = recipe.recipe_ingredients?.map((ri: any) => 
      ri.ingredients?.name?.toLowerCase()
    ).filter(Boolean) || []

    const seasonalIngredients = seasonalContext.local_ingredients.map(i => i.toLowerCase())
    
    const seasonalMatches = recipeIngredients.filter(ingredient =>
      seasonalIngredients.some(seasonal => 
        ingredient.includes(seasonal) || seasonal.includes(ingredient)
      )
    ).length

    return Math.min(100, (seasonalMatches / Math.max(recipeIngredients.length, 1)) * 100)
  }

  /**
   * Calculate novelty score (how new this is for the user)
   */
  private calculateNoveltyScore(
    recipe: any,
    recentMeals: Recipe[],
    aiProfile: AILearningProfile
  ): number {
    const recentRecipeIds = recentMeals.map(meal => meal.id)
    
    if (recentRecipeIds.includes(recipe.id)) {
      return 0 // Recipe was recently consumed
    }

    const recipeIngredients = recipe.recipe_ingredients?.map((ri: any) => 
      ri.ingredients?.name
    ).filter(Boolean) || []

    const recentIngredients = recentMeals.flatMap(meal =>
      meal.ingredients?.map(ri => ri.ingredient.name) || []
    )

    const novelIngredients = recipeIngredients.filter(ingredient =>
      !recentIngredients.includes(ingredient)
    )

    const noveltyRatio = novelIngredients.length / Math.max(recipeIngredients.length, 1)
    return Math.min(100, noveltyRatio * 100)
  }

  /**
   * Get scientific evidence for recipe health benefits
   */
  private getScientificEvidence(recipe: any): { score: number; claims: HealthClaim[] } {
    const claims: HealthClaim[] = []
    let totalScore = 0

    // Anti-inflammatory evidence
    if (recipe.anti_inflammatory_score > 5) {
      claims.push({
        claim: "Rich in anti-inflammatory compounds",
        evidence_level: "strong",
        research_citations: [
          "Calder, P.C. (2017). Omega-3 fatty acids and inflammatory processes",
          "Schwingshackl, L. (2018). Mediterranean diet and health status"
        ],
        confidence_score: 0.85
      })
      totalScore += 85
    }

    // Micronutrient density
    const micronutrientScore = this.calculateMicronutrientDensity(recipe)
    if (micronutrientScore > 70) {
      claims.push({
        claim: "High micronutrient density supporting optimal health",
        evidence_level: "strong",
        research_citations: [
          "Ames, B.N. (2006). Low micronutrient intake may accelerate aging",
          "Blumberg, J.B. (2018). Impact of frequency of multi-vitamin use"
        ],
        confidence_score: 0.78
      })
      totalScore += 78
    }

    const averageScore = claims.length > 0 ? totalScore / claims.length : 50

    return { score: averageScore, claims }
  }

  /**
   * Extract anti-inflammatory compounds from recipe
   */
  private extractAntiInflammatoryCompounds(recipe: any): string[] {
    const compounds: string[] = []
    const ingredients = recipe.recipe_ingredients?.map((ri: any) => 
      ri.ingredients?.name?.toLowerCase()
    ).filter(Boolean) || []

    const compoundMap: Record<string, string[]> = {
      'curcumin': ['turmeric'],
      'gingerol': ['ginger'],
      'omega-3 fatty acids': ['salmon', 'sardines', 'mackerel', 'walnuts', 'flaxseed'],
      'anthocyanins': ['blueberries', 'blackberries', 'cherries'],
      'quercetin': ['onions', 'apples', 'berries'],
      'resveratrol': ['grapes', 'red wine'],
      'lycopene': ['tomatoes', 'watermelon'],
      'catechins': ['green tea', 'dark chocolate']
    }

    for (const [compound, sources] of Object.entries(compoundMap)) {
      if (sources.some(source => 
        ingredients.some(ingredient => ingredient.includes(source))
      )) {
        compounds.push(compound)
      }
    }

    return compounds
  }

  /**
   * Extract key micronutrients from recipe
   */
  private extractMicronutrientHighlights(recipe: any): string[] {
    const highlights: string[] = []
    
    // This would typically analyze the actual micronutrient content
    // For now, we'll use ingredient-based heuristics
    const ingredients = recipe.recipe_ingredients?.map((ri: any) => 
      ri.ingredients?.name?.toLowerCase()
    ).filter(Boolean) || []

    if (ingredients.some(i => ['spinach', 'kale', 'broccoli'].some(g => i.includes(g)))) {
      highlights.push('High in Vitamin K, Folate, Iron')
    }
    
    if (ingredients.some(i => ['salmon', 'sardines', 'mackerel'].some(f => i.includes(f)))) {
      highlights.push('Rich in Omega-3 fatty acids, Vitamin D')
    }
    
    if (ingredients.some(i => ['nuts', 'seeds'].some(n => i.includes(n)))) {
      highlights.push('Good source of Vitamin E, Magnesium')
    }

    return highlights
  }

  /**
   * Calculate micronutrient density score
   */
  private calculateMicronutrientDensity(recipe: any): number {
    // This would typically analyze actual micronutrient data
    // For now, return a heuristic-based score
    const ingredients = recipe.recipe_ingredients?.length || 0
    const vegetables = recipe.recipe_ingredients?.filter((ri: any) =>
      ri.ingredients?.category === 'vegetables'
    ).length || 0
    
    const baseScore = Math.min(100, (vegetables / Math.max(ingredients, 1)) * 100)
    return baseScore
  }

  /**
   * Predict user satisfaction with recipe
   */
  private predictUserSatisfaction(
    recipe: any,
    userProfile: UserProfile,
    aiProfile: AILearningProfile
  ): number {
    let satisfaction = 5 // Base satisfaction

    // Adjust based on learned preferences
    const learnedPreferences = aiProfile.meal_preferences_learned || {}
    const recipeIngredients = recipe.recipe_ingredients?.map((ri: any) => 
      ri.ingredients?.name
    ).filter(Boolean) || []

    const avgPreference = recipeIngredients.reduce((acc, ingredient) => {
      const preference = learnedPreferences[ingredient] || 0
      return acc + preference
    }, 0) / Math.max(recipeIngredients.length, 1)

    satisfaction += (avgPreference * 3) // Scale to 1-10

    // Adjust for dietary compliance
    const complianceScore = aiProfile.dietary_compliance_score || 75
    if (complianceScore > 80) {
      satisfaction += 1
    }

    // Adjust for novelty tolerance
    const noveltyTolerance = aiProfile.novelty_tolerance || 0.5
    const recipeNovelty = this.calculateNoveltyScore(recipe, [], aiProfile) / 100
    
    if (Math.abs(recipeNovelty - noveltyTolerance) < 0.3) {
      satisfaction += 1 // Good novelty match
    }

    return Math.min(10, Math.max(1, satisfaction))
  }

  /**
   * Select optimal recipes using AI algorithm
   */
  private async selectOptimalRecipes(
    candidates: EnhancedRecipe[],
    context: MealPlanningContext,
    options: AIMenuOptions
  ): Promise<Record<string, EnhancedRecipe[]>> {
    const selectedMeals: Record<string, EnhancedRecipe[]> = {}

    for (const mealType of options.mealTypes) {
      const mealCandidates = candidates.filter(recipe =>
        recipe.meal_type.includes(mealType)
      )

      if (mealCandidates.length === 0) continue

      // Apply AI selection criteria
      const scored = mealCandidates.map(recipe => ({
        recipe,
        totalScore: this.calculateTotalAIScore(recipe, options, context)
      }))

      // Sort by total AI score
      scored.sort((a, b) => b.totalScore - a.totalScore)

      // Select top recipe(s) for this meal type
      selectedMeals[mealType] = [scored[0].recipe]
    }

    return selectedMeals
  }

  /**
   * Calculate total AI score for recipe selection
   */
  private calculateTotalAIScore(
    recipe: EnhancedRecipe,
    options: AIMenuOptions,
    context: MealPlanningContext
  ): number {
    let score = 0

    // Base personalization score (40% weight)
    score += recipe.personalization_score * 0.4

    // Predicted satisfaction (20% weight)
    score += (recipe.predicted_satisfaction / 10) * 100 * 0.2

    // Biomarker optimization (20% weight if enabled)
    if (options.optimize_for_biomarkers) {
      const avgBiomarkerBenefit = Object.values(recipe.biomarker_benefits)
        .reduce((sum, benefit) => sum + benefit, 0) / 
        Math.max(Object.keys(recipe.biomarker_benefits).length, 1)
      score += avgBiomarkerBenefit * 0.2
    }

    // Seasonal appropriateness (10% weight)
    const seasonalWeight = options.seasonal_preference_weight || 0.5
    score += recipe.seasonal_appropriateness * seasonalWeight * 0.1

    // Novelty vs familiarity (10% weight)
    const noveltyPreference = options.novelty_vs_familiarity || 0.5
    const noveltyScore = noveltyPreference * recipe.novelty_score + 
                        (1 - noveltyPreference) * (100 - recipe.novelty_score)
    score += noveltyScore * 0.1

    return Math.min(100, Math.max(0, score))
  }

  /**
   * Generate nutrition predictions for selected menu
   */
  private async generateNutritionPredictions(
    selectedRecipes: Record<string, EnhancedRecipe[]>,
    userProfile: UserProfile
  ): Promise<NutritionPrediction> {
    
    const allRecipes = Object.values(selectedRecipes).flat()
    
    // Predicted energy level based on macro balance and timing
    const predictedEnergyLevel = this.predictEnergyLevel(allRecipes, userProfile)
    
    // Inflammation impact based on anti-inflammatory compounds
    const inflammationImpactScore = this.calculateInflammationImpact(allRecipes)
    
    // Biomarker improvement probability
    const biomarkerImprovementProbability = this.calculateBiomarkerImprovementProbability(
      allRecipes,
      userProfile.health_profile?.health_biomarkers
    )
    
    // Micronutrient adequacy
    const micronutrientAdequacyScore = this.calculateMicronutrientAdequacy(allRecipes)
    
    // Meal satisfaction prediction
    const mealSatisfactionPrediction = allRecipes.reduce((sum, recipe) => 
      sum + recipe.predicted_satisfaction, 0) / Math.max(allRecipes.length, 1)

    return {
      predicted_energy_level: predictedEnergyLevel,
      inflammation_impact_score: inflammationImpactScore,
      biomarker_improvement_probability: biomarkerImprovementProbability,
      micronutrient_adequacy_score: micronutrientAdequacyScore,
      meal_satisfaction_prediction: mealSatisfactionPrediction
    }
  }

  /**
   * Predict energy level from meals
   */
  private predictEnergyLevel(recipes: EnhancedRecipe[], userProfile: UserProfile): number {
    let energyScore = 5 // Base energy level

    // Analyze macro balance
    const totalCalories = recipes.reduce((sum, recipe) => sum + recipe.calories_per_serving, 0)
    const targetCalories = userProfile.daily_calories_target || 2000
    
    const calorieRatio = totalCalories / targetCalories
    if (calorieRatio >= 0.8 && calorieRatio <= 1.2) {
      energyScore += 1 // Good calorie balance
    }

    // Complex carbohydrates for sustained energy
    const avgFiber = recipes.reduce((sum, recipe) => 
      sum + recipe.fiber_g_per_serving, 0) / Math.max(recipes.length, 1)
    
    if (avgFiber > 5) {
      energyScore += 1
    }

    // Anti-inflammatory foods reduce energy-draining inflammation
    const avgAntiInflammatory = recipes.reduce((sum, recipe) => 
      sum + recipe.anti_inflammatory_score, 0) / Math.max(recipes.length, 1)
    
    if (avgAntiInflammatory > 5) {
      energyScore += 1
    }

    return Math.min(10, Math.max(1, energyScore))
  }

  /**
   * Calculate inflammation impact
   */
  private calculateInflammationImpact(recipes: EnhancedRecipe[]): number {
    const avgAntiInflammatoryScore = recipes.reduce((sum, recipe) => 
      sum + recipe.anti_inflammatory_score, 0) / Math.max(recipes.length, 1)
    
    // Convert -10 to +10 scale (higher is better for inflammation)
    return Math.min(10, Math.max(-10, avgAntiInflammatoryScore))
  }

  /**
   * Calculate biomarker improvement probability
   */
  private calculateBiomarkerImprovementProbability(
    recipes: EnhancedRecipe[],
    biomarkers?: HealthBiomarkers
  ): number {
    if (!biomarkers) return 0.5 // Base probability

    let totalBenefit = 0
    let benefitCount = 0

    for (const recipe of recipes) {
      for (const benefit of Object.values(recipe.biomarker_benefits)) {
        totalBenefit += benefit
        benefitCount++
      }
    }

    const avgBenefit = benefitCount > 0 ? totalBenefit / benefitCount : 50
    return Math.min(1, Math.max(0, avgBenefit / 100))
  }

  /**
   * Calculate micronutrient adequacy
   */
  private calculateMicronutrientAdequacy(recipes: EnhancedRecipe[]): number {
    // This would typically analyze actual micronutrient content
    // For now, use ingredient diversity and quality as proxy
    
    const allIngredients = recipes.flatMap(recipe => 
      recipe.ingredients?.map(ri => ri.ingredient.name) || []
    )
    
    const uniqueIngredients = [...new Set(allIngredients)]
    const ingredientDiversity = Math.min(100, (uniqueIngredients.length / 20) * 100)
    
    // Bonus for nutrient-dense ingredients
    const nutrientDenseCount = allIngredients.filter(ingredient =>
      ['spinach', 'kale', 'broccoli', 'salmon', 'nuts', 'seeds', 'berries']
        .some(dense => ingredient.toLowerCase().includes(dense))
    ).length
    
    const nutrientDensityBonus = Math.min(20, nutrientDenseCount * 2)
    
    return Math.min(100, ingredientDiversity + nutrientDensityBonus)
  }

  /**
   * Build enhanced menu structure
   */
  private async buildEnhancedMenu(
    selectedRecipes: Record<string, EnhancedRecipe[]>,
    context: MealPlanningContext,
    predictions: NutritionPrediction
  ): Promise<GeneratedMenu> {
    
    const allRecipes = Object.values(selectedRecipes).flat()
    
    // Calculate total nutrition
    const totalNutrition = {
      calories: allRecipes.reduce((sum, recipe) => sum + recipe.calories_per_serving, 0),
      protein: allRecipes.reduce((sum, recipe) => sum + recipe.protein_g_per_serving, 0),
      carbs: allRecipes.reduce((sum, recipe) => sum + recipe.carbs_g_per_serving, 0),
      fat: allRecipes.reduce((sum, recipe) => sum + recipe.fat_g_per_serving, 0),
      fiber: allRecipes.reduce((sum, recipe) => sum + recipe.fiber_g_per_serving, 0)
    }

    // Calculate overall anti-inflammatory score
    const antiInflammatoryScore = allRecipes.reduce((sum, recipe) => 
      sum + recipe.anti_inflammatory_score, 0) / Math.max(allRecipes.length, 1)

    return {
      id: `ai-menu-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      meals: selectedRecipes,
      totalNutrition,
      antiInflammatoryScore,
      shoppingList: [] // Would generate shopping list here
    }
  }

  /**
   * Generate learning insights from meal planning
   */
  private async generateLearningInsights(
    selectedRecipes: Record<string, EnhancedRecipe[]>,
    context: MealPlanningContext,
    predictions: NutritionPrediction
  ): Promise<LearningInsight[]> {
    
    const insights: LearningInsight[] = []
    const allRecipes = Object.values(selectedRecipes).flat()

    // Preference learning insight
    const avgPersonalizationScore = allRecipes.reduce((sum, recipe) => 
      sum + recipe.personalization_score, 0) / Math.max(allRecipes.length, 1)
    
    if (avgPersonalizationScore > 80) {
      insights.push({
        insight_type: 'preference',
        description: 'Strong preference match detected - continuing to learn your tastes',
        confidence: 0.85,
        impact_on_planning: 0.9
      })
    }

    // Novelty tolerance insight
    const avgNoveltyScore = allRecipes.reduce((sum, recipe) => 
      sum + recipe.novelty_score, 0) / Math.max(allRecipes.length, 1)
    
    if (avgNoveltyScore > 70) {
      insights.push({
        insight_type: 'preference',
        description: 'You seem open to trying new ingredients and recipes',
        confidence: 0.7,
        impact_on_planning: 0.6
      })
    }

    // Health optimization insight
    if (predictions.biomarker_improvement_probability > 0.7) {
      insights.push({
        insight_type: 'preference',
        description: 'Menu optimized for your health biomarkers with high improvement potential',
        confidence: 0.8,
        impact_on_planning: 0.95
      })
    }

    return insights
  }

  /**
   * Update user learning profile based on meal planning
   */
  private async updateLearningProfile(
    userProfile: UserProfile,
    selectedRecipes: Record<string, EnhancedRecipe[]>,
    insights: LearningInsight[]
  ): Promise<void> {
    
    const allRecipes = Object.values(selectedRecipes).flat()
    const currentProfile = userProfile.ai_learning_profile || {}

    // Update interaction count
    const updatedProfile: AILearningProfile = {
      ...currentProfile,
      interaction_count: (currentProfile.interaction_count || 0) + 1,
      preference_confidence: Math.min(1, (currentProfile.preference_confidence || 0.5) + 0.05)
    }

    // Update ingredient preferences based on selections
    const updatedPreferences = { ...currentProfile.meal_preferences_learned } || {}
    
    for (const recipe of allRecipes) {
      const ingredients = recipe.ingredients?.map(ri => ri.ingredient.name) || []
      for (const ingredient of ingredients) {
        updatedPreferences[ingredient] = Math.min(1, 
          (updatedPreferences[ingredient] || 0) + 0.1
        )
      }
    }

    updatedProfile.meal_preferences_learned = updatedPreferences

    // Save updated profile (would typically update database)
    console.log('🧠 Updated AI learning profile:', updatedProfile)
  }

  /**
   * Initialize scientific database with anti-inflammatory and research data
   */
  private initializeScientificDatabase(): void {
    // Anti-inflammatory scores for common ingredients
    this.antiInflammatoryDatabase.set('turmeric', 9)
    this.antiInflammatoryDatabase.set('ginger', 8)
    this.antiInflammatoryDatabase.set('salmon', 8)
    this.antiInflammatoryDatabase.set('blueberries', 7)
    this.antiInflammatoryDatabase.set('spinach', 7)
    this.antiInflammatoryDatabase.set('olive_oil', 8)
    this.antiInflammatoryDatabase.set('nuts', 6)
    this.antiInflammatoryDatabase.set('green_tea', 7)
    this.antiInflammatoryDatabase.set('tomatoes', 6)
    this.antiInflammatoryDatabase.set('cherries', 7)

    // Scientific references (would typically load from database)
    this.scientificReferences.set('anti_inflammatory', [
      {
        claim: "Mediterranean diet reduces inflammatory markers",
        evidence_level: "strong",
        research_citations: [
          "Estruch et al. (2018). Primary Prevention of CVD with Mediterranean Diet",
          "Schwingshackl et al. (2017). Mediterranean diet and health outcomes"
        ],
        confidence_score: 0.92
      }
    ])
  }
}

export const aiMealPlanner = new AILearningMealPlanner()