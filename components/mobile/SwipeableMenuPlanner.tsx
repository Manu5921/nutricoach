'use client'

import { useState, useRef, useEffect } from 'react'
import { Recipe } from '@/lib/offline-storage'

interface MealPlan {
  id: string
  date: string
  breakfast?: Recipe[]
  lunch?: Recipe[]
  dinner?: Recipe[]
  snacks?: Recipe[]
}

interface SwipeableMenuPlannerProps {
  mealPlans: MealPlan[]
  onMealPlanChange?: (date: string, mealType: string, recipes: Recipe[]) => void
  onAddRecipe?: (date: string, mealType: string) => void
  className?: string
}

export default function SwipeableMenuPlanner({
  mealPlans,
  onMealPlanChange,
  onAddRecipe,
  className = ''
}: SwipeableMenuPlannerProps) {
  const [currentWeek, setCurrentWeek] = useState(0)
  const [selectedDate, setSelectedDate] = useState<string>()
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const startY = useRef(0)

  // Generate week dates
  const getWeekDates = (weekOffset: number = 0) => {
    const today = new Date()
    const currentDay = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - currentDay + 1 + (weekOffset * 7))
    
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const currentWeekDates = getWeekDates(currentWeek)
  const weekLabel = `${currentWeekDates[0].toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })} - ${currentWeekDates[6].toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}`

  // Touch handlers for week navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    startX.current = touch.clientX
    startY.current = touch.clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!e.touches[0]) return
    
    const touch = e.touches[0]
    const deltaX = touch.clientX - startX.current
    const deltaY = touch.clientY - startY.current
    
    // Only handle horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setIsDragging(true)
      setSwipeOffset(deltaX)
      e.preventDefault()
    }
  }

  const handleTouchEnd = () => {
    if (isDragging) {
      const threshold = 100
      
      if (swipeOffset > threshold) {
        // Swipe right - previous week
        setCurrentWeek(prev => prev - 1)
      } else if (swipeOffset < -threshold) {
        // Swipe left - next week
        setCurrentWeek(prev => prev + 1)
      }
      
      setSwipeOffset(0)
      setIsDragging(false)
    }
  }

  const getMealPlanForDate = (date: Date): MealPlan | undefined => {
    const dateString = date.toISOString().split('T')[0]
    return mealPlans.find(plan => plan.date === dateString)
  }

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return '🥐'
      case 'lunch': return '🍽️'
      case 'dinner': return '🍲'
      case 'snacks': return '🍎'
      default: return '🍴'
    }
  }

  const getMealLabel = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return 'Petit-déjeuner'
      case 'lunch': return 'Déjeuner'
      case 'dinner': return 'Dîner'
      case 'snacks': return 'Collations'
      default: return 'Repas'
    }
  }

  const MealTypeCard = ({ 
    date, 
    mealType, 
    recipes = [] 
  }: { 
    date: Date
    mealType: string
    recipes?: Recipe[] 
  }) => {
    const totalCalories = recipes.reduce((sum, recipe) => sum + recipe.nutritionFacts.calories, 0)
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 min-h-32">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getMealIcon(mealType)}</span>
            <span className="font-medium text-gray-900 text-sm">
              {getMealLabel(mealType)}
            </span>
          </div>
          {totalCalories > 0 && (
            <span className="text-xs text-gray-500">
              {Math.round(totalCalories)} cal
            </span>
          )}
        </div>
        
        {recipes.length > 0 ? (
          <div className="space-y-2">
            {recipes.map((recipe, index) => (
              <div 
                key={index}
                className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {recipe.title.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {recipe.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {Math.round(recipe.nutritionFacts.calories)} cal
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <button
            className="w-full h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors"
            onClick={() => onAddRecipe?.(date.toISOString().split('T')[0], mealType)}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">+</div>
              <div className="text-xs">Ajouter un plat</div>
            </div>
          </button>
        )}
      </div>
    )
  }

  const DayColumn = ({ date }: { date: Date }) => {
    const mealPlan = getMealPlanForDate(date)
    const isToday = date.toDateString() === new Date().toDateString()
    const dateString = date.toISOString().split('T')[0]
    const isSelected = selectedDate === dateString

    return (
      <div className="flex-shrink-0 w-full px-2">
        <div
          className={`rounded-lg border-2 transition-colors ${
            isSelected 
              ? 'border-green-500 bg-green-50' 
              : isToday
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white'
          }`}
          onClick={() => setSelectedDate(isSelected ? undefined : dateString)}
        >
          {/* Date Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wide">
                {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
              </div>
              <div className={`text-lg font-bold ${
                isToday 
                  ? 'text-blue-600' 
                  : isSelected 
                  ? 'text-green-600' 
                  : 'text-gray-900'
              }`}>
                {date.getDate()}
              </div>
              <div className="text-xs text-gray-500">
                {date.toLocaleDateString('fr-FR', { month: 'short' })}
              </div>
            </div>
            
            {/* Daily nutrition summary */}
            {mealPlan && (
              <div className="mt-2 text-center">
                <div className="text-xs text-gray-600">
                  Total: {Math.round(
                    (mealPlan.breakfast || []).reduce((sum, r) => sum + r.nutritionFacts.calories, 0) +
                    (mealPlan.lunch || []).reduce((sum, r) => sum + r.nutritionFacts.calories, 0) +
                    (mealPlan.dinner || []).reduce((sum, r) => sum + r.nutritionFacts.calories, 0) +
                    (mealPlan.snacks || []).reduce((sum, r) => sum + r.nutritionFacts.calories, 0)
                  )} cal
                </div>
              </div>
            )}
          </div>
          
          {/* Meals */}
          <div className="p-4 space-y-4">
            <MealTypeCard date={date} mealType="breakfast" recipes={mealPlan?.breakfast} />
            <MealTypeCard date={date} mealType="lunch" recipes={mealPlan?.lunch} />
            <MealTypeCard date={date} mealType="dinner" recipes={mealPlan?.dinner} />
            <MealTypeCard date={date} mealType="snacks" recipes={mealPlan?.snacks} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Week Navigation Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setCurrentWeek(prev => prev - 1)}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="text-center flex-1">
            <h2 className="font-semibold text-gray-900">
              {weekLabel}
            </h2>
            <p className="text-sm text-gray-500">
              Semaine {currentWeek === 0 ? 'actuelle' : currentWeek > 0 ? `+${currentWeek}` : currentWeek}
            </p>
          </div>
          
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setCurrentWeek(prev => prev + 1)}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
        
        {/* Swipe indicator */}
        {isDragging && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div 
              className="h-full bg-green-500 transition-all duration-150"
              style={{ 
                width: `${Math.min(Math.abs(swipeOffset) / 2, 50)}%`,
                marginLeft: swipeOffset > 0 ? '0' : 'auto',
                marginRight: swipeOffset < 0 ? '0' : 'auto'
              }}
            />
          </div>
        )}
      </div>
      
      {/* Week Content */}
      <div
        ref={containerRef}
        className="overflow-x-auto scrollbar-hide"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        <div className="flex space-x-4 p-4 min-w-max">
          {currentWeekDates.map((date, index) => (
            <div key={index} className="w-80">
              <DayColumn date={date} />
            </div>
          ))}
        </div>
      </div>
      
      {/* Quick Actions for Mobile */}
      <div className="fixed bottom-4 right-4 z-20">
        <div className="flex flex-col space-y-2">
          <button
            className="w-12 h-12 bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-600 transition-colors"
            onClick={() => {
              // Add recipe to current day
              const today = new Date().toISOString().split('T')[0]
              onAddRecipe?.(today, 'lunch')
            }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          <button
            className="w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
            onClick={() => setCurrentWeek(0)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}