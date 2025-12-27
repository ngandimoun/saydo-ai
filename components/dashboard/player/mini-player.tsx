"use client"

import { useRef, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, X, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Mini Audio Player
 * 
 * Persistent mini player that sits above the bottom navigation.
 * Stays visible across all tabs without blocking content.
 * Can be expanded to a full player view.
 * 
 * TODO (Backend Integration):
 * - Save playback progress to user's profile
 * - Track listening history
 * - Resume from last position on app reopen
 */

interface MiniPlayerProps {
  track: {
    id: string
    title: string
    narrator?: string
    audioUrl: string
    durationSeconds: number
  }
  isPlaying: boolean
  currentTime: number
  onPlay: () => void
  onPause: () => void
  onSeek: (time: number) => void
  onClose: () => void
}

export function MiniPlayer({
  track,
  isPlaying,
  currentTime,
  onPlay,
  onPause,
  onSeek,
  onClose
}: MiniPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [localProgress, setLocalProgress] = useState(0)

  // Sync audio element with state
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.play().catch(() => {
        // Handle autoplay restrictions
        onPause()
      })
    } else {
      audio.pause()
    }
  }, [isPlaying, onPause])

  // Update audio src when track changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.src = track.audioUrl
    audio.load()
    if (isPlaying) {
      audio.play().catch(() => onPause())
    }
  }, [track.audioUrl, track.id])

  // Handle time updates
  const handleTimeUpdate = () => {
    const audio = audioRef.current
    if (!audio) return
    
    const progress = (audio.currentTime / audio.duration) * 100
    setLocalProgress(progress)
    onSeek(audio.currentTime)
  }

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    const newTime = percentage * audio.duration

    audio.currentTime = newTime
    onSeek(newTime)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "fixed left-0 right-0 z-45",
          "bottom-[76px]", // Above bottom nav (64px) + safe area
          "px-3"
        )}
      >
        <div className={cn(
          "bg-card/95 backdrop-blur-lg",
          "border border-border/50 rounded-2xl",
          "shadow-lg shadow-black/10",
          "overflow-hidden"
        )}>
          {/* Hidden audio element */}
          <audio
            ref={audioRef}
            onTimeUpdate={handleTimeUpdate}
            onEnded={onClose}
          />

          {/* Progress bar */}
          <div 
            className="h-1 bg-muted/50 cursor-pointer"
            onClick={handleProgressClick}
          >
            <motion.div 
              className="h-full bg-primary"
              style={{ width: `${localProgress}%` }}
            />
          </div>

          {/* Player content */}
          <div className="flex items-center gap-3 p-3">
            {/* Track info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {track.title}
              </p>
              {track.narrator && (
                <p className="text-xs text-muted-foreground truncate">
                  {track.narrator}
                </p>
              )}
            </div>

            {/* Time display */}
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatTime(currentTime)} / {formatTime(track.durationSeconds)}
            </span>

            {/* Controls */}
            <div className="flex items-center gap-1">
              {/* Play/Pause */}
              <button
                onClick={isPlaying ? onPause : onPlay}
                className={cn(
                  "w-10 h-10 rounded-full",
                  "flex items-center justify-center",
                  "bg-primary text-primary-foreground",
                  "hover:bg-primary/90 transition-colors",
                  "touch-manipulation"
                )}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause size={18} />
                ) : (
                  <Play size={18} className="ml-0.5" />
                )}
              </button>

              {/* Close */}
              <button
                onClick={onClose}
                className={cn(
                  "w-8 h-8 rounded-full",
                  "flex items-center justify-center",
                  "text-muted-foreground hover:text-foreground",
                  "transition-colors touch-manipulation"
                )}
                aria-label="Close player"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

