"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { motion } from "framer-motion"
import { Moon, Search, Play, Sparkles, Clock, User, Pause, Music } from "lucide-react"
import type { AudioContent } from "@/lib/dashboard/types"
import { formatDuration } from "@/lib/dashboard/time-utils"
import { cn } from "@/lib/utils"
import { useAudioPlayer } from "@/components/dashboard/dashboard-layout-client"
import { springs, staggerContainer, fadeInUp } from "@/lib/motion-system"
import { logger } from "@/lib/logger"
import { useCalmAudio } from "@/hooks/queries"
import { shuffleWithoutAdjacentDuplicates } from "@/lib/array-utils"

/**
 * Calm Zone Tab Page - Light/Dark Mode Support
 * 
 * Atmospheric, immersive calm experience with:
 * - Theme-aware backgrounds and text colors
 * - Genre filters for music selection
 * - Content grid with play state indicators
 */

const genres = [
  { id: 'all', label: 'All', emoji: '✨', tag: null },
  { id: 'jazz', label: 'Jazz', emoji: '🎷', tag: 'jazz' },
  { id: 'blues', label: 'Blues', emoji: '🎸', tag: 'blues' },
  { id: 'ambient', label: 'Ambient', emoji: '🌊', tag: 'ambient' },
  { id: 'latin', label: 'Latin', emoji: '🌴', tag: 'latin' },
  { id: 'deep_house', label: 'Deep House', emoji: '🎹', tag: 'deep house' },
  { id: 'hip_hop', label: 'Hip-Hop', emoji: '🎤', tag: 'hip-hop' },
  { id: 'bossa_nova', label: 'Bossa Nova', emoji: '☕', tag: 'bossa nova' },
  { id: 'classical', label: 'Classical', emoji: '🎻', tag: 'classic' },
  { id: 'soulful', label: 'Soulful', emoji: '💫', tag: 'soulful' },
  { id: 'violin', label: 'Violin', emoji: '🎻', tag: 'violin' },
  { id: 'saxophone', label: 'Saxophone', emoji: '🎷', tag: 'saxophone' },
]

// Ambient gradient backgrounds for each genre - light and dark mode
const genreGradientsLight: Record<string, string> = {
  all: 'from-amber-100 via-yellow-50 to-orange-50',
  jazz: 'from-amber-100 via-yellow-50 to-orange-50',
  blues: 'from-blue-100 via-indigo-50 to-purple-50',
  ambient: 'from-cyan-100 via-blue-50 to-teal-50',
  latin: 'from-emerald-100 via-green-50 to-lime-50',
  deep_house: 'from-purple-100 via-pink-50 to-rose-50',
  hip_hop: 'from-slate-100 via-gray-50 to-zinc-50',
  bossa_nova: 'from-amber-100 via-yellow-50 to-orange-50',
  classical: 'from-violet-100 via-purple-50 to-indigo-50',
  soulful: 'from-pink-100 via-rose-50 to-fuchsia-50',
  violin: 'from-purple-100 via-violet-50 to-indigo-50',
  saxophone: 'from-amber-100 via-orange-50 to-yellow-50',
}

const genreGradientsDark: Record<string, string> = {
  all: 'from-amber-900 via-yellow-800 to-orange-800',
  jazz: 'from-amber-950 via-orange-950 to-slate-950',
  blues: 'from-blue-950 via-indigo-950 to-slate-950',
  ambient: 'from-cyan-950 via-blue-950 to-slate-950',
  latin: 'from-emerald-950 via-green-950 to-slate-950',
  deep_house: 'from-purple-950 via-pink-950 to-slate-950',
  hip_hop: 'from-slate-950 via-gray-950 to-slate-950',
  bossa_nova: 'from-amber-950 via-yellow-950 to-slate-950',
  classical: 'from-violet-950 via-purple-950 to-slate-950',
  soulful: 'from-pink-950 via-rose-950 to-slate-950',
  violin: 'from-purple-950 via-violet-950 to-slate-950',
  saxophone: 'from-amber-950 via-orange-950 to-slate-950',
}

export default function CalmPage() {
  const audioPlayer = useAudioPlayer()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeGenre, setActiveGenre] = useState('all')
  
  // Get the tag for the active genre
  const activeGenreTag = genres.find(g => g.id === activeGenre)?.tag
  
  // Use query hook for cached audio content - pass genre tag for filtering
  const { data: audioContent = [], isLoading } = useCalmAudio({ genre: activeGenreTag })

  const filteredContent = audioContent.filter(content => {
    // Database already filters by genre, so we only need to filter by search query
    const matchesSearch = content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         content.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         content.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesSearch
  })

  // Store shuffled result in ref to prevent re-shuffling on every render
  const shuffledContentRef = useRef<AudioContent[]>([])
  const prevHashRef = useRef<string>('')

  // Calculate stable content hash - only changes when actual content IDs or filters change
  const contentHash = useMemo(() => {
    // Create stable hash from content IDs, search query, and genre
    const sortedIds = [...audioContent.map(c => c.id)].sort().join(',')
    return `${sortedIds}|${searchQuery}|${activeGenre}`
  }, [audioContent, searchQuery, activeGenre])

  // Update shuffled content only when hash changes (not on every render)
  useEffect(() => {
    if (prevHashRef.current !== contentHash) {
      prevHashRef.current = contentHash
      // Recalculate filteredContent inside effect to avoid dependency issues
      const filtered = audioContent.filter(content => {
        const matchesSearch = content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             content.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             content.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        return matchesSearch
      })
      shuffledContentRef.current = shuffleWithoutAdjacentDuplicates(filtered, (content) => content.title)
    }
  }, [contentHash, audioContent, searchQuery])

  // Use shuffled content from ref (stable across renders)
  const shuffledContent = shuffledContentRef.current.length > 0 
    ? shuffledContentRef.current 
    : filteredContent

  const featuredContent = audioContent.find(c => c.isFeatured)

  // Convert AudioContent to AudioTrack format
  const toAudioTrack = (content: AudioContent) => ({
    id: content.id,
    title: content.title,
    narrator: content.narrator,
    audioUrl: content.audioUrl,
    durationSeconds: content.durationSeconds,
    thumbnailUrl: content.thumbnailUrl,
    category: content.category
  })

  const handlePlayContent = (content: AudioContent) => {
    // Create playlist from current filtered content
    const playlist = filteredContent.map(toAudioTrack)
    const track = toAudioTrack(content)
    
    // Open full-screen player with the track and playlist
    audioPlayer.openFullPlayer(track, playlist)
  }

  const isPlaying = (contentId: string) => {
    return audioPlayer.currentTrack?.id === contentId && audioPlayer.isPlaying
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-muted-foreground"
          >
            Preparing your calm space...
          </motion.p>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="relative min-h-screen"
    >
      {/* Ambient Background - Light Mode */}
      <motion.div 
        key={`light-${activeGenre}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className={cn(
          "fixed inset-0 -z-10 dark:hidden",
          "bg-gradient-to-b",
          genreGradientsLight[activeGenre] || genreGradientsLight.all,
          "transition-colors duration-700"
        )}
      />
      
      {/* Ambient Background - Dark Mode */}
      <motion.div 
        key={`dark-${activeGenre}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className={cn(
          "fixed inset-0 -z-10 hidden dark:block",
          "bg-gradient-to-b",
          genreGradientsDark[activeGenre] || genreGradientsDark.all,
          "transition-colors duration-700"
        )}
      >
        {/* Animated gradient orbs - dark mode only */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl animate-pulse" />
      </motion.div>

      <div className="relative px-4 pt-6 pb-8 space-y-6 max-w-lg mx-auto">
        {/* Header */}
        <motion.div 
          variants={fadeInUp}
          className="flex items-center gap-3"
        >
          <div className="p-2 rounded-xl bg-indigo-500/20 dark:bg-indigo-500/20">
            <Moon size={22} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="saydo-headline text-2xl font-semibold text-foreground">Calm Zone</h1>
            <p className="text-sm text-muted-foreground">Breathe. Relax. Be.</p>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div variants={fadeInUp} className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search music..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full pl-11 pr-4 py-3.5 rounded-2xl",
              "bg-card/80 dark:bg-white/10 backdrop-blur-sm",
              "border border-border dark:border-white/10",
              "text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/50",
              "transition-all duration-200"
            )}
          />
        </motion.div>

        {/* Genre Pills */}
        <motion.div 
          variants={fadeInUp}
          className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide"
        >
          {genres.map((genre, index) => (
            <motion.button
              key={genre.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05, ...springs.gentle }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveGenre(genre.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium flex-shrink-0",
                "transition-all duration-200 touch-manipulation",
                activeGenre === genre.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card/80 dark:bg-white/10 text-foreground dark:text-white/80 hover:bg-muted dark:hover:bg-white/20 border border-border dark:border-white/10"
              )}
            >
              <span>{genre.emoji}</span>
              {genre.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Featured Content */}
        {featuredContent && activeGenre === 'all' && (
          <motion.section variants={fadeInUp} className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-primary" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Featured
              </h2>
            </div>

            <motion.button
              onClick={() => handlePlayContent(featuredContent)}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={springs.snappy}
              className={cn(
                "w-full rounded-3xl text-left relative overflow-hidden touch-manipulation",
                "min-h-[200px] sm:min-h-[240px]",
                featuredContent.thumbnailUrl
                  ? "bg-card/90 dark:bg-white/5 p-0"
                  : cn(
                      "p-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600",
                      "shadow-xl shadow-purple-500/20"
                    )
              )}
            >
              {featuredContent.thumbnailUrl ? (
                <>
                  {/* Cover Image Featured Section */}
                  <div className="relative w-full aspect-[21/9]">
                    {/* Cover Image */}
                    <img
                      src={featuredContent.thumbnailUrl}
                      alt={featuredContent.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    
                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
                    
                    {/* Play Button Overlay */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                    >
                      <motion.div 
                        className={cn(
                          "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl",
                          isPlaying(featuredContent.id)
                            ? "bg-white"
                            : "bg-white/90 hover:bg-white"
                        )}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isPlaying(featuredContent.id) ? (
                          <Pause size={24} className="text-purple-600" />
                        ) : (
                          <Play size={24} className="text-purple-600 ml-1" fill="currentColor" />
                        )}
                      </motion.div>
                    </motion.div>

                    {/* Metadata Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
                        {featuredContent.category}
                      </span>
                      <h3 className="text-2xl font-display font-bold text-white mt-1 drop-shadow-lg">
                        {featuredContent.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-sm text-white/90 font-medium">
                          {Math.floor(featuredContent.durationSeconds / 60)} min
                        </span>
                        {featuredContent.narrator && (
                          <span className="text-sm text-white/70">
                            by {featuredContent.narrator}
                          </span>
                        )}
                        {featuredContent.tags.length > 0 && (
                          <div className="flex gap-2">
                            {featuredContent.tags.slice(0, 2).map(tag => (
                              <span
                                key={tag}
                                className="text-[10px] px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white/90"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Fallback: Gradient Background */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),transparent_50%)]" />
                  <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
                  
                  <div className="relative z-10">
                    <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
                      {featuredContent.category}
                    </span>
                    <h3 className="text-xl font-display font-bold text-white mt-1">
                      {featuredContent.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-3">
                      <motion.div 
                        className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center",
                          isPlaying(featuredContent.id)
                            ? "bg-white"
                            : "bg-white/20 hover:bg-white/30"
                        )}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isPlaying(featuredContent.id) ? (
                          <Pause size={20} className="text-purple-600" />
                        ) : (
                          <Play size={20} className="text-white ml-0.5" />
                        )}
                      </motion.div>
                      <span className="text-sm text-white/80">
                        {Math.floor(featuredContent.durationSeconds / 60)} min
                      </span>
                      {featuredContent.narrator && (
                        <span className="text-sm text-white/60">
                          by {featuredContent.narrator}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </motion.button>
          </motion.section>
        )}

        {/* Content Grid */}
        <motion.section variants={fadeInUp} className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {activeGenre === 'all' ? 'All Music' : genres.find(g => g.id === activeGenre)?.label}
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {shuffledContent.filter(c => !c.isFeatured || activeGenre !== 'all').map((content, index) => {
              const hasCoverImage = !!content.thumbnailUrl;
              return (
                <motion.button
                  key={content.id}
                  layout
                  initial={false}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePlayContent(content)}
                  className={cn(
                    "rounded-2xl text-left relative overflow-hidden",
                    "border border-border dark:border-white/10",
                    "hover:shadow-lg active:scale-[0.98]",
                    "transition-all duration-200 touch-manipulation",
                    isPlaying(content.id) && "ring-2 ring-primary dark:ring-white/30",
                    hasCoverImage 
                      ? "bg-card/90 dark:bg-white/5 p-0" 
                      : "p-4 bg-card/90 dark:bg-white/10 backdrop-blur-sm hover:bg-card dark:hover:bg-white/15 hover:border-primary/30 dark:hover:border-white/20"
                  )}
                  >
                    {hasCoverImage ? (
                      <>
                        {/* Cover Image - Spotify Style */}
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
                              {isPlaying(content.id) ? (
                                <Pause size={20} className="text-foreground" />
                              ) : (
                                <Play size={20} className="text-foreground ml-1" fill="currentColor" />
                              )}
                            </div>
                          </motion.div>

                          {/* Playing indicator */}
                          {isPlaying(content.id) && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary dark:bg-white flex items-center justify-center z-10"
                            >
                              <div className="flex gap-0.5">
                                {[...Array(3)].map((_, i) => (
                                  <motion.div
                                    key={i}
                                    className="w-0.5 bg-primary-foreground dark:bg-purple-600 rounded-full"
                                    animate={{ height: [4, 8, 4] }}
                                    transition={{
                                      duration: 0.5,
                                      repeat: Infinity,
                                      delay: i * 0.15
                                    }}
                                  />
                                ))}
                              </div>
                            </motion.div>
                          )}

                          {/* Metadata Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 className="font-semibold text-white text-sm line-clamp-2 mb-1 drop-shadow-lg">
                              {content.title}
                            </h3>
                            
                            {/* Meta */}
                            <div className="flex items-center gap-2 text-xs text-white/80">
                              <div className="flex items-center gap-1">
                                <Clock size={10} />
                                <span>{formatDuration(content.durationSeconds)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Fallback: Icon Design */}
                        {/* Playing indicator */}
                        {isPlaying(content.id) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary dark:bg-white flex items-center justify-center"
                          >
                            <div className="flex gap-0.5">
                              {[...Array(3)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  className="w-0.5 bg-primary-foreground dark:bg-purple-600 rounded-full"
                                  animate={{ height: [4, 8, 4] }}
                                  transition={{
                                    duration: 0.5,
                                    repeat: Infinity,
                                    delay: i * 0.15
                                  }}
                                />
                              ))}
                            </div>
                          </motion.div>
                        )}

                        <div className="flex items-center justify-between mb-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            'bg-primary/20'
                          )}>
                            <span className="text-lg">
                              {content.tags.length > 0 ? genres.find(g => g.tag === content.tags[0])?.emoji || '🎵' : '🎵'}
                            </span>
                          </div>
                        </div>
                        
                        <h3 className="font-semibold text-sm text-foreground line-clamp-2">
                          {content.title}
                        </h3>
                        
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock size={12} />
                          <span>{formatDuration(content.durationSeconds)}</span>
                        </div>
                      </>
                    )}
                  </motion.button>
                );
              })}
          </div>
        </motion.section>

        {/* Empty State */}
        {filteredContent.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-full bg-muted dark:bg-white/10 flex items-center justify-center mx-auto mb-4">
              <Moon size={28} className="text-muted-foreground" />
            </div>
            <p className="text-foreground mb-2">No content found</p>
            <p className="text-sm text-muted-foreground">Try a different search or category</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
