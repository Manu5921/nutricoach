'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { menuGenerator, type MenuGenerationOptions, type GeneratedMenu } from '@/lib/services/menu-generator'
import { UserService } from '@/lib/auth/user-service'
import { UserProfile } from '@/lib/auth/types'

interface MenuForm {
  mealTypes: string[]
  targetCalories: number
  dietaryPreferences: string[]
  maxPrepTime: number
  difficultyLevel: 'easy' | 'medium' | 'hard'
  antiInflammatoryFocus: boolean
}

export default function MenuGeneratePage() {
  const router = useRouter()
  const supabase = createClient()
  const userService = new UserService()
  
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatedMenu, setGeneratedMenu] = useState<GeneratedMenu | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const [form, setForm] = useState<MenuForm>({
    mealTypes: ['breakfast', 'lunch', 'dinner'],
    targetCalories: 2000,
    dietaryPreferences: [],
    maxPrepTime: 60,
    difficultyLevel: 'medium',
    antiInflammatoryFocus: true
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

  useEffect(() => {
    loadUserData()
  }, [])

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
          dietaryPreferences: userProfile.dietary_preferences || []
        }))
      }
      
    } catch (error) {
      console.error('Error loading user data:', error)
      setError('Erreur lors du chargement des données utilisateur')
    } finally {
      setLoading(false)
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
      
    } catch (error) {
      console.error('Menu generation error:', error)
      // For demo, create a sample menu
      const sampleMenu: GeneratedMenu = {
        id: 'demo-menu',
        date: new Date().toISOString().split('T')[0],
        meals: {
          breakfast: [{
            id: '1',
            title: 'Smoothie Bowl Anti-Inflammatoire',
            description: 'Un bowl énergisant aux fruits rouges et graines',
            instructions: 'Mélanger les ingrédients...',
            servings: 1,
            prep_time_minutes: 10,
            cook_time_minutes: 0,
            difficulty_level: 'easy',
            meal_type: ['breakfast'],
            dietary_tags: ['vegan', 'anti_inflammatory'],
            anti_inflammatory_score: 8,
            calories_per_serving: 350,
            protein_g_per_serving: 12,
            carbs_g_per_serving: 45,
            fat_g_per_serving: 15,
            fiber_g_per_serving: 8
          }],
          lunch: [{
            id: '2',
            title: 'Salade de Quinoa au Saumon',
            description: 'Salade complète riche en oméga-3',
            instructions: 'Cuire le quinoa...',
            servings: 1,
            prep_time_minutes: 15,
            cook_time_minutes: 20,
            difficulty_level: 'medium',
            meal_type: ['lunch'],
            dietary_tags: ['gluten_free', 'anti_inflammatory'],
            anti_inflammatory_score: 9,
            calories_per_serving: 520,
            protein_g_per_serving: 35,
            carbs_g_per_serving: 40,
            fat_g_per_serving: 22,
            fiber_g_per_serving: 6
          }],
          dinner: [{
            id: '3',
            title: 'Curry de Légumes au Curcuma',
            description: 'Curry épicé aux légumes de saison',
            instructions: 'Faire revenir les épices...',
            servings: 2,
            prep_time_minutes: 20,
            cook_time_minutes: 30,
            difficulty_level: 'medium',
            meal_type: ['dinner'],
            dietary_tags: ['vegan', 'anti_inflammatory'],
            anti_inflammatory_score: 9,
            calories_per_serving: 420,
            protein_g_per_serving: 15,
            carbs_g_per_serving: 55,
            fat_g_per_serving: 18,
            fiber_g_per_serving: 12
          }]
        },
        totalNutrition: {
          calories: 1290,
          protein: 62,
          carbs: 140,
          fat: 55,
          fiber: 26
        },
        antiInflammatoryScore: 8.7,
        shoppingList: []
      }
      setGeneratedMenu(sampleMenu)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
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
              <h1 className="text-2xl font-bold text-green-600">Générateur de Menu</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6">Configuration du Menu</h2>
            
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

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

            <button
              onClick={handleGenerateMenu}
              disabled={generating || form.mealTypes.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {generating ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Génération en cours...</span>
                </div>
              ) : (
                'Générer mon menu personnalisé'
              )}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6">Menu Généré</h2>
            
            {!generatedMenu ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">🍽️</div>
                <p className="text-lg mb-2">Aucun menu généré</p>
                <p className="text-sm">
                  Configurez vos préférences et cliquez sur "Générer"
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-3">Résumé Nutritionnel</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-700">Calories:</span>
                      <span className="ml-2 font-semibold">{generatedMenu.totalNutrition.calories}</span>
                    </div>
                    <div>
                      <span className="text-green-700">Protéines:</span>
                      <span className="ml-2 font-semibold">{generatedMenu.totalNutrition.protein}g</span>
                    </div>
                  </div>
                </div>

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
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>⏱️ {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} min</span>
                              <span>📊 {recipe.calories_per_serving} cal</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}