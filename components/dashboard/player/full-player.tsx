"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  X, 
  ChevronDown,
  Music2,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { springs } from "@/lib/motion-system"
import { extractVibrantColors, type ColorPalette } from "@/lib/color-extraction"

/**
 * Full Screen Audio Player - Spotify-Inspired
 * 
 * Opens when clicking audio content in Calm Zone.
 * Features:
 * - Full-screen gradient background based on category
 * - Large animated artwork placeholder
 * - Interactive progress bar with drag
 * - Previous / Play-Pause / Next controls
 * - Minimize to mini player
 * - Animated waveform visualizer
 */

export interface FullPlayerTrack {
  id: string
  title: string
  narrator?: string
  audioUrl: string
  durationSeconds: number
  thumbnailUrl?: string
  category?: string
}

interface FullPlayerProps {
  isOpen: boolean
  track: FullPlayerTrack | null
  playlist?: FullPlayerTrack[]
  isPlaying: boolean
  currentTime: number
  error?: string | null
  onPlay: () => void
  onPause: () => void
  onSeek: (time: number) => void
  onClose: () => void
  onNext?: () => void
  onPrevious?: () => void
  isShuffled?: boolean
  onToggleShuffle?: () => void
  repeatMode?: 'off' | 'all' | 'one'
  onToggleRepeat?: () => void
  isMuted?: boolean
  onToggleMute?: () => void
  volume?: number
  onVolumeChange?: (volume: number) => void
}

// Category-based gradient backgrounds
const categoryGradients: Record<string, string> = {
  sleep: 'from-indigo-900 via-purple-900 to-slate-950',
  meditation: 'from-violet-900 via-indigo-900 to-slate-950',
  relaxation: 'from-sky-900 via-blue-900 to-slate-950',
  motivational: 'from-orange-900 via-amber-900 to-slate-950',
  music: 'from-pink-900 via-rose-900 to-slate-950',
  default: 'from-slate-800 via-slate-900 to-slate-950',
}

// Category-based accent colors
const categoryAccents: Record<string, string> = {
  sleep: 'bg-indigo-500',
  meditation: 'bg-violet-500',
  relaxation: 'bg-sky-500',
  motivational: 'bg-orange-500',
  music: 'bg-pink-500',
  default: 'bg-primary',
}

export function FullPlayer({
  isOpen,
  track,
  playlist = [],
  isPlaying,
  currentTime,
  error,
  onPlay,
  onPause,
  onSeek,
  onClose,
  onNext,
  onPrevious,
  isShuffled = false,
  onToggleShuffle,
  repeatMode = 'off',
  onToggleRepeat,
  isMuted = false,
  onToggleMute,
  volume = 1,
  onVolumeChange
}: FullPlayerProps) {
  const progressRef = useRef<HTMLDivElement>(null)
  const [localProgress, setLocalProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [extractedColors, setExtractedColors] = useState<ColorPalette | null>(null)
  const [isExtractingColors, setIsExtractingColors] = useState(false)

  const hasError = !!error
  const category = track?.category || 'default'
  
  // Extract colors from album cover when track changes
  useEffect(() => {
    if (!track?.thumbnailUrl || hasError) {
      setExtractedColors(null)
      return
    }

    let cancelled = false
    setIsExtractingColors(true)

    extractVibrantColors(track.thumbnailUrl)
      .then((palette) => {
        if (!cancelled && palette) {
          setExtractedColors(palette)
        }
      })
      .catch((error) => {
        console.warn('Failed to extract colors:', error)
        if (!cancelled) {
          setExtractedColors(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsExtractingColors(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [track?.thumbnailUrl, hasError])

  // Determine gradient and accent colors
  const getGradientStyle = (): React.CSSProperties | undefined => {
    if (hasError) {
      return undefined // Use default error gradient classes
    }
    
    if (extractedColors) {
      return {
        background: `linear-gradient(to bottom, ${extractedColors.primary}, ${extractedColors.secondary}, ${extractedColors.tertiary})`
      }
    }
    
    return undefined // Use category-based gradient classes
  }

  const getGradientClasses = (): string => {
    if (hasError) {
      return 'from-slate-700 via-slate-800 to-slate-900'
    }
    
    if (extractedColors) {
      return '' // Use inline styles instead
    }
    
    return categoryGradients[category] || categoryGradients.default
  }

  const getAccentStyle = (): React.CSSProperties | undefined => {
    if (hasError) {
      return undefined // Use default error accent class
    }
    
    if (extractedColors) {
      return {
        backgroundColor: extractedColors.accent
      }
    }
    
    return undefined // Use category-based accent class
  }

  const getAccentClasses = (): string => {
    if (hasError) {
      return 'bg-slate-500'
    }
    
    if (extractedColors) {
      return '' // Use inline styles instead
    }
    
    return categoryAccents[category] || categoryAccents.default
  }

  const gradient = getGradientClasses()
  const accent = getAccentClasses()
  const gradientStyle = getGradientStyle()
  const accentStyle = getAccentStyle()

  // Get current track index in playlist
  const currentIndex = playlist.findIndex(t => t.id === track?.id)
  const hasNext = currentIndex >= 0 && currentIndex < playlist.length - 1 && playlist.length > 1
  const hasPrevious = currentIndex > 0 && playlist.length > 1

  // Update local progress from currentTime prop
  useEffect(() => {
    if (!isDragging && track) {
      const progress = track.durationSeconds > 0 
        ? (currentTime / track.durationSeconds) * 100 
        : 0
      setLocalProgress(isNaN(progress) ? 0 : progress)
    }
  }, [currentTime, track, isDragging])

  // Handle progress bar interaction
  const handleProgressInteraction = useCallback((clientX: number) => {
    const progressBar = progressRef.current
    if (!progressBar || !track) return

    const rect = progressBar.getBoundingClientRect()
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const newTime = percentage * track.durationSeconds

    setLocalProgress(percentage * 100)
    onSeek(newTime)
  }, [onSeek, track])

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    handleProgressInteraction(e.clientX)
  }

  const handleProgressDragStart = () => {
    setIsDragging(true)
  }

  const handleProgressDragEnd = () => {
    setIsDragging(false)
  }

  // Handle audio end - this is handled by the AudioPlayer callbacks in dashboard-layout-client
  // No need for separate handler here

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen || !track) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={cn(
          "fixed inset-0 z-50",
          !gradientStyle && "bg-gradient-to-b",
          !gradientStyle && gradient,
          "flex flex-col",
          "overflow-hidden",
          "safe-area-inset-top safe-area-inset-bottom"
        )}
        style={{
          ...gradientStyle,
          transition: gradientStyle ? 'background 0.8s ease-in-out' : undefined
        }}
      >
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between px-4 py-4 pt-safe"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Minimize player"
          >
            <ChevronDown size={24} className="text-white" />
          </motion.button>
          
          <div className="text-center">
            <p className="text-xs text-white/60 uppercase tracking-wider">Playing from</p>
            <p className="text-sm text-white font-medium capitalize">{category} Zone</p>
          </div>
          
          <div className="w-10" /> {/* Spacer for balance */}
        </motion.div>

        {/* Artwork */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, ...springs.gentle }}
          className="flex-1 flex items-center justify-center px-8 py-4 min-h-0"
        >
          <div className="relative w-full max-w-[240px] sm:max-w-[300px] aspect-square">
            {/* Artwork container with shadow */}
            <div className={cn(
              "absolute inset-0 rounded-3xl overflow-hidden",
              "shadow-2xl shadow-black/40",
              track.thumbnailUrl 
                ? "bg-cover bg-center" 
                : `bg-gradient-to-br ${gradient.replace('to-slate-950', 'to-black/50')}`
            )}
            style={track.thumbnailUrl ? { backgroundImage: `url(${track.thumbnailUrl})` } : {}}
            >
              {/* Placeholder artwork if no image */}
              {!track.thumbnailUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {/* Animated rings - hide when error */}
                  {!hasError && (
                    <>
                      <motion.div
                        className="absolute inset-8 rounded-full border-2 border-white/10"
                        animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.1, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute inset-16 rounded-full border-2 border-white/10"
                        animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.1, 0.2] }}
                        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                      />
                    </>
                  )}
                  
                  {/* Error icon or waveform animation when playing */}
                  {hasError ? (
                    <div className="flex flex-col items-center gap-4">
                      <AlertCircle size={64} className="text-white/40" />
                    </div>
                  ) : isPlaying ? (
                    <div className="flex items-end gap-1.5 h-16">
                      {[...Array(7)].map((_, i) => (
                        <motion.div
                          key={i}
                          className={cn("w-2 rounded-full", accent)}
                          style={{
                            ...accentStyle,
                            transition: accentStyle ? 'background-color 0.8s ease-in-out' : undefined
                          }}
                          animate={{
                            height: [16, 40 + Math.random() * 24, 16],
                          }}
                          transition={{
                            duration: 0.6 + Math.random() * 0.3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.1
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <Music2 size={64} className="text-white/40" />
                  )}
                </div>
              )}

              {/* Overlay gradient for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/10" />
            </div>

            {/* Reflection effect */}
            <div 
              className="absolute -bottom-12 left-4 right-4 h-12 rounded-b-3xl opacity-20 blur-md"
              style={{
                background: `linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)`,
                transform: 'scaleY(-1)'
              }}
            />
          </div>
        </motion.div>

        {/* Track Info */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="px-8 mb-4"
        >
          <h1 className="text-2xl font-bold text-white truncate">{track.title}</h1>
          {hasError ? (
            <div className="flex items-center gap-2 mt-2">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          ) : track.narrator ? (
            <p className="text-white/60 text-lg truncate mt-1">{track.narrator}</p>
          ) : null}
        </motion.div>

        {/* Progress Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="px-8 mb-2"
        >
          <div 
            ref={progressRef}
            className="h-2 bg-white/20 rounded-full cursor-pointer relative overflow-hidden"
            onClick={handleProgressClick}
            onMouseDown={handleProgressDragStart}
            onMouseUp={handleProgressDragEnd}
            onMouseLeave={handleProgressDragEnd}
          >
            {/* Progress fill */}
            <motion.div 
              className={cn("absolute inset-y-0 left-0 rounded-full", accent)}
              style={{ 
                width: `${localProgress}%`,
                ...accentStyle,
                transition: accentStyle ? 'background-color 0.8s ease-in-out' : undefined
              }}
            />
            
            {/* Drag handle */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg"
              style={{ left: `calc(${localProgress}% - 8px)` }}
              whileHover={{ scale: 1.2 }}
            />
          </div>
          
          {/* Time stamps */}
          <div className="flex justify-between mt-2">
            <span className="text-xs text-white/60 tabular-nums">
              {formatTime(currentTime)}
            </span>
            <span className="text-xs text-white/60 tabular-nums">
              {formatTime(track.durationSeconds)}
            </span>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="px-8 pb-8 pb-safe"
        >
          {/* Main controls */}
          <div className="flex items-center justify-center gap-8">
            {/* Shuffle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleShuffle}
              className={cn(
                "p-2 rounded-full transition-colors",
                isShuffled ? "text-white" : "text-white/50 hover:text-white"
              )}
              aria-label="Toggle shuffle"
            >
              <Shuffle size={20} />
            </motion.button>

            {/* Previous */}
            <motion.button
              whileHover={hasPrevious && onPrevious ? { scale: 1.1 } : {}}
              whileTap={hasPrevious && onPrevious ? { scale: 0.95 } : {}}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (onPrevious && hasPrevious) {
                  onPrevious()
                }
              }}
              disabled={!hasPrevious || !onPrevious}
              className={cn(
                "p-3 rounded-full transition-colors touch-manipulation",
                "min-w-[48px] min-h-[48px] flex items-center justify-center",
                hasPrevious && onPrevious
                  ? "text-white hover:bg-white/10 cursor-pointer" 
                  : "text-white/30 cursor-not-allowed"
              )}
              aria-label="Previous track"
            >
              <SkipBack size={28} fill="currentColor" className="sm:w-7 sm:h-7" />
            </motion.button>

            {/* Play/Pause */}
            <motion.button
              whileHover={hasError ? {} : { scale: 1.05 }}
              whileTap={hasError ? {} : { scale: 0.95 }}
              onClick={hasError ? undefined : (isPlaying ? onPause : onPlay)}
              disabled={hasError}
              className={cn(
                "w-20 h-20 sm:w-16 sm:h-16 rounded-full flex items-center justify-center touch-manipulation",
                "min-w-[80px] min-h-[80px]",
                hasError 
                  ? "bg-white/50 text-slate-500 cursor-not-allowed"
                  : "bg-white text-slate-900",
                "shadow-lg shadow-white/20"
              )}
              aria-label={hasError ? "Audio unavailable" : (isPlaying ? "Pause" : "Play")}
            >
              {hasError ? (
                <AlertCircle size={32} className="text-slate-500 sm:w-7 sm:h-7" />
              ) : isPlaying ? (
                <Pause size={32} fill="currentColor" className="sm:w-7 sm:h-7" />
              ) : (
                <Play size={32} fill="currentColor" className="ml-1 sm:w-7 sm:h-7" />
              )}
            </motion.button>

            {/* Next */}
            <motion.button
              whileHover={hasNext && onNext ? { scale: 1.1 } : {}}
              whileTap={hasNext && onNext ? { scale: 0.95 } : {}}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (onNext && hasNext) {
                  onNext()
                }
              }}
              disabled={!hasNext || !onNext}
              className={cn(
                "p-3 rounded-full transition-colors touch-manipulation",
                "min-w-[48px] min-h-[48px] flex items-center justify-center",
                hasNext && onNext
                  ? "text-white hover:bg-white/10 cursor-pointer" 
                  : "text-white/30 cursor-not-allowed"
              )}
              aria-label="Next track"
            >
              <SkipForward size={28} fill="currentColor" className="sm:w-7 sm:h-7" />
            </motion.button>

            {/* Repeat */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleRepeat}
              className={cn(
                "p-2 rounded-full transition-colors relative",
                repeatMode !== 'off' ? "text-white" : "text-white/50 hover:text-white"
              )}
              aria-label={`Repeat ${repeatMode}`}
            >
              <Repeat size={20} />
              {repeatMode === 'one' && (
                <span className="absolute -top-1 -right-1 text-[10px] font-bold">1</span>
              )}
            </motion.button>
          </div>

          {/* Secondary controls */}
          <div className="flex items-center justify-between mt-6">
            {/* Volume */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleMute}
              className="p-2 text-white/50 hover:text-white transition-colors"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </motion.button>

            {/* Playlist indicator */}
            {playlist.length > 1 && (
              <p className="text-xs text-white/50">
                {currentIndex + 1} of {playlist.length}
              </p>
            )}

            {/* Close button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 text-white/50 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

