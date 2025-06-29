'use client'

import { useState, useEffect } from 'react'
import { trackBusinessEvents } from './GoogleAnalytics'

interface PerformanceMetrics {
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  fcp: number // First Contentful Paint
  ttfb: number // Time to First Byte
  loadTime: number
  domContentLoaded: number
}

interface ConversionMetrics {
  pageViews: number
  conversions: number
  conversionRate: number
  bounceRate: number
  timeOnPage: number
  scrollDepth: number
}

interface PerformanceCorrelationData {
  performance: PerformanceMetrics
  conversion: ConversionMetrics
  url: string
  timestamp: string
  userAgent: string
  connection?: string
}

export default function PerformanceCorrelationAnalyzer() {
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics | null>(null)
  const [correlationAnalysis, setCorrelationAnalysis] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    // Collect performance metrics when page loads
    collectPerformanceMetrics()
    
    // Analyze correlation with conversion data
    analyzePerformanceCorrelation()
  }, [])

  const collectPerformanceMetrics = () => {
    // Wait for page to fully load before collecting metrics
    if (document.readyState === 'complete') {
      gatherMetrics()
    } else {
      window.addEventListener('load', gatherMetrics)
    }
  }

  const gatherMetrics = () => {
    // Get performance metrics from Performance API
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')
    
    // Get Core Web Vitals
    const metrics: Partial<PerformanceMetrics> = {
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      ttfb: navigation.responseStart - navigation.requestStart
    }

    // Get paint metrics
    paint.forEach(entry => {
      if (entry.name === 'first-contentful-paint') {
        metrics.fcp = entry.startTime
      }
    })

    // Get LCP from PerformanceObserver (if available)
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              metrics.lcp = entry.startTime
            }
            if (entry.entryType === 'first-input') {
              metrics.fid = (entry as any).processingStart - entry.startTime
            }
            if (entry.entryType === 'layout-shift') {
              metrics.cls = (metrics.cls || 0) + (entry as any).value
            }
          }
          
          setPerformanceData(metrics as PerformanceMetrics)
          sendPerformanceData(metrics as PerformanceMetrics)
        })
        
        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
        
        // Stop observing after 10 seconds
        setTimeout(() => observer.disconnect(), 10000)
      } catch (error) {
        console.error('PerformanceObserver error:', error)
      }
    }

    // Fallback metrics if PerformanceObserver is not available
    if (!metrics.lcp) {
      metrics.lcp = metrics.fcp || metrics.loadTime || 0
    }
    if (!metrics.fid) {
      metrics.fid = 0 // Default for pages without interaction
    }
    if (!metrics.cls) {
      metrics.cls = 0 // Default if no layout shifts detected
    }

    setPerformanceData(metrics as PerformanceMetrics)
    sendPerformanceData(metrics as PerformanceMetrics)
  }

  const sendPerformanceData = async (metrics: PerformanceMetrics) => {
    try {
      // Get connection information
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

      const correlationData: PerformanceCorrelationData = {
        performance: metrics,
        conversion: {
          pageViews: 1,
          conversions: 0, // Will be updated by conversion events
          conversionRate: 0,
          bounceRate: 0,
          timeOnPage: 0,
          scrollDepth: 0
        },
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        connection: connection ? `${connection.effectiveType}-${connection.downlink}mbps` : undefined
      }

      await fetch('/api/analytics/performance-correlation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(correlationData)
      })

      // Track performance metrics to Google Analytics
      trackBusinessEvents.featureUsed('performance_metrics_collected', undefined, {
        lcp: metrics.lcp,
        fid: metrics.fid,
        cls: metrics.cls * 1000, // Convert to integer
        page_load_time: metrics.loadTime
      })

    } catch (error) {
      console.error('Failed to send performance correlation data:', error)
    }
  }

  const analyzePerformanceCorrelation = async () => {
    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/analytics/performance-correlation')
      const analysis = await response.json()
      setCorrelationAnalysis(analysis)
    } catch (error) {
      console.error('Failed to get performance correlation analysis:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Performance grade calculation
  const getPerformanceGrade = (metrics: PerformanceMetrics) => {
    let score = 100

    // LCP scoring (Good: <2.5s, Needs improvement: 2.5-4s, Poor: >4s)
    if (metrics.lcp > 4000) score -= 30
    else if (metrics.lcp > 2500) score -= 15

    // FID scoring (Good: <100ms, Needs improvement: 100-300ms, Poor: >300ms)
    if (metrics.fid > 300) score -= 25
    else if (metrics.fid > 100) score -= 10

    // CLS scoring (Good: <0.1, Needs improvement: 0.1-0.25, Poor: >0.25)
    if (metrics.cls > 0.25) score -= 25
    else if (metrics.cls > 0.1) score -= 10

    // FCP scoring (Good: <1.8s, Needs improvement: 1.8-3s, Poor: >3s)
    if (metrics.fcp > 3000) score -= 20
    else if (metrics.fcp > 1800) score -= 10

    return Math.max(0, score)
  }

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGradeLetter = (score: number) => {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  if (!performanceData) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="text-blue-800 text-sm">Collecte des métriques de performance...</span>
        </div>
      </div>
    )
  }

  const performanceScore = getPerformanceGrade(performanceData)

  return (
    <div className="space-y-6">
      {/* Performance Score */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Score de Performance</h3>
          <div className={`text-3xl font-bold ${getGradeColor(performanceScore)}`}>
            {getGradeLetter(performanceScore)} ({performanceScore})
          </div>
        </div>

        {/* Core Web Vitals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="LCP"
            value={`${(performanceData.lcp / 1000).toFixed(2)}s`}
            threshold={2.5}
            actualValue={performanceData.lcp / 1000}
            description="Largest Contentful Paint"
          />
          <MetricCard
            title="FID"
            value={`${performanceData.fid.toFixed(0)}ms`}
            threshold={100}
            actualValue={performanceData.fid}
            description="First Input Delay"
          />
          <MetricCard
            title="CLS"
            value={performanceData.cls.toFixed(3)}
            threshold={0.1}
            actualValue={performanceData.cls}
            description="Cumulative Layout Shift"
          />
          <MetricCard
            title="FCP"
            value={`${(performanceData.fcp / 1000).toFixed(2)}s`}
            threshold={1.8}
            actualValue={performanceData.fcp / 1000}
            description="First Contentful Paint"
          />
        </div>
      </div>

      {/* Correlation Analysis */}
      {correlationAnalysis && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Corrélation Performance / Conversion
          </h3>
          
          <CorrelationInsights analysis={correlationAnalysis} />
        </div>
      )}

      {/* Performance Recommendations */}
      <PerformanceRecommendations metrics={performanceData} score={performanceScore} />
    </div>
  )
}

// Metric Card Component
function MetricCard({ title, value, threshold, actualValue, description }: {
  title: string
  value: string
  threshold: number
  actualValue: number
  description: string
}) {
  const isGood = actualValue <= threshold
  const isNeedsImprovement = actualValue <= threshold * 1.5
  
  const statusColor = isGood ? 'green' : isNeedsImprovement ? 'yellow' : 'red'
  const bgColor = `bg-${statusColor}-50`
  const textColor = `text-${statusColor}-800`
  const borderColor = `border-${statusColor}-200`

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg p-3`}>
      <div className="flex items-center justify-between mb-1">
        <h4 className={`font-medium ${textColor}`}>{title}</h4>
        <span className={`text-xs px-2 py-1 rounded ${isGood ? 'bg-green-100 text-green-800' : isNeedsImprovement ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
          {isGood ? 'Bon' : isNeedsImprovement ? 'Moyen' : 'Faible'}
        </span>
      </div>
      <div className={`text-xl font-bold ${textColor} mb-1`}>{value}</div>
      <div className="text-xs text-gray-600">{description}</div>
    </div>
  )
}

// Correlation Insights Component
function CorrelationInsights({ analysis }: { analysis: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Impact sur les Conversions</h4>
          <div className="text-2xl font-bold text-blue-900 mb-1">
            {analysis.conversionImpact > 0 ? '+' : ''}{analysis.conversionImpact.toFixed(1)}%
          </div>
          <p className="text-xs text-blue-700">
            Amélioration potentielle avec optimisation performance
          </p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">Corrélation LCP</h4>
          <div className="text-2xl font-bold text-green-900 mb-1">
            {analysis.lcpCorrelation.toFixed(2)}
          </div>
          <p className="text-xs text-green-700">
            Coefficient de corrélation avec taux de conversion
          </p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="font-medium text-purple-800 mb-2">Taux de Rebond</h4>
          <div className="text-2xl font-bold text-purple-900 mb-1">
            {analysis.bounceRateIncrease.toFixed(1)}%
          </div>
          <p className="text-xs text-purple-700">
            Augmentation avec performance dégradée
          </p>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-3">Insights Clés</h4>
        <ul className="space-y-2 text-sm text-gray-700">
          {analysis.insights.map((insight: string, index: number) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// Performance Recommendations Component
function PerformanceRecommendations({ metrics, score }: { metrics: PerformanceMetrics, score: number }) {
  const recommendations = []

  if (metrics.lcp > 2500) {
    recommendations.push({
      priority: 'high',
      metric: 'LCP',
      issue: 'Largest Contentful Paint trop lent',
      solutions: [
        'Optimiser les images (WebP, lazy loading)',
        'Utiliser un CDN pour les ressources statiques',
        'Précharger les ressources critiques',
        'Optimiser le server-side rendering'
      ]
    })
  }

  if (metrics.fid > 100) {
    recommendations.push({
      priority: 'medium',
      metric: 'FID',
      issue: 'First Input Delay élevé',
      solutions: [
        'Réduire le JavaScript blocking',
        'Utiliser code splitting',
        'Optimiser les tasks longues',
        'Implementer progressive hydration'
      ]
    })
  }

  if (metrics.cls > 0.1) {
    recommendations.push({
      priority: 'high',
      metric: 'CLS',
      issue: 'Layout shifts fréquents',
      solutions: [
        'Définir dimensions pour images et vidéos',
        'Éviter l\'injection de contenu dynamique',
        'Utiliser transform au lieu de propriétés layout',
        'Préloader les fonts'
      ]
    })
  }

  if (metrics.fcp > 1800) {
    recommendations.push({
      priority: 'medium',
      metric: 'FCP',
      issue: 'First Contentful Paint lent',
      solutions: [
        'Optimiser le critical CSS',
        'Minimiser le time to first byte',
        'Utiliser service workers',
        'Optimiser les fonts (font-display: swap)'
      ]
    })
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-2 text-green-800">
          <span className="text-xl">🎉</span>
          <h3 className="font-semibold">Excellente performance !</h3>
        </div>
        <p className="text-green-700 mt-2">
          Votre site atteint de très bonnes métriques de performance. 
          Continuez à monitorer pour maintenir cette qualité.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Recommandations d'Optimisation
      </h3>
      
      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 text-xs rounded ${
                rec.priority === 'high' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {rec.priority === 'high' ? 'Priorité haute' : 'Priorité moyenne'}
              </span>
              <span className="font-medium text-gray-900">{rec.metric}</span>
            </div>
            
            <h4 className="font-medium text-gray-900 mb-2">{rec.issue}</h4>
            
            <ul className="space-y-1">
              {rec.solutions.map((solution, sIndex) => (
                <li key={sIndex} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{solution}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}