'use client'

import { useState, useEffect } from 'react'

// Widget for quick nutrition logging
interface QuickNutritionLogWidget {
  type: 'nutrition-log'
  lastMeal?: string
  caloriesConsumed: number
  caloriesGoal: number
  nextMealTime?: string
}

// Widget for daily nutrition summary
interface DailyNutritionSummary {
  type: 'daily-summary'
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
  waterIntake: number
  goals: {
    calories: number
    protein: number
    carbs: number
    fat: number
    water: number
  }
}

// Home screen widget components for NutriCoach
export function QuickNutritionLogWidget({ data }: { data?: QuickNutritionLogWidget }) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000) // Update every minute
    return () => clearInterval(timer)
  }, [])

  const caloriesProgress = data ? (data.caloriesConsumed / data.caloriesGoal) * 100 : 0
  const timeOfDay = currentTime.getHours()
  
  // Determine current meal
  let currentMeal = 'collation'
  if (timeOfDay >= 6 && timeOfDay < 10) currentMeal = 'petit-déjeuner'
  else if (timeOfDay >= 11 && timeOfDay < 15) currentMeal = 'déjeuner'
  else if (timeOfDay >= 18 && timeOfDay < 22) currentMeal = 'dîner'

  return (
    <div className="bg-gradient-to-br from-green-400 to-blue-500 rounded-lg p-4 text-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🍽️</span>
          <span className="font-semibold text-sm">NutriCoach</span>
        </div>
        <span className="text-xs opacity-80">
          {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Main content */}
      <div className="space-y-3">
        {/* Current meal prompt */}
        <div className="text-center">
          <h3 className="font-bold text-lg capitalize">{currentMeal}</h3>
          <p className="text-xs opacity-90">Qu'avez-vous mangé ?</p>
        </div>

        {/* Calories progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Calories</span>
            <span>
              {data?.caloriesConsumed || 0} / {data?.caloriesGoal || 2000}
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${Math.min(caloriesProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button className="bg-white/20 rounded-lg py-2 px-3 text-xs font-medium hover:bg-white/30 transition-colors">
            📷 Scanner
          </button>
          <button className="bg-white/20 rounded-lg py-2 px-3 text-xs font-medium hover:bg-white/30 transition-colors">
            ✏️ Saisir
          </button>
        </div>

        {/* Next meal reminder */}
        {data?.nextMealTime && (
          <div className="text-center text-xs opacity-75">
            Prochain repas: {data.nextMealTime}
          </div>
        )}
      </div>
    </div>
  )
}

export function DailyNutritionSummaryWidget({ data }: { data?: DailyNutritionSummary }) {
  const [expanded, setExpanded] = useState(false)

  const calculateProgress = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100)
  }

  const getProgressColor = (progress: number) => {
    if (progress < 50) return 'bg-red-400'
    if (progress < 80) return 'bg-yellow-400'
    if (progress <= 100) return 'bg-green-400'
    return 'bg-orange-400'
  }

  const macros = data ? [
    { name: 'Protéines', value: data.protein, goal: data.goals.protein, unit: 'g', color: 'text-blue-600' },
    { name: 'Glucides', value: data.carbs, goal: data.goals.carbs, unit: 'g', color: 'text-green-600' },
    { name: 'Lipides', value: data.fat, goal: data.goals.fat, unit: 'g', color: 'text-yellow-600' }
  ] : []

  const caloriesProgress = data ? calculateProgress(data.calories, data.goals.calories) : 0
  const waterProgress = data ? calculateProgress(data.waterIntake, data.goals.water) : 0

  return (
    <div className="bg-white rounded-lg p-4 shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-lg">📊</span>
          <div>
            <h3 className="font-semibold text-sm text-gray-900">Résumé du jour</h3>
            <p className="text-xs text-gray-600">
              {data?.date || new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Main calories display */}
      <div className="text-center mb-4">
        <div className="text-2xl font-bold text-gray-900">
          {data?.calories || 0}
        </div>
        <div className="text-xs text-gray-600">
          / {data?.goals.calories || 2000} calories
        </div>
        
        {/* Calories progress ring */}
        <div className="relative w-16 h-16 mx-auto mt-2">
          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-gray-200"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              className={getProgressColor(caloriesProgress)}
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${caloriesProgress}, 100`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-gray-700">
              {Math.round(caloriesProgress)}%
            </span>
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="space-y-3 border-t border-gray-100 pt-3">
          {/* Macronutrients */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700">Macronutriments</h4>
            {macros.map((macro, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${macro.color.replace('text-', 'bg-')}`} />
                  <span className="text-xs text-gray-600">{macro.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full ${macro.color.replace('text-', 'bg-')}`}
                      style={{ width: `${calculateProgress(macro.value, macro.goal)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-800 w-12 text-right">
                    {macro.value}{macro.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Hydration */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700">Hydratation</h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm">💧</span>
                <span className="text-xs text-gray-600">Eau</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-blue-400 h-1 rounded-full"
                    style={{ width: `${waterProgress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-800 w-12 text-right">
                  {data?.waterIntake || 0}L
                </span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <button className="bg-gray-100 rounded-lg py-2 px-2 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors">
              📈 Détails
            </button>
            <button className="bg-gray-100 rounded-lg py-2 px-2 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors">
              🍽️ Ajouter
            </button>
            <button className="bg-gray-100 rounded-lg py-2 px-2 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors">
              📊 Rapport
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Widget preview components for testing
export function WidgetPreview() {
  const [currentWidget, setCurrentWidget] = useState<'nutrition-log' | 'daily-summary'>('nutrition-log')

  const mockNutritionData: QuickNutritionLogWidget = {
    type: 'nutrition-log',
    lastMeal: 'Salade de quinoa',
    caloriesConsumed: 1250,
    caloriesGoal: 2000,
    nextMealTime: '19:00'
  }

  const mockSummaryData: DailyNutritionSummary = {
    type: 'daily-summary',
    date: new Date().toLocaleDateString('fr-FR'),
    calories: 1250,
    protein: 65,
    carbs: 120,
    fat: 45,
    waterIntake: 1.8,
    goals: {
      calories: 2000,
      protein: 80,
      carbs: 200,
      fat: 60,
      water: 2.5
    }
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-sm mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Aperçu des Widgets</h2>
          <div className="flex justify-center space-x-2 mb-6">
            <button
              onClick={() => setCurrentWidget('nutrition-log')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                currentWidget === 'nutrition-log'
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-700'
              }`}
            >
              Log Nutrition
            </button>
            <button
              onClick={() => setCurrentWidget('daily-summary')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                currentWidget === 'daily-summary'
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-700'
              }`}
            >
              Résumé Quotidien
            </button>
          </div>
        </div>

        {/* Widget display */}
        <div className="w-full max-w-xs mx-auto">
          {currentWidget === 'nutrition-log' ? (
            <QuickNutritionLogWidget data={mockNutritionData} />
          ) : (
            <DailyNutritionSummaryWidget data={mockSummaryData} />
          )}
        </div>

        {/* Widget info */}
        <div className="bg-white rounded-lg p-4 text-center">
          <h3 className="font-semibold text-sm text-gray-900 mb-2">
            Installation du Widget
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Pour ajouter ce widget à votre écran d'accueil, appuyez longuement sur l'écran d'accueil 
            et sélectionnez "Widgets" → "NutriCoach".
          </p>
          <div className="text-xs text-gray-500">
            📱 iOS 14+ • 🤖 Android 12+
          </div>
        </div>
      </div>
    </div>
  )
}

// Widget API endpoint data generator
export const generateWidgetData = {
  nutritionLog: (): QuickNutritionLogWidget => ({
    type: 'nutrition-log',
    lastMeal: 'Déjeuner équilibré',
    caloriesConsumed: Math.floor(Math.random() * 1500) + 500,
    caloriesGoal: 2000,
    nextMealTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }),

  dailySummary: (): DailyNutritionSummary => ({
    type: 'daily-summary',
    date: new Date().toLocaleDateString('fr-FR'),
    calories: Math.floor(Math.random() * 1500) + 800,
    protein: Math.floor(Math.random() * 60) + 40,
    carbs: Math.floor(Math.random() * 180) + 100,
    fat: Math.floor(Math.random() * 50) + 30,
    waterIntake: Math.round((Math.random() * 2 + 1) * 10) / 10,
    goals: {
      calories: 2000,
      protein: 80,
      carbs: 200,
      fat: 60,
      water: 2.5
    }
  })
}

export type { QuickNutritionLogWidget, DailyNutritionSummary }