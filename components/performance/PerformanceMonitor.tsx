'use client'

import { useEffect, useState } from 'react'

interface PerformanceMetrics {
  fcp?: number
  lcp?: number
  fid?: number
  cls?: number
  ttfb?: number
  navigationStart?: number
  domContentLoaded?: number
  domComplete?: number
  loadEvent?: number
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({})
  const [score, setScore] = useState<number>(0)

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              setMetrics(prev => ({ ...prev, fcp: entry.startTime }))
            }
            break
          case 'largest-contentful-paint':
            setMetrics(prev => ({ ...prev, lcp: entry.startTime }))
            break
          case 'first-input':
            setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }))
            break
          case 'layout-shift':
            if (!(entry as any).hadRecentInput) {
              setMetrics(prev => ({
                ...prev,
                cls: (prev.cls || 0) + (entry as any).value
              }))
            }
            break
        }
      }
    })

    // Observe different entry types
    try {
      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] })
    } catch (error) {
      console.log('PerformanceObserver not supported for some entry types')
    }

    // Get navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      setMetrics(prev => ({
        ...prev,
        navigationStart: navigation.navigationStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        domComplete: navigation.domComplete - navigation.navigationStart,
        loadEvent: navigation.loadEventEnd - navigation.navigationStart,
        ttfb: navigation.responseStart - navigation.requestStart,
      }))
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    // Calculate performance score based on Core Web Vitals
    let score = 100
    
    if (metrics.lcp) {
      if (metrics.lcp > 4000) score -= 30
      else if (metrics.lcp > 2500) score -= 15
    }
    
    if (metrics.fid) {
      if (metrics.fid > 300) score -= 30
      else if (metrics.fid > 100) score -= 15
    }
    
    if (metrics.cls) {
      if (metrics.cls > 0.25) score -= 30
      else if (metrics.cls > 0.1) score -= 15
    }
    
    if (metrics.fcp) {
      if (metrics.fcp > 3000) score -= 10
      else if (metrics.fcp > 1800) score -= 5
    }

    setScore(Math.max(0, score))
  }, [metrics])

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatMetric = (value: number | undefined, unit: string = 'ms') => {
    if (value === undefined) return 'Loading...'
    return `${Math.round(value)}${unit}`
  }

  const getMetricStatus = (value: number | undefined, good: number, needsImprovement: number) => {
    if (value === undefined) return 'gray'
    if (value <= good) return 'green'
    if (value <= needsImprovement) return 'yellow'
    return 'red'
  }

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="mb-3">
        <h3 className="font-semibold text-sm">Performance Monitor</h3>
        <div className={`text-lg font-bold ${getScoreColor(score)}`}>
          Score: {score}/100
        </div>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium">LCP:</span>
            <span className={`ml-1 ${
              getMetricStatus(metrics.lcp, 2500, 4000) === 'green' ? 'text-green-600' :
              getMetricStatus(metrics.lcp, 2500, 4000) === 'yellow' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {formatMetric(metrics.lcp)}
            </span>
          </div>
          
          <div>
            <span className="font-medium">FID:</span>
            <span className={`ml-1 ${
              getMetricStatus(metrics.fid, 100, 300) === 'green' ? 'text-green-600' :
              getMetricStatus(metrics.fid, 100, 300) === 'yellow' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {formatMetric(metrics.fid)}
            </span>
          </div>
          
          <div>
            <span className="font-medium">CLS:</span>
            <span className={`ml-1 ${
              getMetricStatus(metrics.cls, 0.1, 0.25) === 'green' ? 'text-green-600' :
              getMetricStatus(metrics.cls, 0.1, 0.25) === 'yellow' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {formatMetric(metrics.cls, '')}
            </span>
          </div>
          
          <div>
            <span className="font-medium">FCP:</span>
            <span className={`ml-1 ${
              getMetricStatus(metrics.fcp, 1800, 3000) === 'green' ? 'text-green-600' :
              getMetricStatus(metrics.fcp, 1800, 3000) === 'yellow' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {formatMetric(metrics.fcp)}
            </span>
          </div>
        </div>
        
        <div className="pt-2 border-t border-gray-200">
          <div className="text-gray-600">
            TTFB: {formatMetric(metrics.ttfb)}
          </div>
          <div className="text-gray-600">
            DOM: {formatMetric(metrics.domContentLoaded)}
          </div>
          <div className="text-gray-600">
            Load: {formatMetric(metrics.loadEvent)}
          </div>
        </div>
      </div>
    </div>
  )
}