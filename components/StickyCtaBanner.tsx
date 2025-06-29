'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface StickyCtaBannerProps {
  isLoggedIn?: boolean
}

export default function StickyCtaBanner({ isLoggedIn = false }: StickyCtaBannerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Hide banner on certain pages
  const hiddenPaths = ['/pricing', '/checkout', '/dashboard', '/signup', '/login', '/profile']
  const shouldHide = hiddenPaths.some(path => pathname.includes(path)) || isLoggedIn

  useEffect(() => {
    // Check if user has dismissed the banner in this session
    const dismissed = sessionStorage.getItem('ctaBannerDismissed')
    if (dismissed) {
      setIsDismissed(true)
      return
    }

    if (shouldHide) return

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      
      // Show banner after scrolling 3 seconds worth of content or 1000px
      if (scrollTop > 1000 && !hasScrolled) {
        setHasScrolled(true)
        // Delay appearance by 3 seconds after scroll threshold
        setTimeout(() => {
          if (!isDismissed) {
            setIsVisible(true)
          }
        }, 3000)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [shouldHide, hasScrolled, isDismissed])

  const handleGetStarted = () => {
    if (isLoggedIn) {
      router.push('/dashboard')
    } else {
      router.push('/signup')
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    sessionStorage.setItem('ctaBannerDismissed', 'true')
  }

  if (shouldHide || isDismissed || !isVisible) return null

  return (
    <>
      {/* Backdrop for mobile */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-20 z-40 transition-opacity duration-300 md:hidden ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleDismiss}
      />
      
      {/* Banner */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 transform transition-all duration-500 ease-out ${
          isVisible 
            ? 'translate-y-0 opacity-100' 
            : 'translate-y-full opacity-0'
        }`}
      >
        <div className="bg-gradient-to-r from-green-600 via-green-500 to-blue-600 shadow-2xl">
          {/* Desktop Version */}
          <div className="hidden md:block">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white bg-opacity-20 rounded-full p-2">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <div className="text-white">
                    <div className="font-bold text-lg">
                      Transformez votre santé dès maintenant
                    </div>
                    <div className="text-green-100 text-sm">
                      Plus de 10 000 personnes nous font déjà confiance
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-white text-right hidden lg:block">
                    <div className="text-sm text-green-100">Seulement</div>
                    <div className="font-bold text-xl">6,99€/mois</div>
                  </div>
                  
                  <button
                    onClick={handleGetStarted}
                    className="bg-white text-green-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Commencer maintenant
                  </button>
                  
                  <button
                    onClick={handleDismiss}
                    className="text-white hover:text-gray-200 p-2 transition-colors duration-200"
                    aria-label="Fermer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Version */}
          <div className="block md:hidden">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">🚀</span>
                  <div className="text-white">
                    <div className="font-bold">Transformez votre santé</div>
                    <div className="text-green-100 text-sm">6,99€/mois seulement</div>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-white hover:text-gray-200 p-1"
                  aria-label="Fermer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <button
                onClick={handleGetStarted}
                className="w-full bg-white text-green-600 hover:bg-gray-100 py-3 rounded-lg font-bold text-lg transition-all duration-200 transform active:scale-95 shadow-lg"
              >
                Commencer maintenant
              </button>
              
              <div className="text-center mt-2">
                <div className="text-green-100 text-xs">
                  ✅ Sans engagement • ✅ Paiement sécurisé • ✅ Résultats garantis
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar animation */}
          <div className="h-1 bg-white bg-opacity-20">
            <div 
              className={`h-full bg-white transition-all duration-1000 ease-out ${
                isVisible ? 'w-full' : 'w-0'
              }`}
              style={{ transitionDelay: '500ms' }}
            />
          </div>
        </div>
      </div>

      {/* Add some bottom padding to body when banner is visible */}
      <style jsx global>{`
        ${isVisible ? `
          body {
            padding-bottom: 120px;
          }
          @media (min-width: 768px) {
            body {
              padding-bottom: 80px;
            }
          }
        ` : ''}
      `}</style>
    </>
  )
}