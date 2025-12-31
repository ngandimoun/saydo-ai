/**
 * Camera Utilities
 * 
 * Helper functions for camera access, device enumeration,
 * permission handling, and stream management.
 */

export type CameraFacingMode = 'user' | 'environment' | 'left' | 'right'

export interface CameraDevice {
  deviceId: string
  label: string
  facingMode?: CameraFacingMode
}

export interface CameraPermissionStatus {
  granted: boolean
  denied: boolean
  prompt: boolean
}

/**
 * Check if camera API is available in the current environment
 */
export function isCameraSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'mediaDevices' in navigator &&
    'getUserMedia' in navigator.mediaDevices
  )
}

/**
 * Check if running on a mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || 
  (window.matchMedia && window.matchMedia('(max-width: 768px)').matches)
}

/**
 * Request camera permission
 * Returns the permission status
 */
export async function requestCameraPermission(): Promise<CameraPermissionStatus> {
  if (!isCameraSupported()) {
    return { granted: false, denied: true, prompt: false }
  }

  try {
    // Try to get permission status (if supported)
    if ('permissions' in navigator && 'query' in navigator.permissions) {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
      return {
        granted: result.state === 'granted',
        denied: result.state === 'denied',
        prompt: result.state === 'prompt'
      }
    }
    
    // Fallback: try to access camera to trigger permission
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    stream.getTracks().forEach(track => track.stop())
    return { granted: true, denied: false, prompt: false }
  } catch (error: any) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return { granted: false, denied: true, prompt: false }
    }
    return { granted: false, denied: false, prompt: true }
  }
}

/**
 * Get all available camera devices
 */
export async function getCameraDevices(): Promise<CameraDevice[]> {
  if (!isCameraSupported()) {
    return []
  }

  try {
    // First, we need to get user media to enumerate devices
    // (browsers require this for security)
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    
    // Stop the stream immediately
    stream.getTracks().forEach(track => track.stop())
    
    // Now enumerate devices
    const devices = await navigator.mediaDevices.enumerateDevices()
    const videoDevices = devices
      .filter(device => device.kind === 'videoinput')
      .map(device => {
        // Try to determine facing mode from label
        const label = device.label.toLowerCase()
        let facingMode: CameraFacingMode | undefined
        
        if (label.includes('front') || label.includes('user') || label.includes('facing')) {
          facingMode = 'user'
        } else if (label.includes('back') || label.includes('environment') || label.includes('rear')) {
          facingMode = 'environment'
        }
        
        return {
          deviceId: device.deviceId,
          label: device.label || 'Camera',
          facingMode
        }
      })
    
    return videoDevices
  } catch (error) {
    console.error('Error enumerating camera devices:', error)
    return []
  }
}

/**
 * Check if device has multiple cameras available
 */
export async function hasMultipleCameras(): Promise<boolean> {
  if (!isCameraSupported()) {
    return false
  }

  try {
    const devices = await getCameraDevices()
    return devices.length > 1
  } catch (error) {
    console.error('Error checking for multiple cameras:', error)
    return false
  }
}

/**
 * Get camera stream with specified facing mode
 * Automatically detects device type and adjusts constraints accordingly
 * 
 * @param facingMode - Desired camera facing mode (only used on mobile devices)
 * @param deviceId - Specific device ID to use (optional)
 * @param timeout - Timeout in milliseconds (default: 10000)
 */
export async function getCameraStream(
  facingMode: CameraFacingMode = 'environment',
  deviceId?: string,
  timeout: number = 10000
): Promise<MediaStream | null> {
  if (!isCameraSupported()) {
    return null
  }

  const isMobile = isMobileDevice()
  
  // Progressive fallback strategy
  const attempts: Array<() => Promise<MediaStream>> = []

  // Attempt 1: Use specific deviceId if provided
  if (deviceId) {
    attempts.push(async () => {
      return navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
    })
  }

  // Attempt 2: Device-aware constraints
  if (isMobile) {
    // On mobile: use facingMode constraint
    attempts.push(async () => {
      return navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
    })
  }
  // Note: On desktop/laptop, we skip facingMode entirely as most desktop cameras
  // don't support this constraint. We go straight to Attempt 3 (any camera).

  // Attempt 3: Try without facingMode constraint (any camera)
  attempts.push(async () => {
    return navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    })
  })

  // Attempt 4: Minimal constraints (fallback)
  attempts.push(async () => {
    return navigator.mediaDevices.getUserMedia({ video: true })
  })

  // Try each attempt with its own timeout
  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i]
    const isLastAttempt = i === attempts.length - 1
    
    try {
      // Create a new timeout promise for each attempt
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Camera access timeout'))
        }, timeout)
      })

      const stream = await Promise.race([
        attempt(),
        timeoutPromise
      ])
      return stream as MediaStream
    } catch (error: any) {
      // If it's a timeout, don't try other attempts
      if (error.message === 'Camera access timeout') {
        console.error('Camera access timeout after', timeout, 'ms on attempt', i + 1)
        return null
      }
      
      // Log the error for debugging
      console.warn(`Camera attempt ${i + 1} failed:`, error.name || error.message)
      
      // If it's the last attempt, return null
      if (isLastAttempt) {
        console.error('All camera access attempts failed. Last error:', error)
        return null
      }
      
      // Otherwise, try next attempt
      continue
    }
  }

  return null
}

/**
 * Switch camera stream
 * Stops the old stream and starts a new one with different facing mode
 */
export async function switchCamera(
  currentStream: MediaStream | null,
  newFacingMode: CameraFacingMode,
  deviceId?: string,
  timeout: number = 10000
): Promise<MediaStream | null> {
  // Clean up old stream
  if (currentStream) {
    cleanupMediaStream(currentStream)
  }

  // Get new stream with timeout
  return getCameraStream(newFacingMode, deviceId, timeout)
}

/**
 * Capture image from video stream
 * Returns a Blob of the captured image
 */
export async function captureImageFromStream(
  videoElement: HTMLVideoElement,
  format: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality: number = 0.92
): Promise<Blob | null> {
  if (!videoElement || videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
    return null
  }

  try {
    const canvas = document.createElement('canvas')
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
    
    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        format,
        quality
      )
    })
  } catch (error) {
    console.error('Error capturing image:', error)
    return null
  }
}

/**
 * Capture image from video stream and convert to File
 */
export async function captureImageAsFile(
  videoElement: HTMLVideoElement,
  filename: string = `camera-capture-${Date.now()}.jpg`,
  format: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality: number = 0.92
): Promise<File | null> {
  const blob = await captureImageFromStream(videoElement, format, quality)
  if (!blob) return null
  
  return new File([blob], filename, { type: format })
}

/**
 * Clean up media stream
 * Stops all tracks to release camera
 */
export function cleanupMediaStream(stream: MediaStream | null): void {
  if (!stream) return
  
  stream.getTracks().forEach(track => {
    track.stop()
  })
}

/**
 * Get error message for camera errors
 */
export function getCameraErrorMessage(error: Error | DOMException): string {
  const errorName = error.name || ''
  
  switch (errorName) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Camera permission denied. Please enable camera access in your browser settings.'
    
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No camera found on this device.'
    
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Camera is already in use by another application.'
    
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return 'Camera does not support the requested settings.'
    
    case 'NotSupportedError':
      return 'Camera is not supported on this device or browser.'
    
    case 'AbortError':
      return 'Camera access was aborted.'
    
    default:
      return 'Failed to access camera. Please try again.'
  }
}

