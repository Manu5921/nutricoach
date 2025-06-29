/**
 * NutriCoach Offline Storage System
 * IndexedDB wrapper for offline-first architecture
 */

export interface Recipe {
  id: string
  title: string
  description: string
  ingredients: Ingredient[]
  instructions: string[]
  nutritionFacts: NutritionFacts
  category: string
  tags: string[]
  difficulty: 'facile' | 'moyen' | 'difficile'
  cookingTime: number
  servings: number
  image?: string
  isFavorite?: boolean
  isAntiInflammatory?: boolean
  timestamp?: number
  source?: 'generated' | 'user' | 'imported'
}

export interface Ingredient {
  id: string
  name: string
  quantity: number
  unit: string
  nutritionPer100g: NutritionFacts
  category: string
  antiInflammatoryScore?: number
}

export interface NutritionFacts {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  sodium: number
  potassium: number
  vitaminC?: number
  vitaminD?: number
  omega3?: number
  antioxidants?: number
}

export interface UserNutritionLog {
  id: string
  userId: string
  date: string
  meals: {
    breakfast?: Recipe[]
    lunch?: Recipe[]
    dinner?: Recipe[]
    snacks?: Recipe[]
  }
  totalNutrition: NutritionFacts
  antiInflammatoryScore: number
  timestamp: number
}

export interface SyncQueueItem {
  id?: string
  type: 'recipe' | 'nutrition_log' | 'user_preference' | 'analytics'
  action: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
  retries: number
  lastAttempt?: number
}

const DB_NAME = 'NutriCoachDB'
const DB_VERSION = 2

const STORES = {
  RECIPES: 'recipes',
  INGREDIENTS: 'ingredients',
  NUTRITION_LOGS: 'nutrition_logs',
  SYNC_QUEUE: 'sync_queue',
  USER_PREFERENCES: 'user_preferences',
  CACHED_REQUESTS: 'cached_requests'
} as const

class OfflineStorage {
  private db: IDBDatabase | null = null
  private initPromise: Promise<IDBDatabase> | null = null

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db
    if (this.initPromise) return this.initPromise

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Recipes store
        if (!db.objectStoreNames.contains(STORES.RECIPES)) {
          const recipeStore = db.createObjectStore(STORES.RECIPES, { keyPath: 'id' })
          recipeStore.createIndex('category', 'category', { unique: false })
          recipeStore.createIndex('isFavorite', 'isFavorite', { unique: false })
          recipeStore.createIndex('timestamp', 'timestamp', { unique: false })
          recipeStore.createIndex('tags', 'tags', { unique: false, multiEntry: true })
          recipeStore.createIndex('isAntiInflammatory', 'isAntiInflammatory', { unique: false })
        }

        // Ingredients store
        if (!db.objectStoreNames.contains(STORES.INGREDIENTS)) {
          const ingredientStore = db.createObjectStore(STORES.INGREDIENTS, { keyPath: 'id' })
          ingredientStore.createIndex('name', 'name', { unique: false })
          ingredientStore.createIndex('category', 'category', { unique: false })
          ingredientStore.createIndex('antiInflammatoryScore', 'antiInflammatoryScore', { unique: false })
        }

        // Nutrition logs store
        if (!db.objectStoreNames.contains(STORES.NUTRITION_LOGS)) {
          const logStore = db.createObjectStore(STORES.NUTRITION_LOGS, { keyPath: 'id' })
          logStore.createIndex('userId', 'userId', { unique: false })
          logStore.createIndex('date', 'date', { unique: false })
          logStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // Sync queue store
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true })
          syncStore.createIndex('type', 'type', { unique: false })
          syncStore.createIndex('timestamp', 'timestamp', { unique: false })
          syncStore.createIndex('retries', 'retries', { unique: false })
        }

        // User preferences store
        if (!db.objectStoreNames.contains(STORES.USER_PREFERENCES)) {
          const prefStore = db.createObjectStore(STORES.USER_PREFERENCES, { keyPath: 'key' })
        }

        // Cached requests store
        if (!db.objectStoreNames.contains(STORES.CACHED_REQUESTS)) {
          const cacheStore = db.createObjectStore(STORES.CACHED_REQUESTS, { keyPath: 'url' })
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })

    return this.initPromise
  }

  // Recipe operations
  async saveRecipe(recipe: Recipe): Promise<void> {
    const db = await this.init()
    const transaction = db.transaction([STORES.RECIPES], 'readwrite')
    const store = transaction.objectStore(STORES.RECIPES)
    
    const recipeWithTimestamp = {
      ...recipe,
      timestamp: Date.now()
    }
    
    await this.promisifyRequest(store.put(recipeWithTimestamp))
  }

  async getRecipe(id: string): Promise<Recipe | null> {
    const db = await this.init()
    const transaction = db.transaction([STORES.RECIPES], 'readonly')
    const store = transaction.objectStore(STORES.RECIPES)
    
    const result = await this.promisifyRequest(store.get(id))
    return result || null
  }

  async getAllRecipes(): Promise<Recipe[]> {
    const db = await this.init()
    const transaction = db.transaction([STORES.RECIPES], 'readonly')
    const store = transaction.objectStore(STORES.RECIPES)
    
    return this.promisifyRequest(store.getAll())
  }

  async getFavoriteRecipes(): Promise<Recipe[]> {
    const db = await this.init()
    const transaction = db.transaction([STORES.RECIPES], 'readonly')
    const store = transaction.objectStore(STORES.RECIPES)
    const index = store.index('isFavorite')
    
    return this.promisifyRequest(index.getAll(true))
  }

  async getRecipesByCategory(category: string): Promise<Recipe[]> {
    const db = await this.init()
    const transaction = db.transaction([STORES.RECIPES], 'readonly')
    const store = transaction.objectStore(STORES.RECIPES)
    const index = store.index('category')
    
    return this.promisifyRequest(index.getAll(category))
  }

  async searchRecipes(query: string): Promise<Recipe[]> {
    const recipes = await this.getAllRecipes()
    const lowerQuery = query.toLowerCase()
    
    return recipes.filter(recipe => 
      recipe.title.toLowerCase().includes(lowerQuery) ||
      recipe.description.toLowerCase().includes(lowerQuery) ||
      recipe.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      recipe.ingredients.some(ing => ing.name.toLowerCase().includes(lowerQuery))
    )
  }

  async deleteRecipe(id: string): Promise<void> {
    const db = await this.init()
    const transaction = db.transaction([STORES.RECIPES], 'readwrite')
    const store = transaction.objectStore(STORES.RECIPES)
    
    await this.promisifyRequest(store.delete(id))
  }

  // Nutrition log operations
  async saveNutritionLog(log: UserNutritionLog): Promise<void> {
    const db = await this.init()
    const transaction = db.transaction([STORES.NUTRITION_LOGS], 'readwrite')
    const store = transaction.objectStore(STORES.NUTRITION_LOGS)
    
    await this.promisifyRequest(store.put(log))
  }

  async getNutritionLog(id: string): Promise<UserNutritionLog | null> {
    const db = await this.init()
    const transaction = db.transaction([STORES.NUTRITION_LOGS], 'readonly')
    const store = transaction.objectStore(STORES.NUTRITION_LOGS)
    
    const result = await this.promisifyRequest(store.get(id))
    return result || null
  }

  async getNutritionLogsByDate(userId: string, startDate: string, endDate: string): Promise<UserNutritionLog[]> {
    const db = await this.init()
    const transaction = db.transaction([STORES.NUTRITION_LOGS], 'readonly')
    const store = transaction.objectStore(STORES.NUTRITION_LOGS)
    const index = store.index('date')
    
    const logs = await this.promisifyRequest(index.getAll())
    
    return logs.filter(log => 
      log.userId === userId &&
      log.date >= startDate &&
      log.date <= endDate
    )
  }

  // Ingredient operations
  async saveIngredient(ingredient: Ingredient): Promise<void> {
    const db = await this.init()
    const transaction = db.transaction([STORES.INGREDIENTS], 'readwrite')
    const store = transaction.objectStore(STORES.INGREDIENTS)
    
    await this.promisifyRequest(store.put(ingredient))
  }

  async getIngredient(id: string): Promise<Ingredient | null> {
    const db = await this.init()
    const transaction = db.transaction([STORES.INGREDIENTS], 'readonly')
    const store = transaction.objectStore(STORES.INGREDIENTS)
    
    const result = await this.promisifyRequest(store.get(id))
    return result || null
  }

  async searchIngredients(query: string): Promise<Ingredient[]> {
    const db = await this.init()
    const transaction = db.transaction([STORES.INGREDIENTS], 'readonly')
    const store = transaction.objectStore(STORES.INGREDIENTS)
    
    const ingredients = await this.promisifyRequest(store.getAll())
    const lowerQuery = query.toLowerCase()
    
    return ingredients.filter(ingredient => 
      ingredient.name.toLowerCase().includes(lowerQuery)
    )
  }

  // Sync queue operations
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id'>): Promise<void> {
    const db = await this.init()
    const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite')
    const store = transaction.objectStore(STORES.SYNC_QUEUE)
    
    await this.promisifyRequest(store.add(item))
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const db = await this.init()
    const transaction = db.transaction([STORES.SYNC_QUEUE], 'readonly')
    const store = transaction.objectStore(STORES.SYNC_QUEUE)
    
    return this.promisifyRequest(store.getAll())
  }

  async removeSyncQueueItem(id: number): Promise<void> {
    const db = await this.init()
    const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite')
    const store = transaction.objectStore(STORES.SYNC_QUEUE)
    
    await this.promisifyRequest(store.delete(id))
  }

  async updateSyncQueueItem(item: SyncQueueItem): Promise<void> {
    const db = await this.init()
    const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite')
    const store = transaction.objectStore(STORES.SYNC_QUEUE)
    
    await this.promisifyRequest(store.put(item))
  }

  // User preferences operations
  async setUserPreference(key: string, value: any): Promise<void> {
    const db = await this.init()
    const transaction = db.transaction([STORES.USER_PREFERENCES], 'readwrite')
    const store = transaction.objectStore(STORES.USER_PREFERENCES)
    
    await this.promisifyRequest(store.put({ key, value, timestamp: Date.now() }))
  }

  async getUserPreference(key: string): Promise<any> {
    const db = await this.init()
    const transaction = db.transaction([STORES.USER_PREFERENCES], 'readonly')
    const store = transaction.objectStore(STORES.USER_PREFERENCES)
    
    const result = await this.promisifyRequest(store.get(key))
    return result?.value || null
  }

  // Cache operations
  async cacheRequest(url: string, response: any, ttl: number = 3600000): Promise<void> {
    const db = await this.init()
    const transaction = db.transaction([STORES.CACHED_REQUESTS], 'readwrite')
    const store = transaction.objectStore(STORES.CACHED_REQUESTS)
    
    const cacheEntry = {
      url,
      response,
      timestamp: Date.now(),
      expires: Date.now() + ttl
    }
    
    await this.promisifyRequest(store.put(cacheEntry))
  }

  async getCachedRequest(url: string): Promise<any | null> {
    const db = await this.init()
    const transaction = db.transaction([STORES.CACHED_REQUESTS], 'readonly')
    const store = transaction.objectStore(STORES.CACHED_REQUESTS)
    
    const result = await this.promisifyRequest(store.get(url))
    
    if (result && result.expires > Date.now()) {
      return result.response
    }
    
    // Remove expired cache entry
    if (result) {
      const deleteTransaction = db.transaction([STORES.CACHED_REQUESTS], 'readwrite')
      const deleteStore = deleteTransaction.objectStore(STORES.CACHED_REQUESTS)
      await this.promisifyRequest(deleteStore.delete(url))
    }
    
    return null
  }

  // Utility operations
  async clearExpiredCache(): Promise<void> {
    const db = await this.init()
    const transaction = db.transaction([STORES.CACHED_REQUESTS], 'readwrite')
    const store = transaction.objectStore(STORES.CACHED_REQUESTS)
    const index = store.index('timestamp')
    
    const cursor = await this.promisifyRequest(index.openCursor())
    const now = Date.now()
    
    while (cursor) {
      if (cursor.value.expires < now) {
        await this.promisifyRequest(cursor.delete())
      }
      await this.promisifyRequest(cursor.continue())
    }
  }

  async getStorageStats(): Promise<{
    recipes: number
    ingredients: number
    nutritionLogs: number
    syncQueue: number
    cacheSize: number
  }> {
    const db = await this.init()
    
    const recipeCount = await this.getStoreCount(db, STORES.RECIPES)
    const ingredientCount = await this.getStoreCount(db, STORES.INGREDIENTS)
    const logCount = await this.getStoreCount(db, STORES.NUTRITION_LOGS)
    const syncCount = await this.getStoreCount(db, STORES.SYNC_QUEUE)
    const cacheCount = await this.getStoreCount(db, STORES.CACHED_REQUESTS)
    
    return {
      recipes: recipeCount,
      ingredients: ingredientCount,
      nutritionLogs: logCount,
      syncQueue: syncCount,
      cacheSize: cacheCount
    }
  }

  async clearAllData(): Promise<void> {
    const db = await this.init()
    const storeNames = Object.values(STORES)
    
    const transaction = db.transaction(storeNames, 'readwrite')
    
    await Promise.all(
      storeNames.map(storeName => 
        this.promisifyRequest(transaction.objectStore(storeName).clear())
      )
    )
  }

  // Helper methods
  private async getStoreCount(db: IDBDatabase, storeName: string): Promise<number> {
    const transaction = db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    return this.promisifyRequest(store.count())
  }

  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }
}

// Singleton instance
const offlineStorage = new OfflineStorage()

// Export both the class and singleton instance
export { OfflineStorage }
export default offlineStorage

// Utility functions for common operations
export async function initializeOfflineStorage(): Promise<void> {
  await offlineStorage.init()
}

export async function syncOfflineData(): Promise<void> {
  const syncQueue = await offlineStorage.getSyncQueue()
  
  for (const item of syncQueue) {
    try {
      let endpoint = ''
      
      switch (item.type) {
        case 'recipe':
          endpoint = '/api/recipes'
          break
        case 'nutrition_log':
          endpoint = '/api/nutrition/logs'
          break
        case 'user_preference':
          endpoint = '/api/user/preferences'
          break
        case 'analytics':
          endpoint = '/api/analytics/events'
          break
      }
      
      const method = item.action === 'create' ? 'POST' : 
                    item.action === 'update' ? 'PUT' : 'DELETE'
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(item.data)
      })
      
      if (response.ok) {
        await offlineStorage.removeSyncQueueItem(item.id!)
      } else {
        // Increment retry count
        item.retries += 1
        item.lastAttempt = Date.now()
        
        if (item.retries < 3) {
          await offlineStorage.updateSyncQueueItem(item)
        } else {
          // Remove after 3 failed attempts
          await offlineStorage.removeSyncQueueItem(item.id!)
        }
      }
    } catch (error) {
      console.error('Sync failed for item:', item, error)
    }
  }
}