import './globals.css'
import { Inter } from 'next/font/google'
import CookieConsent from '@/components/CookieConsent'
import { WebVitals } from '@/components/analytics/WebVitals'
import { PerformanceMonitor } from '@/components/performance/PerformanceMonitor'
import CoreWebVitalsOptimizer from '@/components/performance/CoreWebVitalsOptimizer'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'
import { ABTestProvider } from '@/components/ab-testing/ABTestProvider'
import HeatmapTracker from '@/components/analytics/HeatmapTracker'
import ExitIntentPopup from '@/components/growth/ExitIntentPopup'
import PushNotificationManager from '@/components/growth/PushNotificationManager'

// Optimized font loading with performance improvements
const inter = Inter({ 
  subsets: ['latin', 'latin-ext'],
  display: 'swap', // Critical for avoiding layout shifts
  preload: true,
  variable: '--font-inter',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  adjustFontFallback: true, // Reduces layout shift
})

export const metadata = {
  title: 'NutriCoach - Nutrition Anti-Inflammatoire Personnalisée par IA',
  description: 'Transformez votre alimentation avec des recettes personnalisées, des conseils nutritionnels adaptatifs et un suivi complet de votre bien-être. L\'intelligence artificielle au service de votre santé.',
  keywords: 'nutrition, anti-inflammatoire, IA, recettes personnalisées, santé, bien-être',
  authors: [{ name: 'NutriCoach' }],
  robots: 'index, follow',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://nutricoach-production.up.railway.app'),
  openGraph: {
    title: 'NutriCoach - Nutrition Anti-Inflammatoire Personnalisée par IA',
    description: 'Transformez votre alimentation avec l\'intelligence artificielle',
    type: 'website',
    locale: 'fr_FR',
    siteName: 'NutriCoach',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'NutriCoach - Nutrition personnalisée par IA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NutriCoach - Nutrition Anti-Inflammatoire par IA',
    description: 'Transformez votre alimentation avec l\'intelligence artificielle',
    images: ['/og-image.jpg'],
  },
}

export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#16a34a',
  }
}

// Force dynamic rendering for Railway deployment
export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="h-full">
      <head>
        {/* Favicon and Icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NutriCoach" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#16a34a" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Critical Resource Hints for Performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS Prefetch for External Resources */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://nutricoach-production.up.railway.app" />
        
        {/* Preload Critical Resources */}
        <link rel="preload" href="/images/heroes/hero-nutrition.jpg" as="image" type="image/jpeg" />
        <link rel="preload" href="/logo.svg" as="image" type="image/svg+xml" />
        
        {/* Resource Hints for Navigation */}
        <link rel="prefetch" href="/pricing" />
        <link rel="prefetch" href="/menu/generate" />
        
        {/* Security Headers */}
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        
        {/* Performance Hints */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
        
        {/* Font Optimization */}
        <link 
          rel="preload" 
          href="https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous" 
        />
        
        {/* Critical CSS Inline for Above-the-Fold Content */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical CSS for immediate rendering */
            *{box-sizing:border-box;margin:0;padding:0}
            html{line-height:1.5;-webkit-text-size-adjust:100%;tab-size:4}
            body{font-family:'Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:inherit}
            .hero-loading{background:linear-gradient(135deg,#10b981 0%,#3b82f6 100%);min-height:60vh;display:flex;align-items:center;justify-content:center}
            .btn-primary{background:linear-gradient(135deg,#10b981 0%,#3b82f6 100%);color:white;padding:12px 24px;border-radius:8px;font-weight:600;text-decoration:none;display:inline-block;transition:transform 0.2s}
          `
        }} />
        
        {/* Service Worker Registration */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw-advanced.js')
                  .then(function(registration) {
                    console.log('SW registered: ', registration);
                  })
                  .catch(function(registrationError) {
                    console.log('SW registration failed: ', registrationError);
                  });
              });
            }
          `
        }} />
      </head>
      <body className={`${inter.className} ${inter.variable} h-full antialiased`}>
        {/* Performance and Analytics */}
        <GoogleAnalytics />
        
        {/* App Content */}
        <ABTestProvider>
          <div id="root" className="min-h-full">
            {children}
          </div>
          
          {/* Non-critical components loaded after main content */}
          <CookieConsent />
          <WebVitals />
          <PerformanceMonitor />
          <CoreWebVitalsOptimizer />
          <HeatmapTracker />
          <ExitIntentPopup />
          <PushNotificationManager />
        </ABTestProvider>
        
        {/* Schema.org LocalBusiness structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              '@id': 'https://nutricoach-production.up.railway.app/#business',
              name: 'NutriCoach',
              description: 'Plateforme de nutrition anti-inflammatoire personnalisée par intelligence artificielle',
              url: 'https://nutricoach-production.up.railway.app',
              telephone: '+33-1-23-45-67-89',
              email: 'contact@nutricoach.fr',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Paris',
                addressCountry: 'FR'
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: 48.8566,
                longitude: 2.3522
              },
              openingHours: 'Mo-Su 00:00-23:59',
              priceRange: '€€',
              acceptsReservations: false,
              servesCuisine: 'Healthy',
              areaServed: {
                '@type': 'Country',
                name: 'France'
              },
              hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'Services de nutrition',
                itemListElement: [{
                  '@type': 'Offer',
                  name: 'Abonnement NutriCoach Premium',
                  price: '6.99',
                  priceCurrency: 'EUR'
                }]
              }
            })
          }}
        />
      </body>
    </html>
  )
}