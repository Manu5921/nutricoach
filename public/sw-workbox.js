// Enhanced Service Worker with Workbox for NutriCoach PWA
// Advanced caching strategies and offline-first architecture

import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'
import { BackgroundSyncPlugin } from 'workbox-background-sync'
import { BroadcastUpdatePlugin } from 'workbox-broadcast-update'

const CACHE_VERSION = 'nutricoach-v3.0.0'
const MAX_ENTRIES = {
  STATIC: 100,
  DYNAMIC: 50,
  RECIPES: 500,
  NUTRITION: 200,
  IMAGES: 300,
  API: 50
}

// Precache and route static assets
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Background sync plugins for offline actions
const analyticsSync = new BackgroundSyncPlugin('analytics-sync', {
  maxRetentionTime: 24 * 60 // 24 hours
})

const nutritionSync = new BackgroundSyncPlugin('nutrition-sync', {
  maxRetentionTime: 7 * 24 * 60 // 7 days
})

const recipeSync = new BackgroundSyncPlugin('recipe-sync', {
  maxRetentionTime: 3 * 24 * 60 // 3 days
})

// Broadcast update plugin for content updates
const broadcastUpdate = new BroadcastUpdatePlugin({
  headersToCheck: ['content-length', 'etag', 'last-modified']
})

// Cache strategies for different content types

// 1. Static Assets - Cache First
registerRoute(
  ({ request }) => request.destination === 'style' ||
                   request.destination === 'script' ||
                   request.destination === 'worker',
  new CacheFirst({
    cacheName: `${CACHE_VERSION}-static`,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: MAX_ENTRIES.STATIC,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      })
    ]
  })
)

// 2. Images - Cache First with optimization
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: `${CACHE_VERSION}-images`,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: MAX_ENTRIES.IMAGES,
        maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
        purgeOnQuotaError: true
      })
    ]
  })
)

// 3. API Routes - Network First with background sync
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  async ({ event, url }) => {
    // Critical API routes - Network First
    if (url.pathname.includes('/auth/') || 
        url.pathname.includes('/user/') ||
        url.pathname.includes('/stripe/')) {
      return new NetworkFirst({
        cacheName: `${CACHE_VERSION}-api`,
        networkTimeoutSeconds: 3,
        plugins: [
          new CacheableResponsePlugin({
            statuses: [0, 200]
          }),
          new ExpirationPlugin({
            maxEntries: MAX_ENTRIES.API,
            maxAgeSeconds: 5 * 60 // 5 minutes
          })
        ]
      }).handle({ event })
    }
    
    // Nutrition data - Stale While Revalidate
    if (url.pathname.includes('/nutrition/') || 
        url.pathname.includes('/ingredients/')) {
      return new StaleWhileRevalidate({
        cacheName: `${CACHE_VERSION}-nutrition`,
        plugins: [
          new CacheableResponsePlugin({
            statuses: [0, 200]
          }),
          new ExpirationPlugin({
            maxEntries: MAX_ENTRIES.NUTRITION,
            maxAgeSeconds: 24 * 60 * 60 // 24 hours
          }),
          broadcastUpdate,
          // Background sync for POST/PUT requests
          event.request.method !== 'GET' ? nutritionSync : null
        ].filter(Boolean)
      }).handle({ event })
    }
    
    // Recipe data - Cache First with background sync
    if (url.pathname.includes('/recipes/') || 
        url.pathname.includes('/menu/')) {
      return new StaleWhileRevalidate({
        cacheName: `${CACHE_VERSION}-recipes`,
        plugins: [
          new CacheableResponsePlugin({
            statuses: [0, 200]
          }),
          new ExpirationPlugin({
            maxEntries: MAX_ENTRIES.RECIPES,
            maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
          }),
          broadcastUpdate,
          event.request.method !== 'GET' ? recipeSync : null
        ].filter(Boolean)
      }).handle({ event })
    }
    
    // Analytics - Background Sync only
    if (url.pathname.includes('/analytics/')) {
      if (event.request.method !== 'GET') {
        return new NetworkFirst({
          plugins: [analyticsSync]
        }).handle({ event })
      }
    }
    
    // Default: Network First
    return new NetworkFirst({
      cacheName: `${CACHE_VERSION}-dynamic`,
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200]
        }),
        new ExpirationPlugin({
          maxEntries: MAX_ENTRIES.DYNAMIC,
          maxAgeSeconds: 2 * 60 * 60 // 2 hours
        })
      ]
    }).handle({ event })
  }
)

// 4. HTML Pages - Network First with offline fallback
const navigationHandler = createHandlerBoundToURL('/offline')
const navigationRoute = new NavigationRoute(navigationHandler, {
  denylist: [
    new RegExp('/api/'),
    new RegExp('/auth/'),
    new RegExp('/_next/'),
    new RegExp('/admin/')
  ]
})
registerRoute(navigationRoute)

// 5. Google Fonts - Stale While Revalidate
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' ||
               url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: `${CACHE_VERSION}-fonts`,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
      })
    ]
  })
)

// Enhanced push notification handling with rich content
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  const data = event.data.json()
  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'nutricoach-notification',
    data: data.data || {},
    actions: [],
    requireInteraction: data.requireInteraction || false,
    vibrate: [200, 100, 200],
    silent: false,
    image: data.image,
    timestamp: Date.now(),
    renotify: true,
    dir: 'ltr',
    lang: 'fr'
  }
  
  // Rich content based on notification type
  switch (data.type) {
    case 'recipe':
      options.actions = [
        {
          action: 'view',
          title: 'Voir la recette',
          icon: '/icons/action-view.png'
        },
        {
          action: 'save',
          title: 'Sauvegarder',
          icon: '/icons/action-save.png'
        },
        {
          action: 'share',
          title: 'Partager',
          icon: '/icons/action-share.png'
        }
      ]
      break
      
    case 'nutrition':
      options.actions = [
        {
          action: 'log',
          title: 'Enregistrer',
          icon: '/icons/action-log.png'
        },
        {
          action: 'remind',
          title: 'Rappel dans 1h',
          icon: '/icons/action-remind.png'
        }
      ]
      break
      
    case 'meal':
      options.actions = [
        {
          action: 'plan',
          title: 'Planifier',
          icon: '/icons/action-plan.png'
        },
        {
          action: 'shop',
          title: 'Liste de courses',
          icon: '/icons/action-shop.png'
        }
      ]
      break
      
    default:
      options.actions = [
        {
          action: 'open',
          title: 'Ouvrir',
          icon: '/icons/action-open.png'
        }
      ]
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Enhanced notification click handling with deep linking
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const action = event.action
  const data = event.notification.data
  let urlToOpen = '/'
  
  // Handle different actions
  switch (action) {
    case 'view':
      urlToOpen = data.recipeId ? `/recipes/${data.recipeId}` : '/recipes'
      break
    case 'save':
      urlToOpen = data.recipeId ? `/recipes/${data.recipeId}?action=save` : '/recipes/favorites'
      break
    case 'share':
      // Handle sharing via Web Share API in the client
      urlToOpen = data.recipeId ? `/recipes/${data.recipeId}?action=share` : '/'
      break
    case 'log':
      urlToOpen = '/dashboard?action=log-nutrition'
      break
    case 'remind':
      // Schedule another notification
      scheduleNotificationReminder(data)
      return
    case 'plan':
      urlToOpen = '/menu/generate'
      break
    case 'shop':
      urlToOpen = '/shopping-list'
      break
    case 'open':
    default:
      urlToOpen = data.url || '/'
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(urlToOpen.split('?')[0]) && 'focus' in client) {
            return client.focus()
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
      .then(() => {
        // Track notification interaction
        return trackNotificationInteraction(action, data)
      })
  )
})

// Background sync event handling
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag)
  
  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalyticsData())
  } else if (event.tag === 'nutrition-sync') {
    event.waitUntil(syncNutritionData())
  } else if (event.tag === 'recipe-sync') {
    event.waitUntil(syncRecipeData())
  }
})

// Periodic background sync for data freshness
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag)
  
  if (event.tag === 'nutrition-data-refresh') {
    event.waitUntil(refreshNutritionDatabase())
  } else if (event.tag === 'recipe-recommendations') {
    event.waitUntil(updateRecipeRecommendations())
  }
})

// Message handling for client-service worker communication
self.addEventListener('message', (event) => {
  const { type, payload } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
    case 'CACHE_NUTRITION_DATA':
      cacheNutritionData(payload)
      break
    case 'CACHE_RECIPE':
      cacheRecipeData(payload)
      break
    case 'SYNC_USER_DATA':
      queueBackgroundSync('user-data-sync', payload)
      break
    case 'GET_CACHE_INFO':
      getCacheInfo().then(info => {
        event.ports[0].postMessage({ type: 'CACHE_INFO', info })
      })
      break
    case 'CLEAR_CACHE':
      clearCache(payload.cacheName)
      break
  }
})

// Helper functions

async function trackNotificationInteraction(action, data) {
  try {
    const response = await fetch('/api/analytics/notification-interaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        notificationData: data,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to track interaction')
    }
  } catch (error) {
    // Queue for background sync
    await queueBackgroundSync('analytics-sync', {
      type: 'notification_interaction',
      action,
      data,
      timestamp: Date.now()
    })
  }
}

async function scheduleNotificationReminder(data) {
  // Schedule a reminder notification in 1 hour
  setTimeout(() => {
    self.registration.showNotification('Rappel NutriCoach', {
      body: 'N\'oubliez pas d\'enregistrer votre repas !',
      icon: '/icons/icon-192x192.png',
      tag: 'nutrition-reminder',
      data: data,
      vibrate: [200, 100, 200]
    })
  }, 60 * 60 * 1000) // 1 hour
}

async function syncAnalyticsData() {
  // Implementation for syncing analytics data
  console.log('[SW] Syncing analytics data')
}

async function syncNutritionData() {
  // Implementation for syncing nutrition logs
  console.log('[SW] Syncing nutrition data')
}

async function syncRecipeData() {
  // Implementation for syncing recipe data
  console.log('[SW] Syncing recipe data')
}

async function refreshNutritionDatabase() {
  // Implementation for refreshing nutrition database
  console.log('[SW] Refreshing nutrition database')
}

async function updateRecipeRecommendations() {
  // Implementation for updating recipe recommendations
  console.log('[SW] Updating recipe recommendations')
}

async function cacheNutritionData(data) {
  const cache = await caches.open(`${CACHE_VERSION}-nutrition`)
  await cache.put('/api/nutrition/user-data', new Response(JSON.stringify(data)))
}

async function cacheRecipeData(data) {
  const cache = await caches.open(`${CACHE_VERSION}-recipes`)
  await cache.put(`/api/recipes/${data.id}`, new Response(JSON.stringify(data)))
}

async function queueBackgroundSync(tag, data) {
  // Queue data for background sync when network is available
  // This would integrate with IndexedDB for persistent storage
  console.log(`[SW] Queuing for background sync: ${tag}`, data)
}

async function getCacheInfo() {
  const cacheNames = await caches.keys()
  let totalSize = 0
  const cacheInfo = {}
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName)
    const requests = await cache.keys()
    let cacheSize = 0
    
    for (const request of requests) {
      const response = await cache.match(request)
      if (response) {
        const blob = await response.blob()
        cacheSize += blob.size
      }
    }
    
    cacheInfo[cacheName] = {
      entries: requests.length,
      size: cacheSize
    }
    totalSize += cacheSize
  }
  
  return {
    totalSize,
    totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
    caches: cacheInfo
  }
}

async function clearCache(cacheName) {
  if (cacheName && await caches.has(cacheName)) {
    await caches.delete(cacheName)
  }
}

console.log(`[SW] Enhanced Service Worker with Workbox loaded - Version: ${CACHE_VERSION}`)