// Enhanced Service Worker for NutriCoach PWA
// Intelligent caching strategies and offline-first architecture

const CACHE_VERSION = 'nutricoach-v2.1.0'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`
const RECIPES_CACHE = `${CACHE_VERSION}-recipes`
const NUTRITION_CACHE = `${CACHE_VERSION}-nutrition`
const IMAGES_CACHE = `${CACHE_VERSION}-images`
const API_CACHE = `${CACHE_VERSION}-api`

// Cache strategies configuration
const CACHE_STRATEGIES = {
  // Static assets - Cache First (long-term cache)
  static: {
    name: STATIC_CACHE,
    strategy: 'CacheFirst',
    maxEntries: 100,
    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
    patterns: [
      /\/_next\/static\//,
      /\.(?:js|css|woff|woff2|ttf|eot)$/,
      /\/icons\//,
      /\/images\/.*\.(png|jpg|jpeg|svg|webp|avif)$/
    ]
  },
  
  // API calls - Network First with fallback
  api: {
    name: API_CACHE,
    strategy: 'NetworkFirst',
    maxEntries: 50,
    maxAgeSeconds: 5 * 60, // 5 minutes
    patterns: [
      /\/api\/user\//,
      /\/api\/analytics\//,
      /\/api\/health/
    ]
  },
  
  // Nutrition data - Stale While Revalidate
  nutrition: {
    name: NUTRITION_CACHE,
    strategy: 'StaleWhileRevalidate',
    maxEntries: 200,
    maxAgeSeconds: 24 * 60 * 60, // 24 hours
    patterns: [
      /\/api\/nutrition\//,
      /\/api\/ingredients\//,
      /\/api\/usda\//
    ]
  },
  
  // Recipes - Cache First with network fallback
  recipes: {
    name: RECIPES_CACHE,
    strategy: 'CacheFirst',
    maxEntries: 500,
    maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
    patterns: [
      /\/api\/recipes\//,
      /\/api\/menu\//,
      /\/recipes\//,
      /\/menu\//
    ]
  },
  
  // Images - Cache First with optimization
  images: {
    name: IMAGES_CACHE,
    strategy: 'CacheFirst',
    maxEntries: 300,
    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
    patterns: [
      /\.(png|jpg|jpeg|gif|webp|avif|svg)$/i
    ]
  },
  
  // HTML pages - Network First
  pages: {
    name: DYNAMIC_CACHE,
    strategy: 'NetworkFirst',
    maxEntries: 30,
    maxAgeSeconds: 2 * 60 * 60, // 2 hours
    patterns: [
      /\/dashboard/,
      /\/profile/,
      /\/menu/,
      /\/recipes/,
      /\/pricing/
    ]
  }
}

// URLs to precache on install
const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/menu/generate',
  '/offline',
  '/manifest.json',
  '/_next/static/css/',
  '/_next/static/js/',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Background sync tags
const SYNC_TAGS = {
  ANALYTICS: 'analytics-sync',
  RECIPES: 'recipes-sync',
  NUTRITION_LOG: 'nutrition-log-sync', 
  USER_PREFERENCES: 'preferences-sync'
}

// IndexedDB configuration
const DB_NAME = 'NutriCoachDB'
const DB_VERSION = 2
const STORES = {
  RECIPES: 'recipes',
  NUTRITION: 'nutrition_data',
  USER_LOGS: 'user_logs',
  SYNC_QUEUE: 'sync_queue',
  OFFLINE_ACTIONS: 'offline_actions'
}

// Install event - Precache critical resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v' + CACHE_VERSION)
  
  event.waitUntil(
    Promise.all([
      // Cache critical resources
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(PRECACHE_URLS)
      }),
      
      // Initialize IndexedDB
      initializeIndexedDB(),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  )
})

// Activate event - Clean old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v' + CACHE_VERSION)
  
  event.waitUntil(
    Promise.all([
      // Clean old caches
      cleanOldCaches(),
      
      // Claim all clients
      self.clients.claim(),
      
      // Setup periodic background sync
      setupPeriodicSync()
    ])
  )
})

// Fetch event - Intelligent routing with caching strategies
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and chrome-extension requests
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return
  }
  
  event.respondWith(handleFetch(event.request))
})

// Message handling for client communication
self.addEventListener('message', (event) => {
  const { type, payload } = event.data
  
  switch (type) {
    case 'CACHE_RECIPE':
      cacheRecipe(payload)
      break
    case 'SYNC_NUTRITION_LOG':
      queueForSync(SYNC_TAGS.NUTRITION_LOG, payload)
      break
    case 'UPDATE_OFFLINE_STATUS':
      handleOfflineStatusUpdate(payload)
      break
    case 'GET_CACHE_SIZE':
      getCacheSize().then(size => {
        event.ports[0].postMessage({ type: 'CACHE_SIZE', size })
      })
      break
    case 'CLEAR_CACHE':
      clearSpecificCache(payload.cacheName)
      break
  }
})

// Push notification with rich content
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  const data = event.data.json()
  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'nutricoach-notification',
    data: data.data || {},
    actions: [
      {
        action: 'open',
        title: 'Ouvrir',
        icon: '/icons/action-open.png'
      },
      {
        action: 'dismiss',
        title: 'Ignorer',
        icon: '/icons/action-dismiss.png'
      }
    ],
    requireInteraction: data.requireInteraction || false,
    vibrate: [200, 100, 200],
    silent: false,
    image: data.image,
    timestamp: Date.now(),
    renotify: true
  }
  
  // Add rich content for recipe notifications
  if (data.type === 'recipe') {
    options.actions.unshift({
      action: 'save',
      title: 'Sauvegarder',
      icon: '/icons/action-save.png'
    })
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag)
  
  switch (event.tag) {
    case SYNC_TAGS.ANALYTICS:
      event.waitUntil(syncAnalyticsData())
      break
    case SYNC_TAGS.RECIPES:
      event.waitUntil(syncRecipeData())
      break
    case SYNC_TAGS.NUTRITION_LOG:
      event.waitUntil(syncNutritionLogs())
      break
    case SYNC_TAGS.USER_PREFERENCES:
      event.waitUntil(syncUserPreferences())
      break
  }
})

// Periodic background sync for data freshness
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag)
  
  if (event.tag === 'nutrition-data-refresh') {
    event.waitUntil(refreshNutritionData())
  }
})

// Notification click handling with deep linking
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const action = event.action
  const data = event.notification.data
  
  if (action === 'dismiss') {
    return
  }
  
  let urlToOpen = '/'
  
  if (action === 'save' && data.recipeId) {
    urlToOpen = `/recipes/${data.recipeId}?action=save`
  } else if (action === 'open' || !action) {
    urlToOpen = data.url || '/'
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Check for existing window
        const existingClient = clientList.find(client => 
          client.url.includes(urlToOpen.split('?')[0])
        )
        
        if (existingClient && 'focus' in existingClient) {
          return existingClient.focus()
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
      .then(() => {
        // Track interaction
        return trackNotificationInteraction(action, data)
      })
  )
})

// Core Functions

async function handleFetch(request) {
  const url = new URL(request.url)
  
  // Determine caching strategy based on URL pattern
  const strategy = getCacheStrategy(request)
  
  switch (strategy.strategy) {
    case 'CacheFirst':
      return cacheFirst(request, strategy)
    case 'NetworkFirst':
      return networkFirst(request, strategy)
    case 'StaleWhileRevalidate':
      return staleWhileRevalidate(request, strategy)
    default:
      return fetch(request)
  }
}

function getCacheStrategy(request) {
  const url = request.url
  
  for (const [key, config] of Object.entries(CACHE_STRATEGIES)) {
    if (config.patterns.some(pattern => pattern.test(url))) {
      return config
    }
  }
  
  // Default strategy for unmatched requests
  return CACHE_STRATEGIES.pages
}

async function cacheFirst(request, strategy) {
  try {
    const cache = await caches.open(strategy.name)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      // Return cached version and update in background
      fetch(request).then(response => {
        if (response.ok) {
          cache.put(request, response.clone())
        }
      }).catch(() => {}) // Silent fail for background update
      
      return cachedResponse
    }
    
    // Not in cache, fetch from network
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
    
  } catch (error) {
    console.error('[SW] Cache First failed:', error)
    return new Response('Offline - Content not available', { 
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

async function networkFirst(request, strategy) {
  try {
    const response = await fetch(request)
    
    if (response.ok) {
      const cache = await caches.open(strategy.name)
      cache.put(request, response.clone())
    }
    return response
    
  } catch (error) {
    // Network failed, try cache
    const cache = await caches.open(strategy.name)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page for HTML requests
    if (request.headers.get('Accept')?.includes('text/html')) {
      return caches.match('/offline')
    }
    
    return new Response('Offline', { status: 503 })
  }
}

async function staleWhileRevalidate(request, strategy) {
  const cache = await caches.open(strategy.name)
  const cachedResponse = await cache.match(request)
  
  // Always try to fetch fresh data
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  }).catch(() => {
    // Network error - return cached if available
    return cachedResponse
  })
  
  // Return cached immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise
}

async function initializeIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      
      // Create object stores
      Object.values(STORES).forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true })
          
          // Add indexes based on store type
          if (storeName === STORES.RECIPES) {
            store.createIndex('category', 'category', { unique: false })
            store.createIndex('timestamp', 'timestamp', { unique: false })
          } else if (storeName === STORES.NUTRITION) {
            store.createIndex('ingredient', 'ingredient', { unique: false })
            store.createIndex('timestamp', 'timestamp', { unique: false })
          }
        }
      })
    }
  })
}

async function cleanOldCaches() {
  const cacheNames = await caches.keys()
  const currentCaches = Object.values(CACHE_STRATEGIES).map(s => s.name)
  currentCaches.push(STATIC_CACHE, DYNAMIC_CACHE)
  
  return Promise.all(
    cacheNames
      .filter(cacheName => !currentCaches.includes(cacheName))
      .map(cacheName => {
        console.log('[SW] Deleting old cache:', cacheName)
        return caches.delete(cacheName)
      })
  )
}

async function setupPeriodicSync() {
  if ('periodicSync' in self.registration) {
    try {
      await self.registration.periodicSync.register('nutrition-data-refresh', {
        minInterval: 24 * 60 * 60 * 1000 // 24 hours
      })
      console.log('[SW] Periodic sync registered')
    } catch (error) {
      console.log('[SW] Periodic sync registration failed:', error)
    }
  }
}

async function cacheRecipe(recipe) {
  const db = await initializeIndexedDB()
  const transaction = db.transaction([STORES.RECIPES], 'readwrite')
  const store = transaction.objectStore(STORES.RECIPES)
  
  await store.put({
    ...recipe,
    timestamp: Date.now(),
    cached: true
  })
}

async function queueForSync(tag, data) {
  const db = await initializeIndexedDB()
  const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite')
  const store = transaction.objectStore(STORES.SYNC_QUEUE)
  
  await store.add({
    tag,
    data,
    timestamp: Date.now(),
    retries: 0
  })
  
  // Register background sync
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    await self.registration.sync.register(tag)
  }
}

async function syncAnalyticsData() {
  const db = await initializeIndexedDB()
  const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite')
  const store = transaction.objectStore(STORES.SYNC_QUEUE)
  
  const items = await getAllFromStore(store)
  const analyticsItems = items.filter(item => item.tag === SYNC_TAGS.ANALYTICS)
  
  for (const item of analyticsItems) {
    try {
      await fetch('/api/analytics/offline-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data)
      })
      
      // Remove from queue on success
      await store.delete(item.id)
    } catch (error) {
      // Increment retry count
      item.retries = (item.retries || 0) + 1
      if (item.retries < 3) {
        await store.put(item)
      } else {
        await store.delete(item.id) // Give up after 3 retries
      }
    }
  }
}

async function syncNutritionLogs() {
  // Similar implementation for nutrition logs sync
  console.log('[SW] Syncing nutrition logs')
}

async function syncRecipeData() {
  // Sync saved/favorited recipes
  console.log('[SW] Syncing recipe data')
}

async function syncUserPreferences() {
  // Sync user preferences and settings
  console.log('[SW] Syncing user preferences')
}

async function refreshNutritionData() {
  // Refresh cached nutrition database
  console.log('[SW] Refreshing nutrition data')
  
  try {
    const response = await fetch('/api/nutrition/refresh')
    if (response.ok) {
      const data = await response.json()
      
      // Update nutrition cache
      const cache = await caches.open(NUTRITION_CACHE)
      await cache.put('/api/nutrition/database', new Response(JSON.stringify(data)))
    }
  } catch (error) {
    console.error('[SW] Failed to refresh nutrition data:', error)
  }
}

async function trackNotificationInteraction(action, data) {
  try {
    await fetch('/api/analytics/notification-interaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        notificationData: data,
        timestamp: Date.now()
      })
    })
  } catch (error) {
    // Queue for sync when online
    await queueForSync(SYNC_TAGS.ANALYTICS, {
      type: 'notification_interaction',
      action,
      data,
      timestamp: Date.now()
    })
  }
}

async function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

async function getCacheSize() {
  const cacheNames = await caches.keys()
  let totalSize = 0
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName)
    const requests = await cache.keys()
    
    for (const request of requests) {
      const response = await cache.match(request)
      if (response) {
        const blob = await response.blob()
        totalSize += blob.size
      }
    }
  }
  
  return {
    bytes: totalSize,
    mb: Math.round(totalSize / (1024 * 1024) * 100) / 100,
    caches: cacheNames.length
  }
}

async function clearSpecificCache(cacheName) {
  if (cacheName && await caches.has(cacheName)) {
    await caches.delete(cacheName)
  }
}

console.log('[SW] Service Worker loaded successfully v' + CACHE_VERSION)