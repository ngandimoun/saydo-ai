/**
 * React Hook for Audio Player
 * 
 * Provides React interface for the cross-platform audio player
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { getAudioPlayer, type AudioPlayerCallbacks } from '@/lib/audio-player'
import { logger } from '@/lib/logger'

export interface UseAudioPlayerOptions {
  url?: string
  autoPlay?: boolean
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  onTimeUpdate?: (currentTime: number) => void
  onError?: (error: Error) => void
}

export function useAudioPlayer(options: UseAudioPlayerOptions = {}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const playerRef = useRef<ReturnType<typeof getAudioPlayer> | null>(null)

  // Initialize player
  useEffect(() => {
    if (typeof window === 'undefined') return

    playerRef.current = getAudioPlayer()

    const callbacks: AudioPlayerCallbacks = {
      onPlay: () => {
        setIsPlaying(true)
        options.onPlay?.()
      },
      onPause: () => {
        setIsPlaying(false)
        options.onPause?.()
      },
      onEnded: () => {
        setIsPlaying(false)
        setCurrentTime(0)
        options.onEnded?.()
      },
      onTimeUpdate: (time) => {
        setCurrentTime(time)
        options.onTimeUpdate?.(time)
      },
      onError: (err) => {
        setError(err)
        setIsPlaying(false)
        logger.error('Audio player error', { error: err })
        options.onError?.(err)
      },
      onLoadedMetadata: (dur) => {
        setDuration(dur)
        setIsLoading(false)
      },
      onCanPlay: () => {
        setIsLoading(false)
      },
    }

    playerRef.current.setCallbacks(callbacks)

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }
  }, [])

  // Set source when URL changes
  useEffect(() => {
    if (!playerRef.current || !options.url) return

    setIsLoading(true)
    playerRef.current.setSource(options.url)

    if (options.autoPlay) {
      playerRef.current.play().catch((err) => {
        logger.error('Autoplay failed', { error: err })
        setError(err)
      })
    }
  }, [options.url, options.autoPlay])

  const play = useCallback(async () => {
    if (!playerRef.current) return
    try {
      await playerRef.current.play()
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Playback failed')
      setError(error)
      logger.error('Play failed', { error })
    }
  }, [])

  const pause = useCallback(() => {
    playerRef.current?.pause()
  }, [])

  const stop = useCallback(() => {
    playerRef.current?.stop()
    setIsPlaying(false)
    setCurrentTime(0)
  }, [])

  const seek = useCallback((time: number) => {
    playerRef.current?.seek(time)
    setCurrentTime(time)
  }, [])

  const setVolume = useCallback((volume: number) => {
    playerRef.current?.setVolume(volume)
  }, [])

  const setPlaybackRate = useCallback((rate: number) => {
    playerRef.current?.setPlaybackRate(rate)
  }, [])

  return {
    isPlaying,
    currentTime,
    duration,
    isLoading,
    error,
    play,
    pause,
    stop,
    seek,
    setVolume,
    setPlaybackRate,
  }
}


