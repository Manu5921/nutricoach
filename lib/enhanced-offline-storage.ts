/**
 * Enhanced NutriCoach Offline Storage System
 * Advanced IndexedDB wrapper with conflict resolution and progressive data loading
 */

import { Recipe, Ingredient, NutritionFacts, UserNutritionLog, SyncQueueItem } from './offline-storage'

// Enhanced interfaces for conflict resolution
export interface VersionedData<T = any> {
  id: string
  data: T
  version: number
  lastModified: number
  clientId: string
  hash?: string
  syncStatus: 'pending' | 'synced' | 'conflict'
}

export interface ConflictResolution<T = any> {
  localVersion: VersionedData<T>
  remoteVersion: VersionedData<T>
  resolution: 'local' | 'remote' | 'merge' | 'manual'
  mergedData?: T
  timestamp: number
}

export interface NetworkInfo {
  online: boolean
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | undefined
  downlink: number
  rtt: number
  saveData: boolean
}

export interface MobileOptimizationSettings {
  enableImageCompression: boolean
  maxImageSize: number
  enableDataSaver: boolean
  enableAdaptiveLoading: boolean
  enableBatchSync: boolean
  syncBatchSize: number
}

const DB_NAME = 'NutriCoachEnhancedDB'
const DB_VERSION = 3
const CLIENT_ID = generateClientId()

const STORES = {
  RECIPES: 'recipes_v2',
  INGREDIENTS: 'ingredients_v2',
  NUTRITION_LOGS: 'nutrition_logs_v2',
  SYNC_QUEUE: 'sync_queue_v2',
  CONFLICTS: 'conflicts',
  METADATA: 'metadata',
  PROGRESSIVE_CACHE: 'progressive_cache'
} as const

// Generate unique client ID
function generateClientId(): string {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Calculate data hash for conflict detection
function calculateHash(data: any): string {
  const str = JSON.stringify(data, Object.keys(data).sort())
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString(36)
}

class EnhancedOfflineStorage {
  private db: IDBDatabase | null = null
  private initPromise: Promise<IDBDatabase> | null = null
  private networkInfo: NetworkInfo = {
    online: navigator.onLine,
    effectiveType: undefined,
    downlink: 0,
    rtt: 0,
    saveData: false
  }
  private optimizationSettings: MobileOptimizationSettings = {
    enableImageCompression: true,
    maxImageSize: 1024 * 1024, // 1MB
    enableDataSaver: false,
    enableAdaptiveLoading: true,
    enableBatchSync: true,
    syncBatchSize: 10
  }

  constructor() {
    this.initNetworkMonitoring()
    this.initDataSaverDetection()
  }

  // Initialize network monitoring
  private initNetworkMonitoring() {
    // Network connection monitoring
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      this.networkInfo.effectiveType = connection.effectiveType
      this.networkInfo.downlink = connection.downlink
      this.networkInfo.rtt = connection.rtt
      this.networkInfo.saveData = connection.saveData

      connection.addEventListener('change', () => {
        this.networkInfo.effectiveType = connection.effectiveType
        this.networkInfo.downlink = connection.downlink
        this.networkInfo.rtt = connection.rtt
        this.networkInfo.saveData = connection.saveData
        this.adaptToNetworkConditions()
      })
    }

    // Online/offline status
    window.addEventListener('online', () => {
      this.networkInfo.online = true
      this.resumeSync()
    })

    window.addEventListener('offline', () => {
      this.networkInfo.online = false
    })
  }

  // Detect data saver preferences
  private initDataSaverDetection() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      this.optimizationSettings.enableDataSaver = connection.saveData
    }
  }

  // Adapt behavior based on network conditions
  private adaptToNetworkConditions() {
    const { effectiveType, saveData } = this.networkInfo
    
    if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
      this.optimizationSettings.enableDataSaver = true
      this.optimizationSettings.enableImageCompression = true
      this.optimizationSettings.maxImageSize = 512 * 1024 // 512KB
      this.optimizationSettings.syncBatchSize = 5
    } else if (effectiveType === '3g') {
      this.optimizationSettings.enableDataSaver = false
      this.optimizationSettings.syncBatchSize = 10
    } else {
      this.optimizationSettings.enableDataSaver = false
      this.optimizationSettings.syncBatchSize = 20
    }
  }

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
        this.createStores(db)
      }
    })

    return this.initPromise
  }

  private createStores(db: IDBDatabase) {
    // Versioned recipes store
    if (!db.objectStoreNames.contains(STORES.RECIPES)) {
      const store = db.createObjectStore(STORES.RECIPES, { keyPath: 'id' })
      store.createIndex('version', 'version', { unique: false })
      store.createIndex('lastModified', 'lastModified', { unique: false })
      store.createIndex('syncStatus', 'syncStatus', { unique: false })
      store.createIndex('clientId', 'clientId', { unique: false })
      store.createIndex('category', 'data.category', { unique: false })
      store.createIndex('isFavorite', 'data.isFavorite', { unique: false })
    }

    // Versioned ingredients store
    if (!db.objectStoreNames.contains(STORES.INGREDIENTS)) {
      const store = db.createObjectStore(STORES.INGREDIENTS, { keyPath: 'id' })
      store.createIndex('version', 'version', { unique: false })
      store.createIndex('lastModified', 'lastModified', { unique: false })
      store.createIndex('syncStatus', 'syncStatus', { unique: false })
      store.createIndex('name', 'data.name', { unique: false })
      store.createIndex('category', 'data.category', { unique: false })
    }

    // Versioned nutrition logs store
    if (!db.objectStoreNames.contains(STORES.NUTRITION_LOGS)) {
      const store = db.createObjectStore(STORES.NUTRITION_LOGS, { keyPath: 'id' })
      store.createIndex('version', 'version', { unique: false })
      store.createIndex('lastModified', 'lastModified', { unique: false })
      store.createIndex('syncStatus', 'syncStatus', { unique: false })
      store.createIndex('date', 'data.date', { unique: false })
      store.createIndex('userId', 'data.userId', { unique: false })
    }

    // Enhanced sync queue
    if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
      const store = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true })
      store.createIndex('type', 'type', { unique: false })
      store.createIndex('priority', 'priority', { unique: false })
      store.createIndex('timestamp', 'timestamp', { unique: false })
      store.createIndex('retries', 'retries', { unique: false })
      store.createIndex('batchId', 'batchId', { unique: false })
    }

    // Conflicts store
    if (!db.objectStoreNames.contains(STORES.CONFLICTS)) {
      const store = db.createObjectStore(STORES.CONFLICTS, { keyPath: 'id', autoIncrement: true })
      store.createIndex('itemId', 'localVersion.id', { unique: false })
      store.createIndex('timestamp', 'timestamp', { unique: false })
      store.createIndex('type', 'localVersion.data.type', { unique: false })
    }

    // Metadata store
    if (!db.objectStoreNames.contains(STORES.METADATA)) {
      const store = db.createObjectStore(STORES.METADATA, { keyPath: 'key' })
    }

    // Progressive cache store
    if (!db.objectStoreNames.contains(STORES.PROGRESSIVE_CACHE)) {
      const store = db.createObjectStore(STORES.PROGRESSIVE_CACHE, { keyPath: 'id' })
      store.createIndex('priority', 'priority', { unique: false })
      store.createIndex('lastAccessed', 'lastAccessed', { unique: false })
      store.createIndex('size', 'size', { unique: false })
      store.createIndex('type', 'type', { unique: false })
    }
  }

  // Save versioned data with conflict detection
  async saveVersionedData<T>(
    storeName: string,
    data: T,
    id: string,
    type: string = 'unknown'
  ): Promise<VersionedData<T>> {
    const db = await this.init()
    const transaction = db.transaction([storeName, STORES.SYNC_QUEUE], 'readwrite')
    const store = transaction.objectStore(storeName)
    const syncStore = transaction.objectStore(STORES.SYNC_QUEUE)

    // Get existing version
    const existing = await this.get<VersionedData<T>>(store, id)
    const version = existing ? existing.version + 1 : 1

    const versionedData: VersionedData<T> = {
      id,
      data,
      version,
      lastModified: Date.now(),
      clientId: CLIENT_ID,
      hash: calculateHash(data),
      syncStatus: 'pending'
    }

    // Save versioned data
    await this.put(store, versionedData)

    // Add to sync queue
    const syncItem: SyncQueueItem & { priority: number; batchId?: string } = {
      type: type as any,
      action: existing ? 'update' : 'create',
      data: versionedData,
      timestamp: Date.now(),
      retries: 0,
      priority: this.calculateSyncPriority(type, data),
      batchId: this.generateBatchId()
    }

    await this.put(syncStore, syncItem)

    return versionedData
  }

  // Calculate sync priority based on data type and content
  private calculateSyncPriority(type: string, data: any): number {
    switch (type) {
      case 'nutrition_log':
        return 1 // Highest priority
      case 'recipe':
        return data.isFavorite ? 2 : 3
      case 'ingredient':
        return 4
      default:
        return 5
    }
  }

  // Generate batch ID for sync operations
  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
  }

  // Progressive data loading based on network conditions
  async loadDataProgressively<T>(
    storeName: string,
    options: {
      limit?: number
      offset?: number
      index?: string
      direction?: IDBCursorDirection
      priority?: 'high' | 'medium' | 'low'
    } = {}
  ): Promise<VersionedData<T>[]> {
    const db = await this.init()
    const { effectiveType, saveData } = this.networkInfo
    
    // Adapt loading based on network conditions
    let limit = options.limit || 20
    if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
      limit = Math.min(limit, 5)
    } else if (effectiveType === '3g') {
      limit = Math.min(limit, 10)
    }

    const transaction = db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    const results: VersionedData<T>[] = []

    const source = options.index ? store.index(options.index) : store
    const request = source.openCursor(null, options.direction || 'next')

    return new Promise((resolve, reject) => {
      let count = 0
      let skipped = 0

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result

        if (!cursor || count >= limit) {
          resolve(results)
          return
        }

        // Skip items based on offset
        if (skipped < (options.offset || 0)) {
          skipped++
          cursor.continue()
          return
        }

        // Add to cache for future access
        this.cacheProgressively(cursor.value)

        results.push(cursor.value)
        count++
        cursor.continue()
      }

      request.onerror = () => reject(request.error)
    })
  }

  // Cache data progressively based on usage patterns
  private async cacheProgressively(data: any) {
    if (!this.optimizationSettings.enableAdaptiveLoading) return

    const db = await this.init()
    const transaction = db.transaction([STORES.PROGRESSIVE_CACHE], 'readwrite')
    const store = transaction.objectStore(STORES.PROGRESSIVE_CACHE)

    const cacheItem = {
      id: data.id,
      data: data,
      priority: this.calculateCachePriority(data),
      lastAccessed: Date.now(),
      size: JSON.stringify(data).length,
      type: data.data?.type || 'unknown'
    }

    await this.put(store, cacheItem)
    await this.cleanupCache()
  }

  // Calculate cache priority based on access patterns
  private calculateCachePriority(data: any): number {
    const now = Date.now()
    const age = now - (data.lastModified || now)
    const dayInMs = 24 * 60 * 60 * 1000

    // Higher priority for recent items
    if (age < dayInMs) return 10
    if (age < 7 * dayInMs) return 7
    if (age < 30 * dayInMs) return 5
    return 1
  }

  // Cleanup cache based on size and usage
  private async cleanupCache() {
    const db = await this.init()
    const transaction = db.transaction([STORES.PROGRESSIVE_CACHE], 'readwrite')
    const store = transaction.objectStore(STORES.PROGRESSIVE_CACHE)

    // Get cache size
    const all = await this.getAll(store)
    const totalSize = all.reduce((sum, item) => sum + (item.size || 0), 0)
    const maxCacheSize = this.optimizationSettings.enableDataSaver ? 5 * 1024 * 1024 : 20 * 1024 * 1024 // 5MB or 20MB

    if (totalSize > maxCacheSize) {
      // Sort by priority and last accessed
      const sorted = all.sort((a, b) => {
        const priorityDiff = (b.priority || 0) - (a.priority || 0)
        if (priorityDiff !== 0) return priorityDiff
        return (b.lastAccessed || 0) - (a.lastAccessed || 0)
      })

      // Remove least important items
      let removedSize = 0
      const targetRemoval = totalSize - maxCacheSize
      
      for (let i = sorted.length - 1; i >= 0 && removedSize < targetRemoval; i--) {
        await this.delete(store, sorted[i].id)
        removedSize += sorted[i].size || 0
      }
    }
  }

  // Conflict resolution system
  async handleConflict<T>(
    localData: VersionedData<T>,
    remoteData: VersionedData<T>
  ): Promise<ConflictResolution<T>> {
    const conflict: ConflictResolution<T> = {
      localVersion: localData,
      remoteVersion: remoteData,
      resolution: 'manual',
      timestamp: Date.now()
    }

    // Automatic resolution strategies
    if (localData.hash === remoteData.hash) {
      // Same content, no conflict
      conflict.resolution = 'remote'
      conflict.mergedData = remoteData.data
    } else if (localData.lastModified > remoteData.lastModified) {
      // Local is newer
      conflict.resolution = 'local'
      conflict.mergedData = localData.data
    } else if (remoteData.lastModified > localData.lastModified) {
      // Remote is newer
      conflict.resolution = 'remote'
      conflict.mergedData = remoteData.data
    } else {
      // Same timestamp, attempt merge
      const merged = await this.attemptMerge(localData.data, remoteData.data)
      if (merged) {
        conflict.resolution = 'merge'
        conflict.mergedData = merged
      }
    }

    // Save conflict for manual resolution if needed
    if (conflict.resolution === 'manual') {
      const db = await this.init()
      const transaction = db.transaction([STORES.CONFLICTS], 'readwrite')
      const store = transaction.objectStore(STORES.CONFLICTS)
      await this.put(store, conflict)
    }

    return conflict
  }

  // Attempt automatic merge for compatible data types
  private async attemptMerge<T>(localData: T, remoteData: T): Promise<T | null> {
    // Recipe merge logic
    if (this.isRecipe(localData) && this.isRecipe(remoteData)) {
      const local = localData as any
      const remote = remoteData as any

      return {
        ...remote,
        isFavorite: local.isFavorite || remote.isFavorite,
        tags: [...new Set([...local.tags, ...remote.tags])],
        // Keep local user preferences
        userNotes: local.userNotes || remote.userNotes
      } as T
    }

    // Nutrition log merge logic
    if (this.isNutritionLog(localData) && this.isNutritionLog(remoteData)) {
      const local = localData as any
      const remote = remoteData as any

      // Merge meals by combining arrays
      const mergedMeals: any = {}
      const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks']
      
      for (const mealType of mealTypes) {
        const localMeals = local.meals[mealType] || []
        const remoteMeals = remote.meals[mealType] || []
        mergedMeals[mealType] = [...localMeals, ...remoteMeals]
      }

      return {
        ...remote,
        meals: mergedMeals,
        // Recalculate nutrition totals
        totalNutrition: this.calculateTotalNutrition(mergedMeals)
      } as T
    }

    return null
  }

  // Type guards
  private isRecipe(data: any): boolean {
    return data && typeof data.title === 'string' && Array.isArray(data.ingredients)
  }

  private isNutritionLog(data: any): boolean {
    return data && data.meals && typeof data.date === 'string'
  }

  // Calculate total nutrition from meals
  private calculateTotalNutrition(meals: any): NutritionFacts {
    const total: NutritionFacts = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      potassium: 0
    }

    Object.values(meals).flat().forEach((recipe: any) => {
      if (recipe && recipe.nutritionFacts) {
        total.calories += recipe.nutritionFacts.calories || 0
        total.protein += recipe.nutritionFacts.protein || 0
        total.carbs += recipe.nutritionFacts.carbs || 0
        total.fat += recipe.nutritionFacts.fat || 0
        total.fiber += recipe.nutritionFacts.fiber || 0
        total.sugar += recipe.nutritionFacts.sugar || 0
        total.sodium += recipe.nutritionFacts.sodium || 0
        total.potassium += recipe.nutritionFacts.potassium || 0
      }
    })

    return total
  }

  // Batch sync operations
  async performBatchSync(): Promise<{ success: number; failed: number; conflicts: number }> {
    if (!this.networkInfo.online) {
      return { success: 0, failed: 0, conflicts: 0 }
    }

    const db = await this.init()
    const transaction = db.transaction([STORES.SYNC_QUEUE], 'readonly')
    const store = transaction.objectStore(STORES.SYNC_QUEUE)

    // Get items to sync, grouped by batch and priority
    const pendingItems = await this.getAll(store)
    const priorityGroups = this.groupByPriority(pendingItems)

    let success = 0
    let failed = 0
    let conflicts = 0

    // Process by priority
    for (const group of priorityGroups) {
      const batchResult = await this.syncBatch(group)
      success += batchResult.success
      failed += batchResult.failed
      conflicts += batchResult.conflicts

      // Respect network conditions and rate limiting
      if (this.optimizationSettings.enableDataSaver) {
        await this.delay(1000) // 1 second delay for data saver mode
      }
    }

    return { success, failed, conflicts }
  }

  // Group sync items by priority
  private groupByPriority(items: any[]): any[][] {
    const groups: { [key: number]: any[] } = {}
    
    items.forEach(item => {
      const priority = item.priority || 5
      if (!groups[priority]) groups[priority] = []
      groups[priority].push(item)
    })

    // Return sorted by priority (lowest number = highest priority)
    return Object.keys(groups)
      .map(Number)
      .sort((a, b) => a - b)
      .map(priority => groups[priority])
  }

  // Sync a batch of items
  private async syncBatch(items: any[]): Promise<{ success: number; failed: number; conflicts: number }> {
    const batchSize = Math.min(items.length, this.optimizationSettings.syncBatchSize)
    const batch = items.slice(0, batchSize)

    let success = 0
    let failed = 0
    let conflicts = 0

    for (const item of batch) {
      try {
        const result = await this.syncItem(item)
        if (result === 'success') success++
        else if (result === 'conflict') conflicts++
        else failed++
      } catch (error) {
        failed++
        console.error('Sync failed for item:', item, error)
      }
    }

    return { success, failed, conflicts }
  }

  // Sync individual item
  private async syncItem(item: any): Promise<'success' | 'failed' | 'conflict'> {
    // Implementation would depend on your backend API
    // This is a placeholder for the actual sync logic
    
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      })

      if (response.status === 409) {
        // Conflict detected
        const remoteData = await response.json()
        await this.handleConflict(item.data, remoteData)
        return 'conflict'
      } else if (response.ok) {
        // Success - remove from sync queue
        await this.removeSyncItem(item.id)
        return 'success'
      } else {
        // Update retry count
        await this.updateSyncItemRetries(item.id)
        return 'failed'
      }
    } catch (error) {
      await this.updateSyncItemRetries(item.id)
      return 'failed'
    }
  }

  // Resume sync when coming back online
  private async resumeSync() {
    if (this.optimizationSettings.enableBatchSync) {
      // Wait a bit for network to stabilize
      await this.delay(2000)
      await this.performBatchSync()
    }
  }

  // Utility methods
  private async get<T>(store: IDBObjectStore, key: string): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  private async put(store: IDBObjectStore, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = store.put(data)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  private async delete(store: IDBObjectStore, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = store.delete(key)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  private async getAll(store: IDBObjectStore): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  private async removeSyncItem(id: string): Promise<void> {
    const db = await this.init()
    const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite')
    const store = transaction.objectStore(STORES.SYNC_QUEUE)
    await this.delete(store, id)
  }

  private async updateSyncItemRetries(id: string): Promise<void> {
    const db = await this.init()
    const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite')
    const store = transaction.objectStore(STORES.SYNC_QUEUE)
    const item = await this.get(store, id)
    
    if (item) {
      item.retries = (item.retries || 0) + 1
      item.lastAttempt = Date.now()
      
      // Remove if too many retries
      if (item.retries > 5) {
        await this.delete(store, id)
      } else {
        await this.put(store, item)
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Public API methods
  async saveRecipe(recipe: Recipe): Promise<VersionedData<Recipe>> {
    return this.saveVersionedData(STORES.RECIPES, recipe, recipe.id, 'recipe')
  }

  async saveIngredient(ingredient: Ingredient): Promise<VersionedData<Ingredient>> {
    return this.saveVersionedData(STORES.INGREDIENTS, ingredient, ingredient.id, 'ingredient')
  }

  async saveNutritionLog(log: UserNutritionLog): Promise<VersionedData<UserNutritionLog>> {
    return this.saveVersionedData(STORES.NUTRITION_LOGS, log, log.id, 'nutrition_log')
  }

  async getRecipes(options: any = {}): Promise<VersionedData<Recipe>[]> {
    return this.loadDataProgressively<Recipe>(STORES.RECIPES, options)
  }

  async getIngredients(options: any = {}): Promise<VersionedData<Ingredient>[]> {
    return this.loadDataProgressively<Ingredient>(STORES.INGREDIENTS, options)
  }

  async getNutritionLogs(options: any = {}): Promise<VersionedData<UserNutritionLog>[]> {
    return this.loadDataProgressively<UserNutritionLog>(STORES.NUTRITION_LOGS, options)
  }

  // Get network and optimization info
  getNetworkInfo(): NetworkInfo {
    return { ...this.networkInfo }
  }

  getOptimizationSettings(): MobileOptimizationSettings {
    return { ...this.optimizationSettings }
  }

  updateOptimizationSettings(settings: Partial<MobileOptimizationSettings>): void {
    this.optimizationSettings = { ...this.optimizationSettings, ...settings }
  }
}

// Export singleton instance
const enhancedOfflineStorage = new EnhancedOfflineStorage()
export default enhancedOfflineStorage

export {
  EnhancedOfflineStorage,
  type VersionedData,
  type ConflictResolution,
  type NetworkInfo,
  type MobileOptimizationSettings
}