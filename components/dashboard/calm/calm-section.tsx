"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Moon, Search, Sparkles } from "lucide-react"
import { CategoryTabs } from "./category-tabs"
import { StoryCard } from "./story-card"
import { AudioPlayer } from "./audio-player"
import { getMockAudioContent } from "@/lib/dashboard/mock-data"
import type { AudioContent, AudioCategory } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Calm Section
 * 
 * Meditation, relaxation, and audio content zone.
 * Similar to Calm/Headspace but integrated with Saydo.
 * 
 * Features:
 * - Category filtering
 * - Audio player with progress
 * - Story/meditation cards
 * - Search functionality
 * 
 * TODO (Backend Integration):
 * - Fetch audio content from Supabase
 * - Track listening history
 * - Personalize recommendations based on time of day
 * - Resume playback from last position
 * 
 * TODO (Content):
 * - Integrate with audio content provider
 * - Generate AI-narrated content
 * - Custom meditation based on user's stress level
 */

interface CalmSectionProps {
  className?: string
}

export function CalmSection({ className }: CalmSectionProps) {
  const [audioContent, setAudioContent] = useState<AudioContent[]>([])
  const [activeCategory, setActiveCategory] = useState<AudioCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentlyPlaying, setCurrentlyPlaying] = useState<AudioContent | null>(null)
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false)

  // Load mock data
  useEffect(() => {
    /**
     * TODO (Backend):
     * const { data } = await supabase
     *   .from('audio_content')
     *   .select('*')
     *   .order('play_count', { ascending: false })
     */
    setAudioContent(getMockAudioContent())
  }, [])

  // Filter content
  const filteredContent = audioContent.filter(content => {
    const matchesCategory = activeCategory === 'all' || content.category === activeCategory
    const matchesSearch = !searchQuery || 
      content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  // Featured content (first item that's marked featured)
  const featuredContent = audioContent.find(c => c.isFeatured)

  // Play audio
  const playAudio = (audio: AudioContent) => {
    /**
     * TODO (Backend):
     * - Track play in audio_progress table
     * - Update play_count on audio_content
     * - Load previous progress if exists
     */
    setCurrentlyPlaying(audio)
    setIsPlayerExpanded(true)
  }

  return (
    <section id="section-calm" className={cn("", className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
            <Moon size={16} className="text-indigo-500" />
          </div>
          <h2 className="saydo-headline text-xl text-foreground">Calm Zone</h2>
        </div>
      </div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-4"
      >
        <Search 
          size={16} 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
        />
        <input
          type="text"
          placeholder="Search stories, meditations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            "w-full pl-10 pr-4 py-2.5 rounded-xl",
            "bg-muted/50 border border-border/50",
            "text-sm placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
          )}
        />
      </motion.div>

      {/* Category Tabs */}
      <CategoryTabs 
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Featured Card */}
      {featuredContent && activeCategory === 'all' && !searchQuery && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={12} className="text-indigo-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Featured
            </span>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => playAudio(featuredContent)}
            className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-left"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <span className="text-xs font-medium text-white/70 uppercase tracking-wider">
                {featuredContent.category}
              </span>
              <h3 className="text-xl font-semibold text-white mt-1">
                {featuredContent.title}
              </h3>
              <p className="text-sm text-white/80 mt-1 line-clamp-2">
                {featuredContent.description}
              </p>
              
              <div className="flex items-center gap-3 mt-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[8px] border-l-indigo-600 border-y-[5px] border-y-transparent ml-1" />
                </div>
                <span className="text-sm text-white/70">
                  {Math.floor(featuredContent.durationSeconds / 60)} min
                </span>
              </div>
            </div>
          </motion.button>
        </motion.div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filteredContent
          .filter(c => c.id !== featuredContent?.id || activeCategory !== 'all')
          .slice(0, 6)
          .map((content, index) => (
            <StoryCard
              key={content.id}
              content={content}
              onPlay={() => playAudio(content)}
              delay={index * 0.05}
            />
          ))}
      </div>

      {/* Empty State */}
      {filteredContent.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-indigo-500/10 flex items-center justify-center">
            <Moon size={20} className="text-indigo-500" />
          </div>
          <p className="font-medium text-foreground text-sm">No content found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try a different search or category
          </p>
        </motion.div>
      )}

      {/* View All Button */}
      {filteredContent.length > 6 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full mt-4 py-3 rounded-xl bg-muted text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
        >
          View all {filteredContent.length} items
        </motion.button>
      )}

      {/* Audio Player - appears when playing */}
      {currentlyPlaying && (
        <AudioPlayer
          audio={currentlyPlaying}
          isExpanded={isPlayerExpanded}
          onExpandToggle={() => setIsPlayerExpanded(!isPlayerExpanded)}
          onClose={() => {
            setCurrentlyPlaying(null)
            setIsPlayerExpanded(false)
          }}
        />
      )}
    </section>
  )
}



