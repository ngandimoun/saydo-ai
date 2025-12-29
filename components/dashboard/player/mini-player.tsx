"use client"

import { useRef, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, X, Music2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Mini Audio Player - Spotify-Inspired
 * 
 * Persistent mini player that sits above the bottom navigation.
 * Features:
 * - Gradient background for visibility
 * - Animated waveform when playing
 * - Progress bar with drag support
 * - Smooth animations
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
    thumbnailUrl?: string
    category?: string
  }
  isPlaying: boolean
  currentTime: number
  error?: string | null
  onPlay: () => void
  onPause: () => void
  onSeek: (time: number) => void
  onClose: () => void
  onExpand?: () => void
}

export function MiniPlayer({
  track,
  isPlaying,
  currentTime,
  error,
  onPlay,
  onPause,
  onSeek,
  onClose,
  onExpand
}: MiniPlayerProps) {
  const hasError = !!error
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
    setLocalProgress(isNaN(progress) ? 0 : progress)
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
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "fixed left-0 right-0 z-40",
        // Position above bottom nav (64px) + safe area for PWA
        "bottom-[calc(4.5rem+env(safe-area-inset-bottom))]",
        "px-3"
      )}
    >
      <div className={cn(
        // Gradient background for better visibility
        hasError 
          ? "bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600"
          : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600",
        "rounded-2xl",
        hasError ? "shadow-xl shadow-slate-500/30" : "shadow-xl shadow-purple-500/30",
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
          className="h-1 bg-white/20 cursor-pointer"
          onClick={handleProgressClick}
        >
          <motion.div 
            className="h-full bg-white"
            style={{ width: `${localProgress}%` }}
            transition={{ type: "tween", duration: 0.1 }}
          />
        </div>

        {/* Player content */}
        <div className="flex items-center gap-3 p-3">
          {/* Clickable area to expand - Album art + Track info */}
          <button 
            onClick={onExpand}
            className="flex items-center gap-3 flex-1 min-w-0 text-left"
            aria-label="Expand player"
          >
            {/* Album art placeholder with animated waveform or error icon */}
            <div className={cn(
              "relative w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0",
              hasError ? "bg-red-500/30" : "bg-white/20"
            )}>
              {hasError ? (
                <AlertCircle size={18} className="text-red-200" />
              ) : isPlaying ? (
                <div className="flex items-end gap-0.5 h-5">
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-white rounded-full"
                      animate={{
                        height: [8, 16 + Math.random() * 4, 8],
                      }}
                      transition={{
                        duration: 0.5 + Math.random() * 0.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.1
                      }}
                    />
                  ))}
                </div>
              ) : (
                <Music2 size={18} className="text-white/80" />
              )}
            </div>

            {/* Track info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {track.title}
              </p>
              {hasError ? (
                <p className="text-xs text-red-200 truncate">
                  {error}
                </p>
              ) : track.narrator ? (
                <p className="text-xs text-white/70 truncate">
                  {track.narrator}
                </p>
              ) : null}
            </div>
          </button>

          {/* Time display */}
          <span className="text-xs text-white/70 tabular-nums hidden sm:block">
            {formatTime(currentTime)} / {formatTime(track.durationSeconds)}
          </span>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* Play/Pause */}
            <motion.button
              whileHover={hasError ? {} : { scale: 1.1 }}
              whileTap={hasError ? {} : { scale: 0.95 }}
              onClick={hasError ? undefined : (isPlaying ? onPause : onPlay)}
              disabled={hasError}
              className={cn(
                "w-10 h-10 rounded-full",
                "flex items-center justify-center",
                hasError 
                  ? "bg-white/50 text-slate-400 cursor-not-allowed"
                  : "bg-white text-purple-600",
                "shadow-lg shadow-black/20",
                "touch-manipulation"
              )}
              aria-label={hasError ? "Audio unavailable" : (isPlaying ? "Pause" : "Play")}
            >
              {hasError ? (
                <AlertCircle size={18} className="text-slate-400" />
              ) : isPlaying ? (
                <Pause size={18} className="text-purple-600" />
              ) : (
                <Play size={18} className="ml-0.5 text-purple-600" />
              )}
            </motion.button>

            {/* Close */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className={cn(
                "w-8 h-8 rounded-full",
                "flex items-center justify-center",
                "text-white/70 hover:text-white hover:bg-white/10",
                "transition-colors touch-manipulation"
              )}
              aria-label="Close player"
            >
              <X size={18} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
