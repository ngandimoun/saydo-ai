"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, X, Music2, AlertCircle, SkipForward, SkipBack, Shuffle, Repeat } from "lucide-react"
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
  onNext?: () => void
  onPrevious?: () => void
  onToggleShuffle?: () => void
  onToggleRepeat?: () => void
  isShuffled?: boolean
  repeatMode?: 'off' | 'all' | 'one'
  hasNext?: boolean
  hasPrevious?: boolean
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
  onExpand,
  onNext,
  onPrevious,
  onToggleShuffle,
  onToggleRepeat,
  isShuffled = false,
  repeatMode = 'off',
  hasNext = false,
  hasPrevious = false
}: MiniPlayerProps) {
  const hasError = !!error
  const [localProgress, setLocalProgress] = useState(0)

  // Update local progress from currentTime prop
  useEffect(() => {
    const progress = track.durationSeconds > 0 
      ? (currentTime / track.durationSeconds) * 100 
      : 0
    setLocalProgress(isNaN(progress) ? 0 : progress)
  }, [currentTime, track])

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    const newTime = percentage * track.durationSeconds

    setLocalProgress(percentage * 100)
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
        "px-3 flex justify-center"
      )}
    >
      <div className={cn(
        // Gradient background for better visibility - teal/cyan matching Saydo brand
        hasError 
          ? "bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600"
          : "bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-500",
        "rounded-xl",
        hasError ? "shadow-lg shadow-slate-500/30" : "shadow-lg shadow-teal-500/30",
        "overflow-hidden",
        "max-w-2xl w-full"
      )}>
        {/* Progress bar */}
        <div 
          className="h-0.5 bg-white/20 cursor-pointer"
          onClick={handleProgressClick}
        >
          <motion.div 
            className="h-full bg-white"
            style={{ width: `${localProgress}%` }}
            transition={{ type: "tween", duration: 0.1 }}
          />
        </div>

        {/* Player content */}
        <div className="flex items-center gap-2 p-2">
          {/* Clickable area to expand - Album art + Track info */}
          <button 
            onClick={onExpand}
            className="flex items-center gap-2 flex-shrink-0 min-w-0 text-left"
            aria-label="Expand player"
          >
            {/* Album art placeholder with animated waveform or error icon */}
            <div className={cn(
              "relative w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0",
              hasError ? "bg-red-500/30" : "bg-white/20"
            )}>
              {hasError ? (
                <AlertCircle size={14} className="text-red-200" />
              ) : isPlaying ? (
                <div className="flex items-end gap-0.5 h-4">
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-0.5 bg-white rounded-full"
                      animate={{
                        height: [6, 12 + Math.random() * 3, 6],
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
                <Music2 size={14} className="text-white/80" />
              )}
            </div>

            {/* Track info */}
            <div className="min-w-0 max-w-[120px] sm:max-w-[150px]">
              <p className="text-xs font-medium text-white truncate">
                {track.title}
              </p>
              {hasError ? (
                <p className="text-[10px] text-red-200 truncate">
                  {error}
                </p>
              ) : track.narrator ? (
                <p className="text-[10px] text-white/70 truncate">
                  {track.narrator}
                </p>
              ) : null}
            </div>
          </button>

          {/* Center controls: Previous, Play/Pause, Next */}
          <div className="flex items-center gap-1">
            {/* Previous */}
            {onPrevious && (
              <motion.button
                whileHover={hasError || !hasPrevious ? {} : { scale: 1.1 }}
                whileTap={hasError || !hasPrevious ? {} : { scale: 0.95 }}
                onClick={hasError || !hasPrevious ? undefined : onPrevious}
                disabled={hasError || !hasPrevious}
                className={cn(
                  "w-7 h-7 rounded-full",
                  "flex items-center justify-center",
                  hasError || !hasPrevious
                    ? "text-white/30 cursor-not-allowed"
                    : "text-white hover:bg-white/10",
                  "transition-colors touch-manipulation"
                )}
                aria-label="Previous track"
              >
                <SkipBack size={16} />
              </motion.button>
            )}

            {/* Play/Pause */}
            <motion.button
              whileHover={hasError ? {} : { scale: 1.1 }}
              whileTap={hasError ? {} : { scale: 0.95 }}
              onClick={hasError ? undefined : (isPlaying ? onPause : onPlay)}
              disabled={hasError}
              className={cn(
                "w-8 h-8 rounded-full",
                "flex items-center justify-center",
                hasError 
                  ? "bg-white/50 text-slate-400 cursor-not-allowed"
                  : "bg-white text-teal-600",
                "shadow-md shadow-black/20",
                "touch-manipulation"
              )}
              aria-label={hasError ? "Audio unavailable" : (isPlaying ? "Pause" : "Play")}
            >
              {hasError ? (
                <AlertCircle size={14} className="text-slate-400" />
              ) : isPlaying ? (
                <Pause size={14} className="text-teal-600" />
              ) : (
                <Play size={14} className="ml-0.5 text-teal-600" />
              )}
            </motion.button>

            {/* Next */}
            {onNext && (
              <motion.button
                whileHover={hasError || !hasNext ? {} : { scale: 1.1 }}
                whileTap={hasError || !hasNext ? {} : { scale: 0.95 }}
                onClick={hasError || !hasNext ? undefined : onNext}
                disabled={hasError || !hasNext}
                className={cn(
                  "w-7 h-7 rounded-full",
                  "flex items-center justify-center",
                  hasError || !hasNext
                    ? "text-white/30 cursor-not-allowed"
                    : "text-white hover:bg-white/10",
                  "transition-colors touch-manipulation"
                )}
                aria-label="Next track"
              >
                <SkipForward size={16} />
              </motion.button>
            )}
          </div>

          {/* Right side: Shuffle, Loop, Time, Close */}
          <div className="flex items-center gap-1 ml-auto">
            {/* Shuffle */}
            {onToggleShuffle && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggleShuffle}
                className={cn(
                  "w-6 h-6 rounded-full",
                  "flex items-center justify-center",
                  isShuffled 
                    ? "text-white" 
                    : "text-white/50 hover:text-white",
                  "transition-colors touch-manipulation"
                )}
                aria-label="Toggle shuffle"
              >
                <Shuffle size={14} />
              </motion.button>
            )}

            {/* Loop */}
            {onToggleRepeat && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggleRepeat}
                className={cn(
                  "w-6 h-6 rounded-full relative",
                  "flex items-center justify-center",
                  repeatMode !== 'off'
                    ? "text-white" 
                    : "text-white/50 hover:text-white",
                  "transition-colors touch-manipulation"
                )}
                aria-label={`Repeat ${repeatMode}`}
              >
                <Repeat size={14} />
                {repeatMode === 'one' && (
                  <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold">1</span>
                )}
              </motion.button>
            )}

            {/* Time display */}
            <span className="text-[10px] text-white/70 tabular-nums hidden sm:block ml-1">
              {formatTime(currentTime)} / {formatTime(track.durationSeconds)}
            </span>

            {/* Close */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className={cn(
                "w-6 h-6 rounded-full",
                "flex items-center justify-center",
                "text-white/70 hover:text-white hover:bg-white/10",
                "transition-colors touch-manipulation"
              )}
              aria-label="Close player"
            >
              <X size={14} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
