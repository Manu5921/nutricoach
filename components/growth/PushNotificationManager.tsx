'use client'

import { useState, useEffect } from 'react'
import { trackBusinessEvents } from '@/components/analytics/GoogleAnalytics'

interface PushNotificationManagerProps {
  enabled?: boolean
  apiKey?: string // Web Push API key
}

interface NotificationTrigger {
  id: string
  name: string
  condition: (userData: any) => boolean
  delay: number // Days after condition is met
  message: {
    title: string
    body: string
    icon: string
    badge: string
    tag: string
    data: any
  }
  frequency: 'once' | 'weekly' | 'monthly'
}

export default function PushNotificationManager({ 
  enabled = true,
  apiKey = process.env.NEXT_PUBLIC_VAPID_KEY 
}: PushNotificationManagerProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [showPermissionRequest, setShowPermissionRequest] = useState(false)

  // Smart notification triggers based on user behavior
  const notificationTriggers: NotificationTrigger[] = [
    {
      id: 'welcome_day1',
      name: 'Welcome Day 1',
      condition: (userData) => userData.daysSinceSignup === 1,
      delay: 0,
      message: {
        title: '🎉 Bienvenue dans NutriCoach !',
        body: 'Créez votre premier menu personnalisé en 2 minutes',
        icon: '/icons/notification-icon.png',
        badge: '/icons/badge.png',
        tag: 'welcome',
        data: { action: 'create_menu', url: '/menu/generate' }
      },
      frequency: 'once'
    },
    {
      id: 'activation_reminder',
      name: 'Activation Reminder',
      condition: (userData) => userData.daysSinceSignup >= 3 && !userData.hasGeneratedMenu,
      delay: 0,
      message: {
        title: '🍽️ Votre menu personnalisé vous attend',
        body: 'Ne manquez plus jamais d\'idées repas ! Générez votre menu maintenant',
        icon: '/icons/notification-icon.png',
        badge: '/icons/badge.png',
        tag: 'activation',
        data: { action: 'create_menu', url: '/menu/generate' }
      },
      frequency: 'once'
    },
    {
      id: 'trial_ending',
      name: 'Trial Ending',
      condition: (userData) => userData.trialDaysLeft <= 3 && userData.trialDaysLeft > 0,
      delay: 0,
      message: {
        title: '⏰ Votre essai se termine bientôt',
        body: `Plus que ${3} jours pour profiter de NutriCoach gratuitement`,
        icon: '/icons/notification-icon.png',
        badge: '/icons/badge.png',
        tag: 'trial_ending',
        data: { action: 'upgrade', url: '/pricing' }
      },
      frequency: 'once'
    },
    {
      id: 'reengagement',
      name: 'Re-engagement',
      condition: (userData) => userData.daysSinceLastLogin >= 7,
      delay: 0,
      message: {
        title: '🌟 Nous avons ajouté de nouvelles recettes !',
        body: 'Découvrez des plats anti-inflammatoires qui vont vous surprendre',
        icon: '/icons/notification-icon.png',
        badge: '/icons/badge.png',
        tag: 'reengagement',
        data: { action: 'explore', url: '/dashboard' }
      },
      frequency: 'weekly'
    },
    {
      id: 'feature_announcement',
      name: 'Feature Announcement',
      condition: (userData) => userData.isPaidUser && userData.daysSinceLastFeatureUse >= 14,
      delay: 0,
      message: {
        title: '✨ Nouvelle fonctionnalité disponible !',
        body: 'Essayez notre nouvelle analyse nutritionnelle avancée',
        icon: '/icons/notification-icon.png',
        badge: '/icons/badge.png',
        tag: 'feature',
        data: { action: 'new_feature', url: '/dashboard?highlight=nutrition-analysis' }
      },
      frequency: 'monthly'
    },
    {
      id: 'meal_reminder',
      name: 'Meal Planning Reminder',
      condition: (userData) => userData.isPaidUser && userData.weeklyMenus === 0,
      delay: 0,
      message: {
        title: '📅 Il est temps de planifier vos repas !',
        body: 'Organisez votre semaine avec des menus équilibrés',
        icon: '/icons/notification-icon.png',
        badge: '/icons/badge.png',
        tag: 'meal_planning',
        data: { action: 'plan_week', url: '/menu/weekly' }
      },
      frequency: 'weekly'
    }
  ]

  useEffect(() => {
    if (!enabled || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return
    }

    // Check current permission status
    setPermission(Notification.permission)

    // Register service worker
    registerServiceWorker()

    // Check for existing subscription
    checkExistingSubscription()

    // Check if we should show permission request
    shouldShowPermissionRequest()

  }, [enabled])

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered:', registration)
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const existingSubscription = await registration.pushManager.getSubscription()
      
      if (existingSubscription) {
        setSubscription(existingSubscription)
        // Verify subscription is still valid on server
        await verifySubscription(existingSubscription)
      }
    } catch (error) {
      console.error('Failed to check existing subscription:', error)
    }
  }

  const shouldShowPermissionRequest = () => {
    // Show permission request after user has been on site for 30 seconds
    // and hasn't denied permissions before
    const hasAskedBefore = localStorage.getItem('push-permission-asked')
    const lastAsked = localStorage.getItem('push-permission-last-asked')
    
    if (!hasAskedBefore || (lastAsked && Date.now() - parseInt(lastAsked) > 7 * 24 * 60 * 60 * 1000)) {
      setTimeout(() => {
        if (permission === 'default') {
          setShowPermissionRequest(true)
        }
      }, 30000) // 30 seconds
    }
  }

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      setShowPermissionRequest(false)
      
      // Track permission response
      trackBusinessEvents.featureUsed('push_permission_requested', undefined, {
        permission_result: result
      })
      
      // Store that we asked
      localStorage.setItem('push-permission-asked', 'true')
      localStorage.setItem('push-permission-last-asked', Date.now().toString())
      
      if (result === 'granted') {
        await subscribeUser()
      }
    } catch (error) {
      console.error('Permission request failed:', error)
    }
  }

  const subscribeUser = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(apiKey!)
      })
      
      setSubscription(subscription)
      
      // Send subscription to server
      await sendSubscriptionToServer(subscription)
      
      // Track successful subscription
      trackBusinessEvents.featureUsed('push_notifications_enabled')
      
    } catch (error) {
      console.error('Failed to subscribe user:', error)
    }
  }

  const sendSubscriptionToServer = async (subscription: PushSubscription) => {
    try {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Failed to send subscription to server:', error)
    }
  }

  const verifySubscription = async (subscription: PushSubscription) => {
    try {
      const response = await fetch('/api/push/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription })
      })
      
      if (!response.ok) {
        // Subscription is invalid, need to resubscribe
        await subscribeUser()
      }
    } catch (error) {
      console.error('Failed to verify subscription:', error)
    }
  }

  const unsubscribe = async () => {
    try {
      if (subscription) {
        await subscription.unsubscribe()
        setSubscription(null)
        
        // Notify server
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ subscription })
        })
        
        trackBusinessEvents.featureUsed('push_notifications_disabled')
      }
    } catch (error) {
      console.error('Failed to unsubscribe:', error)
    }
  }

  const dismissPermissionRequest = () => {
    setShowPermissionRequest(false)
    
    // Track dismissal
    trackBusinessEvents.featureUsed('push_permission_dismissed')
    
    // Don't ask again for a week
    localStorage.setItem('push-permission-asked', 'true')
    localStorage.setItem('push-permission-last-asked', Date.now().toString())
  }

  // Permission request UI
  if (showPermissionRequest && permission === 'default') {
    return (
      <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🔔</div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              Restez informé de vos progrès
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Recevez des rappels personnalisés pour vos menus et conseils nutrition
            </p>
            <div className="flex gap-2">
              <button
                onClick={requestPermission}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                Activer
              </button>
              <button
                onClick={dismissPermissionRequest}
                className="px-3 py-1.5 text-gray-500 text-sm hover:text-gray-700 transition-colors"
              >
                Plus tard
              </button>
            </div>
          </div>
          <button
            onClick={dismissPermissionRequest}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      </div>
    )
  }

  // Settings UI for managing notifications (could be in user settings)
  if (permission === 'granted' && subscription) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-green-600">🔔</span>
            <span className="text-sm text-green-800">Notifications activées</span>
          </div>
          <button
            onClick={unsubscribe}
            className="text-xs text-green-600 hover:text-green-800 underline"
          >
            Désactiver
          </button>
        </div>
      </div>
    )
  }

  return null
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}