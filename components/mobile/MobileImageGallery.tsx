'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'

interface GalleryImage {
  id: string
  src: string
  alt: string
  title?: string
  description?: string
  nutritionFacts?: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

interface MobileImageGalleryProps {
  images: GalleryImage[]
  initialIndex?: number
  onClose?: () => void
  onImageChange?: (index: number, image: GalleryImage) => void
  showNutritionInfo?: boolean
  className?: string
}

export default function MobileImageGallery({
  images,
  initialIndex = 0,
  onClose,
  onImageChange,
  showNutritionInfo = true,
  className = ''
}: MobileImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isZoomed, setIsZoomed] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [touchStart, setTouchStart] = useState(0)
  const [imageScale, setImageScale] = useState(1)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastTapRef = useRef(0)

  const currentImage = images[currentIndex]

  // Preload adjacent images for smooth swiping
  useEffect(() => {
    const preloadImages = () => {
      const toPreload = [
        images[currentIndex - 1],
        images[currentIndex + 1]
      ].filter(Boolean)

      toPreload.forEach(image => {
        const img = new Image()
        img.src = image.src
      })
    }

    preloadImages()
  }, [currentIndex, images])

  // Handle image change callback
  useEffect(() => {
    if (onImageChange && currentImage) {
      onImageChange(currentIndex, currentImage)
    }
  }, [currentIndex, currentImage, onImageChange])

  // Navigation functions
  const goToNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setImageLoading(true)
      resetZoom()
    }
  }, [currentIndex, images.length])

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setImageLoading(true)
      resetZoom()
    }
  }, [currentIndex])

  const resetZoom = () => {
    setImageScale(1)
    setImagePosition({ x: 0, y: 0 })
    setIsZoomed(false)
  }

  // Touch gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStart(touch.clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return

    const touch = e.changedTouches[0]
    const diff = touchStart - touch.clientX
    const threshold = 50

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goToNext()
      } else {
        goToPrevious()
      }
    }

    setTouchStart(0)
  }

  // Double tap to zoom
  const handleDoubleTap = (e: React.TouchEvent) => {
    e.preventDefault()
    const now = Date.now()
    const timeDiff = now - lastTapRef.current

    if (timeDiff < 300 && timeDiff > 0) {
      toggleZoom(e)
    }

    lastTapRef.current = now
  }

  const toggleZoom = (e: React.TouchEvent) => {
    if (isZoomed) {
      resetZoom()
    } else {
      const rect = e.currentTarget.getBoundingClientRect()
      const touch = e.touches[0] || e.changedTouches[0]
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top
      
      // Center zoom on tap location
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const offsetX = (centerX - x) * 1.5
      const offsetY = (centerY - y) * 1.5

      setImageScale(2.5)
      setImagePosition({ x: offsetX, y: offsetY })
      setIsZoomed(true)
    }

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }

  // Pan gesture for zoomed images
  const handlePan = (event: any, info: PanInfo) => {
    if (isZoomed) {
      setImagePosition({
        x: imagePosition.x + info.delta.x,
        y: imagePosition.y + info.delta.y
      })
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevious()
          break
        case 'ArrowRight':
          goToNext()
          break
        case 'Escape':
          onClose?.()
          break
        case ' ':
          e.preventDefault()
          setShowInfo(!showInfo)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [goToNext, goToPrevious, onClose, showInfo])

  if (!currentImage) return null

  return (
    <div className={`fixed inset-0 bg-black z-50 flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white bg-black/50 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div>
            <h2 className="font-semibold text-lg">{currentImage.title || 'Image'}</h2>
            <p className="text-sm text-gray-300">{currentIndex + 1} sur {images.length}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {showNutritionInfo && currentImage.nutritionFacts && (
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          
          {/* Share button */}
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: currentImage.title,
                  text: currentImage.description,
                  url: currentImage.src
                })
              }
            }}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main image container */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="relative w-full h-full flex items-center justify-center"
          >
            <motion.img
              ref={imageRef}
              src={currentImage.src}
              alt={currentImage.alt}
              className="max-w-full max-h-full object-contain select-none"
              style={{
                scale: imageScale,
                x: imagePosition.x,
                y: imagePosition.y
              }}
              drag={isZoomed}
              onPan={handlePan}
              onTouchStart={handleDoubleTap}
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
              whileTap={{ scale: isZoomed ? imageScale : 0.95 }}
            />

            {/* Loading indicator */}
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        {currentIndex > 0 && (
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {currentIndex < images.length - 1 && (
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Zoom indicator */}
        {isZoomed && (
          <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {Math.round(imageScale * 100)}%
          </div>
        )}
      </div>

      {/* Nutrition info overlay */}
      <AnimatePresence>
        {showInfo && currentImage.nutritionFacts && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm text-white p-6"
          >
            <div className="max-w-4xl mx-auto">
              <h3 className="text-lg font-semibold mb-4">Informations nutritionnelles</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {currentImage.nutritionFacts.calories}
                  </div>
                  <div className="text-sm text-gray-300">Calories</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {currentImage.nutritionFacts.protein}g
                  </div>
                  <div className="text-sm text-gray-300">Protéines</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {currentImage.nutritionFacts.carbs}g
                  </div>
                  <div className="text-sm text-gray-300">Glucides</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {currentImage.nutritionFacts.fat}g
                  </div>
                  <div className="text-sm text-gray-300">Lipides</div>
                </div>
              </div>
              
              {currentImage.description && (
                <p className="text-gray-300 mt-4 text-sm leading-relaxed">
                  {currentImage.description}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image counter dots */}
      <div className="flex items-center justify-center space-x-2 p-4 bg-black/50">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-white' : 'bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

// Helper hook for using the gallery
export const useMobileImageGallery = (images: GalleryImage[]) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const openGallery = (index: number = 0) => {
    setCurrentIndex(index)
    setIsOpen(true)
  }

  const closeGallery = () => {
    setIsOpen(false)
  }

  return {
    isOpen,
    currentIndex,
    openGallery,
    closeGallery,
    GalleryComponent: () => isOpen ? (
      <MobileImageGallery
        images={images}
        initialIndex={currentIndex}
        onClose={closeGallery}
        onImageChange={(index) => setCurrentIndex(index)}
      />
    ) : null
  }
}