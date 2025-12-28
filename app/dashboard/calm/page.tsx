"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Moon, Search, Play, Sparkles, Clock, User, Pause } from "lucide-react"
import { getMockAudioContent } from "@/lib/dashboard/mock-data"
import type { AudioContent } from "@/lib/dashboard/types"
import { formatDuration } from "@/lib/dashboard/time-utils"
import { ChatWidget } from "@/components/dashboard/chat"
import { cn } from "@/lib/utils"
import { useAudioPlayer } from "@/components/dashboard/dashboard-layout-client"
import { springs, staggerContainer, fadeInUp } from "@/lib/motion-system"
import { getCalmAudioManager } from "@/lib/calm-audio"
import { getAudioStreamer } from "@/lib/audio-streamer"
import { logger } from "@/lib/logger"

/**
 * Calm Zone Tab Page - Light/Dark Mode Support
 * 
 * Atmospheric, immersive calm experience with:
 * - Theme-aware backgrounds and text colors
 * - Category pills with smooth selection
 * - Content grid with play state indicators
 */

const categories = [
  { id: 'all', label: 'All', emoji: '✨' },
  { id: 'sleep', label: 'Sleep', emoji: '🌙' },
  { id: 'meditation', label: 'Meditate', emoji: '🧘' },
  { id: 'relaxation', label: 'Relax', emoji: '☀️' },
  { id: 'motivational', label: 'Motivate', emoji: '💪' },
  { id: 'music', label: 'Music', emoji: '🎵' }
]

// Ambient gradient backgrounds for each category - light and dark mode
const categoryGradientsLight: Record<string, string> = {
  all: 'from-indigo-50 via-purple-50 to-pink-50',
  sleep: 'from-indigo-100 via-purple-100 to-slate-100',
  meditation: 'from-violet-100 via-indigo-100 to-purple-50',
  relaxation: 'from-sky-100 via-blue-50 to-cyan-50',
  motivational: 'from-orange-100 via-amber-50 to-yellow-50',
  music: 'from-pink-100 via-rose-50 to-fuchsia-50',
}

const categoryGradientsDark: Record<string, string> = {
  all: 'from-slate-900 via-slate-800 to-slate-900',
  sleep: 'from-indigo-950 via-purple-950 to-slate-950',
  meditation: 'from-violet-950 via-indigo-950 to-slate-950',
  relaxation: 'from-sky-950 via-blue-950 to-slate-950',
  motivational: 'from-orange-950 via-amber-950 to-slate-950',
  music: 'from-pink-950 via-rose-950 to-slate-950',
}

export default function CalmPage() {
  const audioPlayer = useAudioPlayer()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [audioContent, setAudioContent] = useState<AudioContent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const manager = getCalmAudioManager()
        const streamer = getAudioStreamer()
        
        // Load audio content from database
        const content = await manager.getAudioContent(activeCategory === 'all' ? undefined : activeCategory)
        
        // Get streaming URLs for each audio file
        const contentWithUrls = await Promise.all(
          content.map(async (item) => {
            try {
              const streamUrl = await manager.getAudioStreamUrl(item)
              return { ...item, audioUrl: streamUrl }
            } catch (error) {
              logger.warn('Failed to get audio stream URL', { error, audioId: item.id })
              return item // Fallback to original URL
            }
          })
        )
        
        setAudioContent(contentWithUrls.length > 0 ? contentWithUrls : getMockAudioContent())
      } catch (error) {
        logger.error('Failed to load audio content', { error })
        // Fallback to mock data
        setAudioContent(getMockAudioContent())
      }
      setIsLoading(false)
    }
    loadData()
  }, [activeCategory])

  const filteredContent = audioContent.filter(content => {
    const matchesSearch = content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         content.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'all' || content.category === activeCategory
    return matchesSearch && matchesCategory
  })

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
        key={`light-${activeCategory}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className={cn(
          "fixed inset-0 -z-10 dark:hidden",
          "bg-gradient-to-b",
          categoryGradientsLight[activeCategory],
          "transition-colors duration-700"
        )}
      />
      
      {/* Ambient Background - Dark Mode */}
      <motion.div 
        key={`dark-${activeCategory}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className={cn(
          "fixed inset-0 -z-10 hidden dark:block",
          "bg-gradient-to-b",
          categoryGradientsDark[activeCategory],
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
            placeholder="Search stories, meditations..."
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

        {/* Category Pills */}
        <motion.div 
          variants={fadeInUp}
          className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide"
        >
          {categories.map((cat, index) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05, ...springs.gentle }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium flex-shrink-0",
                "transition-all duration-200 touch-manipulation",
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card/80 dark:bg-white/10 text-foreground dark:text-white/80 hover:bg-muted dark:hover:bg-white/20 border border-border dark:border-white/10"
              )}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Featured Content */}
        {featuredContent && activeCategory === 'all' && (
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
                "w-full p-6 rounded-3xl text-left relative overflow-hidden",
                "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600",
                "shadow-xl shadow-purple-500/20"
              )}
            >
              {/* Background decoration */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),transparent_50%)]" />
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
              
              <div className="relative z-10">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
                  {featuredContent.category}
                </span>
                <h3 className="text-xl font-display font-bold text-white mt-1">
                  {featuredContent.title}
                </h3>
                <p className="text-sm text-white/70 mt-2 line-clamp-2">
                  {featuredContent.description}
                </p>
                <div className="flex items-center gap-4 mt-4">
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
            </motion.button>
          </motion.section>
        )}

        {/* Content Grid */}
        <motion.section variants={fadeInUp} className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {activeCategory === 'all' ? 'All Content' : categories.find(c => c.id === activeCategory)?.label}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredContent.filter(c => !c.isFeatured || activeCategory !== 'all').map((content, index) => (
                <motion.button
                  key={content.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ delay: index * 0.05, ...springs.gentle }}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePlayContent(content)}
                  className={cn(
                    "p-4 rounded-2xl text-left relative overflow-hidden",
                    "bg-card/90 dark:bg-white/10 backdrop-blur-sm",
                    "border border-border dark:border-white/10",
                    "hover:bg-card dark:hover:bg-white/15 hover:border-primary/30 dark:hover:border-white/20",
                    "hover:shadow-lg",
                    "transition-all duration-200",
                    isPlaying(content.id) && "ring-2 ring-primary dark:ring-white/30"
                  )}
                >
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
                      content.category === 'sleep' ? 'bg-indigo-500/20' :
                      content.category === 'meditation' ? 'bg-violet-500/20' :
                      content.category === 'relaxation' ? 'bg-sky-500/20' :
                      content.category === 'motivational' ? 'bg-orange-500/20' :
                      'bg-pink-500/20'
                    )}>
                      <span className="text-lg">
                        {categories.find(c => c.id === content.category)?.emoji || '✨'}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-sm text-foreground line-clamp-2">
                    {content.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Clock size={12} />
                    <span>{formatDuration(content.durationSeconds)}</span>
                    {content.narrator && (
                      <>
                        <span>•</span>
                        <User size={12} />
                        <span className="truncate">{content.narrator}</span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {content.tags.slice(0, 2).map(tag => (
                      <span 
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-muted dark:bg-white/10 text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
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

        {/* Chat Widget */}
        <ChatWidget pageContext={{ page: 'calm' }} />
      </div>
    </motion.div>
  )
}
