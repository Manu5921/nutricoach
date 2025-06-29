'use client'

import { useState, useEffect, useRef } from 'react'
import { Recipe } from '@/lib/offline-storage'
import offlineStorage from '@/lib/offline-storage'

interface TouchRecipeCardProps {
  recipe: Recipe
  onFavorite?: (recipe: Recipe) => void
  onShare?: (recipe: Recipe) => void
  onView?: (recipe: Recipe) => void
  className?: string
}

export default function TouchRecipeCard({ 
  recipe, 
  onFavorite, 
  onShare, 
  onView, 
  className = '' 
}: TouchRecipeCardProps) {
  const [isFavorite, setIsFavorite] = useState(recipe.isFavorite || false)
  const [isPressed, setIsPressed] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [showActions, setShowActions] = useState(false)
  
  const cardRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const currentX = useRef(0)
  const isDragging = useRef(false)
  const longPressTimer = useRef<NodeJS.Timeout>()

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    startX.current = touch.clientX
    startY.current = touch.clientY
    currentX.current = touch.clientX
    setIsPressed(true)
    
    // Long press for context menu
    longPressTimer.current = setTimeout(() => {
      if (!isDragging.current) {
        setShowActions(true)
        // Haptic feedback if available
        if ('vibrate' in navigator) {
          navigator.vibrate(50)
        }
      }
    }, 500)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!e.touches[0]) return
    
    const touch = e.touches[0]
    const deltaX = touch.clientX - startX.current
    const deltaY = touch.clientY - startY.current
    currentX.current = touch.clientX
    
    // Determine if horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      isDragging.current = true
      setSwipeOffset(deltaX)
      e.preventDefault() // Prevent scrolling
      
      // Clear long press timer
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPressed(false)
    
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
    
    if (isDragging.current) {
      // Handle swipe actions
      const threshold = 100
      
      if (swipeOffset > threshold) {
        // Swipe right - favorite
        handleFavorite()
      } else if (swipeOffset < -threshold) {
        // Swipe left - share
        handleShare()
      }
      
      // Reset swipe
      setSwipeOffset(0)
      isDragging.current = false
    } else if (!showActions && Math.abs(swipeOffset) < 10) {
      // Simple tap - view recipe
      handleView()
    }
  }

  const handleFavorite = async () => {
    const newFavoriteState = !isFavorite
    setIsFavorite(newFavoriteState)
    
    // Update recipe in offline storage
    const updatedRecipe = { ...recipe, isFavorite: newFavoriteState }
    await offlineStorage.saveRecipe(updatedRecipe)
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(newFavoriteState ? [100, 50, 100] : [50])
    }
    
    onFavorite?.(updatedRecipe)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: recipe.title,
        text: recipe.description,
        url: `/recipes/${recipe.id}`
      })
    } else {
      // Fallback share
      const shareText = `Découvrez cette délicieuse recette: ${recipe.title}\n${recipe.description}`
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText)
      }
    }
    
    onShare?.(recipe)
  }

  const handleView = () => {
    onView?.(recipe)
  }

  const getDifficultyColor = () => {
    switch (recipe.difficulty) {
      case 'facile': return 'bg-green-100 text-green-800'
      case 'moyen': return 'bg-yellow-100 text-yellow-800'
      case 'difficile': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAntiInflammatoryBadge = () => {
    if (recipe.isAntiInflammatory) {
      return (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
          Anti-inflammatoire
        </div>
      )
    }
    return null
  }

  return (
    <>
      <div
        ref={cardRef}
        className={`
          relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden
          transform transition-transform duration-200 select-none
          ${isPressed ? 'scale-95' : 'scale-100'}
          ${className}
        `}
        style={{
          transform: `translateX(${swipeOffset}px) scale(${isPressed ? 0.95 : 1})`,
          transition: isDragging.current ? 'none' : 'transform 0.2s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Recipe Image */}
        <div className="relative h-48 bg-gradient-to-br from-green-400 to-blue-500">
          {recipe.image ? (
            <img
              src={recipe.image}
              alt={recipe.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white text-4xl">
              🍽️
            </div>
          )}
          
          {getAntiInflammatoryBadge()}
          
          {/* Favorite indicator */}
          <button
            className={`absolute top-2 left-2 p-2 rounded-full transition-colors ${
              isFavorite 
                ? 'bg-red-500 color-white' 
                : 'bg-white/80 text-gray-700 hover:bg-white'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              handleFavorite()
            }}
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
        </div>

        {/* Recipe Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 text-lg leading-tight line-clamp-2">
              {recipe.title}
            </h3>
          </div>
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {recipe.description}
          </p>
          
          {/* Recipe Meta */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                ⏱️ {recipe.cookingTime}min
              </span>
              <span className="flex items-center">
                👥 {recipe.servings} pers.
              </span>
            </div>
            
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor()}`}>
              {recipe.difficulty}
            </span>
          </div>
          
          {/* Nutrition Info */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <span>{Math.round(recipe.nutritionFacts.calories)} cal</span>
            <span>{Math.round(recipe.nutritionFacts.protein)}g protéines</span>
            <span>{Math.round(recipe.nutritionFacts.carbs)}g glucides</span>
          </div>
          
          {/* Tags */}
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {recipe.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {recipe.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{recipe.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Swipe indicators */}
        {swipeOffset !== 0 && (
          <>
            <div
              className={`absolute left-0 top-0 h-full w-16 flex items-center justify-center text-white text-2xl transition-opacity ${
                swipeOffset > 50 ? 'bg-red-500 opacity-100' : 'bg-gray-400 opacity-50'
              }`}
            >
              ❤️
            </div>
            <div
              className={`absolute right-0 top-0 h-full w-16 flex items-center justify-center text-white text-2xl transition-opacity ${
                swipeOffset < -50 ? 'bg-blue-500 opacity-100' : 'bg-gray-400 opacity-50'
              }`}
            >
              📤
            </div>
          </>
        )}
      </div>
      
      {/* Actions Modal */}
      {showActions && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4"
          onClick={() => setShowActions(false)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-w-sm p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 className="font-semibold text-lg text-gray-900">{recipe.title}</h3>
              <p className="text-gray-500 text-sm mt-1">Que souhaitez-vous faire ?</p>
            </div>
            
            <div className="space-y-3">
              <button
                className="w-full py-3 px-4 bg-green-50 text-green-700 rounded-lg font-medium flex items-center justify-center space-x-2"
                onClick={() => {
                  handleView()
                  setShowActions(false)
                }}
              >
                <span>👁️</span>
                <span>Voir la recette</span>
              </button>
              
              <button
                className="w-full py-3 px-4 bg-red-50 text-red-700 rounded-lg font-medium flex items-center justify-center space-x-2"
                onClick={() => {
                  handleFavorite()
                  setShowActions(false)
                }}
              >
                <span>{isFavorite ? '💔' : '❤️'}</span>
                <span>{isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}</span>
              </button>
              
              <button
                className="w-full py-3 px-4 bg-blue-50 text-blue-700 rounded-lg font-medium flex items-center justify-center space-x-2"
                onClick={() => {
                  handleShare()
                  setShowActions(false)
                }}
              >
                <span>📤</span>
                <span>Partager</span>
              </button>
            </div>
            
            <button
              className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium"
              onClick={() => setShowActions(false)}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </>
  )
}