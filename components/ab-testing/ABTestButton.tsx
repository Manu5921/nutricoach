'use client'

import { useABTest } from './ABTestProvider'
import { useCTATracking } from '@/components/analytics/usePageTracking'

interface ABTestButtonProps {
  testId?: string
  children?: React.ReactNode
  className?: string
  onClick?: () => void
  href?: string
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  location?: string // For tracking CTA location
}

export function ABTestButton({ 
  testId = 'cta_color',
  children,
  className = '',
  onClick,
  href,
  variant = 'primary',
  size = 'md',
  location = 'unknown'
}: ABTestButtonProps) {
  const { variant: testVariant, trackConversion } = useABTest(testId)
  const { trackCTA } = useCTATracking()

  // Get colors based on A/B test
  const getColors = () => {
    if (testId === 'cta_color') {
      if (testVariant === 'control') {
        // Green (control)
        return {
          primary: 'bg-green-600 hover:bg-green-700 text-white',
          secondary: 'border border-green-600 text-green-600 hover:bg-green-50'
        }
      } else {
        // Blue (variant)
        return {
          primary: 'bg-blue-600 hover:bg-blue-700 text-white',
          secondary: 'border border-blue-600 text-blue-600 hover:bg-blue-50'
        }
      }
    }
    
    // Default colors
    return {
      primary: 'bg-green-600 hover:bg-green-700 text-white',
      secondary: 'border border-green-600 text-green-600 hover:bg-green-50'
    }
  }

  const colors = getColors()
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg'
  }

  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    ${sizeClasses[size]}
    ${variant === 'primary' ? colors.primary : colors.secondary}
    ${className}
  `

  const handleClick = () => {
    // Track CTA click
    trackCTA(children?.toString() || 'Button', location)
    
    // Track A/B test conversion
    trackConversion('cta_click', 1)
    
    // Execute provided onClick
    if (onClick) {
      onClick()
    }
  }

  if (href) {
    return (
      <a
        href={href}
        className={baseClasses}
        onClick={handleClick}
      >
        {children}
      </a>
    )
  }

  return (
    <button
      className={baseClasses}
      onClick={handleClick}
    >
      {children}
    </button>
  )
}

// A/B tested CTA text component
export function ABTestCTAText({ testId = 'cta_text', fallback = 'Commencer maintenant' }: { testId?: string, fallback?: string }) {
  const { variant } = useABTest(testId)
  
  if (testId === 'cta_text') {
    return variant === 'control' ? 'Commencer maintenant' : 'Essayer gratuitement'
  }
  
  return fallback
}

// Combined A/B tested button with text
export function ABTestCTA({ location, className, size = 'lg' }: { location: string, className?: string, size?: 'sm' | 'md' | 'lg' }) {
  return (
    <ABTestButton
      testId="cta_color"
      location={location}
      className={className}
      size={size}
      onClick={() => {
        // Navigate to signup or pricing
        window.location.href = '/pricing'
      }}
    >
      <ABTestCTAText testId="cta_text" />
    </ABTestButton>
  )
}