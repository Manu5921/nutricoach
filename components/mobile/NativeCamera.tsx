'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface NativeCameraProps {
  onCapture?: (imageData: string, file: File, metadata?: CaptureMetadata) => void
  onClose?: () => void
  quality?: number
  maxWidth?: number
  maxHeight?: number
  enableMotionTracking?: boolean
  enableStabilization?: boolean
  className?: string
}

interface CaptureMetadata {
  timestamp: number
  deviceOrientation?: number
  motionData?: {
    acceleration: DeviceMotionEventAcceleration | null
    rotationRate: DeviceMotionEventRotationRate | null
  }
  location?: {
    latitude: number
    longitude: number
  }
  lighting?: 'low' | 'medium' | 'high'
  stability?: 'stable' | 'unstable'
}

interface CapturedPhoto {
  dataUrl: string
  file: File
  timestamp: number
}

export default function NativeCamera({
  onCapture,
  onClose,
  quality = 0.8,
  maxWidth = 1920,
  maxHeight = 1080,
  enableMotionTracking = true,
  enableStabilization = true,
  className = ''
}: NativeCameraProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off')
  const [cameraMode, setCameraMode] = useState<'environment' | 'user'>('environment')
  const [isProcessing, setIsProcessing] = useState(false)
  const [motionData, setMotionData] = useState<{
    acceleration: DeviceMotionEventAcceleration | null
    rotationRate: DeviceMotionEventRotationRate | null
  } | null>(null)
  const [deviceOrientation, setDeviceOrientation] = useState<number>(0)
  const [stability, setStability] = useState<'stable' | 'unstable'>('stable')
  const [lightingLevel, setLightingLevel] = useState<'low' | 'medium' | 'high'>('medium')

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stabilityBuffer = useRef<number[]>([])
  const motionThreshold = 2.0 // Threshold for determining stability

  // Initialize camera
  const initCamera = useCallback(async () => {
    try {
      setError(null)
      
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      // Get camera constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: cameraMode,
          width: { ideal: maxWidth },
          height: { ideal: maxHeight }
        },
        audio: false
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
        setIsActive(true)
      }

    } catch (err) {
      console.error('Camera initialization failed:', err)
      setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.')
    }
  }, [stream, cameraMode, maxWidth, maxHeight])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  // Motion tracking setup
  useEffect(() => {
    if (!enableMotionTracking) return

    let motionPermissionGranted = false

    // Request device motion permission (iOS 13+)
    const requestMotionPermission = async () => {
      if (typeof (DeviceMotionEvent as any)?.requestPermission === 'function') {
        try {
          const permission = await (DeviceMotionEvent as any).requestPermission()
          motionPermissionGranted = permission === 'granted'
        } catch (error) {
          console.warn('Motion permission request failed:', error)
        }
      } else {
        motionPermissionGranted = true // Android or older iOS
      }
    }

    // Handle device motion
    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      if (!motionPermissionGranted) return

      const { acceleration, rotationRate } = event
      setMotionData({ acceleration, rotationRate })

      // Calculate stability based on acceleration
      if (acceleration && (acceleration.x !== null || acceleration.y !== null || acceleration.z !== null)) {
        const totalAcceleration = Math.sqrt(
          (acceleration.x || 0) ** 2 + 
          (acceleration.y || 0) ** 2 + 
          (acceleration.z || 0) ** 2
        )
        
        // Add to stability buffer
        stabilityBuffer.current.push(totalAcceleration)
        if (stabilityBuffer.current.length > 10) {
          stabilityBuffer.current.shift()
        }
        
        // Calculate average acceleration
        const avgAcceleration = stabilityBuffer.current.reduce((a, b) => a + b, 0) / stabilityBuffer.current.length
        setStability(avgAcceleration < motionThreshold ? 'stable' : 'unstable')
      }
    }

    // Handle device orientation
    const handleOrientationChange = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        setDeviceOrientation(event.alpha)
      }
    }

    // Setup motion tracking
    requestMotionPermission().then(() => {
      if (motionPermissionGranted) {
        window.addEventListener('devicemotion', handleDeviceMotion)
        window.addEventListener('deviceorientation', handleOrientationChange)
      }
    })

    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion)
      window.removeEventListener('deviceorientation', handleOrientationChange)
    }
  }, [enableMotionTracking])

  // Lighting level detection
  useEffect(() => {
    if (!videoRef.current || !isActive) return

    const detectLighting = () => {
      if (!videoRef.current || !canvasRef.current) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')!

      // Create a small canvas for sampling
      const sampleCanvas = document.createElement('canvas')
      const sampleContext = sampleCanvas.getContext('2d')!
      sampleCanvas.width = 100
      sampleCanvas.height = 100

      // Draw video frame to sample canvas
      sampleContext.drawImage(video, 0, 0, 100, 100)
      
      // Get image data and calculate brightness
      const imageData = sampleContext.getImageData(0, 0, 100, 100)
      const data = imageData.data
      let brightness = 0

      for (let i = 0; i < data.length; i += 4) {
        brightness += (data[i] + data[i + 1] + data[i + 2]) / 3
      }
      
      brightness = brightness / (data.length / 4)
      
      // Determine lighting level
      if (brightness < 80) {
        setLightingLevel('low')
      } else if (brightness < 180) {
        setLightingLevel('medium')
      } else {
        setLightingLevel('high')
      }
    }

    const interval = setInterval(detectLighting, 1000)
    return () => clearInterval(interval)
  }, [isActive])

  // Start camera when component mounts
  useEffect(() => {
    initCamera()
  }, [initCamera])

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isActive) return

    setIsProcessing(true)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')!

      // Set canvas size to video dimensions
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to blob with compression
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      
      // Create file from canvas
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!)
        }, 'image/jpeg', quality)
      })

      const file = new File([blob], `photo_${Date.now()}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now()
      })

      const photo: CapturedPhoto = {
        dataUrl,
        file,
        timestamp: Date.now()
      }

      setCapturedPhoto(photo)

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100])
      }

    } catch (err) {
      console.error('Photo capture failed:', err)
      setError('Erreur lors de la capture de la photo.')
    } finally {
      setIsProcessing(false)
    }
  }, [isActive, quality])

  const confirmPhoto = async () => {
    if (capturedPhoto) {
      // Gather metadata
      const metadata: CaptureMetadata = {
        timestamp: capturedPhoto.timestamp,
        deviceOrientation,
        motionData,
        lighting: lightingLevel,
        stability
      }

      // Get location if available
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: false
            })
          })
          metadata.location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
        } catch (error) {
          console.warn('Could not get location:', error)
        }
      }

      onCapture?.(capturedPhoto.dataUrl, capturedPhoto.file, metadata)
      closeCamera()
    }
  }

  const retakePhoto = () => {
    setCapturedPhoto(null)
  }

  const switchCamera = () => {
    setCameraMode(prev => prev === 'environment' ? 'user' : 'environment')
  }

  const toggleFlash = () => {
    setFlashMode(prev => {
      const modes: Array<'off' | 'on' | 'auto'> = ['off', 'on', 'auto']
      const currentIndex = modes.indexOf(prev)
      return modes[(currentIndex + 1) % modes.length]
    })
  }

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    setStream(null)
    setIsActive(false)
    setCapturedPhoto(null)
    onClose?.()
  }

  const getFlashIcon = () => {
    switch (flashMode) {
      case 'on': return '⚡'
      case 'auto': return '🔄'
      default: return '❌'
    }
  }

  if (error) {
    return (
      <div className={`fixed inset-0 bg-black z-50 flex items-center justify-center ${className}`}>
        <div className="bg-white rounded-lg p-6 m-4 max-w-sm w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">📷</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Problème de caméra
            </h3>
            <p className="text-gray-600 mb-4">
              {error}
            </p>
            <div className="space-y-2">
              <button
                className="w-full py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                onClick={initCamera}
              >
                Réessayer
              </button>
              <button
                className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                onClick={closeCamera}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`fixed inset-0 bg-black z-50 ${className}`}>
      {/* Camera View */}
      <div className="relative w-full h-full">
        {!capturedPhoto ? (
          <>
            {/* Video Stream */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            
            {/* Canvas for capture (hidden) */}
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            
            {/* Camera Controls Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Top Controls */}
              <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent pointer-events-auto">
                <div className="flex items-center justify-between">
                  <button
                    className="p-2 rounded-full bg-black/30 text-white"
                    onClick={closeCamera}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      className="p-2 rounded-full bg-black/30 text-white text-lg"
                      onClick={toggleFlash}
                    >
                      {getFlashIcon()}
                    </button>
                    
                    <button
                      className="p-2 rounded-full bg-black/30 text-white"
                      onClick={switchCamera}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Center Focus Guide with Stability Indicator */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`w-64 h-64 border-2 rounded-lg transition-colors ${
                  stability === 'stable' ? 'border-green-400/70' : 'border-red-400/70'
                }`}>
                  <div className={`w-full h-full border rounded-lg m-1 transition-colors ${
                    stability === 'stable' ? 'border-green-300/50' : 'border-red-300/50'
                  }`} />
                </div>
              </div>

              {/* Motion & Environment Indicators */}
              {enableMotionTracking && (
                <div className="absolute top-20 left-4 pointer-events-none">
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white text-xs space-y-2">
                    {/* Stability Indicator */}
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        stability === 'stable' ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <span className="capitalize">{stability}</span>
                    </div>
                    
                    {/* Lighting Indicator */}
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        lightingLevel === 'high' ? 'bg-yellow-400' :
                        lightingLevel === 'medium' ? 'bg-blue-400' : 'bg-purple-400'
                      }`} />
                      <span>Éclairage {lightingLevel === 'high' ? 'fort' : 
                                      lightingLevel === 'medium' ? 'moyen' : 'faible'}</span>
                    </div>
                    
                    {/* Orientation Indicator */}
                    {deviceOrientation !== 0 && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full" />
                        <span>{Math.round(deviceOrientation)}°</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stabilization Tip */}
              {stability === 'unstable' && enableStabilization && (
                <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 pointer-events-none">
                  <div className="bg-red-500/90 backdrop-blur-sm rounded-lg p-3 text-white text-sm text-center max-w-xs">
                    <div className="font-medium mb-1">📱 Stabilisez l'appareil</div>
                    <div className="text-xs">Tenez fermement pour une meilleure qualité</div>
                  </div>
                </div>
              )}
              
              {/* Bottom Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent pointer-events-auto">
                <div className="flex items-center justify-center">
                  <button
                    className={`w-20 h-20 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all ${
                      isProcessing ? 'scale-95 opacity-50' : 'hover:scale-105 active:scale-95'
                    }`}
                    onClick={capturePhoto}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                        <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
                
                <div className="text-center mt-4">
                  <p className="text-white/80 text-sm">
                    Centrez l'aliment dans le cadre et appuyez pour capturer
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Photo Preview */}
            <img
              src={capturedPhoto.dataUrl}
              alt="Photo capturée"
              className="w-full h-full object-cover"
            />
            
            {/* Photo Actions Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
              <div className="flex items-center justify-center space-x-4">
                <button
                  className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors"
                  onClick={retakePhoto}
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Reprendre</span>
                  </div>
                </button>
                
                <button
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  onClick={confirmPhoto}
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Confirmer</span>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}