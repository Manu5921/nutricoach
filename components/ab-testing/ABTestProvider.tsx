'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { trackBusinessEvents } from '@/components/analytics/GoogleAnalytics'

interface ABTest {
  id: string
  name: string
  variants: {
    control: any
    variant: any
  }
  allocation: {
    control: number // 0-100
    variant: number // 0-100
  }
  status: 'draft' | 'active' | 'paused' | 'completed'
  startDate: string
  endDate?: string
  targetSample: number
  currentSample: number
  confidence: number
  significance: number
}

interface ABTestResult {
  testId: string
  variant: 'control' | 'variant'
  userId?: string
}

interface ABTestContextType {
  getVariant: (testId: string) => 'control' | 'variant'
  trackConversion: (testId: string, eventName: string, value?: number) => void
  getActiveTests: () => ABTest[]
  isTestActive: (testId: string) => boolean
}

const ABTestContext = createContext<ABTestContextType | undefined>(undefined)

// A/B Test configuration
const AB_TESTS: { [key: string]: ABTest } = {
  'testimonials_style': {
    id: 'testimonials_style',
    name: 'Style des Témoignages',
    variants: {
      control: 'metrics', // Témoignages avec métriques (format actuel)
      variant: 'emotional' // Témoignages émotionnels
    },
    allocation: {
      control: 50,
      variant: 50
    },
    status: 'active',
    startDate: '2024-01-01',
    targetSample: 1000,
    currentSample: 0,
    confidence: 95,
    significance: 0.05
  },
  'cta_color': {
    id: 'cta_color',
    name: 'Couleur du CTA Principal',
    variants: {
      control: 'green', // Vert actuel
      variant: 'blue' // Bleu
    },
    allocation: {
      control: 50,
      variant: 50
    },
    status: 'active',
    startDate: '2024-01-01',
    targetSample: 1000,
    currentSample: 0,
    confidence: 95,
    significance: 0.05
  },
  'cta_text': {
    id: 'cta_text',
    name: 'Texte du CTA',
    variants: {
      control: 'Commencer maintenant', // Texte actuel
      variant: 'Essayer gratuitement' // Alternative
    },
    allocation: {
      control: 50,
      variant: 50
    },
    status: 'active',
    startDate: '2024-01-01',
    targetSample: 1000,
    currentSample: 0,
    confidence: 95,
    significance: 0.05
  },
  'pricing_layout': {
    id: 'pricing_layout',
    name: 'Layout Page Pricing',
    variants: {
      control: 'features_focus', // Focus sur les fonctionnalités
      variant: 'benefits_focus' // Focus sur les bénéfices
    },
    allocation: {
      control: 50,
      variant: 50
    },
    status: 'active',
    startDate: '2024-01-01',
    targetSample: 1000,
    currentSample: 0,
    confidence: 95,
    significance: 0.05
  },
  'faq_order': {
    id: 'faq_order',
    name: 'Ordre des Questions FAQ',
    variants: {
      control: 'security_first', // Sécurité en premier
      variant: 'payment_first' // Paiement en premier
    },
    allocation: {
      control: 50,
      variant: 50
    },
    status: 'active',
    startDate: '2024-01-01',
    targetSample: 1000,
    currentSample: 0,
    confidence: 95,
    significance: 0.05
  }
}

export function ABTestProvider({ children }: { children: React.ReactNode }) {
  const [userAssignments, setUserAssignments] = useState<{ [testId: string]: 'control' | 'variant' }>({})
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    // Get or generate user ID
    let storedUserId = localStorage.getItem('ab-test-user-id')
    if (!storedUserId) {
      storedUserId = generateUserId()
      localStorage.setItem('ab-test-user-id', storedUserId)
    }
    setUserId(storedUserId)

    // Load existing assignments
    const assignments = localStorage.getItem('ab-test-assignments')
    if (assignments) {
      setUserAssignments(JSON.parse(assignments))
    }
  }, [])

  const getVariant = (testId: string): 'control' | 'variant' => {
    const test = AB_TESTS[testId]
    
    // Return control if test doesn't exist or isn't active
    if (!test || test.status !== 'active') {
      return 'control'
    }

    // Check if user already has an assignment
    if (userAssignments[testId]) {
      return userAssignments[testId]
    }

    // Assign variant based on allocation
    const assignment = assignVariant(testId, userId)
    
    // Store assignment
    const newAssignments = { ...userAssignments, [testId]: assignment }
    setUserAssignments(newAssignments)
    localStorage.setItem('ab-test-assignments', JSON.stringify(newAssignments))
    
    // Track test exposure
    trackBusinessEvents.abTestViewed(testId, assignment, userId)
    
    return assignment
  }

  const trackConversion = (testId: string, eventName: string, value?: number) => {
    const variant = getVariant(testId)
    
    // Track conversion event with test information
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'ab_test_conversion', {
        event_category: 'experiments',
        test_id: testId,
        variant: variant,
        conversion_event: eventName,
        value: value,
        user_id: userId,
        event_label: 'ab_test_goal'
      })
    }
    
    // Also track to our analytics API
    fetch('/api/analytics/ab-test-conversion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testId,
        variant,
        eventName,
        value,
        userId,
        timestamp: new Date().toISOString()
      })
    }).catch(console.error)
  }

  const getActiveTests = (): ABTest[] => {
    return Object.values(AB_TESTS).filter(test => test.status === 'active')
  }

  const isTestActive = (testId: string): boolean => {
    const test = AB_TESTS[testId]
    return test?.status === 'active'
  }

  return (
    <ABTestContext.Provider value={{
      getVariant,
      trackConversion,
      getActiveTests,
      isTestActive
    }}>
      {children}
    </ABTestContext.Provider>
  )
}

// Hook to use A/B testing
export function useABTest(testId: string) {
  const context = useContext(ABTestContext)
  if (!context) {
    throw new Error('useABTest must be used within an ABTestProvider')
  }
  
  const variant = context.getVariant(testId)
  const trackConversion = (eventName: string, value?: number) => {
    context.trackConversion(testId, eventName, value)
  }
  
  return { variant, trackConversion }
}

// Hook for conversion tracking
export function useABTestConversion() {
  const context = useContext(ABTestContext)
  if (!context) {
    throw new Error('useABTestConversion must be used within an ABTestProvider')
  }
  
  return context.trackConversion
}

// Assign variant based on user ID and test allocation
function assignVariant(testId: string, userId: string): 'control' | 'variant' {
  const test = AB_TESTS[testId]
  if (!test) return 'control'
  
  // Use deterministic assignment based on user ID and test ID
  const hash = hashString(userId + testId)
  const percentage = hash % 100
  
  return percentage < test.allocation.control ? 'control' : 'variant'
}

// Simple hash function for consistent assignment
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

// Generate unique user ID
function generateUserId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Statistical functions for A/B test analysis
export const ABTestAnalytics = {
  calculateSignificance: (controlConversions: number, controlSample: number, variantConversions: number, variantSample: number) => {
    const p1 = controlConversions / controlSample
    const p2 = variantConversions / variantSample
    const pPooled = (controlConversions + variantConversions) / (controlSample + variantSample)
    
    const se = Math.sqrt(pPooled * (1 - pPooled) * (1/controlSample + 1/variantSample))
    const zScore = Math.abs(p1 - p2) / se
    
    // Convert z-score to p-value (simplified)
    const pValue = 2 * (1 - normalCDF(Math.abs(zScore)))
    
    return {
      pValue,
      isSignificant: pValue < 0.05,
      confidence: (1 - pValue) * 100,
      improvement: ((p2 - p1) / p1) * 100
    }
  },
  
  calculateSampleSize: (baselineRate: number, minDetectableEffect: number, power: number = 0.8, significance: number = 0.05) => {
    // Simplified sample size calculation
    const alpha = significance
    const beta = 1 - power
    const p1 = baselineRate
    const p2 = baselineRate * (1 + minDetectableEffect)
    
    const pooledP = (p1 + p2) / 2
    const pooledSE = Math.sqrt(2 * pooledP * (1 - pooledP))
    
    const za = 1.96 // z-score for 95% confidence
    const zb = 0.84 // z-score for 80% power
    
    const sampleSize = Math.ceil(
      Math.pow(za + zb, 2) * Math.pow(pooledSE, 2) / Math.pow(p2 - p1, 2)
    )
    
    return sampleSize
  }
}

// Normal CDF approximation
function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)))
}

// Error function approximation
function erf(x: number): number {
  const a1 =  0.254829592
  const a2 = -0.284496736
  const a3 =  1.421413741
  const a4 = -1.453152027
  const a5 =  1.061405429
  const p  =  0.3275911
  
  const sign = x >= 0 ? 1 : -1
  x = Math.abs(x)
  
  const t = 1.0 / (1.0 + p * x)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
  
  return sign * y
}