"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Camera, X, RotateCcw, Image as ImageIcon, Loader2, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  isCameraSupported,
  isMobileDevice,
  getCameraStream,
  switchCamera,
  captureImageAsFile,
  cleanupMediaStream,
  getCameraErrorMessage,
  hasMultipleCameras,
  type CameraFacingMode,
} from "@/lib/camera-utils"

interface CameraScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File) => void
  onGallerySelect?: () => void
}

type CameraState = 'idle' | 'loading' | 'ready' | 'error'

export function CameraScannerModal({
  isOpen,
  onClose,
  onCapture,
  onGallerySelect,
}: CameraScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const isInitializingRef = useRef(false)
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMobile = isMobileDevice()
  // Set initial facingMode based on device type
  // Mobile: use 'environment' (back camera) for food scanning
  // Desktop/Laptop: use 'user' (front camera) as default
  const [facingMode, setFacingMode] = useState<CameraFacingMode>(
    isMobile ? 'environment' : 'user'
  )
  const [cameraState, setCameraState] = useState<CameraState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)

  // Prevent zoom on mobile during camera use
  useEffect(() => {
    if (!isOpen || !isMobileDevice()) return

    let lastTouch = 0

    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    }

    const preventDoubleTapZoom = (e: TouchEvent) => {
      const now = Date.now()
      const timeSinceLastTouch = now - lastTouch
      lastTouch = now

      if (timeSinceLastTouch < 300) {
        e.preventDefault()
      }
    }

    document.addEventListener('touchstart', preventZoom, { passive: false })
    document.addEventListener('touchmove', preventZoom, { passive: false })
    document.addEventListener('touchend', preventDoubleTapZoom, { passive: false })

    // Prevent viewport zoom
    const viewport = document.querySelector('meta[name="viewport"]')
    const originalContent = viewport?.getAttribute('content') || ''
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    }

    return () => {
      document.removeEventListener('touchstart', preventZoom)
      document.removeEventListener('touchmove', preventZoom)
      document.removeEventListener('touchend', preventDoubleTapZoom)
      if (viewport) {
        viewport.setAttribute('content', originalContent)
      }
    }
  }, [isOpen])

  const cleanup = useCallback(() => {
    // Clear any pending timeouts
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current)
      cleanupTimeoutRef.current = null
    }
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current)
      initTimeoutRef.current = null
    }

    // Stop all tracks immediately
    if (streamRef.current) {
      cleanupMediaStream(streamRef.current)
      streamRef.current = null
    }
    
    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    // Reset state
    setCameraState('idle')
    setError(null)
    isInitializingRef.current = false
  }, [])

  const initializeCamera = useCallback(async () => {
    // Prevent multiple simultaneous initialization attempts
    if (isInitializingRef.current) {
      return
    }

    if (!isCameraSupported()) {
      setError('Camera is not supported on this device.')
      setCameraState('error')
      return
    }

    // Ensure any existing stream is cleaned up first
    if (streamRef.current) {
      cleanup()
      // Wait a bit for cleanup to complete before initializing
      await new Promise(resolve => setTimeout(resolve, 150))
    }

    isInitializingRef.current = true
    setCameraState('loading')
    setError(null)

    // Set timeout for camera initialization (10 seconds)
    const timeoutId = setTimeout(() => {
      if (isInitializingRef.current) {
        console.error('Camera initialization timeout')
        setError('Camera access timed out. Please try again.')
        setCameraState('error')
        isInitializingRef.current = false
        cleanup()
      }
    }, 10000)
    initTimeoutRef.current = timeoutId

    try {
      // Use device-aware camera stream with timeout (10s)
      const stream = await getCameraStream(facingMode, undefined, 10000)
      
      // Clear timeout if we got a stream
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current)
        initTimeoutRef.current = null
      }
      
      if (!stream) {
        throw new Error('Failed to access camera')
      }

      // Check if we're still supposed to be initializing (modal might have closed)
      if (!isInitializingRef.current) {
        cleanupMediaStream(stream)
        return
      }

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraState('ready')
        isInitializingRef.current = false
        
        // Check if multiple cameras are available (only relevant for mobile)
        if (isMobile) {
          try {
            const multipleCameras = await hasMultipleCameras()
            setHasMultipleCameras(multipleCameras)
          } catch {
            // If enumeration fails, assume single camera on desktop
            setHasMultipleCameras(false)
          }
        } else {
          // Desktop/laptop typically have single camera
          setHasMultipleCameras(false)
        }
      }
    } catch (err: any) {
      // Clear timeout on error
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current)
        initTimeoutRef.current = null
      }
      
      console.error('Camera initialization error:', err)
      
      // Handle specific error types
      const errorName = err?.name || ''
      if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
        setError('Camera is already in use by another application. Please close other apps using the camera and try again.')
      } else if (err.message === 'Camera access timeout') {
        setError('Camera access timed out. Please try again.')
      } else {
        setError(getCameraErrorMessage(err))
      }
      
      setCameraState('error')
      isInitializingRef.current = false
      cleanup()
    }
  }, [facingMode, cleanup, isMobile])

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure any previous cleanup is complete
      const initTimeout = setTimeout(() => {
        initializeCamera()
      }, 100)

      return () => {
        clearTimeout(initTimeout)
        cleanup()
      }
    } else {
      // Cleanup immediately when modal closes
      cleanup()
    }
  }, [isOpen, initializeCamera, cleanup])

  // Note: facingMode changes are handled by switchCameraMode function
  // which is called explicitly by user action, not via useEffect

  const switchCameraMode = useCallback(async () => {
    if (!streamRef.current || cameraState !== 'ready' || isInitializingRef.current) return

    setCameraState('loading')
    const newFacingMode: CameraFacingMode = facingMode === 'user' ? 'environment' : 'user'
    const oldStream = streamRef.current

    try {
      // Use timeout for camera switching (10s)
      const newStream = await switchCamera(oldStream, newFacingMode, undefined, 10000)
      
      if (!newStream) {
        throw new Error('Failed to switch camera')
      }

      streamRef.current = newStream

      if (videoRef.current) {
        videoRef.current.srcObject = newStream
        await videoRef.current.play()
        setFacingMode(newFacingMode)
        setCameraState('ready')
      }
    } catch (err: any) {
      console.error('Camera switch error:', err)
      const errorName = err?.name || ''
      if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
        setError('Camera is already in use. Please try again.')
      } else if (err.message === 'Camera access timeout') {
        setError('Camera switch timed out. Please try again.')
      } else {
        setError(getCameraErrorMessage(err))
      }
      setCameraState('error')
      // Cleanup on error
      if (oldStream) {
        cleanupMediaStream(oldStream)
      }
    }
  }, [facingMode, cameraState])

  const handleCapture = async () => {
    if (!videoRef.current || cameraState !== 'ready' || isCapturing) return

    setIsCapturing(true)

    try {
      const file = await captureImageAsFile(
        videoRef.current,
        `food-scan-${Date.now()}.jpg`,
        'image/jpeg',
        0.92
      )

      if (file) {
        onCapture(file)
        onClose()
      } else {
        setError('Failed to capture image. Please try again.')
      }
    } catch (err: any) {
      console.error('Capture error:', err)
      setError('Failed to capture image. Please try again.')
    } finally {
      setIsCapturing(false)
    }
  }

  const handleGallerySelect = () => {
    if (onGallerySelect) {
      onGallerySelect()
      onClose()
    }
  }

  const handleRetry = async () => {
    cleanup()
    // Wait for cleanup to complete before retrying
    await new Promise(resolve => setTimeout(resolve, 200))
    initializeCamera()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "p-0 gap-0 max-w-full w-full h-full sm:h-auto sm:max-w-2xl",
          "bg-black",
          isMobile && "rounded-none"
        )}
        showCloseButton={false}
      >
        <VisuallyHidden.Root>
          <DialogTitle>Camera Scanner</DialogTitle>
        </VisuallyHidden.Root>
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-11 w-11 rounded-full bg-black/50 text-white hover:bg-black/70 touch-manipulation"
            aria-label="Close camera"
          >
            <X size={20} />
          </Button>
          
          <div className="flex items-center gap-2">
            {/* Only show switch button on mobile devices with multiple cameras */}
            {isMobile && hasMultipleCameras && cameraState === 'ready' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={switchCameraMode}
                disabled={cameraState === 'loading'}
                className="h-11 w-11 rounded-full bg-black/50 text-white hover:bg-black/70 touch-manipulation disabled:opacity-50"
                aria-label="Switch camera"
              >
                <RotateCcw size={20} />
              </Button>
            )}
            {onGallerySelect && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleGallerySelect}
                className="h-11 w-11 rounded-full bg-black/50 text-white hover:bg-black/70 touch-manipulation"
                aria-label="Select from gallery"
              >
                <ImageIcon size={20} />
              </Button>
            )}
          </div>
        </div>

        {/* Camera Preview */}
        <div className="relative w-full bg-black" style={{ aspectRatio: '4/3' }}>
          {cameraState === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="flex flex-col items-center gap-4 text-white">
                <Loader2 size={32} className="animate-spin" />
                <p className="text-sm">Starting camera...</p>
              </div>
            </div>
          )}

          {cameraState === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 bg-black text-white">
              <AlertCircle size={48} className="text-red-500" />
              <p className="text-center text-sm">{error || 'Failed to access camera'}</p>
              <Button
                onClick={handleRetry}
                variant="outline"
                className="mt-2 bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                Try Again
              </Button>
            </div>
          )}

          {cameraState === 'ready' && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
              }}
              onTouchStart={(e) => {
                // Prevent default touch behavior that might interfere with camera
                e.stopPropagation()
              }}
            />
          )}

          {/* Loading overlay during capture */}
          {isCapturing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 size={32} className="animate-spin text-white" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex flex-col items-center gap-4">
            {/* Capture Button */}
            <Button
              onClick={handleCapture}
              disabled={cameraState !== 'ready' || isCapturing}
              size="lg"
              className={cn(
                "h-16 w-16 rounded-full",
                "bg-white hover:bg-white/90 active:bg-white/80",
                "border-4 border-white/30",
                "shadow-lg",
                "touch-manipulation",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all active:scale-90",
                "min-h-[64px] min-w-[64px]"
              )}
              aria-label="Capture photo"
              onTouchStart={(e) => {
                // Prevent event bubbling that might cause issues
                e.stopPropagation()
              }}
            >
              {isCapturing ? (
                <Loader2 size={24} className="animate-spin text-black" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-white border-2 border-gray-300" />
              )}
            </Button>

            {/* Instructions */}
            <p className="text-white text-sm text-center">
              {cameraState === 'ready'
                ? 'Position your food in the frame and tap to capture'
                : cameraState === 'loading'
                ? 'Starting camera...'
                : 'Camera not available'}
            </p>
          </div>
        </div>

        {/* Description for accessibility */}
        <DialogDescription className="sr-only">
          Camera scanner for capturing food images. Use the capture button to take a photo,
          or switch cameras using the rotate button.
        </DialogDescription>
      </DialogContent>
    </Dialog>
  )
}

