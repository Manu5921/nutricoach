'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useDrag } from 'framer-motion'
import { Recipe } from '@/lib/offline-storage'

interface MealPlan {
  id: string
  date: Date
  breakfast?: Recipe
  lunch?: Recipe
  dinner?: Recipe
  snacks?: Recipe[]
  nutritionSummary: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
}

interface ResponsiveMealPlannerProps {
  mealPlans: MealPlan[]
  onMealPlanUpdate?: (mealPlan: MealPlan) => void
  onRecipeSelect?: (recipe: Recipe, mealType: string, date: Date) => void
  className?: string
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks'

export default function ResponsiveMealPlanner({
  mealPlans,
  onMealPlanUpdate,
  onRecipeSelect,
  className = ''
}: ResponsiveMealPlannerProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()))
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [draggedRecipe, setDraggedRecipe] = useState<Recipe | null>(null)
  const [showNutritionSummary, setShowNutritionSummary] = useState(false)
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const weekDays = getWeekDays(currentWeekStart)

  // Get week start (Monday)
  function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  // Get all days of the week
  function getWeekDays(weekStart: Date): Date[] {
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart)
      day.setDate(weekStart.getDate() + i)
      days.push(day)
    }
    return days
  }

  // Get meal plan for specific date
  const getMealPlanForDate = (date: Date): MealPlan | undefined => {
    return mealPlans.find(plan => 
      plan.date.toDateString() === date.toDateString()
    )
  }

  // Navigation functions
  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(newStart.getDate() - 7)
    setCurrentWeekStart(newStart)
  }

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(newStart.getDate() + 7)
    setCurrentWeekStart(newStart)
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentWeekStart(getWeekStart(today))
    setSelectedDate(today)
  }

  // Meal type configuration
  const mealTypes: { key: MealType; label: string; icon: string; color: string }[] = [
    { key: 'breakfast', label: 'Petit-déjeuner', icon: '🌅', color: 'bg-orange-100 text-orange-800' },
    { key: 'lunch', label: 'Déjeuner', icon: '☀️', color: 'bg-yellow-100 text-yellow-800' },
    { key: 'dinner', label: 'Dîner', icon: '🌙', color: 'bg-blue-100 text-blue-800' },
    { key: 'snacks', label: 'Collations', icon: '🍎', color: 'bg-green-100 text-green-800' }
  ]

  // Drag and drop handlers
  const handleDragStart = (recipe: Recipe) => {
    setDraggedRecipe(recipe)
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }

  const handleDragEnd = () => {
    setDraggedRecipe(null)
  }

  const handleDrop = (mealType: MealType, date: Date) => {
    if (draggedRecipe) {
      onRecipeSelect?.(draggedRecipe, mealType, date)
      setDraggedRecipe(null)
    }
  }

  // Calculate weekly nutrition summary
  const getWeeklyNutritionSummary = () => {
    const weekPlans = weekDays.map(getMealPlanForDate).filter(Boolean) as MealPlan[]
    
    return weekPlans.reduce((total, plan) => ({
      calories: total.calories + plan.nutritionSummary.calories,
      protein: total.protein + plan.nutritionSummary.protein,
      carbs: total.carbs + plan.nutritionSummary.carbs,
      fat: total.fat + plan.nutritionSummary.fat,
      fiber: total.fiber + plan.nutritionSummary.fiber
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })
  }

  // Format date for display
  const formatDate = (date: Date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Demain"
    } else {
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      })
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Planning des repas</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowNutritionSummary(!showNutritionSummary)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              📊
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors"
            >
              Aujourd'hui
            </button>
          </div>
        </div>

        {/* Week navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousWeek}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="text-center">
            <div className="text-sm text-gray-600">Semaine du</div>
            <div className="font-medium">
              {currentWeekStart.toLocaleDateString('fr-FR', { 
                day: 'numeric',
                month: 'long'
              })} - {weekDays[6].toLocaleDateString('fr-FR', { 
                day: 'numeric', 
                month: 'long',
                year: 'numeric'
              })}
            </div>
          </div>
          
          <button
            onClick={goToNextWeek}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Weekly nutrition summary */}
        <AnimatePresence>
          {showNutritionSummary && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-3 bg-gray-50 rounded-lg"
            >
              <div className="text-sm font-medium text-gray-700 mb-2">Résumé nutritionnel hebdomadaire</div>
              <div className="grid grid-cols-5 gap-3 text-xs">
                {Object.entries(getWeeklyNutritionSummary()).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className="font-semibold text-gray-900">{Math.round(value)}</div>
                    <div className="text-gray-600 capitalize">
                      {key === 'calories' ? 'kcal' : 
                       key === 'protein' ? 'prot.' :
                       key === 'carbs' ? 'gluc.' :
                       key === 'fat' ? 'lip.' : 'fibres'}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile view - Swipeable days */}
      <div className="block md:hidden">
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {weekDays.map((date, index) => {
            const mealPlan = getMealPlanForDate(date)
            const isToday = date.toDateString() === new Date().toDateString()
            
            return (
              <div
                key={date.toISOString()}
                className="min-w-full snap-start p-4"
              >
                {/* Day header */}
                <div className={`text-center mb-4 p-3 rounded-lg ${
                  isToday ? 'bg-green-100 border border-green-200' : 'bg-gray-50'
                }`}>
                  <div className="text-sm text-gray-600">
                    {date.toLocaleDateString('fr-FR', { weekday: 'long' })}
                  </div>
                  <div className={`font-semibold ${isToday ? 'text-green-800' : 'text-gray-900'}`}>
                    {formatDate(date)}
                  </div>
                  {mealPlan && (
                    <div className="text-xs text-gray-600 mt-1">
                      {Math.round(mealPlan.nutritionSummary.calories)} kcal
                    </div>
                  )}
                </div>

                {/* Meals */}
                <div className="space-y-3">
                  {mealTypes.map(({ key, label, icon, color }) => (
                    <MealSlot
                      key={key}
                      mealType={key}
                      label={label}
                      icon={icon}
                      color={color}
                      recipe={mealPlan?.[key] as Recipe}
                      recipes={key === 'snacks' ? mealPlan?.snacks : undefined}
                      onDrop={() => handleDrop(key, date)}
                      onRecipeSelect={(recipe) => onRecipeSelect?.(recipe, key, date)}
                      draggedRecipe={draggedRecipe}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Day indicators */}
        <div className="flex justify-center space-x-2 p-4 border-t border-gray-200">
          {weekDays.map((date, index) => {
            const isToday = date.toDateString() === new Date().toDateString()
            const scrollToDay = () => {
              if (scrollRef.current) {
                scrollRef.current.scrollTo({
                  left: index * scrollRef.current.clientWidth,
                  behavior: 'smooth'
                })
              }
            }
            
            return (
              <button
                key={index}
                onClick={scrollToDay}
                className={`w-2 h-2 rounded-full transition-colors ${
                  isToday ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            )
          })}
        </div>
      </div>

      {/* Desktop view - Grid layout */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 gap-1 p-4">
          {weekDays.map((date) => {
            const mealPlan = getMealPlanForDate(date)
            const isToday = date.toDateString() === new Date().toDateString()
            
            return (
              <div
                key={date.toISOString()}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  isToday 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                {/* Day header */}
                <div className="text-center mb-3">
                  <div className="text-xs text-gray-600">
                    {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </div>
                  <div className={`font-medium text-sm ${
                    isToday ? 'text-green-800' : 'text-gray-900'
                  }`}>
                    {date.getDate()}
                  </div>
                  {mealPlan && (
                    <div className="text-xs text-gray-600">
                      {Math.round(mealPlan.nutritionSummary.calories)} kcal
                    </div>
                  )}
                </div>

                {/* Meals */}
                <div className="space-y-2">
                  {mealTypes.map(({ key, icon }) => (
                    <MealSlotCompact
                      key={key}
                      mealType={key}
                      icon={icon}
                      recipe={mealPlan?.[key] as Recipe}
                      recipes={key === 'snacks' ? mealPlan?.snacks : undefined}
                      onDrop={() => handleDrop(key, date)}
                      onRecipeSelect={(recipe) => onRecipeSelect?.(recipe, key, date)}
                      draggedRecipe={draggedRecipe}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Meal slot component for mobile
function MealSlot({
  mealType,
  label,
  icon,
  color,
  recipe,
  recipes,
  onDrop,
  onRecipeSelect,
  draggedRecipe
}: {
  mealType: MealType
  label: string
  icon: string
  color: string
  recipe?: Recipe
  recipes?: Recipe[]
  onDrop: () => void
  onRecipeSelect: (recipe: Recipe) => void
  draggedRecipe: Recipe | null
}) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    onDrop()
  }

  const displayRecipes = recipes || (recipe ? [recipe] : [])

  return (
    <div
      className={`p-3 rounded-lg border-2 transition-colors ${
        isDragOver 
          ? 'border-green-400 bg-green-50' 
          : 'border-gray-200 bg-gray-50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`flex items-center space-x-2 mb-2 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        <span>{icon}</span>
        <span>{label}</span>
      </div>

      {displayRecipes.length > 0 ? (
        <div className="space-y-2">
          {displayRecipes.map((r, index) => (
            <div
              key={index}
              className="p-2 bg-white rounded border border-gray-200 cursor-pointer hover:shadow-sm transition-shadow"
              onClick={() => onRecipeSelect(r)}
            >
              <div className="font-medium text-sm text-gray-900 line-clamp-1">
                {r.title}
              </div>
              <div className="text-xs text-gray-600">
                {Math.round(r.nutritionFacts.calories)} kcal • {r.cookingTime}min
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 border-2 border-dashed border-gray-300 rounded text-center text-gray-500 text-sm">
          <div className="mb-1">➕</div>
          <div>Ajouter un plat</div>
        </div>
      )}
    </div>
  )
}

// Compact meal slot for desktop
function MealSlotCompact({
  mealType,
  icon,
  recipe,
  recipes,
  onDrop,
  onRecipeSelect,
  draggedRecipe
}: {
  mealType: MealType
  icon: string
  recipe?: Recipe
  recipes?: Recipe[]
  onDrop: () => void
  onRecipeSelect: (recipe: Recipe) => void
  draggedRecipe: Recipe | null
}) {
  const [isDragOver, setIsDragOver] = useState(false)

  const displayRecipes = recipes || (recipe ? [recipe] : [])

  return (
    <div
      className={`p-2 rounded border transition-colors cursor-pointer ${
        isDragOver 
          ? 'border-green-400 bg-green-50' 
          : displayRecipes.length > 0
            ? 'border-gray-200 bg-white hover:shadow-sm'
            : 'border-dashed border-gray-300 bg-gray-50'
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragOver(false)
        onDrop()
      }}
      onClick={() => {
        if (displayRecipes[0]) {
          onRecipeSelect(displayRecipes[0])
        }
      }}
    >
      <div className="flex items-center space-x-1">
        <span className="text-sm">{icon}</span>
        {displayRecipes.length > 0 ? (
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-900 truncate">
              {displayRecipes[0].title}
            </div>
            <div className="text-xs text-gray-600">
              {Math.round(displayRecipes[0].nutritionFacts.calories)} cal
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-500">+</div>
        )}
      </div>
    </div>
  )
}