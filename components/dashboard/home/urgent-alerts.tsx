"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Play, X, ChevronDown, ChevronUp } from "lucide-react"
import type { UrgentAlert } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Urgent Alerts Section
 * 
 * Displays urgent notifications prominently.
 * Features:
 * - Color-coded by urgency level
 * - Play button for audio summary (TTS)
 * - Expandable details
 * - Dismissible
 * 
 * TODO (Backend Integration):
 * - Mark alerts as read/dismissed in database
 * - Play TTS audio from generated URL
 * - Real-time updates via Supabase subscription
 */

interface UrgentAlertsProps {
  alerts: UrgentAlert[]
}

export function UrgentAlerts({ alerts }: UrgentAlertsProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const visibleAlerts = alerts.filter(a => !dismissedIds.has(a.id) && !a.isDismissed)

  if (visibleAlerts.length === 0) return null

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]))
    // TODO: Update in database
  }

  const handlePlayAudio = (alert: UrgentAlert) => {
    // TODO: Play TTS audio
    console.log('Playing audio for:', alert.title)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'health': return 'bg-rose-500'
      case 'work': return 'bg-blue-500'
      case 'personal': return 'bg-purple-500'
      default: return 'bg-amber-500'
    }
  }

  const getBorderColor = (level: string) => {
    switch (level) {
      case 'critical': return 'border-l-red-500'
      case 'high': return 'border-l-amber-500'
      default: return 'border-l-blue-500'
    }
  }

  return (
    <section className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} className="text-red-500" />
        <h2 className="text-sm font-semibold text-red-500 uppercase tracking-wide">
          Highly Urgent
        </h2>
        <span className="text-xs text-muted-foreground">
          ({visibleAlerts.length})
        </span>
      </div>

      {/* Alert cards */}
      <AnimatePresence mode="popLayout">
        {visibleAlerts.map((alert) => (
          <motion.div
            key={alert.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, height: 0 }}
            className={cn(
              "p-4 rounded-2xl",
              "bg-card border-l-4",
              getBorderColor(alert.urgencyLevel)
            )}
          >
            <div className="flex items-start gap-3">
              {/* Category badge and content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-amber-500/20">
                    <AlertTriangle size={14} className="text-amber-500" />
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs font-semibold uppercase",
                    getCategoryColor(alert.category),
                    "text-white"
                  )}>
                    {alert.category}
                  </span>
                </div>
                
                <h3 className="font-semibold text-foreground">
                  {alert.title}
                </h3>

                {/* Expanded details */}
                <AnimatePresence>
                  {expandedId === alert.id && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-muted-foreground mt-2"
                    >
                      {alert.description}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Expand button */}
                <button
                  onClick={() => setExpandedId(
                    expandedId === alert.id ? null : alert.id
                  )}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 touch-manipulation"
                >
                  {expandedId === alert.id ? (
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
              <div className="flex items-center gap-2">
                {/* Play audio */}
                <button
                  onClick={() => handlePlayAudio(alert)}
                  className={cn(
                    "p-2.5 rounded-full",
                    "bg-muted hover:bg-muted/80",
                    "transition-colors touch-manipulation"
                  )}
                  aria-label="Play audio summary"
                >
                  <Play size={16} className="text-foreground ml-0.5" />
                </button>

                {/* Dismiss */}
                <button
                  onClick={() => handleDismiss(alert.id)}
                  className={cn(
                    "p-2 rounded-full",
                    "hover:bg-muted transition-colors",
                    "touch-manipulation"
                  )}
                  aria-label="Dismiss alert"
                >
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </section>
  )
}

