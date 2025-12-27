"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  X, 
  ChevronUp, 
  ChevronDown,
  Volume2,
  Repeat,
  Shuffle
} from "lucide-react"
import { formatDuration } from "@/lib/dashboard/time-utils"
import type { AudioContent } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Audio Player
 * 
 * Sleek audio player for Calm Zone content.
 * Features:
 * - Mini and expanded modes
 * - Play/pause, skip, progress
 * - Volume control (future)
 * 
 * TODO (Backend Integration):
 * - Save progress to audio_progress table
 * - Resume from last position
 * - Track completion for streaks
 * 
 * TODO (Audio):
 * - Actual audio playback using Howler.js or HTML5 Audio
 * - Background audio support
 * - Lock screen controls (PWA)
 */

interface AudioPlayerProps {
  audio: AudioContent
  isExpanded: boolean
  onExpandToggle: () => void
  onClose: () => void
}

export function AudioPlayer({ audio, isExpanded, onExpandToggle, onClose }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Simulate playback
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= audio.durationSeconds) {
            setIsPlaying(false)
            return audio.durationSeconds
          }
          return prev + 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, audio.durationSeconds])

  // Update progress
  useEffect(() => {
    setProgress((currentTime / audio.durationSeconds) * 100)
  }, [currentTime, audio.durationSeconds])

  // Reset on audio change
  useEffect(() => {
    setCurrentTime(0)
    setIsPlaying(true)
  }, [audio.id])

  // Skip forward/back
  const skipForward = () => {
    setCurrentTime(prev => Math.min(prev + 15, audio.durationSeconds))
  }

  const skipBack = () => {
    setCurrentTime(prev => Math.max(prev - 15, 0))
  }

  // Seek
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    setCurrentTime(Math.floor(percentage * audio.durationSeconds))
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className={cn(
          "fixed left-0 right-0 z-40",
          isExpanded ? "inset-0" : "bottom-20 sm:bottom-6"
        )}
      >
        {/* Backdrop for expanded */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background"
          />
        )}

        {/* Player Content */}
        <motion.div
          layout
          className={cn(
            "relative",
            isExpanded 
              ? "h-full flex flex-col" 
              : "mx-4 max-w-lg sm:mx-auto"
          )}
        >
          {isExpanded ? (
            // EXPANDED VIEW
            <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-lg mx-auto">
              {/* Close button */}
              <button
                onClick={onExpandToggle}
                className="absolute top-4 left-4 p-2 rounded-full hover:bg-muted"
              >
                <ChevronDown size={24} />
              </button>

              {/* Artwork */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-64 h-64 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-8 shadow-2xl"
              >
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                  <Volume2 size={40} className="text-white" />
                </div>
              </motion.div>

              {/* Title & Info */}
              <h2 className="text-2xl font-semibold text-foreground text-center">
                {audio.title}
              </h2>
              {audio.narrator && (
                <p className="text-muted-foreground mt-1">
                  Narrated by {audio.narrator}
                </p>
              )}

              {/* Progress */}
              <div className="w-full mt-8">
                <div 
                  onClick={handleSeek}
                  className="h-2 bg-muted rounded-full cursor-pointer overflow-hidden"
                >
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                  <span>{formatDuration(currentTime)}</span>
                  <span>{formatDuration(audio.durationSeconds)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-8 mt-8">
                <button className="p-2 text-muted-foreground hover:text-foreground">
                  <Shuffle size={20} />
                </button>
                
                <button 
                  onClick={skipBack}
                  className="p-3 hover:bg-muted rounded-full"
                >
                  <SkipBack size={28} />
                </button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 rounded-full bg-primary flex items-center justify-center"
                >
                  {isPlaying ? (
                    <Pause size={28} className="text-primary-foreground" />
                  ) : (
                    <Play size={28} className="text-primary-foreground ml-1" />
                  )}
                </motion.button>
                
                <button 
                  onClick={skipForward}
                  className="p-3 hover:bg-muted rounded-full"
                >
                  <SkipForward size={28} />
                </button>
                
                <button className="p-2 text-muted-foreground hover:text-foreground">
                  <Repeat size={20} />
                </button>
              </div>
            </div>
          ) : (
            // MINI PLAYER
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden"
            >
              {/* Progress bar */}
              <div className="h-1 bg-muted">
                <motion.div
                  className="h-full bg-primary"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="p-3 flex items-center gap-3">
                {/* Artwork mini */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Volume2 size={18} className="text-white" />
                </div>

                {/* Info */}
                <button 
                  onClick={onExpandToggle}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="font-medium text-sm truncate">{audio.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDuration(currentTime)} / {formatDuration(audio.durationSeconds)}
                  </p>
                </button>

                {/* Controls */}
                <div className="flex items-center gap-1">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
                  >
                    {isPlaying ? (
                      <Pause size={18} className="text-primary-foreground" />
                    ) : (
                      <Play size={18} className="text-primary-foreground ml-0.5" />
                    )}
                  </motion.button>

                  <button 
                    onClick={onClose}
                    className="p-2 text-muted-foreground hover:text-foreground"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

