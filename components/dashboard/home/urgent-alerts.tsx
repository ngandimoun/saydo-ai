"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Bell, Play, X, ChevronDown, ChevronUp, Heart, Briefcase, User } from "lucide-react"
import type { UrgentAlert } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"
import { springs, staggerContainer, staggerItem } from "@/lib/motion-system"

/**
 * Urgent Alerts Section - Airbnb-Inspired
 * 
 * Displays urgent notifications prominently with:
 * - Color-coded urgency levels
 * - Category icons
 * - Expandable details
 * - Audio playback support
 * - Smooth dismiss animations
 * 
 * TODO (Backend Integration):
 * - Mark alerts as read/dismissed in database
 * - Play TTS audio from generated URL
 * - Real-time updates via Supabase subscription
 */

interface UrgentAlertsProps {
  alerts: UrgentAlert[]
}

const categoryConfig = {
  health: { 
    icon: Heart, 
    color: 'text-rose-500', 
    bg: 'bg-rose-500/10',
    label: 'Health'
  },
  work: { 
    icon: Briefcase, 
    color: 'text-blue-500', 
    bg: 'bg-blue-500/10',
    label: 'Work'
  },
  personal: { 
    icon: User, 
    color: 'text-purple-500', 
    bg: 'bg-purple-500/10',
    label: 'Personal'
  },
  reminder: { 
    icon: Bell, 
    color: 'text-amber-500', 
    bg: 'bg-amber-500/10',
    label: 'Reminder'
  },
}

const urgencyStyles = {
  critical: {
    border: 'border-l-red-500',
    glow: 'shadow-red-500/10',
    badge: 'bg-red-500 text-white',
  },
  high: {
    border: 'border-l-amber-500',
    glow: 'shadow-amber-500/10',
    badge: 'bg-amber-500 text-white',
  },
  medium: {
    border: 'border-l-blue-500',
    glow: 'shadow-blue-500/10',
    badge: 'bg-blue-500 text-white',
  },
  low: {
    border: 'border-l-gray-400',
    glow: '',
    badge: 'bg-gray-400 text-white',
  },
}

export function UrgentAlerts({ alerts }: UrgentAlertsProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)

  const visibleAlerts = alerts.filter(a => !dismissedIds.has(a.id) && !a.isDismissed)

  if (visibleAlerts.length === 0) return null

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]))
    // TODO: Update in database
  }

  const handlePlayAudio = (alert: UrgentAlert) => {
    setPlayingId(playingId === alert.id ? null : alert.id)
    // TODO: Play TTS audio
    console.log('Playing audio for:', alert.title)
  }

  return (
    <motion.section 
      className="space-y-3"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Section header */}
      <motion.div 
        variants={staggerItem}
        className="flex items-center gap-2"
      >
        <motion.div 
          className="p-1.5 rounded-lg bg-red-500/10"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <AlertTriangle size={14} className="text-red-500" />
        </motion.div>
        <h2 className="text-sm font-display font-semibold text-red-500 uppercase tracking-wide">
          Needs Attention
        </h2>
        <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-xs font-medium text-red-500">
          {visibleAlerts.length}
        </span>
      </motion.div>

      {/* Alert cards */}
      <AnimatePresence mode="popLayout">
        {visibleAlerts.map((alert, index) => {
          const category = categoryConfig[alert.category] || categoryConfig.reminder
          const urgency = urgencyStyles[alert.urgencyLevel] || urgencyStyles.medium
          const CategoryIcon = category.icon
          const isExpanded = expandedId === alert.id
          const isPlaying = playingId === alert.id

          return (
            <motion.div
              key={alert.id}
              layout
              variants={staggerItem}
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
              transition={springs.gentle}
              className={cn(
                "p-4 rounded-2xl",
                "bg-card border-l-4 shadow-sm",
                urgency.border,
                urgency.glow && `shadow-lg ${urgency.glow}`
              )}
            >
              <div className="flex items-start gap-3">
                {/* Category icon */}
                <motion.div 
                  className={cn("p-2.5 rounded-xl", category.bg)}
                  whileHover={{ scale: 1.1 }}
                  transition={springs.bouncy}
                >
                  <CategoryIcon size={18} className={category.color} />
                </motion.div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      urgency.badge
                    )}>
                      {alert.urgencyLevel}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {category.label}
                    </span>
                  </div>
                  
                  <h3 className="font-display font-semibold text-foreground leading-snug">
                    {alert.title}
                  </h3>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                          {alert.description}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Expand button */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                    className={cn(
                      "flex items-center gap-1 text-xs font-medium",
                      "text-muted-foreground hover:text-foreground",
                      "mt-2 touch-manipulation transition-colors"
                    )}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp size={14} />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown size={14} />
                        Show more
                      </>
                    )}
                  </button>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5">
                  {/* Play audio */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePlayAudio(alert)}
                    className={cn(
                      "p-2.5 rounded-xl",
                      isPlaying 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted hover:bg-muted/80 text-foreground",
                      "transition-colors touch-manipulation"
                    )}
                    aria-label="Play audio summary"
                  >
                    <Play size={14} className={isPlaying ? "" : "ml-0.5"} />
                  </motion.button>

                  {/* Dismiss */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDismiss(alert.id)}
                    className={cn(
                      "p-2 rounded-xl",
                      "hover:bg-muted transition-colors",
                      "touch-manipulation"
                    )}
                    aria-label="Dismiss alert"
                  >
                    <X size={16} className="text-muted-foreground" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </motion.section>
  )
}
