import './globals.css'
import { Inter } from 'next/font/google'
import CookieConsent from '@/components/CookieConsent'
import { WebVitals } from '@/components/analytics/WebVitals'
import { PerformanceMonitor } from '@/components/performance/PerformanceMonitor'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'
import { ABTestProvider } from '@/components/ab-testing/ABTestProvider'
import HeatmapTracker from '@/components/analytics/HeatmapTracker'
import ExitIntentPopup from '@/components/growth/ExitIntentPopup'
import PushNotificationManager from '@/components/growth/PushNotificationManager'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
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
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://nutricoach-production.up.railway.app" />
      </head>
      <body className={`${inter.className} ${inter.variable} h-full antialiased`}>
        <GoogleAnalytics />
        <ABTestProvider>
          <div id="root" className="min-h-full">
            {children}
          </div>
          <CookieConsent />
          <WebVitals />
          <PerformanceMonitor />
          <HeatmapTracker />
          <ExitIntentPopup />
          <PushNotificationManager />
        </ABTestProvider>
      </body>
    </html>
  )
}