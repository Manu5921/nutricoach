'use client'

import { useState, useEffect } from 'react'
import { trackBusinessEvents } from '@/components/analytics/GoogleAnalytics'
import { ABTestCTA } from '@/components/ab-testing/ABTestButton'

interface ExitIntentPopupProps {
  enabled?: boolean
  delay?: number // Minimum time on page before showing (seconds)
  cooldown?: number // Hours before showing again to same user
}

export default function ExitIntentPopup({ 
  enabled = true, 
  delay = 30,
  cooldown = 24 
}: ExitIntentPopupProps) {
  const [showPopup, setShowPopup] = useState(false)
  const [isEligible, setIsEligible] = useState(false)
  const [timeOnPage, setTimeOnPage] = useState(0)

  useEffect(() => {
    if (!enabled) return

    // Check if user is eligible (hasn't seen popup recently)
    const lastShown = localStorage.getItem('exit-intent-last-shown')
    const now = new Date().getTime()
    
    if (lastShown) {
      const timeSince = now - parseInt(lastShown)
      const cooldownMs = cooldown * 60 * 60 * 1000
      if (timeSince < cooldownMs) {
        return // Still in cooldown
      }
    }

    // Track time on page
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      setTimeOnPage(elapsed)
      
      if (elapsed >= delay) {
        setIsEligible(true)
      }
    }, 1000)

    // Exit intent detection
    const handleMouseLeave = (e: MouseEvent) => {
      if (!isEligible || showPopup) return
      
      // Check if mouse is leaving through the top of the window
      if (e.clientY <= 0) {
        showExitIntent()
      }
    }

    // Mobile scroll detection (alternative to mouse leave)
    let lastScrollTop = 0
    const handleScroll = () => {
      if (!isEligible || showPopup) return
      
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop
      
      // Rapid upward scroll might indicate exit intent on mobile
      if (currentScrollTop < lastScrollTop - 100 && currentScrollTop < 100) {
        showExitIntent()
      }
      
      lastScrollTop = currentScrollTop
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      clearInterval(interval)
      document.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [enabled, delay, cooldown, isEligible, showPopup])

  const showExitIntent = () => {
    setShowPopup(true)
    
    // Track exit intent event
    trackBusinessEvents.featureUsed('exit_intent_popup', undefined, {
      time_on_page: timeOnPage,
      page_url: window.location.href
    })
    
    // Record when shown
    localStorage.setItem('exit-intent-last-shown', Date.now().toString())
  }

  const closePopup = () => {
    setShowPopup(false)
    
    // Track dismissal
    trackBusinessEvents.featureUsed('exit_intent_dismissed', undefined, {
      time_viewed: timeOnPage
    })
  }

  const handleCTAClick = () => {
    // Track conversion
    trackBusinessEvents.ctaClicked('exit_intent_popup', 'Récupérer mon offre')
    
    // Close popup and redirect
    setShowPopup(false)
    window.location.href = '/pricing?utm_source=exit_intent&utm_medium=popup&utm_campaign=retention'
  }

  if (!showPopup) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={closePopup}
      />
      
      {/* Popup */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-bounce-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-pink-500 p-6 text-white text-center">
            <div className="text-4xl mb-2">⏰</div>
            <h2 className="text-2xl font-bold mb-1">Attendez !</h2>
            <p className="text-red-100">Ne partez pas sans votre offre exclusive</p>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                🎁 Offre Spéciale Dernière Minute
              </h3>
              <p className="text-gray-600 mb-4">
                Obtenez <strong className="text-green-600">30% de réduction</strong> sur votre premier mois 
                et accédez immédiatement à toutes nos fonctionnalités premium.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-yellow-800">
                  <span className="text-xl">⚡</span>
                  <span className="font-semibold">Offre limitée - Expire dans 5 minutes</span>
                </div>
              </div>
              
              <div className="space-y-3 text-left mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-green-500 text-xl">✅</span>
                  <span className="text-gray-700">Menus personnalisés illimités</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-500 text-xl">✅</span>
                  <span className="text-gray-700">Conseils nutrition par IA</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-500 text-xl">✅</span>
                  <span className="text-gray-700">Suivi de progression avancé</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-500 text-xl">✅</span>
                  <span className="text-gray-700">Support prioritaire</span>
                </div>
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleCTAClick}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 px-6 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                🚀 Récupérer mon offre -30%
              </button>
              
              <button
                onClick={closePopup}
                className="w-full text-gray-500 text-sm hover:text-gray-700 transition-colors"
              >
                Non merci, je préfère continuer à naviguer
              </button>
            </div>
            
            {/* Trust signals */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <span>🔒</span>
                  <span>Paiement sécurisé</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>↩️</span>
                  <span>Remboursé 30j</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>⭐</span>
                  <span>4.8/5 (2.3k avis)</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Close button */}
          <button
            onClick={closePopup}
            className="absolute top-4 right-4 text-white hover:text-red-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes bounce-in {
          0% {
            transform: translate(-50%, -50%) scale(0.3);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.05);
          }
          70% {
            transform: translate(-50%, -50%) scale(0.9);
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out;
        }
      `}</style>
    </>
  )
}