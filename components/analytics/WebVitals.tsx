'use client'

import { useReportWebVitals } from 'next/web-vitals'

function hasAnalyticsConsent() {
  try {
    const settings = localStorage.getItem('nutricoach-cookie-settings')
    if (settings) {
      const parsedSettings = JSON.parse(settings)
      return parsedSettings.analytics === true
    }
    return false
  } catch {
    return false
  }
}

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Web Vitals] ${metric.name}:`, metric)
    }

    // Only send analytics if user has given consent
    if (!hasAnalyticsConsent()) {
      console.log('[Web Vitals] Analytics consent not granted, skipping collection')
      return
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Google Analytics 4
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', metric.name, {
          custom_map: { metric_name: metric.name },
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          event_category: 'Web Vitals',
          event_label: metric.id,
          non_interaction: true,
        })
      }

      // Example: Send to custom analytics endpoint
      fetch('/api/web-vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          id: metric.id,
          url: window.location.href,
          timestamp: Date.now(),
        }),
      }).catch((error) => {
        console.error('Failed to send web vitals:', error)
      })
    }
  })

  return null
}

// TypeScript declaration for gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: {
        custom_map?: Record<string, string>
        value?: number
        event_category?: string
        event_label?: string
        non_interaction?: boolean
      }
    ) => void
  }
}