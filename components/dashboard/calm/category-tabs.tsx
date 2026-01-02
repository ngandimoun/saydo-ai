"use client"

import { motion } from "framer-motion"
import { Moon, Sun, Heart, Sparkles, Music } from "lucide-react"
import type { AudioCategory } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Category Tabs
 * 
 * Horizontal scrollable tabs for filtering audio content.
 * Categories: All, Sleep, Meditation, Relaxation, Motivational, Music
 */

interface CategoryTabsProps {
  activeCategory: AudioCategory | 'all'
  onCategoryChange: (category: AudioCategory | 'all') => void
}

const categories: Array<{
  id: AudioCategory | 'all'
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  activeColor: string
}> = [
  { id: 'all', label: 'All', icon: Sparkles, activeColor: 'bg-primary' },
  { id: 'sleep', label: 'Sleep', icon: Moon, activeColor: 'bg-indigo-500' },
  { id: 'meditation', label: 'Meditation', icon: Heart, activeColor: 'bg-purple-500' },
  { id: 'relaxation', label: 'Relax', icon: Sun, activeColor: 'bg-cyan-500' },
  { id: 'motivational', label: 'Motivate', icon: Sparkles, activeColor: 'bg-amber-500' },
  { id: 'music', label: 'Music', icon: Music, activeColor: 'bg-pink-500' }
]

export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-hide">
      {categories.map((category) => {
        const isActive = activeCategory === category.id
        const Icon = category.icon
        
        return (
          <motion.button
            key={category.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0",
              isActive
                ? `${category.activeColor} text-white`
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <Icon size={14} />
            <span>{category.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}







