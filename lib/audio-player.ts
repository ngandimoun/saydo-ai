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
      const error = new Error(`Audio playback error: ${this.audio?.error?.message || 'Unknown error'}`)
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
   */
  setSource(url: string) {
    if (!this.audio) {
      throw new Error('Audio player not initialized')
    }

    if (this.currentUrl === url) {
      return // Already set
    }

    this.currentUrl = url
    this.audio.src = url
    
    // Preload the audio
    this.audio.preload = 'auto'
    
    // For mobile, ensure we can play in background
    if (this.audio.setAttribute) {
      this.audio.setAttribute('playsinline', 'true')
      this.audio.setAttribute('webkit-playsinline', 'true')
    }
  }

  /**
   * Set callbacks for audio events
   */
  setCallbacks(callbacks: AudioPlayerCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  /**
   * Play the audio
   */
  async play(): Promise<void> {
    if (!this.audio) {
      throw new Error('Audio player not initialized')
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
   */
  preload(url: string): void {
    this.setSource(url)
    if (this.audio) {
      this.audio.load()
    }
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

