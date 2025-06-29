'use client'

import { useState, useRef, useEffect } from 'react'

interface QuickAction {
  id: string
  label: string
  icon: string
  action: () => void
  color: string
  shortcut?: string
}

interface QuickActionWidgetProps {
  actions?: QuickAction[]
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  className?: string
}

const defaultActions: QuickAction[] = [
  {
    id: 'scan-food',
    label: 'Scanner un aliment',
    icon: '📷',
    action: () => console.log('Open camera scanner'),
    color: 'bg-blue-500',
    shortcut: 'S'
  },
  {
    id: 'quick-recipe',
    label: 'Recette rapide',
    icon: '⚡',
    action: () => console.log('Quick recipe generation'),
    color: 'bg-green-500',
    shortcut: 'R'
  },
  {
    id: 'log-meal',
    label: 'Journal repas',
    icon: '📝',
    action: () => console.log('Log meal'),
    color: 'bg-purple-500',
    shortcut: 'L'
  },
  {
    id: 'local-ingredients',
    label: 'Ingrédients locaux',
    icon: '📍',
    action: () => console.log('Find local ingredients'),
    color: 'bg-orange-500',
    shortcut: 'M'
  }
]

export default function QuickActionWidget({
  actions = defaultActions,
  position = 'bottom-right',
  className = ''
}: QuickActionWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const widgetRef = useRef<HTMLDivElement>(null)

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  }

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        const action = actions.find(a => a.shortcut?.toLowerCase() === event.key.toLowerCase())
        if (action) {
          event.preventDefault()
          action.action()
          triggerHapticFeedback()
        }
      }

      // ESC to close
      if (event.key === 'Escape') {
        setIsExpanded(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [actions])

  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [50],
        medium: [100],
        heavy: [200, 100, 200]
      }
      navigator.vibrate(patterns[type])
    }
  }

  const handleMainButtonPress = () => {
    if (!isExpanded) {
      setIsExpanded(true)
      triggerHapticFeedback('medium')
    } else {
      setIsExpanded(false)
    }
  }

  const handleMainButtonLongPress = () => {
    setLongPressTimer(setTimeout(() => {
      // Show context menu or primary action
      const primaryAction = actions[0]
      if (primaryAction) {
        primaryAction.action()
        triggerHapticFeedback('heavy')
        setIsExpanded(false)
      }
    }, 500))
  }

  const handleMainButtonRelease = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  const handleActionClick = (action: QuickAction) => {
    setSelectedAction(action.id)
    action.action()
    triggerHapticFeedback('light')
    
    // Visual feedback
    setTimeout(() => {
      setSelectedAction(null)
      setIsExpanded(false)
    }, 200)
  }

  const getActionPosition = (index: number) => {
    const radius = 80
    const angleStep = (Math.PI * 1.5) / Math.max(actions.length - 1, 1)
    const startAngle = -Math.PI / 4
    const angle = startAngle + (index * angleStep)
    
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    
    return {
      transform: `translate(${-x}px, ${-y}px)`,
      transition: `all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) ${index * 50}ms`
    }
  }

  return (
    <div
      ref={widgetRef}
      className={`fixed z-50 ${positionClasses[position]} ${className}`}
    >
      {/* Action Buttons */}
      {isExpanded && actions.map((action, index) => (
        <button
          key={action.id}
          className={`absolute w-12 h-12 rounded-full text-white shadow-lg transition-all duration-300 ${
            action.color
          } ${
            selectedAction === action.id 
              ? 'scale-110 shadow-xl' 
              : 'hover:scale-105 active:scale-95'
          }`}
          style={getActionPosition(index)}
          onClick={() => handleActionClick(action)}
          title={`${action.label} ${action.shortcut ? `(Ctrl+${action.shortcut})` : ''}`}
        >
          <span className="text-lg">{action.icon}</span>
        </button>
      ))}

      {/* Main Button */}
      <button
        className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${
          isExpanded 
            ? 'bg-red-500 hover:bg-red-600 rotate-45' 
            : 'bg-green-600 hover:bg-green-700 hover:scale-105'
        } text-white active:scale-95`}
        onClick={handleMainButtonPress}
        onTouchStart={handleMainButtonLongPress}
        onTouchEnd={handleMainButtonRelease}
        onMouseDown={handleMainButtonLongPress}
        onMouseUp={handleMainButtonRelease}
        onMouseLeave={handleMainButtonRelease}
        aria-label={isExpanded ? 'Fermer le menu' : 'Menu actions rapides'}
      >
        <span className={`text-2xl transition-transform duration-200 ${
          isExpanded ? 'rotate-45' : ''
        }`}>
          {isExpanded ? '×' : '+'}
        </span>
      </button>

      {/* Labels */}
      {isExpanded && (
        <div className="absolute -top-16 right-0 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          Maintenir pour action rapide
        </div>
      )}

      {/* Backdrop */}
      {isExpanded && (
        <div 
          className="fixed inset-0 -z-10 bg-black/20"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  )
}

// Specialized nutrition quick actions
export function NutritionQuickActions() {
  const nutritionActions: QuickAction[] = [
    {
      id: 'barcode-scan',
      label: 'Scanner code-barres',
      icon: '📊',
      action: () => {
        // Open barcode scanner
        if ('BarcodeDetector' in window) {
          console.log('Opening barcode scanner')
        } else {
          console.log('Barcode scanner not supported')
        }
      },
      color: 'bg-indigo-500',
      shortcut: 'B'
    },
    {
      id: 'voice-log',
      label: 'Dictée vocale',
      icon: '🎤',
      action: () => {
        // Start voice recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          console.log('Starting voice recognition')
        } else {
          console.log('Speech recognition not supported')
        }
      },
      color: 'bg-pink-500',
      shortcut: 'V'
    },
    {
      id: 'quick-photo',
      label: 'Photo repas',
      icon: '📸',
      action: () => {
        console.log('Opening camera for meal photo')
      },
      color: 'bg-cyan-500',
      shortcut: 'P'
    },
    {
      id: 'water-track',
      label: 'Eau bue',
      icon: '💧',
      action: () => {
        console.log('Log water intake')
      },
      color: 'bg-blue-400',
      shortcut: 'W'
    }
  ]

  return <QuickActionWidget actions={nutritionActions} />
}

// Recipe-focused quick actions
export function RecipeQuickActions() {
  const recipeActions: QuickAction[] = [
    {
      id: 'ai-recipe',
      label: 'Recette IA',
      icon: '🤖',
      action: () => {
        console.log('Generate AI recipe')
      },
      color: 'bg-violet-500',
      shortcut: 'A'
    },
    {
      id: 'favorites',
      label: 'Favoris',
      icon: '❤️',
      action: () => {
        console.log('Open favorites')
      },
      color: 'bg-red-500',
      shortcut: 'F'
    },
    {
      id: 'shopping-list',
      label: 'Liste courses',
      icon: '🛒',
      action: () => {
        console.log('Open shopping list')
      },
      color: 'bg-amber-500',
      shortcut: 'L'
    },
    {
      id: 'meal-plan',
      label: 'Planifier',
      icon: '📅',
      action: () => {
        console.log('Open meal planner')
      },
      color: 'bg-emerald-500',
      shortcut: 'M'
    }
  ]

  return <QuickActionWidget actions={recipeActions} />
}