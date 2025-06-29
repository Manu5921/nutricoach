'use client'

import { useEffect, useState } from 'react'
import { getCLS, getFCP, getFID, getLCP, getTTFB } from 'web-vitals'

interface WebVitalsMetrics {
  cls: number | null
  fcp: number | null
  fid: number | null
  lcp: number | null
  ttfb: number | null
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
}

export function CoreWebVitalsOptimizer() {
  const [metrics, setMetrics] = useState<WebVitalsMetrics>({
    cls: null,
    fcp: null,
    fid: null,
    lcp: null,
    ttfb: null,
    score: 0,
    grade: 'F'
  })

  useEffect(() => {
    // Initialize Web Vitals measurement
    let clsValue = 0
    let fcpValue = 0
    let fidValue = 0
    let lcpValue = 0
    let ttfbValue = 0

    const updateMetrics = () => {
      const score = calculatePerformanceScore(clsValue, fcpValue, fidValue, lcpValue, ttfbValue)
      const grade = getPerformanceGrade(score)
      
      setMetrics({
        cls: clsValue,
        fcp: fcpValue,
        fid: fidValue,
        lcp: lcpValue,
        ttfb: ttfbValue,
        score,
        grade
      })

      // Send metrics to analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'core_web_vitals', {
          cls: clsValue,
          fcp: fcpValue,
          fid: fidValue,
          lcp: lcpValue,
          ttfb: ttfbValue,
          score,
          grade
        })
      }
    }

    // Measure Core Web Vitals
    getCLS((metric) => {
      clsValue = metric.value
      updateMetrics()
    })

    getFCP((metric) => {
      fcpValue = metric.value
      updateMetrics()
    })

    getFID((metric) => {
      fidValue = metric.value
      updateMetrics()
    })

    getLCP((metric) => {
      lcpValue = metric.value
      updateMetrics()
    })

    getTTFB((metric) => {
      ttfbValue = metric.value
      updateMetrics()
    })

    // Optimize performance on component mount
    optimizePerformance()

    return () => {
      // Cleanup if needed
    }
  }, [])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-20 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs z-50">
      <div className="mb-2">
        <h4 className="font-semibold text-xs text-gray-800">Core Web Vitals</h4>
        <div className={`text-lg font-bold ${getGradeColor(metrics.grade)}`}>
          Grade: {metrics.grade} ({metrics.score}/100)
        </div>
      </div>
      
      <div className="space-y-1 text-xs">
        <MetricRow 
          label="LCP" 
          value={metrics.lcp} 
          unit="ms" 
          threshold={[2500, 4000]}
          target="< 2.5s"
        />
        <MetricRow 
          label="FID" 
          value={metrics.fid} 
          unit="ms" 
          threshold={[100, 300]}
          target="< 100ms"
        />
        <MetricRow 
          label="CLS" 
          value={metrics.cls} 
          unit="" 
          threshold={[0.1, 0.25]}
          target="< 0.1"
        />
        <MetricRow 
          label="FCP" 
          value={metrics.fcp} 
          unit="ms" 
          threshold={[1800, 3000]}
          target="< 1.8s"
        />
        <MetricRow 
          label="TTFB" 
          value={metrics.ttfb} 
          unit="ms" 
          threshold={[800, 1800]}
          target="< 800ms"
        />
      </div>

      <div className="mt-2 pt-2 border-t border-gray-200">
        <button
          onClick={() => window.location.reload()}
          className="w-full text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
        >
          Reload & Remeasure
        </button>
      </div>
    </div>
  )
}

interface MetricRowProps {
  label: string
  value: number | null
  unit: string
  threshold: [number, number]
  target: string
}

function MetricRow({ label, value, unit, threshold, target }: MetricRowProps) {
  const getStatus = () => {
    if (value === null) return 'gray'
    if (value <= threshold[0]) return 'green'
    if (value <= threshold[1]) return 'yellow'
    return 'red'
  }

  const formatValue = () => {
    if (value === null) return '...'
    return `${Math.round(value)}${unit}`
  }

  const status = getStatus()
  const statusColor = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    gray: 'text-gray-400'
  }[status]

  return (
    <div className="flex justify-between items-center">
      <span className="font-medium">{label}:</span>
      <div className="text-right">
        <span className={statusColor}>{formatValue()}</span>
        <div className="text-gray-500 text-xs">{target}</div>
      </div>
    </div>
  )
}

function calculatePerformanceScore(cls: number, fcp: number, fid: number, lcp: number, ttfb: number): number {
  let score = 100

  // LCP scoring (40% weight)
  if (lcp > 4000) score -= 40
  else if (lcp > 2500) score -= 20

  // FID scoring (25% weight)  
  if (fid > 300) score -= 25
  else if (fid > 100) score -= 12

  // CLS scoring (25% weight)
  if (cls > 0.25) score -= 25
  else if (cls > 0.1) score -= 12

  // FCP scoring (10% weight)
  if (fcp > 3000) score -= 10
  else if (fcp > 1800) score -= 5

  return Math.max(0, Math.round(score))
}

function getPerformanceGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'text-green-600'
    case 'B': return 'text-green-500'
    case 'C': return 'text-yellow-600'
    case 'D': return 'text-orange-600'
    case 'F': return 'text-red-600'
    default: return 'text-gray-600'
  }
}

// Performance optimization utilities
function optimizePerformance() {
  // Optimize images with lazy loading
  optimizeImages()
  
  // Preload critical resources
  preloadCriticalResources()
  
  // Optimize font loading
  optimizeFontLoading()
  
  // Minimize layout shifts
  minimizeLayoutShifts()
  
  // Optimize JavaScript execution
  optimizeJavaScriptExecution()
}

function optimizeImages() {
  // Add intersection observer for lazy loading if not already present
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          if (img.dataset.src) {
            img.src = img.dataset.src
            img.classList.remove('lazy')
            observer.unobserve(img)
          }
        }
      })
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    })

    // Observe all lazy images
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img)
    })
  }
}

function preloadCriticalResources() {
  // Preload hero images
  const heroImages = [
    '/images/heroes/hero-nutrition.jpg',
    '/images/heroes/hero-recipes.jpg'
  ]

  heroImages.forEach(src => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = src
    document.head.appendChild(link)
  })

  // DNS prefetch for external domains
  const domains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com'
  ]

  domains.forEach(domain => {
    const link = document.createElement('link')
    link.rel = 'dns-prefetch'
    link.href = domain
    document.head.appendChild(link)
  })
}

function optimizeFontLoading() {
  // Add font-display: swap to improve FCP
  const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]')
  fontLinks.forEach(link => {
    const href = link.getAttribute('href')
    if (href && !href.includes('display=swap')) {
      const separator = href.includes('?') ? '&' : '?'
      link.setAttribute('href', `${href}${separator}display=swap`)
    }
  })
}

function minimizeLayoutShifts() {
  // Add explicit dimensions to images without them
  const images = document.querySelectorAll('img:not([width]):not([height])')
  images.forEach(img => {
    const imgElement = img as HTMLImageElement
    // Add aspect ratio container to prevent CLS
    if (!imgElement.style.aspectRatio && !imgElement.parentElement?.classList.contains('aspect-ratio-container')) {
      const container = document.createElement('div')
      container.className = 'aspect-ratio-container'
      container.style.aspectRatio = '16/9' // Default aspect ratio
      imgElement.parentElement?.insertBefore(container, imgElement)
      container.appendChild(imgElement)
    }
  })
}

function optimizeJavaScriptExecution() {
  // Defer non-critical JavaScript
  const scripts = document.querySelectorAll('script[src]:not([async]):not([defer])')
  scripts.forEach(script => {
    const scriptElement = script as HTMLScriptElement
    if (!scriptElement.src.includes('gtag') && !scriptElement.src.includes('analytics')) {
      scriptElement.defer = true
    }
  })

  // Use requestIdleCallback for non-critical operations
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Initialize non-critical features here
      initializeNonCriticalFeatures()
    })
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(initializeNonCriticalFeatures, 1000)
  }
}

function initializeNonCriticalFeatures() {
  // Initialize features that don't affect initial page load
  // Examples: analytics, chat widgets, social media embeds
}

export default CoreWebVitalsOptimizer