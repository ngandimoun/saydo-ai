"use client"

import { useRef, useEffect, useState, useCallback } from "react"
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
  onPrevious
}: FullPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [localProgress, setLocalProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isShuffled, setIsShuffled] = useState(false)
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off')

  const hasError = !!error
  const category = track?.category || 'default'
  const gradient = hasError ? 'from-slate-700 via-slate-800 to-slate-900' : (categoryGradients[category] || categoryGradients.default)
  const accent = hasError ? 'bg-slate-500' : (categoryAccents[category] || categoryAccents.default)

  // Get current track index in playlist
  const currentIndex = playlist.findIndex(t => t.id === track?.id)
  const hasNext = currentIndex < playlist.length - 1
  const hasPrevious = currentIndex > 0

  // Sync audio element with state
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !track) return

    if (isPlaying) {
      audio.play().catch(() => onPause())
    } else {
      audio.pause()
    }
  }, [isPlaying, onPause, track])

  // Update audio src when track changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !track) return

    audio.src = track.audioUrl
    audio.load()
    if (isPlaying) {
      audio.play().catch(() => onPause())
    }
  }, [track?.audioUrl, track?.id])

  // Handle time updates
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current
    if (!audio || isDragging) return
    
    const progress = (audio.currentTime / audio.duration) * 100
    setLocalProgress(isNaN(progress) ? 0 : progress)
    onSeek(audio.currentTime)
  }, [isDragging, onSeek])

  // Handle progress bar interaction
  const handleProgressInteraction = useCallback((clientX: number) => {
    const audio = audioRef.current
    const progressBar = progressRef.current
    if (!audio || !progressBar) return

    const rect = progressBar.getBoundingClientRect()
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const newTime = percentage * audio.duration

    audio.currentTime = newTime
    setLocalProgress(percentage * 100)
    onSeek(newTime)
  }, [onSeek])

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    handleProgressInteraction(e.clientX)
  }

  const handleProgressDragStart = () => {
    setIsDragging(true)
  }

  const handleProgressDragEnd = () => {
    setIsDragging(false)
  }

  // Handle audio end
  const handleEnded = useCallback(() => {
    if (repeatMode === 'one') {
      const audio = audioRef.current
      if (audio) {
        audio.currentTime = 0
        audio.play()
      }
    } else if (onNext && hasNext) {
      onNext()
    } else if (repeatMode === 'all' && onPrevious) {
      // Go back to first track
      // This is simplified - ideally would track first track
    }
  }, [repeatMode, onNext, hasNext, onPrevious])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (audio) {
      audio.muted = !audio.muted
      setIsMuted(!isMuted)
    }
  }

  const toggleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all'
      if (prev === 'all') return 'one'
      return 'off'
    })
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
        "bg-gradient-to-b",
        gradient,
        "flex flex-col",
        "overflow-hidden"
      )}
      >
        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />

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
              style={{ width: `${localProgress}%` }}
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
              onClick={() => setIsShuffled(!isShuffled)}
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
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onPrevious}
              disabled={!hasPrevious}
              className={cn(
                "p-3 rounded-full transition-colors",
                hasPrevious 
                  ? "text-white hover:bg-white/10" 
                  : "text-white/30 cursor-not-allowed"
              )}
              aria-label="Previous track"
            >
              <SkipBack size={28} fill="currentColor" />
            </motion.button>

            {/* Play/Pause */}
            <motion.button
              whileHover={hasError ? {} : { scale: 1.05 }}
              whileTap={hasError ? {} : { scale: 0.95 }}
              onClick={hasError ? undefined : (isPlaying ? onPause : onPlay)}
              disabled={hasError}
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center",
                hasError 
                  ? "bg-white/50 text-slate-500 cursor-not-allowed"
                  : "bg-white text-slate-900",
                "shadow-lg shadow-white/20"
              )}
              aria-label={hasError ? "Audio unavailable" : (isPlaying ? "Pause" : "Play")}
            >
              {hasError ? (
                <AlertCircle size={28} className="text-slate-500" />
              ) : isPlaying ? (
                <Pause size={28} fill="currentColor" />
              ) : (
                <Play size={28} fill="currentColor" className="ml-1" />
              )}
            </motion.button>

            {/* Next */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNext}
              disabled={!hasNext}
              className={cn(
                "p-3 rounded-full transition-colors",
                hasNext 
                  ? "text-white hover:bg-white/10" 
                  : "text-white/30 cursor-not-allowed"
              )}
              aria-label="Next track"
            >
              <SkipForward size={28} fill="currentColor" />
            </motion.button>

            {/* Repeat */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleRepeat}
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
              onClick={toggleMute}
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

