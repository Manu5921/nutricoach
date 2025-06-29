'use client'

import { useState, useEffect } from 'react'
import { Recipe } from '@/lib/offline-storage'
import offlineStorage from '@/lib/offline-storage'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true)
  const [offlineRecipes, setOfflineRecipes] = useState<Recipe[]>([])
  const [storageStats, setStorageStats] = useState({
    recipes: 0,
    ingredients: 0,
    nutritionLogs: 0,
    syncQueue: 0,
    cacheSize: 0
  })

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Load offline data
    loadOfflineData()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadOfflineData = async () => {
    try {
      const recipes = await offlineStorage.getAllRecipes()
      setOfflineRecipes(recipes)

      const stats = await offlineStorage.getStorageStats()
      setStorageStats(stats)
    } catch (error) {
      console.error('Error loading offline data:', error)
    }
  }

  const syncData = async () => {
    if (!isOnline) return

    try {
      // Trigger sync (would normally be handled by service worker)
      const { syncOfflineData } = await import('@/lib/offline-storage')
      await syncOfflineData()
      
      // Reload page to get fresh data
      window.location.reload()
    } catch (error) {
      console.error('Sync failed:', error)
    }
  }

  if (isOnline) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🌐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Connexion rétablie !
          </h1>
          <p className="text-gray-600 mb-6">
            Vous êtes de nouveau en ligne. Synchronisation en cours...
          </p>
          <button
            onClick={syncData}
            className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Synchroniser maintenant
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📱</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mode hors ligne
          </h1>
          <p className="text-gray-600">
            Pas de connexion internet ? Pas de problème ! Accédez à vos recettes sauvegardées.
          </p>
        </div>

        {/* Connection Status */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-600">⚠️</span>
              <span className="text-sm text-yellow-800 font-medium">
                Connexion internet indisponible
              </span>
            </div>
            <div className="text-xs text-yellow-600">
              Vérification automatique...
            </div>
          </div>
        </div>

        {/* Storage Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{storageStats.recipes}</div>
            <div className="text-sm text-gray-600">Recettes</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{storageStats.ingredients}</div>
            <div className="text-sm text-gray-600">Ingrédients</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{storageStats.nutritionLogs}</div>
            <div className="text-sm text-gray-600">Journaux</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{storageStats.syncQueue}</div>
            <div className="text-sm text-gray-600">En attente</div>
          </div>
        </div>

        {/* Offline Features */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Fonctionnalités disponibles hors ligne
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <span className="text-green-600 text-xl">📖</span>
              <div>
                <div className="font-medium text-gray-900">Consulter vos recettes</div>
                <div className="text-sm text-gray-600">Accès complet aux recettes sauvegardées</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <span className="text-blue-600 text-xl">📊</span>
              <div>
                <div className="font-medium text-gray-900">Consulter vos données</div>
                <div className="text-sm text-gray-600">Historique nutritionnel local</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
              <span className="text-purple-600 text-xl">📝</span>
              <div>
                <div className="font-medium text-gray-900">Prendre des notes</div>
                <div className="text-sm text-gray-600">Sauvegarde locale automatique</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
              <span className="text-orange-600 text-xl">🔄</span>
              <div>
                <div className="font-medium text-gray-900">Sync automatique</div>
                <div className="text-sm text-gray-600">Dès la reconnexion</div>
              </div>
            </div>
          </div>
        </div>

        {/* Offline Recipes */}
        {offlineRecipes.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Vos recettes hors ligne ({offlineRecipes.length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {offlineRecipes.slice(0, 6).map((recipe) => (
                <div
                  key={recipe.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                      {recipe.title}
                    </h3>
                    {recipe.isFavorite && (
                      <span className="text-red-500 text-sm">❤️</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                    {recipe.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>⏱️ {recipe.cookingTime}min</span>
                    <span>{Math.round(recipe.nutritionFacts.calories)} cal</span>
                  </div>
                </div>
              ))}
            </div>
            
            {offlineRecipes.length > 6 && (
              <div className="mt-4 text-center">
                <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                  Voir toutes les recettes ({offlineRecipes.length})
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="text-4xl mb-4">📪</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune recette hors ligne
            </h3>
            <p className="text-gray-600 mb-4">
              Sauvegardez vos recettes préférées pour y accéder même sans connexion internet.
            </p>
            <div className="text-sm text-gray-500">
              Astuce : Consultez une recette en ligne pour la sauvegarder automatiquement
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-4 text-sm text-gray-500">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center space-x-1 hover:text-gray-700"
            >
              <span>🔄</span>
              <span>Vérifier la connexion</span>
            </button>
            <span>•</span>
            <button
              onClick={() => window.history.back()}
              className="flex items-center space-x-1 hover:text-gray-700"
            >
              <span>◀️</span>
              <span>Retour</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}