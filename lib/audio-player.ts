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
 * - Media Session API for lock screen controls
 */

import {
  setupMediaSession,
  updateMediaSessionPlaybackState,
  updateMediaSessionPositionState,
  clearMediaSession,
  type AudioTrack as MediaSessionTrack,
} from './media-session'

export interface AudioPlayerCallbacks {
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  onTimeUpdate?: (currentTime: number) => void
  onError?: (error: Error) => void
  onLoadedMetadata?: (duration: number) => void
  onCanPlay?: () => void
}

export interface AudioPlayerMediaSessionCallbacks {
  onPrevious?: () => void
  onNext?: () => void
  onSeek?: (time: number) => void
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
 * Audio Ready State
 * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/readyState
 */
const HAVE_NOTHING = 0
const HAVE_METADATA = 1
const HAVE_CURRENT_DATA = 2
const HAVE_FUTURE_DATA = 3
const HAVE_ENOUGH_DATA = 4

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
  private mediaSessionCallbacks: AudioPlayerMediaSessionCallbacks = {}
  private currentUrl: string | null = null
  private isInitialized = false
  private currentTrack: MediaSessionTrack | null = null
  private positionUpdateInterval: number | null = null
  private playPromise: Promise<void> | null = null
  private isPlayingInternal = false
  private debounceTimeout: number | null = null
  private isMounted = true

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio()
      this.setupEventListeners()
      this.setupBackgroundPlayback()
      this.setupVisibilityHandling()
      this.isInitialized = true
    }
  }

  /**
   * Setup audio element for background playback
   */
  private setupBackgroundPlayback() {
    if (!this.audio) return

    // Enable background playback
    this.audio.setAttribute('playsinline', 'true')
    this.audio.setAttribute('webkit-playsinline', 'true')
    
    // Allow cross-origin if needed (for CORS)
    this.audio.crossOrigin = 'anonymous'
    
    // Preload audio for better background playback
    this.audio.preload = 'auto'
    
    // Ensure audio continues in background
    // This is critical for PWA background playback
    if ('mediaSession' in navigator) {
      // Media Session API will handle background controls
      // But we need to ensure the audio element doesn't pause
      this.audio.addEventListener('pause', (e) => {
        // Only pause if explicitly paused by user, not due to visibility change
        // The Media Session API will handle background controls
      })
    }
  }

  /**
   * Handle page visibility changes (screen lock/unlock)
   */
  private setupVisibilityHandling() {
    if (typeof document === 'undefined') return

    document.addEventListener('visibilitychange', () => {
      // Audio should continue playing when page is hidden (screen locked)
      // Don't pause audio when visibility changes
      // The Media Session API handles lock screen controls
      if (document.hidden && this.audio && !this.audio.paused) {
        // Ensure audio continues playing when page becomes hidden
        // Some browsers may pause audio on visibility change, so we resume if needed
        // Use a small delay to avoid conflicts with browser's own handling
        setTimeout(() => {
          if (this.audio && !this.audio.paused && this.isPlayingInternal) {
            // Audio is still playing, good
          } else if (this.audio && this.isPlayingInternal) {
            // Audio was paused by browser, resume it
            this.audio.play().catch(() => {
              // Ignore errors - may be due to autoplay restrictions
            })
          }
        }, 100)
      }
    })
  }

  private setupEventListeners() {
    if (!this.audio) return

    this.audio.addEventListener('play', () => {
      this.isPlayingInternal = true
      updateMediaSessionPlaybackState('playing')
      this.startPositionUpdates()
      this.callbacks.onPlay?.()
    })

    this.audio.addEventListener('pause', () => {
      this.isPlayingInternal = false
      updateMediaSessionPlaybackState('paused')
      this.stopPositionUpdates()
      this.callbacks.onPause?.()
    })

    this.audio.addEventListener('ended', () => {
      updateMediaSessionPlaybackState('none')
      this.stopPositionUpdates()
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
    
    // Ensure audio can play in background (PWA support)
    // Load the audio to prepare for background playback
    this.audio.load()
    
    return true
  }

  /**
   * Set Media Session track and callbacks
   */
  setMediaSessionTrack(
    track: MediaSessionTrack | null,
    callbacks?: AudioPlayerMediaSessionCallbacks
  ): void {
    this.currentTrack = track
    if (callbacks) {
      this.mediaSessionCallbacks = callbacks
    }

    if (track) {
      setupMediaSession(track, {
        onPlay: () => {
          this.play().catch(() => {
            // Ignore errors
          })
        },
        onPause: () => {
          this.pause()
        },
        onPrevious: this.mediaSessionCallbacks.onPrevious,
        onNext: this.mediaSessionCallbacks.onNext,
        onSeek: this.mediaSessionCallbacks.onSeek,
      })
    } else {
      clearMediaSession()
    }
  }

  /**
   * Start updating Media Session position state
   */
  startPositionUpdates(): void {
    if (this.positionUpdateInterval) {
      return // Already updating
    }

    this.positionUpdateInterval = window.setInterval(() => {
      if (this.audio && this.currentTrack) {
        const duration = this.audio.duration || this.currentTrack.durationSeconds
        const position = this.audio.currentTime
        const playbackRate = this.audio.playbackRate

        if (!isNaN(duration) && !isNaN(position)) {
          updateMediaSessionPositionState(duration, position, playbackRate)
        }
      }
    }, 1000) // Update every second
  }

  /**
   * Stop updating Media Session position state
   */
  stopPositionUpdates(): void {
    if (this.positionUpdateInterval) {
      clearInterval(this.positionUpdateInterval)
      this.positionUpdateInterval = null
    }
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

    // Cancel any pending play promise
    if (this.playPromise) {
      try {
        await this.playPromise
      } catch {
        // Ignore errors from previous play promise
      }
      this.playPromise = null
    }

    // Check readyState - need at least HAVE_FUTURE_DATA to play smoothly
    if (this.audio.readyState < HAVE_FUTURE_DATA) {
      // Wait for canplay event if not ready
      await new Promise<void>((resolve, reject) => {
        if (!this.audio) {
          reject(new Error('Audio player not initialized'))
          return
        }

        if (this.audio.readyState >= HAVE_FUTURE_DATA) {
          resolve()
          return
        }

        const onCanPlay = () => {
          if (this.audio) {
            this.audio.removeEventListener('canplay', onCanPlay)
            this.audio.removeEventListener('error', onError)
          }
          resolve()
        }

        const onError = () => {
          if (this.audio) {
            this.audio.removeEventListener('canplay', onCanPlay)
            this.audio.removeEventListener('error', onError)
          }
          reject(new Error('Audio failed to load'))
        }

        this.audio.addEventListener('canplay', onCanPlay, { once: true })
        this.audio.addEventListener('error', onError, { once: true })

        // Timeout after 10 seconds
        setTimeout(() => {
          if (this.audio) {
            this.audio.removeEventListener('canplay', onCanPlay)
            this.audio.removeEventListener('error', onError)
          }
          reject(new Error('Audio loading timeout'))
        }, 10000)
      })
    }

    // If already playing, don't call play() again
    if (!this.audio.paused && this.isPlayingInternal) {
      return
    }

    try {
      this.playPromise = this.audio.play()
      await this.playPromise
      this.isPlayingInternal = true
      this.playPromise = null
    } catch (error) {
      this.playPromise = null
      
      // Handle AbortError gracefully - this happens when play() is interrupted by pause()
      // This is expected behavior and not an error
      if (error instanceof Error && error.name === 'AbortError') {
        // Silently ignore - this is expected when interrupting play
        return
      }
      
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
    
    // Cancel any pending play promise
    if (this.playPromise) {
      this.playPromise = null
    }
    
    this.audio.pause()
    this.isPlayingInternal = false
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
    return this.audio ? !this.audio.paused && this.isPlayingInternal : false
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
    this.isMounted = false
    
    // Clear debounce timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout)
      this.debounceTimeout = null
    }
    
    // Cancel any pending play promise
    if (this.playPromise) {
      this.playPromise = null
    }
    
    this.stopPositionUpdates()
    clearMediaSession()
    
    if (this.audio) {
      this.audio.pause()
      this.audio.src = ''
      this.audio.load()
      this.audio = null
    }
    this.callbacks = {}
    this.mediaSessionCallbacks = {}
    this.currentUrl = null
    this.currentTrack = null
    this.isPlayingInternal = false
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


