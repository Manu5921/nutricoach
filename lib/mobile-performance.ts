/**
 * Enhanced Mobile Performance Optimization Utilities for NutriCoach PWA
 * Advanced features: Touch optimization, image compression, haptic feedback
 */

// Network detection and adaptive loading
export class NetworkDetector {
  private connection: any
  private listeners: Array<(info: NetworkInfo) => void> = []

  constructor() {
    // Modern browsers support navigator.connection
    this.connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection
    
    if (this.connection) {
      this.connection.addEventListener('change', this.handleConnectionChange.bind(this))
    }
  }

  getCurrentNetworkInfo(): NetworkInfo {
    if (!this.connection) {
      return {
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false
      }
    }

    return {
      effectiveType: this.connection.effectiveType || '4g',
      downlink: this.connection.downlink || 10,
      rtt: this.connection.rtt || 100,
      saveData: this.connection.saveData || false
    }
  }

  isSlowConnection(): boolean {
    const info = this.getCurrentNetworkInfo()
    return info.effectiveType === '2g' || info.effectiveType === 'slow-2g' || info.saveData
  }

  isFastConnection(): boolean {
    const info = this.getCurrentNetworkInfo()
    return info.effectiveType === '4g' && info.downlink > 1.5
  }

  subscribe(callback: (info: NetworkInfo) => void) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  private handleConnectionChange() {
    const info = this.getCurrentNetworkInfo()
    this.listeners.forEach(listener => listener(info))
  }
}

export interface NetworkInfo {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g'
  downlink: number
  rtt: number
  saveData: boolean
}

// Image optimization for mobile
export class MobileImageOptimizer {
  static getOptimalImageUrl(
    baseUrl: string, 
    width: number, 
    quality: number = 75,
    format: 'webp' | 'avif' | 'jpeg' = 'webp'
  ): string {
    const networkDetector = new NetworkDetector()
    const isSlowConnection = networkDetector.isSlowConnection()
    
    // Reduce quality for slow connections
    const adaptiveQuality = isSlowConnection ? Math.max(quality - 20, 30) : quality
    
    // Reduce size for slow connections
    const adaptiveWidth = isSlowConnection ? Math.min(width, 400) : width
    
    // Fallback to JPEG for older browsers
    const supportedFormat = this.isFormatSupported(format) ? format : 'jpeg'
    
    return `${baseUrl}?w=${adaptiveWidth}&q=${adaptiveQuality}&f=${supportedFormat}`
  }

  static isFormatSupported(format: string): boolean {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    
    try {
      const dataUrl = canvas.toDataURL(`image/${format}`)
      return dataUrl.indexOf(`data:image/${format}`) === 0
    } catch {
      return false
    }
  }

  static preloadCriticalImages(urls: string[]) {
    urls.forEach(url => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = url
      document.head.appendChild(link)
    })
  }
}

// Touch gesture optimization
export class TouchOptimizer {
  private static touchStartTime = 0
  private static touchEndTime = 0

  static optimizeTouchEvents(element: HTMLElement) {
    // Prevent 300ms click delay
    element.style.touchAction = 'manipulation'
    
    // Add touch feedback
    element.addEventListener('touchstart', this.handleTouchStart, { passive: true })
    element.addEventListener('touchend', this.handleTouchEnd, { passive: true })
    element.addEventListener('touchcancel', this.handleTouchCancel, { passive: true })
  }

  private static handleTouchStart(event: TouchEvent) {
    this.touchStartTime = Date.now()
    const element = event.currentTarget as HTMLElement
    element.classList.add('touch-active')
  }

  private static handleTouchEnd(event: TouchEvent) {
    this.touchEndTime = Date.now()
    const element = event.currentTarget as HTMLElement
    element.classList.remove('touch-active')
    
    // Haptic feedback for quick taps
    if (this.touchEndTime - this.touchStartTime < 200) {
      this.triggerHapticFeedback('light')
    }
  }

  private static handleTouchCancel(event: TouchEvent) {
    const element = event.currentTarget as HTMLElement
    element.classList.remove('touch-active')
  }

  static triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light') {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [50],
        medium: [100],
        heavy: [200, 100, 200]
      }
      navigator.vibrate(patterns[type])
    }
  }
}

// Lazy loading utilities
export class LazyLoader {
  private observer: IntersectionObserver
  private loadedImages = new Set<string>()

  constructor() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target as HTMLImageElement)
          }
        })
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1
      }
    )
  }

  observeImage(img: HTMLImageElement) {
    this.observer.observe(img)
  }

  private loadImage(img: HTMLImageElement) {
    const src = img.dataset.src
    if (src && !this.loadedImages.has(src)) {
      img.src = src
      this.loadedImages.add(src)
      this.observer.unobserve(img)
      
      img.onload = () => {
        img.classList.add('loaded')
      }
    }
  }

  disconnect() {
    this.observer.disconnect()
  }
}

// Memory management for mobile devices
export class MemoryManager {
  private static componentCache = new Map()
  private static maxCacheSize = 50

  static cacheComponent(key: string, component: any) {
    if (this.componentCache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.componentCache.keys().next().value
      this.componentCache.delete(firstKey)
    }
    this.componentCache.set(key, component)
  }

  static getCachedComponent(key: string) {
    return this.componentCache.get(key)
  }

  static clearCache() {
    this.componentCache.clear()
  }

  static getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024 // MB
    }
    return 0
  }

  static isLowMemoryDevice(): boolean {
    const memory = this.getMemoryUsage()
    return memory < 100 // Less than 100MB available
  }
}

// Battery optimization
export class BatteryOptimizer {
  private batteryManager: any = null

  async init() {
    if ('getBattery' in navigator) {
      try {
        this.batteryManager = await (navigator as any).getBattery()
      } catch (error) {
        console.warn('Battery API not available:', error)
      }
    }
  }

  isLowBattery(): boolean {
    if (!this.batteryManager) return false
    return this.batteryManager.level < 0.2 // Less than 20%
  }

  isCharging(): boolean {
    if (!this.batteryManager) return true
    return this.batteryManager.charging
  }

  getBatteryLevel(): number {
    if (!this.batteryManager) return 1
    return this.batteryManager.level
  }

  optimizeForBattery(): MobileOptimizationSettings {
    const isLowBattery = this.isLowBattery()
    const isCharging = this.isCharging()

    return {
      reduceAnimations: isLowBattery && !isCharging,
      lowerImageQuality: isLowBattery,
      disableAutoRefresh: isLowBattery && !isCharging,
      reducePushNotifications: isLowBattery
    }
  }
}

export interface MobileOptimizationSettings {
  reduceAnimations: boolean
  lowerImageQuality: boolean
  disableAutoRefresh: boolean
  reducePushNotifications: boolean
}

// Virtual scrolling for large lists
export class VirtualScroller {
  private container: HTMLElement
  private itemHeight: number
  private visibleCount: number
  private items: any[]
  private renderItem: (item: any, index: number) => HTMLElement

  constructor(
    container: HTMLElement,
    itemHeight: number,
    items: any[],
    renderItem: (item: any, index: number) => HTMLElement
  ) {
    this.container = container
    this.itemHeight = itemHeight
    this.items = items
    this.renderItem = renderItem
    this.visibleCount = Math.ceil(container.clientHeight / itemHeight) + 2
    
    this.setupScrolling()
  }

  private setupScrolling() {
    this.container.style.height = `${this.items.length * this.itemHeight}px`
    this.container.addEventListener('scroll', this.handleScroll.bind(this), { passive: true })
    this.render()
  }

  private handleScroll() {
    this.render()
  }

  private render() {
    const scrollTop = this.container.scrollTop
    const startIndex = Math.floor(scrollTop / this.itemHeight)
    const endIndex = Math.min(startIndex + this.visibleCount, this.items.length)

    // Clear existing items
    this.container.innerHTML = ''

    // Create spacer for items above viewport
    if (startIndex > 0) {
      const topSpacer = document.createElement('div')
      topSpacer.style.height = `${startIndex * this.itemHeight}px`
      this.container.appendChild(topSpacer)
    }

    // Render visible items
    for (let i = startIndex; i < endIndex; i++) {
      const item = this.renderItem(this.items[i], i)
      this.container.appendChild(item)
    }

    // Create spacer for items below viewport
    if (endIndex < this.items.length) {
      const bottomSpacer = document.createElement('div')
      bottomSpacer.style.height = `${(this.items.length - endIndex) * this.itemHeight}px`
      this.container.appendChild(bottomSpacer)
    }
  }

  updateItems(newItems: any[]) {
    this.items = newItems
    this.container.style.height = `${this.items.length * this.itemHeight}px`
    this.render()
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static marks = new Map<string, number>()

  static mark(name: string) {
    this.marks.set(name, performance.now())
  }

  static measure(name: string, startMark: string): number {
    const startTime = this.marks.get(startMark)
    if (!startTime) return 0
    
    const duration = performance.now() - startTime
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)
    return duration
  }

  static measureCLS(): Promise<number> {
    return new Promise((resolve) => {
      let cls = 0

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            cls += (entry as any).value
          }
        }
      })

      observer.observe({ entryTypes: ['layout-shift'] })

      setTimeout(() => {
        observer.disconnect()
        resolve(cls)
      }, 5000)
    })
  }

  static measureFCP(): Promise<number> {
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            observer.disconnect()
            resolve(entry.startTime)
          }
        }
      })

      observer.observe({ entryTypes: ['paint'] })
    })
  }

  static measureLCP(): Promise<number> {
    return new Promise((resolve) => {
      let lcp = 0

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        lcp = lastEntry.startTime
      })

      observer.observe({ entryTypes: ['largest-contentful-paint'] })

      setTimeout(() => {
        observer.disconnect()
        resolve(lcp)
      }, 5000)
    })
  }
}

// Main optimization manager
export class MobileOptimizationManager {
  private networkDetector: NetworkDetector
  private batteryOptimizer: BatteryOptimizer
  private lazyLoader: LazyLoader
  private settings: MobileOptimizationSettings

  constructor() {
    this.networkDetector = new NetworkDetector()
    this.batteryOptimizer = new BatteryOptimizer()
    this.lazyLoader = new LazyLoader()
    
    this.settings = {
      reduceAnimations: false,
      lowerImageQuality: false,
      disableAutoRefresh: false,
      reducePushNotifications: false
    }

    this.init()
  }

  async init() {
    await this.batteryOptimizer.init()
    this.updateOptimizationSettings()
    
    // Listen for network changes
    this.networkDetector.subscribe(() => {
      this.updateOptimizationSettings()
    })

    // Apply CSS optimizations
    this.applyCSSOptimizations()
  }

  private updateOptimizationSettings() {
    const networkInfo = this.networkDetector.getCurrentNetworkInfo()
    const batterySettings = this.batteryOptimizer.optimizeForBattery()
    const isSlowNetwork = this.networkDetector.isSlowConnection()
    const isLowMemory = MemoryManager.isLowMemoryDevice()

    this.settings = {
      reduceAnimations: batterySettings.reduceAnimations || isSlowNetwork || isLowMemory,
      lowerImageQuality: batterySettings.lowerImageQuality || isSlowNetwork,
      disableAutoRefresh: batterySettings.disableAutoRefresh || isSlowNetwork,
      reducePushNotifications: batterySettings.reducePushNotifications
    }

    // Notify app of setting changes
    window.dispatchEvent(new CustomEvent('mobile-optimization-updated', {
      detail: this.settings
    }))
  }

  private applyCSSOptimizations() {
    const style = document.createElement('style')
    style.textContent = `
      /* Touch optimizations */
      .touch-active {
        opacity: 0.7;
        transform: scale(0.98);
        transition: all 0.1s ease;
      }

      /* Reduce animations for performance */
      ${this.settings.reduceAnimations ? `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      ` : ''}

      /* Lazy loading images */
      img[data-src] {
        opacity: 0;
        transition: opacity 0.3s;
      }
      img[data-src].loaded {
        opacity: 1;
      }

      /* Scrollbar optimization */
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }

      /* GPU acceleration for smooth scrolling */
      .gpu-accelerated {
        transform: translateZ(0);
        will-change: transform;
      }
    `
    document.head.appendChild(style)
  }

  getSettings(): MobileOptimizationSettings {
    return { ...this.settings }
  }

  optimizeImages() {
    const images = document.querySelectorAll('img[data-src]')
    images.forEach(img => {
      this.lazyLoader.observeImage(img as HTMLImageElement)
    })
  }

  optimizeTouchTargets() {
    const touchTargets = document.querySelectorAll('button, a, [role="button"]')
    touchTargets.forEach(element => {
      TouchOptimizer.optimizeTouchEvents(element as HTMLElement)
    })
  }

  cleanup() {
    this.lazyLoader.disconnect()
  }
}

// Touch gesture optimization
export class TouchOptimizer {
  private static touchStartTime = 0
  private static touchStartPos = { x: 0, y: 0 }

  static optimizeTouchEvents(element: HTMLElement) {
    // Add touch feedback
    element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false })
    element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false })
    element.addEventListener('touchcancel', this.handleTouchCancel.bind(this))

    // Prevent 300ms click delay
    element.style.touchAction = 'manipulation'
  }

  private static handleTouchStart(e: TouchEvent) {
    this.touchStartTime = Date.now()
    this.touchStartPos = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }

    // Add visual feedback
    const target = e.currentTarget as HTMLElement
    target.classList.add('touch-active')

    // Haptic feedback for supported devices
    if ('vibrate' in navigator && this.shouldVibrateForElement(target)) {
      navigator.vibrate(10) // Light haptic feedback
    }
  }

  private static handleTouchEnd(e: TouchEvent) {
    const target = e.currentTarget as HTMLElement
    target.classList.remove('touch-active')

    // Calculate touch duration and movement
    const duration = Date.now() - this.touchStartTime
    const endPos = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    }
    
    const distance = Math.sqrt(
      Math.pow(endPos.x - this.touchStartPos.x, 2) +
      Math.pow(endPos.y - this.touchStartPos.y, 2)
    )

    // Only trigger click if it's a tap (short duration, minimal movement)
    if (duration < 300 && distance < 10) {
      // Custom tap event
      target.dispatchEvent(new CustomEvent('optimized-tap', {
        detail: { originalEvent: e, duration, distance }
      }))
    }
  }

  private static handleTouchCancel(e: TouchEvent) {
    const target = e.currentTarget as HTMLElement
    target.classList.remove('touch-active')
  }

  private static shouldVibrateForElement(element: HTMLElement): boolean {
    // Only vibrate for important actions
    return element.matches('button[type="submit"], .primary-button, .action-button')
  }
}

// Enhanced haptic feedback system
export class HapticFeedback {
  private static isSupported = 'vibrate' in navigator

  static light() {
    if (this.isSupported) {
      navigator.vibrate(10)
    }
  }

  static medium() {
    if (this.isSupported) {
      navigator.vibrate(50)
    }
  }

  static heavy() {
    if (this.isSupported) {
      navigator.vibrate([100, 50, 100])
    }
  }

  static success() {
    if (this.isSupported) {
      navigator.vibrate([50, 25, 50])
    }
  }

  static error() {
    if (this.isSupported) {
      navigator.vibrate([100, 100, 100])
    }
  }

  static notification() {
    if (this.isSupported) {
      navigator.vibrate([200, 100, 200])
    }
  }

  static selection() {
    if (this.isSupported) {
      navigator.vibrate(20)
    }
  }

  static impact() {
    if (this.isSupported) {
      navigator.vibrate([10, 10, 10])
    }
  }

  // Pattern for recipe actions
  static recipeAction(action: 'favorite' | 'share' | 'save' | 'delete') {
    if (!this.isSupported) return

    switch (action) {
      case 'favorite':
        navigator.vibrate([50, 25, 50, 25, 50]) // Heart beat pattern
        break
      case 'share':
        navigator.vibrate([30, 30, 30]) // Quick triple tap
        break
      case 'save':
        navigator.vibrate([100]) // Single confirmation
        break
      case 'delete':
        navigator.vibrate([200, 100, 200, 100, 200]) // Warning pattern
        break
    }
  }

  // Pattern for camera actions
  static cameraAction(action: 'capture' | 'focus' | 'error') {
    if (!this.isSupported) return

    switch (action) {
      case 'capture':
        navigator.vibrate([100, 50, 100]) // Camera shutter
        break
      case 'focus':
        navigator.vibrate([25]) // Light confirmation
        break
      case 'error':
        navigator.vibrate([200, 50, 200, 50, 200]) // Error pattern
        break
    }
  }
}

// Advanced image optimization
export class ImageOptimizer {
  private static canvas: HTMLCanvasElement | null = null
  private static ctx: CanvasRenderingContext2D | null = null

  private static getCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas')
      this.ctx = this.canvas.getContext('2d')!
    }
    return { canvas: this.canvas, ctx: this.ctx! }
  }

  // Compress image for mobile upload
  static async compressImage(
    file: File,
    options: {
      maxWidth?: number
      maxHeight?: number
      quality?: number
      format?: 'jpeg' | 'webp' | 'png'
    } = {}
  ): Promise<{ file: File; dataUrl: string }> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'jpeg'
    } = options

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        try {
          const { canvas, ctx } = this.getCanvas()

          // Calculate new dimensions
          let { width, height } = this.calculateDimensions(
            img.width,
            img.height,
            maxWidth,
            maxHeight
          )

          canvas.width = width
          canvas.height = height

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Image compression failed'))
                return
              }

              const compressedFile = new File([blob], file.name, {
                type: `image/${format}`,
                lastModified: Date.now()
              })

              const dataUrl = canvas.toDataURL(`image/${format}`, quality)
              resolve({ file: compressedFile, dataUrl })
            },
            `image/${format}`,
            quality
          )
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  // Generate responsive image sizes
  static async generateResponsiveSizes(
    file: File,
    sizes: number[] = [320, 640, 1024, 1920]
  ): Promise<{ size: number; file: File; dataUrl: string }[]> {
    const results = []

    for (const size of sizes) {
      try {
        const compressed = await this.compressImage(file, {
          maxWidth: size,
          maxHeight: size,
          quality: 0.8
        })
        results.push({ size, ...compressed })
      } catch (error) {
        console.warn(`Failed to generate ${size}px version:`, error)
      }
    }

    return results
  }

  // Convert to WebP if supported
  static async convertToWebP(file: File, quality = 0.8): Promise<File> {
    if (!this.supportsWebP()) {
      return file
    }

    const { file: webpFile } = await this.compressImage(file, {
      format: 'webp',
      quality
    })

    return webpFile
  }

  // Check WebP support
  static supportsWebP(): boolean {
    const { canvas } = this.getCanvas()
    return canvas.toDataURL('image/webp').indexOf('image/webp') === 5
  }

  // Check AVIF support
  static supportsAVIF(): boolean {
    const { canvas } = this.getCanvas()
    return canvas.toDataURL('image/avif').indexOf('image/avif') === 5
  }

  // Calculate optimal dimensions maintaining aspect ratio
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let width = originalWidth
    let height = originalHeight

    // Scale down if necessary
    if (width > maxWidth) {
      height = (height * maxWidth) / width
      width = maxWidth
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height
      height = maxHeight
    }

    return { width: Math.round(width), height: Math.round(height) }
  }

  // Optimize existing images on page
  static optimizePageImages() {
    const images = document.querySelectorAll('img')
    images.forEach(img => {
      // Add loading="lazy" if not already present
      if (!img.hasAttribute('loading')) {
        img.loading = 'lazy'
      }

      // Add decoding="async" for better performance
      if (!img.hasAttribute('decoding')) {
        img.decoding = 'async'
      }

      // Optimize src based on device pixel ratio
      this.optimizeImageSrc(img)
    })
  }

  private static optimizeImageSrc(img: HTMLImageElement) {
    const devicePixelRatio = window.devicePixelRatio || 1
    const containerWidth = img.offsetWidth || 300

    // Calculate optimal width
    const optimalWidth = Math.round(containerWidth * devicePixelRatio)

    // If image has srcset, let browser handle optimization
    if (img.srcset) return

    // Add size parameters to image URLs if they support it
    const src = img.src
    if (src.includes('unsplash.com') || src.includes('cloudinary.com')) {
      const separator = src.includes('?') ? '&' : '?'
      img.src = `${src}${separator}w=${optimalWidth}&q=80&fm=webp`
    }
  }
}

// Gesture recognition for advanced interactions
export class GestureRecognizer {
  private element: HTMLElement
  private startTime = 0
  private startPos = { x: 0, y: 0 }
  private currentPos = { x: 0, y: 0 }
  private velocity = { x: 0, y: 0 }
  private lastTime = 0
  private lastPos = { x: 0, y: 0 }

  constructor(element: HTMLElement) {
    this.element = element
    this.setupListeners()
  }

  private setupListeners() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false })
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false })
  }

  private handleTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) return

    const touch = e.touches[0]
    this.startTime = Date.now()
    this.lastTime = this.startTime
    this.startPos = { x: touch.clientX, y: touch.clientY }
    this.currentPos = { ...this.startPos }
    this.lastPos = { ...this.startPos }
    this.velocity = { x: 0, y: 0 }
  }

  private handleTouchMove(e: TouchEvent) {
    if (e.touches.length !== 1) return

    const touch = e.touches[0]
    const now = Date.now()
    const timeDelta = now - this.lastTime

    this.currentPos = { x: touch.clientX, y: touch.clientY }

    // Calculate velocity
    if (timeDelta > 0) {
      this.velocity = {
        x: (this.currentPos.x - this.lastPos.x) / timeDelta,
        y: (this.currentPos.y - this.lastPos.y) / timeDelta
      }
    }

    this.lastTime = now
    this.lastPos = { ...this.currentPos }

    // Emit move event
    this.element.dispatchEvent(new CustomEvent('gesture-move', {
      detail: {
        position: this.currentPos,
        startPosition: this.startPos,
        velocity: this.velocity,
        deltaX: this.currentPos.x - this.startPos.x,
        deltaY: this.currentPos.y - this.startPos.y
      }
    }))
  }

  private handleTouchEnd(e: TouchEvent) {
    const duration = Date.now() - this.startTime
    const deltaX = this.currentPos.x - this.startPos.x
    const deltaY = this.currentPos.y - this.startPos.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // Determine gesture type
    let gestureType = 'tap'

    if (duration > 500 && distance < 10) {
      gestureType = 'long-press'
    } else if (distance > 50) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        gestureType = deltaX > 0 ? 'swipe-right' : 'swipe-left'
      } else {
        gestureType = deltaY > 0 ? 'swipe-down' : 'swipe-up'
      }
    }

    // Check for fling gesture (fast swipe)
    const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y)
    if (speed > 0.5 && distance > 30) {
      gestureType = gestureType.replace('swipe', 'fling')
    }

    // Emit gesture event
    this.element.dispatchEvent(new CustomEvent('gesture-end', {
      detail: {
        type: gestureType,
        duration,
        distance,
        deltaX,
        deltaY,
        velocity: this.velocity,
        speed
      }
    }))

    // Specific gesture events
    this.element.dispatchEvent(new CustomEvent(`gesture-${gestureType}`, {
      detail: {
        duration,
        distance,
        deltaX,
        deltaY,
        velocity: this.velocity,
        speed
      }
    }))
  }

  destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this))
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this))
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this))
  }
}

// Export singleton instance
export const mobileOptimizer = new MobileOptimizationManager()