"use client"

import { motion } from "framer-motion"
import { Play, Clock, Moon, Heart, Sun, Sparkles, Music } from "lucide-react"
import { formatAudioDuration } from "@/lib/dashboard/time-utils"
import type { AudioContent, AudioCategory } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Story Card
 * 
 * Card for audio content in the Calm Zone.
 * Shows title, duration, category, and play button.
 * 
 * TODO (Future):
 * - Show progress indicator if partially listened
 * - Favorite/bookmark functionality
 * - Download for offline
 */

interface StoryCardProps {
  content: AudioContent
  onPlay: () => void
  delay?: number
}

// Category to gradient mapping
const categoryGradients: Record<AudioCategory, string> = {
  sleep: 'from-indigo-500/20 to-purple-500/10',
  meditation: 'from-purple-500/20 to-pink-500/10',
  relaxation: 'from-cyan-500/20 to-blue-500/10',
  motivational: 'from-amber-500/20 to-orange-500/10',
  music: 'from-pink-500/20 to-rose-500/10'
}

// Category icons
const categoryIcons: Record<AudioCategory, React.ComponentType<{ size?: number; className?: string }>> = {
  sleep: Moon,
  meditation: Heart,
  relaxation: Sun,
  motivational: Sparkles,
  music: Music
}

export function StoryCard({ content, onPlay, delay = 0 }: StoryCardProps) {
  const gradient = categoryGradients[content.category] || categoryGradients.relaxation
  const Icon = categoryIcons[content.category] || Moon
  const hasCoverImage = !!content.thumbnailUrl

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onPlay}
      className={cn(
        "relative overflow-hidden rounded-2xl text-left",
        "border border-border/30",
        hasCoverImage 
          ? "bg-card/90 dark:bg-white/5 p-0" 
          : cn("bg-gradient-to-br p-4", gradient)
      )}
    >
      {/* Cover Image - Spotify Style */}
      {hasCoverImage ? (
        <div className="relative w-full aspect-square">
          {/* Cover Image */}
          <img
            src={content.thumbnailUrl}
            alt={content.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          
          {/* Gradient Overlay for Metadata */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Play Button Overlay - appears on hover */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <div className="w-12 h-12 rounded-full bg-white/90 dark:bg-white shadow-lg flex items-center justify-center">
              <Play size={20} className="text-foreground ml-1" fill="currentColor" />
            </div>
          </motion.div>

          {/* Metadata Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h4 className="font-semibold text-white text-sm line-clamp-2 mb-1 drop-shadow-lg">
              {content.title}
            </h4>
            
            {/* Meta */}
            <div className="flex items-center gap-2 text-xs text-white/80">
              <div className="flex items-center gap-1">
                <Clock size={10} />
                <span>{formatAudioDuration(content.durationSeconds)}</span>
              </div>
              
              {content.narrator && (
                <>
                  <span>·</span>
                  <span className="truncate">{content.narrator}</span>
                </>
              )}
            </div>

            {/* Tags */}
            {content.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {content.tags.slice(0, 2).map(tag => (
                  <span 
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white/90"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Fallback: Category Icon Design */}
          {/* Play button overlay */}
          <div className="absolute top-3 right-3 z-10">
            <div className="w-8 h-8 rounded-full bg-white/90 dark:bg-card shadow-sm flex items-center justify-center">
              <Play size={14} className="text-foreground ml-0.5" fill="currentColor" />
            </div>
          </div>

          {/* Category icon */}
          <div className="w-10 h-10 rounded-xl bg-white/50 dark:bg-white/10 flex items-center justify-center mb-3">
            <Icon size={18} className="text-foreground" />
          </div>

          {/* Title */}
          <h4 className="font-medium text-foreground text-sm line-clamp-2 pr-8">
            {content.title}
          </h4>

          {/* Meta */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={10} />
              <span>{formatAudioDuration(content.durationSeconds)}</span>
            </div>
            
            {content.narrator && (
              <span className="text-xs text-muted-foreground">
                · {content.narrator}
              </span>
            )}
          </div>

          {/* Tags */}
          {content.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {content.tags.slice(0, 2).map(tag => (
                <span 
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-white/50 dark:bg-white/10 text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </motion.button>
  )
}







