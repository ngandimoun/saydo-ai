/**
 * Cross-Platform Audio Player
 * 
 * Unified audio player interface that works across:
 * - Web browsers (HTML5 Audio API)
 * - iOS PWA (Web Audio API with fallback)
 * - Android PWA (MediaPlayer via Capacitor if needed)
 * 
 * Features:
 * - Streaming from Supabase Storage
 * - Progress tracking
 * - Playlist management
 * - Background playback (mobile)
 * - Preloading and buffering
 */

export interface AudioPlayerCallbacks {
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  onTimeUpdate?: (currentTime: number) => void
  onError?: (error: Error) => void
  onLoadedMetadata?: (duration: number) => void
  onCanPlay?: () => void
}

/**
 * HTML5 Audio Error Codes
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MediaError
 */
const MEDIA_ERR_ABORTED = 1
const MEDIA_ERR_NETWORK = 2
const MEDIA_ERR_DECODE = 3
const MEDIA_ERR_SRC_NOT_SUPPORTED = 4

/**
 * Audio Network State
 * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/networkState
 */
const NETWORK_EMPTY = 0
const NETWORK_IDLE = 1
const NETWORK_LOADING = 2
const NETWORK_NO_SOURCE = 3

/**
 * Check if a URL is a mock/placeholder URL that won't work
 */
export function isMockAudioUrl(url: string | null): boolean {
  if (!url) return true
  
  // Check for common mock/placeholder patterns
  const mockPatterns = [
    /^\/mock\//,           // /mock/ directory
    /^\/placeholder\//,    // /placeholder/ directory
    /placeholder\./,       // placeholder.mp3, etc.
    /^mock-/,              // mock-audio.mp3
    /^#$/,                 // Empty hash
    /^about:blank$/,       // about:blank
  ]
  
  return mockPatterns.some(pattern => pattern.test(url))
}

/**
 * Check if a URL appears to be a valid audio URL
 */
export function isValidAudioUrl(url: string | null): boolean {
  if (!url || url.trim() === '') return false
  if (isMockAudioUrl(url)) return false
  
  // Must be a valid URL format (http/https or valid relative path to real file)
  try {
    // Check if it's an absolute URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      new URL(url)
      return true
    }
    
    // For relative URLs, just ensure it's not a mock pattern
    return !isMockAudioUrl(url)
  } catch {
    return false
  }
}

/**
 * Maps HTML5 Audio error codes to human-readable error messages
 * Enhanced to detect network state and provide better diagnostics
 */
function getAudioErrorMessage(
  error: MediaError | null, 
  url: string | null,
  networkState?: number
): string {
  // Check for mock URLs first - provide clear message
  if (isMockAudioUrl(url)) {
    return `Audio unavailable: This is placeholder content (URL: ${url})`
  }

  // Check network state for additional context
  if (networkState === NETWORK_NO_SOURCE) {
    return `Audio source not found or inaccessible${url ? ` (URL: ${url})` : ''}`
  }

  if (!error) {
    // No MediaError but we got an error event - likely network issue
    if (networkState === NETWORK_EMPTY || networkState === NETWORK_NO_SOURCE) {
      return `Failed to load audio - file may not exist${url ? ` (URL: ${url})` : ''}`
    }
    return `Audio loading failed${url ? ` (URL: ${url})` : ''}`
  }

  const errorCode = error.code
  let baseMessage = ''

  switch (errorCode) {
    case MEDIA_ERR_ABORTED:
      baseMessage = 'Audio loading was aborted'
      break
    case MEDIA_ERR_NETWORK:
      baseMessage = 'Network error while loading audio'
      break
    case MEDIA_ERR_DECODE:
      baseMessage = 'Error decoding audio file'
      break
    case MEDIA_ERR_SRC_NOT_SUPPORTED:
      baseMessage = 'Audio format not supported or file not found'
      break
    default:
      baseMessage = 'Audio playback error'
  }

  // Include error message if available
  const errorMessage = error.message || ''
  if (errorMessage) {
    baseMessage += `: ${errorMessage}`
  }

  // Include URL for debugging
  if (url) {
    baseMessage += ` (URL: ${url})`
  }

  return baseMessage
}

export class AudioPlayer {
  private audio: HTMLAudioElement | null = null
  private callbacks: AudioPlayerCallbacks = {}
  private currentUrl: string | null = null
  private isInitialized = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio()
      this.setupEventListeners()
      this.isInitialized = true
    }
  }

  private setupEventListeners() {
    if (!this.audio) return

    this.audio.addEventListener('play', () => {
      this.callbacks.onPlay?.()
    })

    this.audio.addEventListener('pause', () => {
      this.callbacks.onPause?.()
    })

    this.audio.addEventListener('ended', () => {
      this.callbacks.onEnded?.()
    })

    this.audio.addEventListener('timeupdate', () => {
      if (this.audio) {
        this.callbacks.onTimeUpdate?.(this.audio.currentTime)
      }
    })

    this.audio.addEventListener('error', (e) => {
      const mediaError = this.audio?.error || null
      const networkState = this.audio?.networkState
      const errorMessage = getAudioErrorMessage(mediaError, this.currentUrl, networkState)
      const error = new Error(errorMessage)
      
      // Add additional context to error object for debugging
      if (mediaError) {
        ;(error as any).code = mediaError.code
        ;(error as any).mediaError = mediaError
      }
      if (this.currentUrl) {
        ;(error as any).url = this.currentUrl
      }
      ;(error as any).networkState = networkState
      ;(error as any).isMockUrl = isMockAudioUrl(this.currentUrl)
      
      this.callbacks.onError?.(error)
    })

    this.audio.addEventListener('loadedmetadata', () => {
      if (this.audio) {
        this.callbacks.onLoadedMetadata?.(this.audio.duration)
      }
    })

    this.audio.addEventListener('canplay', () => {
      this.callbacks.onCanPlay?.()
    })
  }

  /**
   * Set the audio source URL
   * @returns true if source was set, false if URL is invalid/mock
   */
  setSource(url: string): boolean {
    if (!this.audio) {
      throw new Error('Audio player not initialized')
    }

    if (this.currentUrl === url) {
      return !isMockAudioUrl(url) // Already set, return validity
    }

    this.currentUrl = url
    
    // Check if this is a mock/invalid URL
    if (isMockAudioUrl(url)) {
      // Don't set the source for mock URLs - this prevents error spam
      // The caller should handle this gracefully
      return false
    }

    this.audio.src = url
    
    // Preload the audio
    this.audio.preload = 'auto'
    
    // For mobile, ensure we can play in background
    if (this.audio.setAttribute) {
      this.audio.setAttribute('playsinline', 'true')
      this.audio.setAttribute('webkit-playsinline', 'true')
    }
    
    return true
  }

  /**
   * Get the current audio source URL
   */
  getCurrentUrl(): string | null {
    return this.currentUrl
  }

  /**
   * Check if current source is a valid (non-mock) audio URL
   */
  hasValidSource(): boolean {
    return isValidAudioUrl(this.currentUrl)
  }

  /**
   * Set callbacks for audio events
   */
  setCallbacks(callbacks: AudioPlayerCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  /**
   * Play the audio
   * @throws Error if audio unavailable (mock URL) or autoplay blocked
   */
  async play(): Promise<void> {
    if (!this.audio) {
      throw new Error('Audio player not initialized')
    }

    // Check if we have a valid source
    if (isMockAudioUrl(this.currentUrl)) {
      const error = new Error('Audio unavailable: This is placeholder content')
      ;(error as any).isMockUrl = true
      ;(error as any).url = this.currentUrl
      throw error
    }

    try {
      await this.audio.play()
    } catch (error) {
      // Handle autoplay restrictions
      if (error instanceof Error && error.name === 'NotAllowedError') {
        throw new Error('Autoplay blocked. User interaction required.')
      }
      throw error
    }
  }

  /**
   * Pause the audio
   */
  pause(): void {
    if (!this.audio) return
    this.audio.pause()
  }

  /**
   * Stop the audio (pause and reset)
   */
  stop(): void {
    if (!this.audio) return
    this.audio.pause()
    this.audio.currentTime = 0
  }

  /**
   * Seek to a specific time
   */
  seek(time: number): void {
    if (!this.audio) return
    this.audio.currentTime = time
  }

  /**
   * Get current playback time
   */
  getCurrentTime(): number {
    return this.audio?.currentTime || 0
  }

  /**
   * Get total duration
   */
  getDuration(): number {
    return this.audio?.duration || 0
  }

  /**
   * Get playback state
   */
  isPlaying(): boolean {
    return this.audio ? !this.audio.paused : false
  }

  /**
   * Get ready state
   */
  getReadyState(): number {
    return this.audio?.readyState || 0
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    if (!this.audio) return
    this.audio.volume = Math.max(0, Math.min(1, volume))
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.audio?.volume || 1
  }

  /**
   * Set playback rate (0.5 to 2.0)
   */
  setPlaybackRate(rate: number): void {
    if (!this.audio) return
    this.audio.playbackRate = Math.max(0.5, Math.min(2, rate))
  }

  /**
   * Cleanup and destroy the player
   */
  destroy(): void {
    if (this.audio) {
      this.audio.pause()
      this.audio.src = ''
      this.audio.load()
      this.audio = null
    }
    this.callbacks = {}
    this.currentUrl = null
  }

  /**
   * Preload audio without playing
   * @returns true if preload started, false if URL is invalid/mock
   */
  preload(url: string): boolean {
    const isValid = this.setSource(url)
    if (isValid && this.audio) {
      this.audio.load()
    }
    return isValid
  }
}

// Singleton instance
let audioPlayerInstance: AudioPlayer | null = null

export function getAudioPlayer(): AudioPlayer {
  if (!audioPlayerInstance) {
    audioPlayerInstance = new AudioPlayer()
  }
  return audioPlayerInstance
}


