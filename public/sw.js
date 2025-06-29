// Service Worker for Push Notifications
const CACHE_NAME = 'nutricoach-v1'
const urlsToCache = [
  '/',
  '/dashboard',
  '/pricing',
  '/menu/generate'
]

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache)
      })
  )
})

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      }
    )
  )
})

// Push event
self.addEventListener('push', (event) => {
  if (!event.data) {
    return
  }

  const data = event.data.json()
  
  const options = {
    body: data.body,
    icon: data.icon || '/icons/notification-icon.png',
    badge: data.badge || '/icons/badge.png',
    tag: data.tag || 'nutricoach-notification',
    data: data.data || {},
    actions: [
      {
        action: 'open',
        title: 'Ouvrir',
        icon: '/icons/open-icon.png'
      },
      {
        action: 'close',
        title: 'Fermer',
        icon: '/icons/close-icon.png'
      }
    ],
    requireInteraction: false,
    vibrate: [200, 100, 200],
    silent: false
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'close') {
    return
  }

  // Handle notification click
  const urlToOpen = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      
      // If no existing window/tab, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )

  // Track notification interaction
  if (event.notification.data?.action) {
    fetch('/api/analytics/notification-interaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: event.action || 'click',
        notificationTag: event.notification.tag,
        timestamp: new Date().toISOString()
      })
    }).catch(() => {
      // Silent fail - don't block the user experience
    })
  }
})

// Background sync for offline analytics
self.addEventListener('sync', (event) => {
  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalyticsData())
  }
})

// Sync analytics data when back online
async function syncAnalyticsData() {
  try {
    // Get stored analytics data from IndexedDB
    const offlineData = await getOfflineAnalyticsData()
    
    if (offlineData.length > 0) {
      // Send to analytics endpoint
      await fetch('/api/analytics/offline-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(offlineData)
      })
      
      // Clear offline data after successful sync
      await clearOfflineAnalyticsData()
    }
  } catch (error) {
    console.error('Analytics sync failed:', error)
  }
}

// IndexedDB helpers for offline analytics
function getOfflineAnalyticsData() {
  return new Promise((resolve) => {
    // Simplified implementation - in real app would use proper IndexedDB
    const data = JSON.parse(localStorage.getItem('offline-analytics') || '[]')
    resolve(data)
  })
}

function clearOfflineAnalyticsData() {
  return new Promise((resolve) => {
    localStorage.removeItem('offline-analytics')
    resolve()
  })
}