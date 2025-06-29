/**
 * Learning & Adaptation System
 * Advanced user preference learning with feedback-based recommendation improvement
 * and adaptive meal planning optimization
 */

import { UserProfile, AILearningProfile, GoalProgress, HealthCorrelationInsight } from '@/lib/auth/types'
import { Recipe, GeneratedMenu } from '@/lib/services/menu-generator'
import { createClient } from '@/lib/supabase-client'

export interface UserFeedback {
  recipe_id: string
  user_id: string
  feedback_type: 'like' | 'dislike' | 'love' | 'neutral'
  rating: number // 1-5 stars
  preparation_difficulty_actual: 'easier' | 'as_expected' | 'harder'
  cooking_time_actual: number // actual minutes taken
  satisfaction_level: number // 1-10
  would_cook_again: boolean
  taste_rating: number // 1-5
  health_feeling_after: 'energized' | 'satisfied' | 'sluggish' | 'neutral'
  comments?: string
  date_consumed: string
  meal_type: string
  modifications_made?: string[]
}

export interface LearningEvent {
  event_type: 'recipe_selection' | 'meal_completion' | 'ingredient_substitution' | 'cooking_method_change'
  timestamp: string
  data: Record<string, any>
  learning_weight: number // 0-1 how much this should influence learning
}

export interface PreferenceLearning {
  ingredient_preferences: Record<string, number> // ingredient -> preference score (-1 to 1)
  flavor_preferences: Record<string, number> // flavor profile -> preference score
  cuisine_preferences: Record<string, number> // cuisine type -> preference score
  cooking_method_preferences: Record<string, number> // method -> preference score
  meal_timing_patterns: Record<string, number> // time of day -> frequency
  portion_size_patterns: Record<string, number> // meal type -> preferred size multiplier
  difficulty_comfort_level: number // 0-1 how comfortable with complex recipes
  novelty_appetite: number // 0-1 how much they want new vs familiar foods
  last_updated: string
  confidence_score: number // 0-1 how confident we are in these learnings
}

export interface AdaptationRecommendation {
  type: 'ingredient_increase' | 'ingredient_decrease' | 'cuisine_exploration' | 'difficulty_adjustment' | 'timing_optimization'
  description: string
  confidence: number
  expected_impact: number // 0-1 expected improvement in satisfaction
  rationale: string
  implementation_difficulty: 'easy' | 'medium' | 'hard'
}

export interface PersonalizationMetrics {
  satisfaction_trend: 'improving' | 'stable' | 'declining'
  recommendation_accuracy: number // 0-100 percentage of liked recommendations
  learning_velocity: number // 0-1 how quickly preferences are being learned
  prediction_confidence: number // 0-1 confidence in future recommendations
  engagement_score: number // 0-100 user engagement with recommendations
  health_correlation_strength: number // 0-1 strength of nutrition-health correlations
}

class LearningAdaptationSystem {
  private supabase = createClient()
  
  constructor() {}

  /**
   * Process user feedback and update learning profile
   */
  async processFeedback(
    feedback: UserFeedback,
    currentProfile: AILearningProfile
  ): Promise<AILearningProfile> {
    console.log('🧠 Processing user feedback for learning adaptation...')

    try {
      // Get recipe details for analysis
      const recipe = await this.getRecipeDetails(feedback.recipe_id)
      if (!recipe) {
        throw new Error('Recipe not found for feedback processing')
      }

      // Update ingredient preferences based on feedback
      const updatedIngredientPreferences = await this.updateIngredientPreferences(
        recipe,
        feedback,
        currentProfile.meal_preferences_learned || {}
      )

      // Update cooking preferences
      const updatedCookingPreferences = await this.updateCookingPreferences(
        recipe,
        feedback,
        currentProfile
      )

      // Update timing patterns
      const updatedTimingPatterns = await this.updateTimingPatterns(
        feedback,
        currentProfile.meal_timing_patterns || {}
      )

      // Update portion preferences
      const updatedPortionPatterns = await this.updatePortionPatterns(
        feedback,
        currentProfile.portion_size_adjustments || {}
      )

      // Calculate learning metrics
      const newInteractionCount = (currentProfile.interaction_count || 0) + 1
      const newFeedbackCount = (currentProfile.feedback_provided || 0) + 1
      
      // Update confidence based on amount of data
      const newConfidence = Math.min(1, Math.log(newFeedbackCount + 1) / 5)
      
      // Update learning rate (decreases as we get more confident)
      const newLearningRate = Math.max(0.1, 1 - (newConfidence * 0.7))

      // Generate health correlations if applicable
      const healthCorrelations = await this.analyzeHealthCorrelations(
        feedback,
        recipe,
        currentProfile.health_correlation_insights || []
      )

      // Update goal progress
      const updatedGoalProgress = await this.updateGoalProgress(
        feedback,
        recipe,
        currentProfile.nutrition_goal_progress || {}
      )

      const updatedProfile: AILearningProfile = {
        ...currentProfile,
        meal_preferences_learned: updatedIngredientPreferences,
        meal_timing_patterns: updatedTimingPatterns,
        portion_size_adjustments: updatedPortionPatterns,
        cooking_complexity_preference: updatedCookingPreferences.complexity,
        interaction_count: newInteractionCount,
        feedback_provided: newFeedbackCount,
        preference_confidence: newConfidence,
        learning_rate: newLearningRate,
        nutrition_goal_progress: updatedGoalProgress,
        health_correlation_insights: healthCorrelations,
        dietary_compliance_score: await this.calculateComplianceScore(feedback, recipe, currentProfile),
        stability_preference: await this.calculateStabilityPreference(feedback, currentProfile),
        novelty_tolerance: await this.calculateNoveltyTolerance(feedback, recipe, currentProfile)
      }

      // Save learning event for further analysis
      await this.saveLearningEvent({
        event_type: 'meal_completion',
        timestamp: new Date().toISOString(),
        data: {
          feedback,
          recipe_id: recipe.id,
          satisfaction: feedback.satisfaction_level,
          would_repeat: feedback.would_cook_again
        },
        learning_weight: this.calculateLearningWeight(feedback)
      })

      return updatedProfile

    } catch (error) {
      console.error('❌ Error processing feedback:', error)
      throw new Error(`Feedback processing failed: ${error.message}`)
    }
  }

  /**
   * Generate personalized recommendations based on learning
   */
  async generatePersonalizedRecommendations(
    userProfile: UserProfile,
    context: { meal_type: string; time_of_day: string; recent_meals: Recipe[] }
  ): Promise<{ recipes: Recipe[]; reasoning: string[]; confidence: number }> {
    
    const aiProfile = userProfile.ai_learning_profile || {}
    const ingredientPreferences = aiProfile.meal_preferences_learned || {}
    
    // Get candidate recipes
    const { data: candidateRecipes, error } = await this.supabase
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
      .contains('meal_type', [context.meal_type])
      .eq('is_public', true)
      .limit(100)

    if (error || !candidateRecipes) {
      throw new Error('Failed to fetch candidate recipes')
    }

    // Score recipes based on learned preferences
    const scoredRecipes = candidateRecipes.map(recipe => {
      const score = this.calculatePersonalizationScore(recipe, aiProfile, context)
      return { recipe, score }
    })

    // Sort by score and take top recommendations
    scoredRecipes.sort((a, b) => b.score.total - a.score.total)
    const topRecipes = scoredRecipes.slice(0, 10)

    // Generate reasoning for recommendations
    const reasoning = topRecipes.map(({ recipe, score }) => {
      const reasons = []
      
      if (score.ingredient_match > 0.7) {
        reasons.push(`Ingrédients que vous appréciez (${Math.round(score.ingredient_match * 100)}% match)`)
      }
      
      if (score.timing_match > 0.8) {
        reasons.push(`Parfait pour ce moment de la journée`)
      }
      
      if (score.complexity_match > 0.7) {
        reasons.push(`Niveau de difficulté adapté à vos préférences`)
      }
      
      if (score.novelty_balance > 0.6) {
        reasons.push(`Bon équilibre entre familier et nouveau`)
      }

      return `${recipe.title}: ${reasons.join(', ')}`
    })

    // Calculate overall confidence
    const confidence = Math.min(1, (aiProfile.preference_confidence || 0.5) * 
                               (aiProfile.interaction_count || 0) / 20)

    return {
      recipes: topRecipes.map(({ recipe }) => recipe),
      reasoning,
      confidence
    }
  }

  /**
   * Analyze user behavior patterns and suggest adaptations
   */
  async analyzeAdaptationOpportunities(
    userProfile: UserProfile
  ): Promise<AdaptationRecommendation[]> {
    
    const aiProfile = userProfile.ai_learning_profile || {}
    const recommendations: AdaptationRecommendation[] = []

    // Analyze ingredient preferences for expansion opportunities
    const ingredientPrefs = aiProfile.meal_preferences_learned || {}
    const lowPreferenceIngredients = Object.entries(ingredientPrefs)
      .filter(([_, score]) => score < -0.3)
      .map(([ingredient]) => ingredient)

    if (lowPreferenceIngredients.length > 5) {
      recommendations.push({
        type: 'ingredient_exploration',
        description: `Nous avons identifié ${lowPreferenceIngredients.length} ingrédients que vous n'appréciez pas. Explorons des alternatives dans les mêmes familles nutritionnelles.`,
        confidence: 0.8,
        expected_impact: 0.6,
        rationale: 'Diversifier les sources nutritionnelles tout en respectant vos goûts',
        implementation_difficulty: 'medium'
      })
    }

    // Analyze complexity comfort for growth
    const complexityComfort = aiProfile.cooking_complexity_preference || 0.5
    if (complexityComfort < 0.3 && (aiProfile.interaction_count || 0) > 10) {
      recommendations.push({
        type: 'difficulty_adjustment',
        description: 'Vous maîtrisez bien les recettes simples. Prêt(e) pour des défis culinaires un peu plus excitants ?',
        confidence: 0.7,
        expected_impact: 0.5,
        rationale: 'Développer les compétences culinaires graduellement augmente la satisfaction',
        implementation_difficulty: 'easy'
      })
    }

    // Analyze novelty tolerance
    const noveltyTolerance = aiProfile.novelty_tolerance || 0.5
    if (noveltyTolerance > 0.7) {
      recommendations.push({
        type: 'cuisine_exploration',
        description: 'Vous êtes aventureux(-se) ! Explorons des cuisines du monde que vous n\'avez pas encore essayées.',
        confidence: 0.85,
        expected_impact: 0.8,
        rationale: 'Satisfaire votre curiosité culinaire avec des découvertes ciblées',
        implementation_difficulty: 'medium'
      })
    }

    // Analyze timing patterns for optimization
    const timingPatterns = aiProfile.meal_timing_patterns || {}
    const hasInconsistentTiming = Object.values(timingPatterns).some(freq => freq < 0.3)
    
    if (hasInconsistentTiming) {
      recommendations.push({
        type: 'timing_optimization',
        description: 'Optimisons vos horaires de repas pour améliorer votre énergie et digestion.',
        confidence: 0.6,
        expected_impact: 0.4,
        rationale: 'Des horaires réguliers améliorent le métabolisme et la satisfaction',
        implementation_difficulty: 'easy'
      })
    }

    return recommendations.sort((a, b) => b.expected_impact - a.expected_impact)
  }

  /**
   * Calculate personalization metrics for user dashboard
   */
  async calculatePersonalizationMetrics(
    userProfile: UserProfile
  ): Promise<PersonalizationMetrics> {
    
    const aiProfile = userProfile.ai_learning_profile || {}
    
    // Calculate satisfaction trend (would use historical data in real implementation)
    const satisfactionTrend = await this.calculateSatisfactionTrend(userProfile.id)
    
    // Calculate recommendation accuracy
    const recommendationAccuracy = await this.calculateRecommendationAccuracy(userProfile.id)
    
    // Calculate learning velocity
    const learningVelocity = Math.min(1, (aiProfile.interaction_count || 0) / 50)
    
    // Calculate prediction confidence
    const predictionConfidence = aiProfile.preference_confidence || 0.5
    
    // Calculate engagement score
    const engagementScore = Math.min(100, ((aiProfile.feedback_provided || 0) / Math.max(aiProfile.interaction_count || 1, 1)) * 100)
    
    // Calculate health correlation strength
    const healthCorrelationStrength = (aiProfile.health_correlation_insights?.length || 0) > 0 ? 0.7 : 0.3

    return {
      satisfaction_trend: satisfactionTrend,
      recommendation_accuracy: recommendationAccuracy,
      learning_velocity: learningVelocity,
      prediction_confidence: predictionConfidence,
      engagement_score: engagementScore,
      health_correlation_strength: healthCorrelationStrength
    }
  }

  /**
   * Update ingredient preferences based on feedback
   */
  private async updateIngredientPreferences(
    recipe: Recipe,
    feedback: UserFeedback,
    currentPreferences: Record<string, number>
  ): Promise<Record<string, number>> {
    
    const updatedPreferences = { ...currentPreferences }
    const ingredients = recipe.ingredients?.map(ri => ri.ingredient.name) || []
    
    // Convert feedback to preference adjustment
    const preferenceAdjustment = this.feedbackToPreferenceScore(feedback)
    const learningRate = 0.1 // How quickly we adapt (could be dynamic)

    for (const ingredient of ingredients) {
      const currentScore = updatedPreferences[ingredient] || 0
      const adjustment = preferenceAdjustment * learningRate
      
      // Apply exponential smoothing
      updatedPreferences[ingredient] = currentScore + adjustment * (1 - Math.abs(currentScore))
      
      // Keep scores within bounds [-1, 1]
      updatedPreferences[ingredient] = Math.max(-1, Math.min(1, updatedPreferences[ingredient]))
    }

    return updatedPreferences
  }

  /**
   * Update cooking-related preferences
   */
  private async updateCookingPreferences(
    recipe: Recipe,
    feedback: UserFeedback,
    currentProfile: AILearningProfile
  ): Promise<{ complexity: number }> {
    
    const currentComplexity = currentProfile.cooking_complexity_preference || 0.5
    const difficultyMap = { easy: 0.3, medium: 0.6, hard: 0.9 }
    const recipeComplexity = difficultyMap[recipe.difficulty_level] || 0.5
    
    // Adjust complexity preference based on feedback
    let complexityAdjustment = 0
    
    if (feedback.preparation_difficulty_actual === 'easier' && feedback.satisfaction_level > 7) {
      complexityAdjustment = 0.05 // Encourage slightly more complex recipes
    } else if (feedback.preparation_difficulty_actual === 'harder' && feedback.satisfaction_level < 5) {
      complexityAdjustment = -0.05 // Prefer simpler recipes
    }

    const newComplexity = Math.max(0, Math.min(1, currentComplexity + complexityAdjustment))

    return { complexity: newComplexity }
  }

  /**
   * Update meal timing patterns
   */
  private async updateTimingPatterns(
    feedback: UserFeedback,
    currentPatterns: Record<string, number>
  ): Promise<Record<string, number>> {
    
    const updatedPatterns = { ...currentPatterns }
    const consumptionHour = new Date(feedback.date_consumed).getHours()
    const timeSlot = this.getTimeSlot(consumptionHour)
    const mealKey = `${feedback.meal_type}_${timeSlot}`
    
    // Increase frequency for this timing if satisfaction was high
    if (feedback.satisfaction_level > 7) {
      updatedPatterns[mealKey] = (updatedPatterns[mealKey] || 0) + 0.1
    }

    // Normalize to prevent values from growing indefinitely
    const maxValue = Math.max(...Object.values(updatedPatterns))
    if (maxValue > 2) {
      Object.keys(updatedPatterns).forEach(key => {
        updatedPatterns[key] = updatedPatterns[key] / maxValue
      })
    }

    return updatedPatterns
  }

  /**
   * Update portion size patterns
   */
  private async updatePortionPatterns(
    feedback: UserFeedback,
    currentPatterns: Record<string, number>
  ): Promise<Record<string, number>> {
    
    const updatedPatterns = { ...currentPatterns }
    
    // This would be implemented based on portion feedback
    // For now, maintain current patterns
    return updatedPatterns
  }

  /**
   * Calculate personalization score for a recipe
   */
  private calculatePersonalizationScore(
    recipe: any,
    aiProfile: AILearningProfile,
    context: { meal_type: string; time_of_day: string; recent_meals: Recipe[] }
  ): { total: number; ingredient_match: number; timing_match: number; complexity_match: number; novelty_balance: number } {
    
    const ingredientPrefs = aiProfile.meal_preferences_learned || {}
    const timingPatterns = aiProfile.meal_timing_patterns || {}
    const complexityPref = aiProfile.cooking_complexity_preference || 0.5
    const noveltyTolerance = aiProfile.novelty_tolerance || 0.5
    
    // Ingredient preference match
    const ingredients = recipe.recipe_ingredients?.map((ri: any) => ri.ingredients?.name) || []
    const ingredientScores = ingredients.map(ingredient => ingredientPrefs[ingredient] || 0)
    const ingredientMatch = ingredientScores.length > 0 ? 
      (ingredientScores.reduce((sum, score) => sum + score, 0) / ingredientScores.length + 1) / 2 : 0.5

    // Timing preference match
    const timeSlot = this.getTimeSlot(parseInt(context.time_of_day))
    const timingKey = `${context.meal_type}_${timeSlot}`
    const timingMatch = Math.min(1, (timingPatterns[timingKey] || 0.3) * 2)

    // Complexity preference match
    const difficultyMap = { easy: 0.3, medium: 0.6, hard: 0.9 }
    const recipeComplexity = difficultyMap[recipe.difficulty_level as keyof typeof difficultyMap] || 0.5
    const complexityMatch = 1 - Math.abs(recipeComplexity - complexityPref)

    // Novelty balance (check if recipe was recently consumed)
    const wasRecentlyConsumed = context.recent_meals.some(meal => meal.id === recipe.id)
    const noveltyScore = wasRecentlyConsumed ? 0 : 1
    const noveltyBalance = noveltyTolerance * noveltyScore + (1 - noveltyTolerance) * (1 - noveltyScore)

    // Weighted total score
    const total = (
      ingredientMatch * 0.4 +
      timingMatch * 0.2 +
      complexityMatch * 0.2 +
      noveltyBalance * 0.2
    )

    return {
      total,
      ingredient_match: ingredientMatch,
      timing_match: timingMatch,
      complexity_match: complexityMatch,
      novelty_balance: noveltyBalance
    }
  }

  // Helper methods
  private feedbackToPreferenceScore(feedback: UserFeedback): number {
    // Convert feedback to preference score (-1 to 1)
    const baseScore = (feedback.rating - 3) / 2 // Convert 1-5 to -1 to 1
    const satisfactionBonus = (feedback.satisfaction_level - 5.5) / 4.5 // Convert 1-10 to -1 to 1
    const repeatBonus = feedback.would_cook_again ? 0.2 : -0.2
    
    return Math.max(-1, Math.min(1, (baseScore + satisfactionBonus + repeatBonus) / 3))
  }

  private calculateLearningWeight(feedback: UserFeedback): number {
    // Higher weight for more informative feedback
    let weight = 0.5
    
    if (feedback.comments && feedback.comments.length > 10) weight += 0.2
    if (feedback.rating === 1 || feedback.rating === 5) weight += 0.2 // Extreme ratings are more informative
    if (feedback.satisfaction_level <= 3 || feedback.satisfaction_level >= 8) weight += 0.1
    
    return Math.min(1, weight)
  }

  private getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 11) return 'morning'
    if (hour >= 11 && hour < 15) return 'midday'
    if (hour >= 15 && hour < 19) return 'afternoon'
    if (hour >= 19 && hour < 23) return 'evening'
    return 'night'
  }

  private async getRecipeDetails(recipeId: string): Promise<Recipe | null> {
    const { data, error } = await this.supabase
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
      .eq('id', recipeId)
      .single()

    if (error || !data) {
      console.error('Error fetching recipe details:', error)
      return null
    }

    return {
      ...data,
      ingredients: data.recipe_ingredients?.map((ri: any) => ({
        ingredient: ri.ingredients,
        quantity: ri.quantity,
        unit: ri.unit,
        preparation_notes: ri.preparation_notes
      })) || []
    }
  }

  // Placeholder methods that would be implemented with real data
  private async analyzeHealthCorrelations(
    feedback: UserFeedback,
    recipe: Recipe,
    currentInsights: HealthCorrelationInsight[]
  ): Promise<HealthCorrelationInsight[]> {
    // Would analyze correlations between recipes and health feelings
    return currentInsights
  }

  private async updateGoalProgress(
    feedback: UserFeedback,
    recipe: Recipe,
    currentProgress: Record<string, GoalProgress>
  ): Promise<Record<string, GoalProgress>> {
    // Would update progress toward nutrition goals
    return currentProgress
  }

  private async calculateComplianceScore(
    feedback: UserFeedback,
    recipe: Recipe,
    profile: AILearningProfile
  ): Promise<number> {
    // Would calculate adherence to dietary preferences
    return profile.dietary_compliance_score || 75
  }

  private async calculateStabilityPreference(
    feedback: UserFeedback,
    profile: AILearningProfile
  ): Promise<number> {
    // Would calculate preference for routine vs variety
    return profile.stability_preference || 0.5
  }

  private async calculateNoveltyTolerance(
    feedback: UserFeedback,
    recipe: Recipe,
    profile: AILearningProfile
  ): Promise<number> {
    // Would calculate willingness to try new things
    return profile.novelty_tolerance || 0.5
  }

  private async saveLearningEvent(event: LearningEvent): Promise<void> {
    // Would save learning event to database for analysis
    console.log('💾 Saving learning event:', event)
  }

  private async calculateSatisfactionTrend(userId: string): Promise<'improving' | 'stable' | 'declining'> {
    // Would analyze historical satisfaction data
    return 'stable'
  }

  private async calculateRecommendationAccuracy(userId: string): Promise<number> {
    // Would calculate percentage of liked recommendations
    return 75
  }
}

export const learningSystem = new LearningAdaptationSystem()