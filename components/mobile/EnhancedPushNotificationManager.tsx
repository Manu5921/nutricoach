'use client'

import { useState, useEffect, useCallback } from 'react'

interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  tag?: string
  data?: any
  actions?: NotificationAction[]
  requireInteraction?: boolean
  silent?: boolean
  vibrate?: number[]
  timestamp?: number
}

interface NotificationAction {
  action: string
  title: string
  icon?: string
}

interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

interface EnhancedPushNotificationManagerProps {
  apiEndpoint?: string
  vapidPublicKey?: string
  onSubscriptionChange?: (subscription: PushSubscription | null) => void
  onNotificationReceived?: (payload: NotificationPayload) => void
  onPermissionChange?: (permission: NotificationPermission) => void
  className?: string
}

export default function EnhancedPushNotificationManager({
  apiEndpoint = '/api/push',
  vapidPublicKey,
  onSubscriptionChange,
  onNotificationReceived,
  onPermissionChange,
  className = ''
}: EnhancedPushNotificationManagerProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check browser support and current permission
  useEffect(() => {
    const checkSupport = () => {
      const supported = 'serviceWorker' in navigator && 
                       'PushManager' in window && 
                       'Notification' in window
      setIsSupported(supported)
      
      if (supported) {
        setPermission(Notification.permission)
        onPermissionChange?.(Notification.permission)
      }
    }

    checkSupport()
  }, [onPermissionChange])

  // Get existing subscription
  useEffect(() => {
    const getExistingSubscription = async () => {
      if (!isSupported) return

      try {
        const registration = await navigator.serviceWorker.ready
        const existingSubscription = await registration.pushManager.getSubscription()
        
        if (existingSubscription) {
          const pushSubscription: PushSubscription = {
            endpoint: existingSubscription.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(existingSubscription.getKey('p256dh')!),
              auth: arrayBufferToBase64(existingSubscription.getKey('auth')!)
            }
          }
          
          setSubscription(pushSubscription)
          setIsSubscribed(true)
          onSubscriptionChange?.(pushSubscription)
        }
      } catch (err) {
        console.error('Failed to get existing subscription:', err)
      }
    }

    if (permission === 'granted') {
      getExistingSubscription()
    }
  }, [permission, isSupported, onSubscriptionChange])

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setError('Les notifications push ne sont pas supportées sur ce navigateur')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const newPermission = await Notification.requestPermission()
      setPermission(newPermission)
      onPermissionChange?.(newPermission)

      if (newPermission === 'granted') {
        return true
      } else {
        setError('Permission refusée pour les notifications')
        return false
      }
    } catch (err) {
      setError('Erreur lors de la demande de permission')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, onPermissionChange])

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (permission !== 'granted') {
      const hasPermission = await requestPermission()
      if (!hasPermission) return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const registration = await navigator.serviceWorker.ready
      
      // Convert VAPID key to Uint8Array
      const applicationServerKey = vapidPublicKey ? 
        urlBase64ToUint8Array(vapidPublicKey) : undefined

      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      })

      const subscription: PushSubscription = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(pushSubscription.getKey('auth')!)
        }
      }

      // Send subscription to server
      const response = await fetch(`${apiEndpoint}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save subscription on server')
      }

      setSubscription(subscription)
      setIsSubscribed(true)
      onSubscriptionChange?.(subscription)
      
      return true
    } catch (err) {
      console.error('Failed to subscribe:', err)
      setError('Erreur lors de l\'abonnement aux notifications')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [permission, requestPermission, vapidPublicKey, apiEndpoint, onSubscriptionChange])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!subscription) return

    setIsLoading(true)
    setError(null)

    try {
      const registration = await navigator.serviceWorker.ready
      const pushSubscription = await registration.pushManager.getSubscription()
      
      if (pushSubscription) {
        await pushSubscription.unsubscribe()
      }

      // Remove subscription from server
      await fetch(`${apiEndpoint}/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ subscription })
      })

      setSubscription(null)
      setIsSubscribed(false)
      onSubscriptionChange?.(null)
      
      return true
    } catch (err) {
      console.error('Failed to unsubscribe:', err)
      setError('Erreur lors de la désinscription')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [subscription, apiEndpoint, onSubscriptionChange])

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    if (!subscription) return

    try {
      const response = await fetch(`${apiEndpoint}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription,
          notification: {
            title: 'Test NutriCoach',
            body: 'Vos notifications fonctionnent parfaitement ! 🎉',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            tag: 'test-notification',
            data: {
              type: 'test',
              timestamp: Date.now(),
              url: '/'
            },
            actions: [
              {
                action: 'open',
                title: 'Ouvrir l\'app',
                icon: '/icons/action-open.png'
              }
            ],
            requireInteraction: false,
            vibrate: [200, 100, 200]
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send test notification')
      }
    } catch (err) {
      console.error('Failed to send test notification:', err)
      setError('Erreur lors de l\'envoi du test')
    }
  }, [subscription, apiEndpoint])

  // Schedule nutrition reminders
  const scheduleNutritionReminders = useCallback(async (times: string[]) => {
    if (!subscription) return

    try {
      const response = await fetch(`${apiEndpoint}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription,
          schedule: {
            type: 'nutrition-reminders',
            times,
            notifications: times.map(time => ({
              title: 'Rappel NutriCoach',
              body: 'Il est temps d\'enregistrer votre repas ! 🍽️',
              icon: '/icons/icon-192x192.png',
              tag: `nutrition-reminder-${time}`,
              data: {
                type: 'nutrition-reminder',
                scheduledTime: time,
                url: '/dashboard?action=log-nutrition'
              },
              actions: [
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
              ],
              vibrate: [200, 100, 200]
            }))
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to schedule reminders')
      }
    } catch (err) {
      console.error('Failed to schedule reminders:', err)
      setError('Erreur lors de la programmation des rappels')
    }
  }, [subscription, apiEndpoint])

  // Handle incoming push messages (if using custom handling)
  useEffect(() => {
    if (!isSupported) return

    const handlePushMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'push-notification') {
        onNotificationReceived?.(event.data.payload)
      }
    }

    navigator.serviceWorker.addEventListener('message', handlePushMessage)
    return () => {
      navigator.serviceWorker.removeEventListener('message', handlePushMessage)
    }
  }, [isSupported, onNotificationReceived])

  if (!isSupported) {
    return (
      <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="flex items-start space-x-3">
          <div className="text-yellow-600 text-lg">⚠️</div>
          <div>
            <h3 className="font-medium text-yellow-800">Notifications non supportées</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Votre navigateur ne supporte pas les notifications push.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Permission Status */}
      <div className={`p-4 rounded-lg border ${
        permission === 'granted' ? 'bg-green-50 border-green-200' :
        permission === 'denied' ? 'bg-red-50 border-red-200' :
        'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-lg">
              {permission === 'granted' ? '✅' :
               permission === 'denied' ? '❌' : '🔔'}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                Notifications push
              </h3>
              <p className="text-sm text-gray-600">
                {permission === 'granted' ? 'Autorisées' :
                 permission === 'denied' ? 'Refusées' :
                 'En attente d\'autorisation'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isSubscribed && (
              <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Abonné
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {permission !== 'granted' && (
          <button
            onClick={requestPermission}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Demande en cours...' : 'Autoriser les notifications'}
          </button>
        )}

        {permission === 'granted' && !isSubscribed && (
          <button
            onClick={subscribe}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Abonnement...' : 'S\'abonner aux notifications'}
          </button>
        )}

        {isSubscribed && (
          <div className="space-y-2">
            <button
              onClick={sendTestNotification}
              className="w-full py-2 px-4 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              📤 Envoyer un test
            </button>
            
            <button
              onClick={() => scheduleNutritionReminders(['08:00', '12:00', '19:00'])}
              className="w-full py-2 px-4 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            >
              ⏰ Programmer rappels nutrition
            </button>
            
            <button
              onClick={unsubscribe}
              disabled={isLoading}
              className="w-full py-2 px-4 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Désinscription...' : 'Se désabonner'}
            </button>
          </div>
        )}
      </div>

      {/* Subscription Info */}
      {subscription && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Informations d'abonnement</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Endpoint: {subscription.endpoint.slice(0, 50)}...</div>
            <div>Clé P256DH: {subscription.keys.p256dh.slice(0, 20)}...</div>
            <div>Clé Auth: {subscription.keys.auth.slice(0, 20)}...</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Utility functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const binary = String.fromCharCode.apply(null, Array.from(bytes))
  return btoa(binary)
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export { type NotificationPayload, type PushSubscription }