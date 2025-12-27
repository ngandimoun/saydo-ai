"use client"

import { motion } from "framer-motion"
import { Clock, Check, Bell, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Reminder } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Reminder Card
 * 
 * Time-based reminder with:
 * - Time display
 * - Complete and snooze actions
 * - Recurring indicator
 * 
 * TODO (Backend):
 * - Push notification integration
 * - Custom snooze duration picker
 */

interface ReminderCardProps {
  reminder: Reminder
  onComplete: () => void
  onSnooze: () => void
  delay?: number
}

export function ReminderCard({ reminder, onComplete, onSnooze, delay = 0 }: ReminderCardProps) {
  // Format time
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Check if reminder is due soon (within 30 min)
  const isDueSoon = () => {
    const now = new Date()
    const reminderTime = new Date(reminder.reminderTime)
    const diffMs = reminderTime.getTime() - now.getTime()
    return diffMs > 0 && diffMs < 30 * 60 * 1000
  }

  const dueSoon = isDueSoon()

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.2 }}
      className={cn(
        "saydo-card p-3 flex items-center gap-3",
        dueSoon && "bg-amber-500/5 border-l-4 border-l-amber-500"
      )}
    >
      {/* Time badge */}
      <div className={cn(
        "w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0",
        dueSoon ? "bg-amber-500 text-white" : "bg-muted"
      )}>
        <Clock size={14} className={dueSoon ? "" : "text-muted-foreground"} />
        <span className={cn(
          "text-xs font-bold mt-0.5",
          !dueSoon && "text-foreground"
        )}>
          {formatTime(reminder.reminderTime)}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground text-sm">
          {reminder.title}
        </h4>
        {reminder.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {reminder.description}
          </p>
        )}
        {reminder.isRecurring && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <RotateCcw size={10} />
            <span>{reminder.recurrencePattern}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onSnooze}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"
          aria-label="Snooze"
        >
          <Bell size={14} className="text-muted-foreground" />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onComplete}
          className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600"
          aria-label="Mark as done"
        >
          <Check size={14} className="text-white" />
        </motion.button>
      </div>
    </motion.div>
  )
}

