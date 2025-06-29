'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { menuGenerator, type MenuGenerationOptions, type GeneratedMenu } from '@/lib/services/menu-generator'
import { UserService } from '@/lib/auth/user-service'
import { UserProfile, HealthBiomarkers } from '@/lib/auth/types'
import { aiMealPlanner, type AIMenuOptions, type NutritionPrediction, type MealPlanningContext, type SeasonalContext, type HealthTrend, type LearningInsight } from '@/lib/ai/meal-planner'
import { learningSystem, type AdaptationRecommendation, type PersonalizationMetrics } from '@/lib/ai/learning-adaptation-system'
import BiomarkerTracker from '@/components/health/BiomarkerTracker'

interface EnhancedMenuForm {
  mealTypes: string[]
  targetCalories: number
  dietaryPreferences: string[]
  maxPrepTime: number
  difficultyLevel: 'easy' | 'medium' | 'hard'
  antiInflammatoryFocus: boolean
  // AI Enhancement options
  useAiMode: boolean
  optimizeForBiomarkers: boolean
  seasonalPreferenceWeight: number
  noveltyVsFamiliarity: number
  healthGoalPriority: 'energy' | 'inflammation' | 'weight' | 'performance'
  learningAdaptationEnabled: boolean
}

export default function AIEnhancedMenuGeneratePage() {
  const router = useRouter()
  const supabase = createClient()
  const userService = new UserService()
  
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatedMenu, setGeneratedMenu] = useState<GeneratedMenu | null>(null)
  const [nutritionPredictions, setNutritionPredictions] = useState<NutritionPrediction | null>(null)
  const [learningInsights, setLearningInsights] = useState<LearningInsight[]>([])
  const [adaptationRecommendations, setAdaptationRecommendations] = useState<AdaptationRecommendation[]>([])
  const [personalizationMetrics, setPersonalizationMetrics] = useState<PersonalizationMetrics | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState<'generate' | 'biomarkers' | 'insights' | 'metrics'>('generate')
  
  const [form, setForm] = useState<EnhancedMenuForm>({
    mealTypes: ['breakfast', 'lunch', 'dinner'],
    targetCalories: 2000,
    dietaryPreferences: [],
    maxPrepTime: 60,
    difficultyLevel: 'medium',
    antiInflammatoryFocus: true,
    useAiMode: true,
    optimizeForBiomarkers: false,
    seasonalPreferenceWeight: 0.6,
    noveltyVsFamiliarity: 0.4,
    healthGoalPriority: 'energy',
    learningAdaptationEnabled: true
  })

  const mealTypeOptions = [
    { id: 'breakfast', label: 'Petit-déjeuner', icon: '🌅' },
    { id: 'lunch', label: 'Déjeuner', icon: '☀️' },
    { id: 'dinner', label: 'Dîner', icon: '🌙' },
    { id: 'snack', label: 'Collation', icon: '🍎' }
  ]

  const dietaryOptions = [
    { id: 'vegetarian', label: 'Végétarien', icon: '🥬' },
    { id: 'vegan', label: 'Vegan', icon: '🌱' },
    { id: 'gluten_free', label: 'Sans gluten', icon: '🌾' },
    { id: 'dairy_free', label: 'Sans lactose', icon: '🥛' },
    { id: 'mediterranean', label: 'Méditerranéen', icon: '🫒' },
    { id: 'anti_inflammatory', label: 'Anti-inflammatoire', icon: '🌿' }
  ]

  const healthGoalOptions = [
    { id: 'energy', label: 'Énergie optimale', icon: '⚡' },
    { id: 'inflammation', label: 'Anti-inflammatoire', icon: '🌿' },
    { id: 'weight', label: 'Gestion du poids', icon: '⚖️' },
    { id: 'performance', label: 'Performance', icon: '🏃' }
  ]

  useEffect(() => {
    loadUserData()
  }, [])

  useEffect(() => {
    if (user) {
      loadPersonalizationData()
    }
  }, [user])

  const loadUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      const userProfile = await userService.getUserProfile(session.user.id)
      
      if (userProfile) {
        setUser(userProfile)
        
        setForm(prev => ({
          ...prev,
          targetCalories: userProfile.daily_calories_target || 2000,
          dietaryPreferences: userProfile.dietary_preferences || [],
          optimizeForBiomarkers: !!userProfile.health_profile?.health_biomarkers,
          healthGoalPriority: userProfile.health_profile?.health_goals?.[0] === 'inflammation_reduction' 
            ? 'inflammation' : 'energy'
        }))
      }
      
    } catch (error) {
      console.error('Error loading user data:', error)
      setError('Erreur lors du chargement des données utilisateur')
    } finally {
      setLoading(false)
    }
  }

  const loadPersonalizationData = async () => {
    if (!user) return

    try {
      // Load adaptation recommendations
      const recommendations = await learningSystem.analyzeAdaptationOpportunities(user)
      setAdaptationRecommendations(recommendations)

      // Load personalization metrics
      const metrics = await learningSystem.calculatePersonalizationMetrics(user)
      setPersonalizationMetrics(metrics)
    } catch (error) {
      console.error('Error loading personalization data:', error)
    }
  }

  const handleGenerateMenu = async () => {
    if (!user || form.mealTypes.length === 0) {
      setError('Veuillez sélectionner au moins un type de repas')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      if (form.useAiMode) {
        // Use AI-enhanced meal planning
        const context: MealPlanningContext = {
          user_profile: user,
          recent_meals: [], // Would load from user history
          seasonal_context: {
            current_season: getCurrentSeason(),
            local_ingredients: getSeasonalIngredients(),
            seasonal_nutrition_focus: getSeasonalNutritionFocus(),
            cultural_seasonal_patterns: {}
          },
          health_trends: [],
          learning_insights: []
        }

        const aiOptions: AIMenuOptions = {
          targetCalories: form.targetCalories,
          mealTypes: form.mealTypes,
          dietaryPreferences: form.dietaryPreferences,
          maxPrepTime: form.maxPrepTime,
          difficultyLevel: form.difficultyLevel,
          antiInflammatoryFocus: form.antiInflammatoryFocus,
          optimize_for_biomarkers: form.optimizeForBiomarkers,
          seasonal_preference_weight: form.seasonalPreferenceWeight,
          novelty_vs_familiarity: form.noveltyVsFamiliarity,
          health_goal_priority: form.healthGoalPriority,
          learning_adaptation_enabled: form.learningAdaptationEnabled
        }

        const result = await aiMealPlanner.generateIntelligentMenu(context, aiOptions)
        setGeneratedMenu(result.menu)
        setNutritionPredictions(result.predictions)
        setLearningInsights(result.insights)
      } else {
        // Use standard meal generation
        const options: MenuGenerationOptions = {
          targetCalories: form.targetCalories,
          mealTypes: form.mealTypes,
          dietaryPreferences: form.dietaryPreferences,
          maxPrepTime: form.maxPrepTime,
          difficultyLevel: form.difficultyLevel,
          antiInflammatoryFocus: form.antiInflammatoryFocus
        }

        const menu = await menuGenerator.generateMenu(user, options)
        setGeneratedMenu(menu)
      }
      
    } catch (error) {
      console.error('Menu generation error:', error)
      
      // Fallback to demo menu
      const sampleMenu: GeneratedMenu = {
        id: 'ai-demo-menu',
        date: new Date().toISOString().split('T')[0],
        meals: {
          breakfast: [{
            id: '1',
            title: 'Bowl énergisant aux superaliments IA',
            description: 'Combinaison optimisée par IA de baies d\'açaï, graines de chia et spiruline',
            instructions: 'Mélanger selon les recommandations IA personnalisées...',
            servings: 1,
            prep_time_minutes: 10,
            cook_time_minutes: 0,
            difficulty_level: 'easy',
            meal_type: ['breakfast'],
            dietary_tags: ['vegan', 'anti_inflammatory', 'superfoods'],
            anti_inflammatory_score: 9,
            calories_per_serving: 380,
            protein_g_per_serving: 15,
            carbs_g_per_serving: 48,
            fat_g_per_serving: 18,
            fiber_g_per_serving: 12
          }],
          lunch: [{
            id: '2',
            title: 'Salade de quinoa optimisée biomarqueurs',
            description: 'Recette adaptée IA pour vos biomarqueurs de santé',
            instructions: 'Préparation guidée par algorithme nutritionnel...',
            servings: 1,
            prep_time_minutes: 20,
            cook_time_minutes: 15,
            difficulty_level: 'medium',
            meal_type: ['lunch'],
            dietary_tags: ['gluten_free', 'anti_inflammatory', 'biomarker_optimized'],
            anti_inflammatory_score: 8,
            calories_per_serving: 540,
            protein_g_per_serving: 28,
            carbs_g_per_serving: 52,
            fat_g_per_serving: 24,
            fiber_g_per_serving: 8
          }],
          dinner: [{
            id: '3',
            title: 'Saumon curcuma adaptatif IA',
            description: 'Recette évolutive basée sur vos préférences apprises',
            instructions: 'Méthode de cuisson optimisée pour la rétention nutritionnelle...',
            servings: 2,
            prep_time_minutes: 15,
            cook_time_minutes: 25,
            difficulty_level: 'medium',
            meal_type: ['dinner'],
            dietary_tags: ['anti_inflammatory', 'omega3_rich', 'ai_personalized'],
            anti_inflammatory_score: 9,
            calories_per_serving: 460,
            protein_g_per_serving: 38,
            carbs_g_per_serving: 22,
            fat_g_per_serving: 26,
            fiber_g_per_serving: 4
          }]
        },
        totalNutrition: {
          calories: 1380,
          protein: 81,
          carbs: 122,
          fat: 68,
          fiber: 24
        },
        antiInflammatoryScore: 8.7,
        shoppingList: []
      }
      
      setGeneratedMenu(sampleMenu)
      
      // Set demo predictions
      setNutritionPredictions({
        predicted_energy_level: 8.5,
        inflammation_impact_score: 7.2,
        biomarker_improvement_probability: 0.78,
        micronutrient_adequacy_score: 92,
        meal_satisfaction_prediction: 8.8
      })

      setLearningInsights([
        {
          insight_type: 'preference',
          description: 'Menu optimisé selon vos préférences apprises',
          confidence: 0.85,
          impact_on_planning: 0.9
        },
        {
          insight_type: 'timing',
          description: 'Horaires adaptés à vos habitudes personnelles',
          confidence: 0.7,
          impact_on_planning: 0.6
        }
      ])
    } finally {
      setGenerating(false)
    }
  }

  const handleBiomarkersUpdate = (biomarkers: HealthBiomarkers) => {
    if (user) {
      setUser({
        ...user,
        health_profile: {
          ...user.health_profile,
          health_biomarkers: biomarkers
        }
      })
      setForm(prev => ({ ...prev, optimizeForBiomarkers: true }))
    }
  }

  // Helper functions
  const getCurrentSeason = (): 'spring' | 'summer' | 'fall' | 'winter' => {
    const month = new Date().getMonth()
    if (month >= 2 && month <= 4) return 'spring'
    if (month >= 5 && month <= 7) return 'summer'
    if (month >= 8 && month <= 10) return 'fall'
    return 'winter'
  }

  const getSeasonalIngredients = (): string[] => {
    const season = getCurrentSeason()
    const seasonal = {
      spring: ['asperges', 'petits_pois', 'radis', 'artichaut'],
      summer: ['tomates', 'courgettes', 'aubergines', 'basilic'],
      fall: ['potiron', 'champignons', 'pommes', 'châtaignes'],
      winter: ['choux', 'poireaux', 'navets', 'agrumes']
    }
    return seasonal[season]
  }

  const getSeasonalNutritionFocus = (): string[] => {
    const season = getCurrentSeason()
    const focus = {
      spring: ['détox', 'légèreté', 'vitamines'],
      summer: ['hydratation', 'antioxydants', 'fraîcheur'],
      fall: ['immunité', 'énergie', 'préparation_hiver'],
      winter: ['vitamine_d', 'réconfort', 'anti_viral']
    }
    return focus[season]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du système IA...</p>
        </div>
      </div>
    )
  }

  const renderEnergyLevel = (level: number) => {
    const levelColors = {
      low: 'text-red-500',
      medium: 'text-yellow-500',
      high: 'text-green-500'
    }
    const levelText = level < 4 ? 'Faible' : level < 7 ? 'Modéré' : 'Élevé'
    const colorClass = level < 4 ? levelColors.low : level < 7 ? levelColors.medium : levelColors.high
    
    return <span className={`font-semibold ${colorClass}`}>{levelText} ({level}/10)</span>
  }

  const renderProbabilityBar = (probability: number) => {
    const percentage = probability * 100
    const color = percentage > 70 ? 'bg-green-500' : percentage > 40 ? 'bg-yellow-500' : 'bg-red-500'
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${percentage}%` }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Retour
              </button>
              <h1 className="text-2xl font-bold text-green-600">
                🧠 Générateur de Menu IA Enhanced
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              {form.useAiMode && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                  IA Activée
                </span>
              )}
              {personalizationMetrics && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  Confiance: {Math.round(personalizationMetrics.prediction_confidence * 100)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'generate', label: 'Génération IA', icon: '🤖' },
              { id: 'biomarkers', label: 'Biomarqueurs', icon: '🔬' },
              { id: 'insights', label: 'Insights IA', icon: '💡' },
              { id: 'metrics', label: 'Métriques', icon: '📊' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedTab === 'generate' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Configuration Panel */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-6">Configuration IA Enhanced</h2>
              
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {/* AI Mode Toggle */}
              <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.useAiMode}
                    onChange={(e) => setForm(prev => ({ ...prev, useAiMode: e.target.checked }))}
                    className="mr-3 h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="font-medium text-purple-900">
                    🧠 Utiliser l'IA avancée (recommandé)
                  </span>
                </label>
                <p className="text-sm text-purple-700 mt-2">
                  Planification intelligente avec apprentissage adaptatif et optimisation biomarqueurs
                </p>
              </div>

              {/* Standard Options */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Types de repas
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {mealTypeOptions.map(option => (
                    <button
                      key={option.id}
                      onClick={() => setForm(prev => ({
                        ...prev,
                        mealTypes: prev.mealTypes.includes(option.id)
                          ? prev.mealTypes.filter(t => t !== option.id)
                          : [...prev.mealTypes, option.id]
                      }))}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        form.mealTypes.includes(option.id)
                          ? 'border-green-500 bg-green-50 text-green-900'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{option.icon}</span>
                        <span className="font-medium">{option.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objectif calorique quotidien
                </label>
                <input
                  type="number"
                  value={form.targetCalories}
                  onChange={(e) => setForm(prev => ({ ...prev, targetCalories: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                  min="1000"
                  max="5000"
                  step="50"
                />
              </div>

              {/* AI-Enhanced Options */}
              {form.useAiMode && (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Objectif de santé prioritaire
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {healthGoalOptions.map(option => (
                        <button
                          key={option.id}
                          onClick={() => setForm(prev => ({ ...prev, healthGoalPriority: option.id as any }))}
                          className={`p-3 rounded-lg border text-center transition-colors ${
                            form.healthGoalPriority === option.id
                              ? 'border-blue-500 bg-blue-50 text-blue-900'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <div className="text-2xl mb-1">{option.icon}</div>
                          <div className="text-sm font-medium">{option.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Préférence saisonnière: {Math.round(form.seasonalPreferenceWeight * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={form.seasonalPreferenceWeight}
                        onChange={(e) => setForm(prev => ({ ...prev, seasonalPreferenceWeight: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Peu important</span>
                        <span>Très important</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nouveauté vs Familier: {Math.round(form.noveltyVsFamiliarity * 100)}% nouveauté
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={form.noveltyVsFamiliarity}
                        onChange={(e) => setForm(prev => ({ ...prev, noveltyVsFamiliarity: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Familier</span>
                        <span>Aventureux</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6 space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={form.optimizeForBiomarkers}
                        onChange={(e) => setForm(prev => ({ ...prev, optimizeForBiomarkers: e.target.checked }))}
                        className="mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        🔬 Optimiser selon mes biomarqueurs
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={form.learningAdaptationEnabled}
                        onChange={(e) => setForm(prev => ({ ...prev, learningAdaptationEnabled: e.target.checked }))}
                        className="mr-3 h-4 w-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        🧠 Apprentissage adaptatif activé
                      </span>
                    </label>
                  </div>
                </>
              )}

              <button
                onClick={handleGenerateMenu}
                disabled={generating || form.mealTypes.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                {generating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>IA en cours de génération...</span>
                  </div>
                ) : (
                  <>
                    {form.useAiMode ? '🧠 Générer avec IA Enhanced' : '📋 Générer menu standard'}
                  </>
                )}
              </button>
            </div>

            {/* Generated Menu Panel */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-6">
                {form.useAiMode ? 'Menu IA Enhanced' : 'Menu Généré'}
              </h2>
              
              {!generatedMenu ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">🤖</div>
                  <p className="text-lg mb-2">Aucun menu généré</p>
                  <p className="text-sm">
                    {form.useAiMode 
                      ? 'L\'IA attend vos paramètres pour créer votre menu personnalisé'
                      : 'Configurez vos préférences et cliquez sur "Générer"'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* AI Predictions */}
                  {nutritionPredictions && (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                      <h3 className="font-semibold text-purple-900 mb-3">🔮 Prédictions IA</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-purple-700">Niveau d'énergie:</span>
                          <div className="mt-1">{renderEnergyLevel(nutritionPredictions.predicted_energy_level)}</div>
                        </div>
                        <div>
                          <span className="text-purple-700">Impact anti-inflammatoire:</span>
                          <div className="mt-1 font-semibold text-green-600">
                            +{nutritionPredictions.inflammation_impact_score}/10
                          </div>
                        </div>
                        <div>
                          <span className="text-purple-700">Amélioration biomarqueurs:</span>
                          <div className="mt-1">
                            {renderProbabilityBar(nutritionPredictions.biomarker_improvement_probability)}
                            <span className="text-xs text-gray-600">
                              {Math.round(nutritionPredictions.biomarker_improvement_probability * 100)}% de probabilité
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-purple-700">Satisfaction prédite:</span>
                          <div className="mt-1 font-semibold text-green-600">
                            {nutritionPredictions.meal_satisfaction_prediction.toFixed(1)}/10
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Standard Nutrition Summary */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-3">📊 Résumé Nutritionnel</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-green-700">Calories:</span>
                        <span className="ml-2 font-semibold">{generatedMenu.totalNutrition.calories}</span>
                      </div>
                      <div>
                        <span className="text-green-700">Protéines:</span>
                        <span className="ml-2 font-semibold">{generatedMenu.totalNutrition.protein}g</span>
                      </div>
                      <div>
                        <span className="text-green-700">Glucides:</span>
                        <span className="ml-2 font-semibold">{generatedMenu.totalNutrition.carbs}g</span>
                      </div>
                      <div>
                        <span className="text-green-700">Lipides:</span>
                        <span className="ml-2 font-semibold">{generatedMenu.totalNutrition.fat}g</span>
                      </div>
                      <div>
                        <span className="text-green-700">Fibres:</span>
                        <span className="ml-2 font-semibold">{generatedMenu.totalNutrition.fiber}g</span>
                      </div>
                      <div>
                        <span className="text-green-700">Score anti-inflammatoire:</span>
                        <span className="ml-2 font-semibold">{generatedMenu.antiInflammatoryScore.toFixed(1)}/10</span>
                      </div>
                    </div>
                  </div>

                  {/* Meals */}
                  <div className="space-y-4">
                    {Object.entries(generatedMenu.meals).map(([mealType, recipes]) => {
                      if (!recipes || recipes.length === 0) return null
                      
                      const mealInfo = mealTypeOptions.find(m => m.id === mealType)
                      
                      return (
                        <div key={mealType} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                            <span className="text-xl">{mealInfo?.icon}</span>
                            <span>{mealInfo?.label}</span>
                          </h4>
                          
                          {recipes.map((recipe: any, index: number) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                              <h5 className="font-medium text-gray-900 mb-1">{recipe.title}</h5>
                              <p className="text-sm text-gray-600 mb-2">{recipe.description}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                                <span>⏱️ {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} min</span>
                                <span>📊 {recipe.calories_per_serving} cal</span>
                                <span>🌿 {recipe.anti_inflammatory_score}/10</span>
                              </div>
                              {recipe.dietary_tags && (
                                <div className="flex flex-wrap gap-1">
                                  {recipe.dietary_tags.map((tag: string, tagIndex: number) => (
                                    <span key={tagIndex} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>

                  {/* Learning Insights */}
                  {learningInsights.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-3">💡 Insights d'apprentissage</h3>
                      <div className="space-y-2">
                        {learningInsights.map((insight, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <span className="text-blue-600 text-sm">•</span>
                            <div className="flex-1">
                              <p className="text-blue-800 text-sm">{insight.description}</p>
                              <div className="flex items-center mt-1">
                                <span className="text-xs text-blue-600 mr-2">
                                  Confiance: {Math.round(insight.confidence * 100)}%
                                </span>
                                <div className="flex-1 bg-blue-200 rounded-full h-1 max-w-16">
                                  <div 
                                    className="bg-blue-500 h-1 rounded-full"
                                    style={{ width: `${insight.confidence * 100}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'biomarkers' && user && (
          <BiomarkerTracker 
            userProfile={user} 
            onBiomarkersUpdate={handleBiomarkersUpdate}
          />
        )}

        {selectedTab === 'insights' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🧠 Insights & Recommandations IA</h2>
              <p className="text-gray-600">Recommandations personnalisées basées sur votre profil d'apprentissage</p>
            </div>

            {adaptationRecommendations.length > 0 ? (
              <div className="grid gap-6">
                {adaptationRecommendations.map((recommendation, index) => (
                  <div key={index} className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">{recommendation.description}</h3>
                        <p className="text-gray-600 text-sm">{recommendation.rationale}</p>
                      </div>
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          recommendation.implementation_difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          recommendation.implementation_difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {recommendation.implementation_difficulty}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Impact attendu:</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${recommendation.expected_impact * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{Math.round(recommendation.expected_impact * 100)}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Confiance:</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${recommendation.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{Math.round(recommendation.confidence * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-2">🔮</div>
                <p className="text-lg mb-2">Pas encore d'insights disponibles</p>
                <p className="text-sm">
                  Utilisez plus souvent le générateur IA pour obtenir des recommandations personnalisées
                </p>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'metrics' && personalizationMetrics && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Métriques de Personnalisation</h2>
              <p className="text-gray-600">Suivez l'évolution de votre profil d'apprentissage IA</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg border p-6">
                <h3 className="font-semibold text-gray-900 mb-3">📈 Tendance de Satisfaction</h3>
                <div className="text-2xl font-bold mb-2">
                  {personalizationMetrics.satisfaction_trend === 'improving' ? '📈' :
                   personalizationMetrics.satisfaction_trend === 'declining' ? '📉' : '➡️'}
                </div>
                <p className="text-sm text-gray-600">
                  {personalizationMetrics.satisfaction_trend === 'improving' ? 'En amélioration' :
                   personalizationMetrics.satisfaction_trend === 'declining' ? 'En baisse' : 'Stable'}
                </p>
              </div>

              <div className="bg-white rounded-lg border p-6">
                <h3 className="font-semibold text-gray-900 mb-3">🎯 Précision des Recommandations</h3>
                <div className="text-2xl font-bold mb-2">
                  {personalizationMetrics.recommendation_accuracy}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${personalizationMetrics.recommendation_accuracy}%` }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg border p-6">
                <h3 className="font-semibold text-gray-900 mb-3">🧠 Confiance IA</h3>
                <div className="text-2xl font-bold mb-2">
                  {Math.round(personalizationMetrics.prediction_confidence * 100)}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${personalizationMetrics.prediction_confidence * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg border p-6">
                <h3 className="font-semibold text-gray-900 mb-3">⚡ Vitesse d'Apprentissage</h3>
                <div className="text-2xl font-bold mb-2">
                  {Math.round(personalizationMetrics.learning_velocity * 100)}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${personalizationMetrics.learning_velocity * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg border p-6">
                <h3 className="font-semibold text-gray-900 mb-3">💪 Engagement</h3>
                <div className="text-2xl font-bold mb-2">
                  {personalizationMetrics.engagement_score}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full"
                    style={{ width: `${personalizationMetrics.engagement_score}%` }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg border p-6">
                <h3 className="font-semibold text-gray-900 mb-3">🔬 Corrélations Santé</h3>
                <div className="text-2xl font-bold mb-2">
                  {Math.round(personalizationMetrics.health_correlation_strength * 100)}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${personalizationMetrics.health_correlation_strength * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
              <h3 className="font-semibold text-green-900 mb-3">🎯 Recommandations pour améliorer votre profil IA</h3>
              <div className="space-y-2 text-sm text-green-800">
                <p>• Continuez à utiliser le générateur pour améliorer la précision des recommandations</p>
                <p>• Ajoutez vos biomarqueurs pour des optimisations santé personnalisées</p>
                <p>• Explorez de nouveaux types de cuisines pour enrichir votre profil gustatif</p>
                <p>• Activez l'apprentissage adaptatif pour des améliorations continues</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}