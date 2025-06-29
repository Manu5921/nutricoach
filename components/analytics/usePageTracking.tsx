'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackBusinessEvents } from './GoogleAnalytics'

// Custom hook for automatic page tracking with business context
export function usePageTracking() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Track page view with additional business context
    const url = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    
    // Get business context from URL and localStorage
    const businessContext = getBusinessContext(pathname, searchParams)
    
    // Track the page view
    trackBusinessEvents.pageView(url, document.title, businessContext)

    // Track specific business events based on page
    trackPageSpecificEvents(pathname, searchParams)
    
  }, [pathname, searchParams])
}

// Extract business context from current page
function getBusinessContext(pathname: string, searchParams: URLSearchParams) {
  const context: Record<string, any> = {}

  // Add traffic source information
  const utm_source = searchParams.get('utm_source')
  const utm_medium = searchParams.get('utm_medium') 
  const utm_campaign = searchParams.get('utm_campaign')
  const utm_content = searchParams.get('utm_content')
  const ref = searchParams.get('ref')

  if (utm_source) context.utm_source = utm_source
  if (utm_medium) context.utm_medium = utm_medium
  if (utm_campaign) context.utm_campaign = utm_campaign
  if (utm_content) context.utm_content = utm_content
  if (ref) context.referrer = ref

  // Add user context if available
  try {
    const userSession = localStorage.getItem('nutricoach-user-session')
    if (userSession) {
      const userData = JSON.parse(userSession)
      if (userData.userId) context.user_id = userData.userId
      if (userData.subscriptionStatus) context.subscription_status = userData.subscriptionStatus
      if (userData.subscriptionType) context.subscription_type = userData.subscriptionType
    }
  } catch (error) {
    // Silent fail for localStorage issues
  }

  // Add page-specific context
  switch (pathname) {
    case '/':
      context.page_type = 'homepage'
      context.conversion_funnel_step = 'awareness'
      break
    case '/pricing':
      context.page_type = 'pricing'
      context.conversion_funnel_step = 'consideration'
      break
    case '/signup':
      context.page_type = 'registration'
      context.conversion_funnel_step = 'conversion'
      break
    case '/login':
      context.page_type = 'authentication'
      context.conversion_funnel_step = 'retention'
      break
    case '/dashboard':
      context.page_type = 'app_main'
      context.conversion_funnel_step = 'activation'
      break
    case '/menu/generate':
      context.page_type = 'core_feature'
      context.conversion_funnel_step = 'engagement'
      break
    case '/profile':
      context.page_type = 'account_management'
      context.conversion_funnel_step = 'retention'
      break
    default:
      context.page_type = 'other'
  }

  return context
}

// Track specific events based on the current page
function trackPageSpecificEvents(pathname: string, searchParams: URLSearchParams) {
  switch (pathname) {
    case '/pricing':
      // Track pricing page view for conversion funnel
      const source = searchParams.get('utm_source') || searchParams.get('ref') || 'direct'
      trackBusinessEvents.pricingPageViewed(source)
      break

    case '/signup':
      // Track sign up page entry
      trackBusinessEvents.signUpStarted()
      break

    case '/menu/generate':
      // Track menu generation page entry
      trackBusinessEvents.menuGenerationStarted()
      break

    case '/dashboard':
      // Track dashboard access for user retention
      try {
        const userSession = localStorage.getItem('nutricoach-user-session')
        if (userSession) {
          const userData = JSON.parse(userSession)
          if (userData.registrationDate) {
            const daysSinceSignup = Math.floor(
              (Date.now() - new Date(userData.registrationDate).getTime()) / (1000 * 60 * 60 * 24)
            )
            trackBusinessEvents.userRetention(daysSinceSignup, userData.userId, userData.userSegment)
          }
        }
      } catch (error) {
        // Silent fail
      }
      break
  }
}

// Hook for tracking form interactions
export function useFormTracking(formName: string) {
  const trackFormStart = () => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'form_start', {
        event_category: 'engagement',
        form_name: formName,
        event_label: 'form_interaction'
      })
    }
  }

  const trackFormSubmit = (success: boolean = true) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', success ? 'form_submit' : 'form_error', {
        event_category: 'engagement',
        form_name: formName,
        event_label: success ? 'form_success' : 'form_failure'
      })
    }
  }

  const trackFormFieldError = (fieldName: string, errorType: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'form_field_error', {
        event_category: 'engagement',
        form_name: formName,
        field_name: fieldName,
        error_type: errorType,
        event_label: 'form_validation'
      })
    }
  }

  return {
    trackFormStart,
    trackFormSubmit,
    trackFormFieldError
  }
}

// Hook for tracking scroll depth and time on page
export function useEngagementTracking() {
  useEffect(() => {
    let startTime = Date.now()
    let maxScrollDepth = 0
    let clickCount = 0
    let isActive = true

    // Track scroll depth
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = Math.round((scrollTop / docHeight) * 100)
      
      if (scrollPercent > maxScrollDepth) {
        maxScrollDepth = scrollPercent
      }
    }

    // Track clicks
    const handleClick = () => {
      clickCount++
    }

    // Track when user becomes inactive
    const handleVisibilityChange = () => {
      isActive = !document.hidden
    }

    // Send engagement data before page unload
    const handleBeforeUnload = () => {
      if (isActive) {
        const timeOnPage = Date.now() - startTime
        trackBusinessEvents.sessionEngagement(timeOnPage, maxScrollDepth, clickCount)
      }
    }

    // Add event listeners
    window.addEventListener('scroll', handleScroll, { passive: true })
    document.addEventListener('click', handleClick)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Send engagement data every 30 seconds for active users
    const engagementInterval = setInterval(() => {
      if (isActive) {
        const timeOnPage = Date.now() - startTime
        trackBusinessEvents.sessionEngagement(timeOnPage, maxScrollDepth, clickCount)
      }
    }, 30000)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('click', handleClick)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      clearInterval(engagementInterval)

      // Send final engagement data
      if (isActive) {
        const timeOnPage = Date.now() - startTime
        trackBusinessEvents.sessionEngagement(timeOnPage, maxScrollDepth, clickCount)
      }
    }
  }, [])
}

// Hook for tracking CTA clicks with business context
export function useCTATracking() {
  const trackCTA = (ctaText: string, ctaLocation: string, additionalData?: Record<string, any>) => {
    // Track the CTA click
    trackBusinessEvents.ctaClicked(ctaLocation, ctaText)

    // Additional business logic
    try {
      const userSession = localStorage.getItem('nutricoach-user-session')
      if (userSession) {
        const userData = JSON.parse(userSession)
        trackBusinessEvents.ctaClicked(ctaLocation, ctaText, userData.userId)
      } else {
        trackBusinessEvents.ctaClicked(ctaLocation, ctaText)
      }
    } catch (error) {
      trackBusinessEvents.ctaClicked(ctaLocation, ctaText)
    }

    // Track specific CTA types
    if (ctaText.toLowerCase().includes('essai') || ctaText.toLowerCase().includes('trial')) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'trial_interest', {
          event_category: 'conversion',
          cta_location: ctaLocation,
          event_label: 'trial_cta_clicked'
        })
      }
    }

    if (ctaText.toLowerCase().includes('commencer') || ctaText.toLowerCase().includes('start')) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'getting_started', {
          event_category: 'conversion',
          cta_location: ctaLocation,
          event_label: 'start_cta_clicked'
        })
      }
    }
  }

  return { trackCTA }
}