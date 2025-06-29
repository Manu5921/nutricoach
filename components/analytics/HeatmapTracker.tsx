'use client'

import { useEffect, useRef, useState } from 'react'
import { useAnalyticsConsent } from '@/components/CookieConsent'
import { trackBusinessEvents } from './GoogleAnalytics'

interface HeatmapDataPoint {
  x: number
  y: number
  timestamp: number
  type: 'click' | 'scroll' | 'hover'
  element?: string
  value?: number
}

interface HeatmapTrackerProps {
  enabled?: boolean
  sampleRate?: number // 0-1, percentage of users to track
  sessionDuration?: number // Max session duration to track (minutes)
}

export default function HeatmapTracker({ 
  enabled = true, 
  sampleRate = 0.1,
  sessionDuration = 30 
}: HeatmapTrackerProps) {
  const analyticsConsent = useAnalyticsConsent()
  const [isTracking, setIsTracking] = useState(false)
  const [sessionData, setSessionData] = useState<HeatmapDataPoint[]>([])
  const sessionStartTime = useRef<number>(Date.now())
  const scrollDepthRef = useRef<number>(0)
  const heatmapDataRef = useRef<HeatmapDataPoint[]>([])

  useEffect(() => {
    if (!enabled || !analyticsConsent) return

    // Determine if this user should be tracked (sampling)
    const shouldTrack = Math.random() < sampleRate
    if (!shouldTrack) return

    setIsTracking(true)
    initializeTracking()

    return () => {
      if (isTracking) {
        sendHeatmapData()
      }
    }
  }, [enabled, analyticsConsent, sampleRate])

  const initializeTracking = () => {
    // Track clicks
    document.addEventListener('click', handleClick, true)
    
    // Track scroll behavior
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Track mouse movements (sampled)
    let mouseMoveThrottle: NodeJS.Timeout | null = null
    document.addEventListener('mousemove', (e) => {
      if (mouseMoveThrottle) return
      
      mouseMoveThrottle = setTimeout(() => {
        handleMouseMove(e)
        mouseMoveThrottle = null
      }, 500) // Throttle to every 500ms
    })
    
    // Track page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Send data before page unload
    window.addEventListener('beforeunload', sendHeatmapData)
    
    // Send data periodically during long sessions
    const interval = setInterval(() => {
      if (heatmapDataRef.current.length > 0) {
        sendHeatmapData()
      }
    }, 5 * 60 * 1000) // Every 5 minutes
    
    // Stop tracking after max session duration
    setTimeout(() => {
      setIsTracking(false)
      sendHeatmapData()
      clearInterval(interval)
    }, sessionDuration * 60 * 1000)
  }

  const handleClick = (event: MouseEvent) => {
    if (!isTracking) return

    const target = event.target as HTMLElement
    const rect = document.documentElement.getBoundingClientRect()
    
    const dataPoint: HeatmapDataPoint = {
      x: event.clientX,
      y: event.clientY + window.pageYOffset,
      timestamp: Date.now() - sessionStartTime.current,
      type: 'click',
      element: getElementSelector(target)
    }
    
    addDataPoint(dataPoint)
    
    // Track important clicks
    if (target.matches('button, a, [role="button"]')) {
      trackBusinessEvents.featureUsed('heatmap_important_click', undefined, {
        element: dataPoint.element,
        x: dataPoint.x,
        y: dataPoint.y
      })
    }
  }

  const handleScroll = () => {
    if (!isTracking) return

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    const scrollPercent = Math.round((scrollTop / docHeight) * 100)
    
    // Only track new scroll depths
    if (scrollPercent > scrollDepthRef.current) {
      scrollDepthRef.current = scrollPercent
      
      const dataPoint: HeatmapDataPoint = {
        x: window.innerWidth / 2, // Center of screen
        y: scrollTop + window.innerHeight,
        timestamp: Date.now() - sessionStartTime.current,
        type: 'scroll',
        value: scrollPercent
      }
      
      addDataPoint(dataPoint)
      
      // Track scroll milestones
      if (scrollPercent >= 25 && scrollPercent < 30) {
        trackBusinessEvents.sessionEngagement(Date.now() - sessionStartTime.current, 25, 0)
      }
    }
  }

  const handleMouseMove = (event: MouseEvent) => {
    if (!isTracking) return

    // Only track hover on interactive elements
    const target = event.target as HTMLElement
    if (target.matches('button, a, input, select, textarea, [role="button"]')) {
      const dataPoint: HeatmapDataPoint = {
        x: event.clientX,
        y: event.clientY + window.pageYOffset,
        timestamp: Date.now() - sessionStartTime.current,
        type: 'hover',
        element: getElementSelector(target)
      }
      
      addDataPoint(dataPoint)
    }
  }

  const handleVisibilityChange = () => {
    if (document.hidden && isTracking) {
      sendHeatmapData()
    }
  }

  const addDataPoint = (dataPoint: HeatmapDataPoint) => {
    heatmapDataRef.current.push(dataPoint)
    setSessionData(prev => [...prev, dataPoint])
    
    // Limit data points to prevent memory issues
    if (heatmapDataRef.current.length > 1000) {
      sendHeatmapData()
    }
  }

  const sendHeatmapData = async () => {
    if (heatmapDataRef.current.length === 0) return

    const sessionData = {
      url: window.location.href,
      pathname: window.location.pathname,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: window.screen.width,
        height: window.screen.height
      },
      sessionDuration: Date.now() - sessionStartTime.current,
      dataPoints: heatmapDataRef.current,
      timestamp: new Date().toISOString()
    }

    try {
      await fetch('/api/analytics/heatmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
        keepalive: true // Allow request to continue even if page is closing
      })
      
      // Clear data after successful send
      heatmapDataRef.current = []
      setSessionData([])
      
    } catch (error) {
      console.error('Failed to send heatmap data:', error)
    }
  }

  const getElementSelector = (element: HTMLElement): string => {
    // Generate a unique selector for the element
    const id = element.id
    if (id) return `#${id}`
    
    const className = element.className
    if (className && typeof className === 'string') {
      const classes = className.split(' ').filter(c => c.length > 0)
      if (classes.length > 0) {
        return `.${classes[0]}`
      }
    }
    
    const tagName = element.tagName.toLowerCase()
    const parent = element.parentElement
    
    if (parent) {
      const siblings = Array.from(parent.children)
      const index = siblings.indexOf(element)
      return `${tagName}:nth-child(${index + 1})`
    }
    
    return tagName
  }

  // Debug visualization (only in development)
  if (process.env.NODE_ENV === 'development' && isTracking) {
    return (
      <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs z-50">
        <div>Heatmap Tracking Active</div>
        <div>Data Points: {sessionData.length}</div>
        <div>Scroll Depth: {scrollDepthRef.current}%</div>
      </div>
    )
  }

  return null
}

// Hook for accessing heatmap data in components
export function useHeatmapData() {
  const [heatmapData, setHeatmapData] = useState<any>(null)
  
  const loadHeatmapData = async (pathname?: string, dateRange?: { start: string, end: string }) => {
    try {
      const params = new URLSearchParams()
      if (pathname) params.append('pathname', pathname)
      if (dateRange) {
        params.append('start', dateRange.start)
        params.append('end', dateRange.end)
      }
      
      const response = await fetch(`/api/analytics/heatmap?${params}`)
      const data = await response.json()
      setHeatmapData(data)
    } catch (error) {
      console.error('Failed to load heatmap data:', error)
    }
  }
  
  return { heatmapData, loadHeatmapData }
}

// Heatmap visualization component for admin dashboard
export function HeatmapVisualization({ pathname, dateRange }: { pathname?: string, dateRange?: { start: string, end: string } }) {
  const { heatmapData, loadHeatmapData } = useHeatmapData()
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadHeatmapData(pathname, dateRange).finally(() => setLoading(false))
  }, [pathname, dateRange])
  
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    )
  }
  
  if (!heatmapData || !heatmapData.dataPoints) {
    return (
      <div className="text-center text-gray-500 p-8">
        Aucune donnée de heatmap disponible
      </div>
    )
  }
  
  return (
    <div className="relative">
      <h3 className="text-lg font-semibold mb-4">Heatmap des Interactions</h3>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded">
          <div className="text-2xl font-bold text-blue-600">{heatmapData.totalClicks}</div>
          <div className="text-sm text-blue-800">Clics totaux</div>
        </div>
        <div className="bg-green-50 p-3 rounded">
          <div className="text-2xl font-bold text-green-600">{heatmapData.avgScrollDepth}%</div>
          <div className="text-sm text-green-800">Scroll moyen</div>
        </div>
        <div className="bg-purple-50 p-3 rounded">
          <div className="text-2xl font-bold text-purple-600">{heatmapData.avgSessionTime}s</div>
          <div className="text-sm text-purple-800">Temps moyen</div>
        </div>
        <div className="bg-orange-50 p-3 rounded">
          <div className="text-2xl font-bold text-orange-600">{heatmapData.totalSessions}</div>
          <div className="text-sm text-orange-800">Sessions</div>
        </div>
      </div>
      
      {/* Top clicked elements */}
      <div className="bg-gray-50 p-4 rounded">
        <h4 className="font-medium mb-3">Éléments les plus cliqués</h4>
        <div className="space-y-2">
          {heatmapData.topElements?.slice(0, 5).map((element: any, index: number) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm font-mono bg-gray-200 px-2 py-1 rounded">
                {element.selector}
              </span>
              <span className="text-sm font-medium text-gray-600">
                {element.clicks} clics
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}