'use client'

import Script from 'next/script'
import { useEffect } from 'react'
import { useAnalyticsConsent } from '@/components/CookieConsent'

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'consent',
      targetId: string | 'update',
      config?: {
        // Config parameters
        page_title?: string
        page_location?: string
        send_page_view?: boolean
        custom_map?: Record<string, string>
        
        // Event parameters
        event_category?: string
        event_label?: string
        value?: number
        currency?: string
        transaction_id?: string
        user_id?: string
        
        // Consent parameters
        analytics_storage?: 'granted' | 'denied'
        ad_storage?: 'granted' | 'denied'
        functionality_storage?: 'granted' | 'denied'
        personalization_storage?: 'granted' | 'denied'
        security_storage?: 'granted' | 'denied'
        
        // Custom business parameters
        subscription_type?: string
        trial_status?: string
        user_segment?: string
        menu_generation_count?: number
        
        // Enhanced ecommerce
        purchase?: {
          transaction_id: string
          value: number
          currency: string
          items: Array<{
            item_id: string
            item_name: string
            category: string
            price: number
            quantity: number
          }>
        }
        
        // User properties
        user_properties?: {
          subscription_status?: string
          registration_date?: string
          last_menu_generated?: string
          preferred_diet_type?: string
        }
      }
    ) => void
    dataLayer: Array<any>
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX'

// Initialize Google Analytics with consent management
export function GoogleAnalytics() {
  const analyticsConsent = useAnalyticsConsent()

  useEffect(() => {
    // Initialize gtag with consent mode
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || []
      
      // Set default consent state
      window.gtag?.('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        functionality_storage: 'granted',
        personalization_storage: 'denied',
        security_storage: 'granted'
      })
    }
  }, [])

  useEffect(() => {
    // Update consent when user changes preferences
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: analyticsConsent ? 'granted' : 'denied',
        ad_storage: analyticsConsent ? 'granted' : 'denied',
        personalization_storage: analyticsConsent ? 'granted' : 'denied'
      })
    }
  }, [analyticsConsent])

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            
            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              page_title: document.title,
              page_location: window.location.href,
              send_page_view: false, // We'll handle page views manually
              custom_map: {
                'custom_subscription_type': 'subscription_type',
                'custom_trial_status': 'trial_status',
                'custom_user_segment': 'user_segment'
              }
            });
          `,
        }}
      />
    </>
  )
}

// Business Events Tracking Functions
export const trackBusinessEvents = {
  // Page views with business context
  pageView: (pagePath: string, pageTitle?: string, additionalData?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: pageTitle || document.title,
        page_location: window.location.href,
        page_path: pagePath,
        ...additionalData
      })
    }
  },

  // User registration funnel
  signUpStarted: (method: string = 'email') => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'sign_up_started', {
        event_category: 'engagement',
        method: method,
        event_label: 'registration_flow'
      })
    }
  },

  signUpCompleted: (userId: string, method: string = 'email') => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'sign_up', {
        event_category: 'engagement',
        method: method,
        user_id: userId,
        event_label: 'registration_completed'
      })
    }
  },

  // Trial to paid conversion
  trialStarted: (subscriptionType: string, userId?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'begin_checkout', {
        event_category: 'ecommerce',
        currency: 'EUR',
        value: 0,
        subscription_type: subscriptionType,
        trial_status: 'started',
        user_id: userId,
        event_label: 'trial_activation'
      })
    }
  },

  subscriptionPurchased: (transactionId: string, value: number, subscriptionType: string, userId?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: transactionId,
        value: value,
        currency: 'EUR',
        event_category: 'ecommerce',
        subscription_type: subscriptionType,
        user_id: userId,
        purchase: {
          transaction_id: transactionId,
          value: value,
          currency: 'EUR',
          items: [{
            item_id: `subscription_${subscriptionType}`,
            item_name: `NutriCoach ${subscriptionType}`,
            category: 'subscription',
            price: value,
            quantity: 1
          }]
        }
      })
    }
  },

  subscriptionCancelled: (subscriptionType: string, cancellationReason?: string, userId?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'subscription_cancelled', {
        event_category: 'ecommerce',
        subscription_type: subscriptionType,
        cancellation_reason: cancellationReason,
        user_id: userId,
        event_label: 'churn'
      })
    }
  },

  // Product engagement
  menuGenerationStarted: (userId?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'menu_generation_started', {
        event_category: 'engagement',
        user_id: userId,
        event_label: 'core_feature_usage'
      })
    }
  },

  menuGenerationCompleted: (userId?: string, mealCount?: number, dietType?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'menu_generated', {
        event_category: 'engagement',
        user_id: userId,
        value: mealCount || 1,
        event_label: 'core_feature_success',
        user_properties: {
          preferred_diet_type: dietType,
          last_menu_generated: new Date().toISOString()
        }
      })
    }
  },

  // User engagement metrics
  sessionEngagement: (timeOnPage: number, scrollDepth: number, clicksCount: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'user_engagement', {
        event_category: 'engagement',
        engagement_time_msec: timeOnPage,
        value: scrollDepth,
        event_label: 'session_quality',
        custom_parameter_clicks: clicksCount
      })
    }
  },

  // Conversion funnel tracking
  pricingPageViewed: (source?: string, userId?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_item_list', {
        event_category: 'ecommerce',
        item_list_name: 'pricing_plans',
        user_id: userId,
        event_label: 'pricing_funnel_entry',
        source: source
      })
    }
  },

  ctaClicked: (ctaLocation: string, ctaText: string, userId?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'select_promotion', {
        event_category: 'engagement',
        promotion_name: ctaText,
        promotion_id: ctaLocation,
        user_id: userId,
        event_label: 'cta_conversion'
      })
    }
  },

  // Feature usage tracking
  featureUsed: (featureName: string, userId?: string, additionalData?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'feature_used', {
        event_category: 'engagement',
        event_label: featureName,
        user_id: userId,
        ...additionalData
      })
    }
  },

  // Error tracking
  errorOccurred: (errorType: string, errorMessage: string, userId?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: `${errorType}: ${errorMessage}`,
        fatal: false,
        user_id: userId,
        event_label: 'app_error'
      })
    }
  },

  // A/B Test tracking
  abTestViewed: (testName: string, variant: string, userId?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'ab_test_viewed', {
        event_category: 'experiments',
        test_name: testName,
        variant: variant,
        user_id: userId,
        event_label: 'experiment_exposure'
      })
    }
  },

  // Customer lifecycle events
  userRetention: (daysSinceSignup: number, userId: string, userSegment?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'user_retention', {
        event_category: 'retention',
        value: daysSinceSignup,
        user_id: userId,
        user_segment: userSegment,
        event_label: 'retention_milestone'
      })
    }
  }
}

// User identification and segmentation
export const identifyUser = (userId: string, userProperties: {
  subscription_status?: 'trial' | 'active' | 'cancelled' | 'expired'
  registration_date?: string
  subscription_type?: 'basic' | 'premium' | 'family'
  total_revenue?: number
  menu_generation_count?: number
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_ID, {
      user_id: userId,
      user_properties: userProperties
    })
  }
}

// Enhanced ecommerce tracking for subscription lifecycle
export const trackSubscriptionLifecycle = {
  viewPlans: (userId?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_item_list', {
        item_list_name: 'subscription_plans',
        user_id: userId,
        event_category: 'ecommerce'
      })
    }
  },

  selectPlan: (planId: string, planName: string, price: number, userId?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'select_item', {
        item_list_name: 'subscription_plans',
        user_id: userId,
        event_category: 'ecommerce',
        currency: 'EUR',
        value: price,
        items: [{
          item_id: planId,
          item_name: planName,
          category: 'subscription',
          price: price,
          quantity: 1
        }]
      })
    }
  },

  beginCheckout: (planId: string, planName: string, price: number, userId?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'begin_checkout', {
        currency: 'EUR',
        value: price,
        user_id: userId,
        event_category: 'ecommerce',
        items: [{
          item_id: planId,
          item_name: planName,
          category: 'subscription',
          price: price,
          quantity: 1
        }]
      })
    }
  }
}