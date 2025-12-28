"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Play, Pause, X, ChevronDown, ChevronUp, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getUrgencyLabel } from "@/lib/dashboard/time-utils"
import type { UrgentAlert } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Urgent Alerts Section
 * 
 * Displays immediately after greeting when urgent items exist.
 * Features:
 * - Red/amber accent for urgency
 * - Play button to hear audio summary (TTS)
 * - Dismiss/snooze actions
 * - Expandable for details
 * 
 * TODO (AI Integration):
 * - Generate TTS audio for each alert
 * - Auto-read critical alerts on first load
 * - Link to source (task, health insight, reminder)
 */

interface UrgentAlertsProps {
  alerts: UrgentAlert[]
  language: string
  onDismiss: (alertId: string) => void
  className?: string
}

export function UrgentAlerts({ alerts, language, onDismiss, className }: UrgentAlertsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)

  const urgencyLabel = getUrgencyLabel(language)

  // Toggle audio playback
  const togglePlay = (alertId: string) => {
    /**
     * TODO (AI Integration):
     * - Fetch TTS audio from storage
     * - Use Web Audio API or HTML5 Audio
     * - const audio = new Audio(alert.audioSummaryUrl)
     * - audio.play()
     */
    if (playingId === alertId) {
      setPlayingId(null)
      // Stop audio
    } else {
      setPlayingId(alertId)
      // Play audio
      // Simulate audio duration
      setTimeout(() => setPlayingId(null), 3000)
    }
  }

  // Get urgency color based on level
  const getUrgencyColor = (level: UrgentAlert['urgencyLevel']) => {
    switch (level) {
      case 'critical':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500',
          text: 'text-red-500',
          badge: 'bg-red-500 text-white'
        }
      case 'high':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500',
          text: 'text-amber-500',
          badge: 'bg-amber-500 text-white'
        }
      default:
        return {
          bg: 'bg-primary/10',
          border: 'border-primary',
          text: 'text-primary',
          badge: 'bg-primary text-primary-foreground'
        }
    }
  }

  // Get category icon
  const getCategoryIcon = (category: UrgentAlert['category']) => {
    // Could add more icons per category
    return AlertTriangle
  }

  return (
    <section className={cn("", className)}>
      {/* Section Label */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2 mb-3"
      >
        <AlertTriangle size={16} className="text-red-500" />
        <span className="text-sm font-bold text-red-500 uppercase tracking-wider">
          {urgencyLabel}
        </span>
        <span className="text-xs text-muted-foreground">
          ({alerts.length})
        </span>
      </motion.div>

      {/* Alert Cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {alerts.map((alert, index) => {
            const colors = getUrgencyColor(alert.urgencyLevel)
            const Icon = getCategoryIcon(alert.category)
            const isExpanded = expandedId === alert.id
            const isPlaying = playingId === alert.id

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -100, scale: 0.95 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                layout
                className={cn(
                  "saydo-card overflow-hidden",
                  "border-l-4",
                  colors.border
                )}
              >
                <div className="p-4">
                  {/* Header Row */}
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                      colors.bg
                    )}>
                      <Icon size={18} className={colors.text} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Badge */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                          colors.badge
                        )}>
                          {alert.category}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-foreground">
                        {alert.title}
                      </h3>

                      {/* Description - collapsible */}
                      <AnimatePresence>
                        {(isExpanded || alert.description.length < 80) && (
                          <motion.p
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="text-sm text-muted-foreground mt-1 leading-relaxed"
                          >
                            {alert.description}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Play Button - for TTS */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => togglePlay(alert.id)}
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                          isPlaying 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted hover:bg-primary/10"
                        )}
                        aria-label={isPlaying ? "Pause" : "Play audio summary"}
                      >
                        {isPlaying ? (
                          <Volume2 size={18} className="animate-pulse" />
                        ) : (
                          <Play size={18} className="ml-0.5" />
                        )}
                      </motion.button>

                      {/* Dismiss */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={() => onDismiss(alert.id)}
                        aria-label="Dismiss alert"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>

                  {/* Expand Toggle - for long descriptions */}
                  {alert.description.length >= 80 && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 ml-13"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp size={14} />
                          <span>Show less</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown size={14} />
                          <span>Show more</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Playing Indicator */}
                {isPlaying && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 3 }}
                    className="h-1 bg-primary origin-left"
                  />
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </section>
  )
}



