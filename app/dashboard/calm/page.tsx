"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Moon, Search, Play, Sparkles, Clock, User } from "lucide-react"
import { getMockAudioContent } from "@/lib/dashboard/mock-data"
import type { AudioContent } from "@/lib/dashboard/types"
import { formatDuration } from "@/lib/dashboard/time-utils"
import { cn } from "@/lib/utils"
import { useAudioPlayer } from "@/app/dashboard/layout"

/**
 * Calm Zone Tab Page
 * 
 * Full-screen calm zone showing:
 * - Search bar for finding content
 * - Category filter tabs
 * - Featured content section
 * - Audio content grid
 * 
 * Audio plays in the persistent mini player (from layout).
 * 
 * TODO (Backend Integration):
 * - Fetch audio content from database
 * - Track listening history
 * - Personalized recommendations
 */

const categories = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'sleep', label: 'Sleep', icon: Moon },
  { id: 'meditation', label: 'Meditation', icon: () => <span>🧘</span> },
  { id: 'relaxation', label: 'Relax', icon: () => <span>☀️</span> },
  { id: 'motivational', label: 'Motivate', icon: () => <span>💪</span> },
  { id: 'music', label: 'Music', icon: () => <span>🎵</span> }
]

export default function CalmPage() {
  const audioPlayer = useAudioPlayer()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [audioContent, setAudioContent] = useState<AudioContent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      setAudioContent(getMockAudioContent())
      setIsLoading(false)
    }
    loadData()
  }, [])

  const filteredContent = audioContent.filter(content => {
    const matchesSearch = content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         content.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'all' || content.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const featuredContent = audioContent.find(c => c.isFeatured)

  const handlePlayContent = (content: AudioContent) => {
    // Use the audio player context from layout to play in persistent mini player
    audioPlayer.setTrack({
      id: content.id,
      title: content.title,
      narrator: content.narrator,
      audioUrl: content.audioUrl,
      durationSeconds: content.durationSeconds
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 pt-6 pb-8 space-y-6 max-w-lg mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Moon size={20} className="text-indigo-500" />
        <h1 className="text-2xl font-semibold">Calm Zone</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search stories, meditations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            "w-full pl-11 pr-4 py-3 rounded-2xl",
            "bg-card border border-border/50",
            "text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:border-primary transition-colors"
          )}
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {categories.map((cat) => {
          const Icon = cat.icon
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium flex-shrink-0",
                "transition-colors touch-manipulation",
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {typeof Icon === 'function' ? <Icon /> : <Icon size={14} />}
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Featured Content */}
      {featuredContent && activeCategory === 'all' && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Featured
            </h2>
          </div>

          <motion.button
            onClick={() => handlePlayContent(featuredContent)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "w-full p-6 rounded-3xl text-left relative overflow-hidden",
              "bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800"
            )}
          >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjgwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] opacity-20" />
            
            <div className="relative z-10">
              <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
                {featuredContent.category}
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                {featuredContent.title}
              </h3>
              <p className="text-sm text-white/70 mt-2">
                {featuredContent.description}
              </p>
              <div className="flex items-center gap-3 mt-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Play size={18} className="text-white ml-0.5" />
                </div>
                <span className="text-sm text-white/80">
                  {Math.floor(featuredContent.durationSeconds / 60)} min
                </span>
              </div>
            </div>
          </motion.button>
        </section>
      )}

      {/* Content Grid */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {activeCategory === 'all' ? 'All Content' : categories.find(c => c.id === activeCategory)?.label}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {filteredContent.filter(c => !c.isFeatured || activeCategory !== 'all').map((content, index) => (
            <motion.button
              key={content.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handlePlayContent(content)}
              className={cn(
                "p-4 rounded-2xl text-left",
                "bg-card border border-border/50",
                "hover:border-border transition-colors"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  content.category === 'sleep' ? 'bg-indigo-500/20' :
                  content.category === 'meditation' ? 'bg-purple-500/20' :
                  content.category === 'relaxation' ? 'bg-blue-500/20' :
                  'bg-orange-500/20'
                )}>
                  {content.category === 'sleep' && <Moon size={18} className="text-indigo-500" />}
                  {content.category === 'meditation' && <span>🧘</span>}
                  {content.category === 'relaxation' && <span>☀️</span>}
                  {content.category === 'motivational' && <span>💪</span>}
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play size={14} className="text-primary ml-0.5" />
                </div>
              </div>
              
              <h3 className="font-semibold text-sm">{content.title}</h3>
              
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Clock size={12} />
                <span>{formatDuration(content.durationSeconds)}</span>
                {content.narrator && (
                  <>
                    <span>•</span>
                    <User size={12} />
                    <span>{content.narrator}</span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {content.tags.slice(0, 2).map(tag => (
                  <span 
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.button>
          ))}
        </div>
      </section>
    </motion.div>
  )
}

