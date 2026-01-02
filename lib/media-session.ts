/**
 * Media Session API Integration
 * 
 * Provides lock screen controls, notification controls, and Bluetooth device controls
 * for background audio playback on mobile devices.
 * 
 * Features:
 * - Lock screen controls (iOS/Android)
 * - Notification controls
 * - Bluetooth device controls
 * - CarPlay/Android Auto support
 */

export interface AudioTrack {
  id: string
  title: string
  narrator?: string
  audioUrl: string
  durationSeconds: number
  thumbnailUrl?: string
  category?: string
}

export interface MediaSessionCallbacks {
  onPlay: () => void
  onPause: () => void
  onPrevious?: () => void
  onNext?: () => void
  onSeek?: (time: number) => void
  onSeekBackward?: (seconds: number) => void
  onSeekForward?: (seconds: number) => void
}

/**
 * Setup Media Session API for a track
 */
export function setupMediaSession(
  track: AudioTrack,
  callbacks: MediaSessionCallbacks
): void {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) {
    return
  }

  const mediaSession = navigator.mediaSession

  // Set metadata
  try {
    mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.narrator || 'Saydo',
      album: 'Calm Zone',
      artwork: track.thumbnailUrl
        ? [
            { src: track.thumbnailUrl, sizes: '512x512', type: 'image/png' },
            { src: track.thumbnailUrl, sizes: '256x256', type: 'image/png' },
            { src: track.thumbnailUrl, sizes: '128x128', type: 'image/png' },
          ]
        : [],
    })
  } catch (error) {
    console.warn('Failed to set MediaSession metadata:', error)
  }

  // Set action handlers
  try {
    mediaSession.setActionHandler('play', () => {
      // Ensure play works even when page is in background
      callbacks.onPlay()
    })

    mediaSession.setActionHandler('pause', () => {
      // Ensure pause works even when page is in background
      callbacks.onPause()
    })

    if (callbacks.onPrevious) {
      mediaSession.setActionHandler('previoustrack', () => {
        // Previous track should auto-play - handled by playPrevious callback
        callbacks.onPrevious?.()
      })
    } else {
      mediaSession.setActionHandler('previoustrack', null)
    }

    if (callbacks.onNext) {
      mediaSession.setActionHandler('nexttrack', () => {
        // Next track should auto-play - handled by playNext callback
        callbacks.onNext?.()
      })
    } else {
      mediaSession.setActionHandler('nexttrack', null)
    }

    if (callbacks.onSeek) {
      mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          callbacks.onSeek?.(details.seekTime)
        }
      })
    } else {
      mediaSession.setActionHandler('seekto', null)
    }

    if (callbacks.onSeekBackward) {
      mediaSession.setActionHandler('seekbackward', (details) => {
        const seconds = details.seekOffset || 10
        callbacks.onSeekBackward?.(seconds)
      })
    } else {
      mediaSession.setActionHandler('seekbackward', null)
    }

    if (callbacks.onSeekForward) {
      mediaSession.setActionHandler('seekforward', (details) => {
        const seconds = details.seekOffset || 10
        callbacks.onSeekForward?.(seconds)
      })
    } else {
      mediaSession.setActionHandler('seekforward', null)
    }
  } catch (error) {
    console.warn('Failed to set MediaSession action handlers:', error)
  }
}

/**
 * Update Media Session playback state
 */
export function updateMediaSessionPlaybackState(
  state: 'playing' | 'paused' | 'none'
): void {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) {
    return
  }

  try {
    navigator.mediaSession.playbackState = state
  } catch (error) {
    console.warn('Failed to update MediaSession playback state:', error)
  }
}

/**
 * Update Media Session position state
 */
export function updateMediaSessionPositionState(
  duration: number,
  position: number,
  playbackRate: number = 1.0
): void {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) {
    return
  }

  if (!('setPositionState' in navigator.mediaSession)) {
    return // Not supported in all browsers
  }

  try {
    navigator.mediaSession.setPositionState({
      duration,
      playbackRate,
      position,
    })
  } catch (error) {
    console.warn('Failed to update MediaSession position state:', error)
  }
}

/**
 * Clear Media Session
 */
export function clearMediaSession(): void {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) {
    return
  }

  try {
    navigator.mediaSession.metadata = null
    navigator.mediaSession.playbackState = 'none'
  } catch (error) {
    console.warn('Failed to clear MediaSession:', error)
  }
}

