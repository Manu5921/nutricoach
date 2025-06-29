'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface PWAInstallPromptProps {
  onInstall?: () => void
  onDismiss?: () => void
  showDelay?: number
  className?: string
}

export default function PWAInstallPrompt({
  onInstall,
  onDismiss,
  showDelay = 30000, // 30 seconds
  className = ''
}: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if running on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Check if already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
    const isInWebAppMode = (window.navigator as any).standalone === true
    setIsInstalled(isInStandaloneMode || isInWebAppMode)

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
      
      // Show prompt after delay if not dismissed before
      const hasPromptedBefore = localStorage.getItem('pwa-prompt-dismissed')
      if (!hasPromptedBefore) {
        setTimeout(() => {
          setShowPrompt(true)
        }, showDelay)
      }
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
      onInstall?.()
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [showDelay, onInstall])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
        setShowPrompt(false)
        onInstall?.()
      } else {
        console.log('User dismissed the install prompt')
        handleDismiss()
      }
      
      setDeferredPrompt(null)
    } catch (error) {
      console.error('Error showing install prompt:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-dismissed', 'true')
    localStorage.setItem('pwa-prompt-dismissed-time', Date.now().toString())
    onDismiss?.()
  }

  const getInstallInstructions = () => {
    if (isIOS) {
      return {
        title: 'Installer NutriCoach',
        steps: [
          'Appuyez sur le bouton de partage',
          'Faites défiler et appuyez sur "Sur l\'écran d\'accueil"',
          'Appuyez sur "Ajouter" pour installer l\'application'
        ],
        icon: '📱'
      }
    }
    
    return {
      title: 'Installer NutriCoach',
      steps: [
        'Appuyez sur "Installer" ci-dessous',
        'Confirmez l\'installation dans la popup',
        'L\'application sera ajoutée à votre écran d\'accueil'
      ],
      icon: '📲'
    }
  }

  // Don't show if already installed
  if (isInstalled) {
    return null
  }

  // Don't show if not installable and not iOS
  if (!isInstallable && !isIOS) {
    return null
  }

  // Don't show if dismissed
  if (!showPrompt && !isIOS) {
    return null
  }

  const instructions = getInstallInstructions()

  return (
    <div className={`fixed bottom-4 left-4 right-4 z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm mx-auto">
        <div className="flex items-start gap-3">
          <div className="text-3xl">{instructions.icon}</div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              {instructions.title}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Accédez rapidement à vos recettes et menus personnalisés
            </p>
            
            {isIOS ? (
              <div className="space-y-2 mb-4">
                <p className="text-xs font-medium text-gray-700">Instructions :</p>
                {instructions.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="flex-shrink-0 w-4 h-4 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-4">
                <div className="flex items-center space-x-2 text-xs text-gray-600 mb-2">
                  <span>✨</span>
                  <span>Notifications push pour vos rappels</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-600 mb-2">
                  <span>📱</span>
                  <span>Accès hors ligne à vos recettes</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <span>⚡</span>
                  <span>Lancement ultra-rapide</span>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              {!isIOS && deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Installer
                </button>
              )}
              
              <button
                onClick={handleDismiss}
                className={`px-3 py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors ${
                  isIOS || !deferredPrompt ? 'flex-1' : ''
                }`}
              >
                {isIOS ? 'Compris' : 'Plus tard'}
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook for managing PWA install state
export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Check if already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
    const isInWebAppMode = (window.navigator as any).standalone === true
    setIsInstalled(isInStandaloneMode || isInWebAppMode)

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      setIsInstallable(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = async () => {
    if (!deferredPrompt) return false

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      return outcome === 'accepted'
    } catch (error) {
      console.error('Error prompting install:', error)
      return false
    }
  }

  return {
    isInstallable,
    isInstalled,
    promptInstall,
    canInstall: !!deferredPrompt
  }
}