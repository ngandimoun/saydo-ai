"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Play, Pause, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDuration } from "@/lib/dashboard/time-utils"

/**
 * Voice Response Player Component
 * 
 * Audio playback controls for voice responses from Saydo.
 * Features:
 * - Play/pause controls
 * - Progress indicator
 * - Duration display
 * - Volume control (future)
 * 
 * TODO (Backend Integration):
 * - Load audio from Supabase Storage or CDN
 * - Cache audio files for offline playback
 * - Track playback analytics
 * 
 * TODO (AI Integration):
 * - Stream audio as it's generated (real-time TTS)
 * - Show waveform visualization
 * - Add playback speed control
 * - Add skip forward/backward buttons
 */

interface VoiceResponsePlayerProps {
  audioUrl: string
  messageId: string
  className?: string
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
}

export function VoiceResponsePlayer({
  audioUrl,
  messageId,
  className,
  onPlay,
  onPause,
  onEnded
}: VoiceResponsePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) return

    const audio = audioRef.current

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      onEnded?.()
    }

    const handlePlay = () => {
      setIsPlaying(true)
      onPlay?.()
    }

    const handlePause = () => {
      setIsPlaying(false)
      onPause?.()
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [onPlay, onPause, onEnded])

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch((error) => {
        console.error('Error playing audio:', error)
        // TODO (Backend): Handle audio playback errors gracefully
      })
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = percentage * duration

    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={cn("space-y-2", className)}>
      {/* Audio Element (hidden) */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onError={(e) => {
          console.error('Audio loading error:', e)
          // TODO (Backend): Show error message to user
          setIsLoading(false)
        }}
      />

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90 transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "touch-manipulation"
          )}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause size={18} />
          ) : (
            <Play size={18} className="ml-0.5" />
          )}
        </button>

        {/* Progress Bar */}
        <div className="flex-1 space-y-1">
          <div
            onClick={handleSeek}
            className={cn(
              "relative h-2 bg-muted rounded-full cursor-pointer",
              "hover:h-2.5 transition-all"
            )}
          >
            <motion.div
              className="absolute inset-y-0 left-0 bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatDuration(Math.floor(currentTime))}</span>
            <span>{formatDuration(Math.floor(duration))}</span>
          </div>
        </div>

        {/* Volume Icon (future: make it interactive) */}
        <div className="text-muted-foreground">
          <Volume2 size={16} />
          {/* TODO (Backend): Add volume control slider */}
        </div>
      </div>
    </div>
  )
}

