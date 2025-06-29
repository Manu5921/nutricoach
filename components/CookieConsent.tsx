'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CookieSettings {
  essential: boolean
  analytics: boolean
  marketing: boolean
  preferences: boolean
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [cookieSettings, setCookieSettings] = useState<CookieSettings>({
    essential: true, // Always true, cannot be disabled
    analytics: false,
    marketing: false,
    preferences: false
  })

  useEffect(() => {
    // Check if user has already made a choice
    const consentGiven = localStorage.getItem('nutricoach-cookie-consent')
    if (!consentGiven) {
      // Show banner after a short delay to avoid flash
      const timer = setTimeout(() => {
        setShowBanner(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const acceptAll = async () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true
    }
    
    await saveCookieSettings(allAccepted)
    setShowBanner(false)
    
    // Initialize analytics if accepted
    if (allAccepted.analytics) {
      initializeAnalytics()
    }
  }

  const rejectAll = async () => {
    const onlyEssential = {
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false
    }
    
    await saveCookieSettings(onlyEssential)
    setShowBanner(false)
  }

  const saveCustomSettings = async () => {
    await saveCookieSettings(cookieSettings)
    setShowBanner(false)
    setShowSettings(false)
    
    // Initialize analytics if accepted
    if (cookieSettings.analytics) {
      initializeAnalytics()
    }
  }

  const saveCookieSettings = async (settings: CookieSettings) => {
    localStorage.setItem('nutricoach-cookie-settings', JSON.stringify(settings))
    localStorage.setItem('nutricoach-cookie-consent', 'true')
    localStorage.setItem('nutricoach-cookie-consent-date', new Date().toISOString())
    
    // Log consent changes to API
    try {
      await Promise.all([
        fetch('/api/user/consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            consentType: 'cookies_analytics',
            consentStatus: settings.analytics,
            consentMethod: 'cookie_banner'
          })
        }),
        fetch('/api/user/consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            consentType: 'cookies_marketing',
            consentStatus: settings.marketing,
            consentMethod: 'cookie_banner'
          })
        }),
        fetch('/api/user/consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            consentType: 'cookies_preferences',
            consentStatus: settings.preferences,
            consentMethod: 'cookie_banner'
          })
        })
      ])
    } catch (error) {
      console.log('Consent logging failed:', error)
      // Continue even if logging fails
    }
    
    // Clean up unwanted cookies if they were rejected
    if (!settings.analytics) {
      // Remove Google Analytics cookies
      document.cookie = '_ga=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = '_ga_*=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = '_gid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    }
    
    if (!settings.marketing) {
      // Remove marketing cookies
      document.cookie = '_fbp=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = '_gcl_au=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    }
  }

  const initializeAnalytics = () => {
    // Initialize Google Analytics if needed
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'granted'
      })
    }
  }

  const handleToggle = (category: keyof CookieSettings) => {
    if (category === 'essential') return // Cannot disable essential cookies
    
    setCookieSettings(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  if (!showBanner) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-30 z-40" />
      
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-2xl border-t-4 border-green-500">
        <div className="container mx-auto px-4 py-6">
          {!showSettings ? (
            /* Main Banner */
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-2xl">🍪</div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      Respect de votre vie privée
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Nous utilisons des cookies pour améliorer votre expérience, analyser l'utilisation du site 
                      et vous proposer des contenus personnalisés. Vos données de santé sont traitées selon les 
                      exigences les plus strictes du RGPD.
                    </p>
                  </div>
                </div>
                
                <div className="text-xs text-gray-600 flex flex-wrap gap-4">
                  <Link href="/privacy" className="text-blue-600 hover:underline">
                    Politique de confidentialité
                  </Link>
                  <Link href="/cookies" className="text-blue-600 hover:underline">
                    Politique cookies
                  </Link>
                  <Link href="/terms" className="text-blue-600 hover:underline">
                    CGU
                  </Link>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 min-w-fit">
                <button
                  onClick={() => setShowSettings(true)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Personnaliser
                </button>
                <button
                  onClick={rejectAll}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Refuser tout
                </button>
                <button
                  onClick={acceptAll}
                  className="px-6 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Accepter tout
                </button>
              </div>
            </div>
          ) : (
            /* Settings Panel */
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  🔧 Paramètres des cookies
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* Essential Cookies */}
                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-green-800">🔒 Cookies essentiels</h4>
                    <div className="flex items-center">
                      <span className="text-xs text-green-600 mr-2">Toujours actifs</span>
                      <div className="w-10 h-5 bg-green-500 rounded-full flex items-center justify-end px-1">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-green-700">
                    Nécessaires au fonctionnement de base (connexion, sécurité, panier).
                  </p>
                </div>

                {/* Analytics Cookies */}
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-blue-800">📊 Cookies analytiques</h4>
                    <button
                      onClick={() => handleToggle('analytics')}
                      className={`w-10 h-5 rounded-full flex items-center px-1 transition-colors ${
                        cookieSettings.analytics ? 'bg-blue-500 justify-end' : 'bg-gray-300 justify-start'
                      }`}
                    >
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </button>
                  </div>
                  <p className="text-xs text-blue-700">
                    Nous aident à comprendre l'utilisation du site pour l'améliorer.
                  </p>
                </div>

                {/* Marketing Cookies */}
                <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-purple-800">🎯 Cookies marketing</h4>
                    <button
                      onClick={() => handleToggle('marketing')}
                      className={`w-10 h-5 rounded-full flex items-center px-1 transition-colors ${
                        cookieSettings.marketing ? 'bg-purple-500 justify-end' : 'bg-gray-300 justify-start'
                      }`}
                    >
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </button>
                  </div>
                  <p className="text-xs text-purple-700">
                    Personnalisent les publicités et mesurent leur efficacité.
                  </p>
                </div>

                {/* Preferences Cookies */}
                <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-orange-800">⚙️ Cookies de préférences</h4>
                    <button
                      onClick={() => handleToggle('preferences')}
                      className={`w-10 h-5 rounded-full flex items-center px-1 transition-colors ${
                        cookieSettings.preferences ? 'bg-orange-500 justify-end' : 'bg-gray-300 justify-start'
                      }`}
                    >
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </button>
                  </div>
                  <p className="text-xs text-orange-700">
                    Mémorisent vos préférences (langue, thème, région).
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="text-yellow-800 text-xs">
                  <strong>ℹ️ Information RGPD :</strong> Vos données de santé sont traitées avec le niveau de sécurité 
                  le plus élevé. Le consentement peut être retiré à tout moment depuis vos paramètres de compte.
                </p>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-600">
                  <Link href="/cookies" className="text-blue-600 hover:underline">
                    En savoir plus sur nos cookies
                  </Link>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCookieSettings({ essential: true, analytics: false, marketing: false, preferences: false })
                    }}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Refuser tout
                  </button>
                  <button
                    onClick={saveCustomSettings}
                    className="px-6 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Enregistrer mes préférences
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Hook to check if analytics cookies are accepted
export const useAnalyticsConsent = () => {
  const [analyticsAccepted, setAnalyticsAccepted] = useState(false)

  useEffect(() => {
    const checkConsent = () => {
      const settings = localStorage.getItem('nutricoach-cookie-settings')
      if (settings) {
        const parsedSettings = JSON.parse(settings)
        setAnalyticsAccepted(parsedSettings.analytics || false)
      }
    }

    checkConsent()
    
    // Listen for changes in localStorage
    window.addEventListener('storage', checkConsent)
    return () => window.removeEventListener('storage', checkConsent)
  }, [])

  return analyticsAccepted
}

// Hook to check if marketing cookies are accepted
export const useMarketingConsent = () => {
  const [marketingAccepted, setMarketingAccepted] = useState(false)

  useEffect(() => {
    const checkConsent = () => {
      const settings = localStorage.getItem('nutricoach-cookie-settings')
      if (settings) {
        const parsedSettings = JSON.parse(settings)
        setMarketingAccepted(parsedSettings.marketing || false)
      }
    }

    checkConsent()
    
    // Listen for changes in localStorage
    window.addEventListener('storage', checkConsent)
    return () => window.removeEventListener('storage', checkConsent)
  }, [])

  return marketingAccepted
}