'use client'

import { useState, useEffect, useCallback } from 'react'

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

interface LocalIngredient {
  id: string
  name: string
  category: string
  seasonality: string[]
  localSuppliers: LocalSupplier[]
  distance: number
  sustainability: {
    carbonFootprint: number
    waterUsage: number
    locallyGrown: boolean
  }
}

interface LocalSupplier {
  id: string
  name: string
  type: 'market' | 'farm' | 'store' | 'organic'
  distance: number
  address: string
  openingHours: string
  rating: number
  priceRange: 'low' | 'medium' | 'high'
}

interface LocationBasedSuggestionsProps {
  onIngredientsFound?: (ingredients: LocalIngredient[]) => void
  onLocationUpdate?: (location: LocationData) => void
  radiusKm?: number
  className?: string
}

export default function LocationBasedSuggestions({
  onIngredientsFound,
  onLocationUpdate,
  radiusKm = 25,
  className = ''
}: LocationBasedSuggestionsProps) {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [localIngredients, setLocalIngredients] = useState<LocalIngredient[]>([])
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt')
  const [showPermissionModal, setShowPermissionModal] = useState(false)

  // Check geolocation permission status
  const checkPermissionStatus = useCallback(async () => {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' })
        setPermissionStatus(permission.state)
        
        permission.addEventListener('change', () => {
          setPermissionStatus(permission.state)
        })
      } catch (error) {
        console.error('Error checking geolocation permission:', error)
      }
    }
  }, [])

  useEffect(() => {
    checkPermissionStatus()
  }, [checkPermissionStatus])

  // Request location permission and get current position
  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocationError('La géolocalisation n\'est pas supportée par votre navigateur')
      return
    }

    setIsLoading(true)
    setLocationError(null)

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000 // 5 minutes
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        }
        
        setLocation(locationData)
        setPermissionStatus('granted')
        onLocationUpdate?.(locationData)
        
        // Fetch local ingredients
        fetchLocalIngredients(locationData)
        
        setIsLoading(false)
      },
      (error) => {
        let errorMessage = 'Erreur de géolocalisation'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permission de géolocalisation refusée'
            setPermissionStatus('denied')
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Position non disponible'
            break
          case error.TIMEOUT:
            errorMessage = 'Délai de géolocalisation dépassé'
            break
        }
        
        setLocationError(errorMessage)
        setIsLoading(false)
      },
      options
    )
  }, [onLocationUpdate])

  // Fetch local ingredients based on location
  const fetchLocalIngredients = async (locationData: LocationData) => {
    try {
      const response = await fetch('/api/ingredients/local', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          radius: radiusKm
        })
      })

      if (response.ok) {
        const ingredients: LocalIngredient[] = await response.json()
        setLocalIngredients(ingredients)
        onIngredientsFound?.(ingredients)
      }
    } catch (error) {
      console.error('Error fetching local ingredients:', error)
      
      // Fallback to mock data for demo
      const mockIngredients: LocalIngredient[] = generateMockLocalIngredients(locationData)
      setLocalIngredients(mockIngredients)
      onIngredientsFound?.(mockIngredients)
    }
  }

  // Generate mock local ingredients for demo
  const generateMockLocalIngredients = (locationData: LocationData): LocalIngredient[] => {
    const currentMonth = new Date().getMonth()
    const season = currentMonth >= 3 && currentMonth <= 5 ? 'spring' :
                  currentMonth >= 6 && currentMonth <= 8 ? 'summer' :
                  currentMonth >= 9 && currentMonth <= 11 ? 'autumn' : 'winter'

    return [
      {
        id: '1',
        name: 'Tomates cerises bio',
        category: 'Légumes',
        seasonality: ['summer', 'autumn'],
        distance: 8.5,
        localSuppliers: [
          {
            id: '1',
            name: 'Ferme du Soleil',
            type: 'farm',
            distance: 8.5,
            address: '123 Route des Champs',
            openingHours: '8h-18h',
            rating: 4.8,
            priceRange: 'medium'
          }
        ],
        sustainability: {
          carbonFootprint: 0.2,
          waterUsage: 15,
          locallyGrown: true
        }
      },
      {
        id: '2',
        name: 'Épinards frais',
        category: 'Légumes verts',
        seasonality: ['spring', 'autumn', 'winter'],
        distance: 12.3,
        localSuppliers: [
          {
            id: '2',
            name: 'Marché Bio Central',
            type: 'market',
            distance: 12.3,
            address: 'Place du Marché',
            openingHours: 'Mar, Jeu, Sam 7h-13h',
            rating: 4.5,
            priceRange: 'medium'
          }
        ],
        sustainability: {
          carbonFootprint: 0.1,
          waterUsage: 8,
          locallyGrown: true
        }
      },
      {
        id: '3',
        name: 'Pommes Gala',
        category: 'Fruits',
        seasonality: ['autumn', 'winter'],
        distance: 5.2,
        localSuppliers: [
          {
            id: '3',
            name: 'Verger des Trois Chênes',
            type: 'farm',
            distance: 5.2,
            address: '456 Chemin des Pommiers',
            openingHours: '9h-17h',
            rating: 4.9,
            priceRange: 'low'
          }
        ],
        sustainability: {
          carbonFootprint: 0.05,
          waterUsage: 12,
          locallyGrown: true
        }
      }
    ].filter(ingredient => ingredient.seasonality.includes(season))
  }

  const formatDistance = (distance: number) => {
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`
  }

  const getSupplierIcon = (type: LocalSupplier['type']) => {
    switch (type) {
      case 'farm': return '🚜'
      case 'market': return '🏪'
      case 'organic': return '🌱'
      default: return '🏬'
    }
  }

  const getSustainabilityColor = (carbonFootprint: number) => {
    if (carbonFootprint < 0.2) return 'text-green-600'
    if (carbonFootprint < 0.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (permissionStatus === 'prompt' || showPermissionModal) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-3">📍</div>
          <h3 className="font-semibold text-gray-900 mb-2">
            Ingrédients locaux disponibles
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Autorisez la géolocalisation pour découvrir les ingrédients frais près de chez vous
          </p>
          
          <div className="space-y-2">
            <button
              className="w-full py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              onClick={requestLocation}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Localisation...</span>
                </div>
              ) : (
                'Autoriser la géolocalisation'
              )}
            </button>
            
            <button
              className="w-full py-2 px-4 text-gray-600 text-sm hover:text-gray-800 transition-colors"
              onClick={() => setShowPermissionModal(false)}
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (permissionStatus === 'denied') {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-3">🚫</div>
          <h3 className="font-semibold text-red-800 mb-2">
            Géolocalisation désactivée
          </h3>
          <p className="text-red-600 text-sm mb-4">
            Activez la géolocalisation dans les paramètres de votre navigateur pour découvrir les ingrédients locaux
          </p>
          
          <button
            className="py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
            onClick={requestLocation}
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (locationError) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h3 className="font-semibold text-yellow-800 mb-2">
            Erreur de localisation
          </h3>
          <p className="text-yellow-600 text-sm mb-4">
            {locationError}
          </p>
          
          <button
            className="py-2 px-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
            onClick={requestLocation}
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!location) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="text-center">
          <div className="animate-pulse text-4xl mb-3">📍</div>
          <p className="text-gray-600 text-sm">
            Recherche d'ingrédients locaux...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Location Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-green-600">📍</span>
            <span className="text-sm text-green-800">
              Position détectée (±{Math.round(location.accuracy)}m)
            </span>
          </div>
          <button
            className="text-green-600 hover:text-green-800 text-sm underline"
            onClick={requestLocation}
          >
            Actualiser
          </button>
        </div>
      </div>

      {/* Local Ingredients */}
      {localIngredients.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">
            🌱 Ingrédients locaux ({localIngredients.length})
          </h3>
          
          {localIngredients.map((ingredient) => (
            <div
              key={ingredient.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{ingredient.name}</h4>
                  <p className="text-sm text-gray-600">{ingredient.category}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatDistance(ingredient.distance)}
                  </div>
                  <div className={`text-xs ${getSustainabilityColor(ingredient.sustainability.carbonFootprint)}`}>
                    {ingredient.sustainability.carbonFootprint}kg CO₂
                  </div>
                </div>
              </div>
              
              {/* Suppliers */}
              <div className="space-y-2">
                {ingredient.localSuppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getSupplierIcon(supplier.type)}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {supplier.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {supplier.openingHours}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        <span className="text-yellow-500">⭐</span>
                        <span className="text-sm text-gray-600">{supplier.rating}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDistance(supplier.distance)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Sustainability info */}
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>💧 {ingredient.sustainability.waterUsage}L/kg</span>
                <span>
                  {ingredient.sustainability.locallyGrown ? '🌱 Local' : '🚛 Importé'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-600 text-sm">
            Aucun ingrédient local trouvé dans un rayon de {radiusKm}km
          </p>
        </div>
      )}
    </div>
  )
}