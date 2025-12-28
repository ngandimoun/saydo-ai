"use client"

import { motion } from "framer-motion"
import { Check, Circle, Clock, Tag } from "lucide-react"
import type { Task } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Task Card
 * 
 * Individual task item with:
 * - Checkbox for completion
 * - Priority indicator
 * - Due date/time
 * - Tags
 * 
 * TODO (AI):
 * - Show source indicator if extracted from voice
 * - Smart suggestions for similar tasks
 */

interface TaskCardProps {
  task: Task
  onToggle: () => void
  delay?: number
}

// Priority colors
const priorityConfig: Record<string, { dot: string; bg: string }> = {
  urgent: { dot: 'bg-red-500', bg: 'bg-red-500/5' },
  high: { dot: 'bg-amber-500', bg: 'bg-amber-500/5' },
  medium: { dot: 'bg-blue-500', bg: 'bg-blue-500/5' },
  low: { dot: 'bg-gray-400', bg: 'bg-transparent' }
}

export function TaskCard({ task, onToggle, delay = 0 }: TaskCardProps) {
  const isCompleted = task.status === 'completed'
  const priority = priorityConfig[task.priority] || priorityConfig.low

  // Format due date
  const formatDueDate = () => {
    if (!task.dueDate) return null
    
    const today = new Date()
    const due = new Date(task.dueDate)
    const isToday = due.toDateString() === today.toDateString()
    const isTomorrow = due.toDateString() === new Date(Date.now() + 86400000).toDateString()
    
    if (isToday) return task.dueTime ? `Today ${task.dueTime}` : 'Today'
    if (isTomorrow) return 'Tomorrow'
    return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const dueText = formatDueDate()

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "saydo-card p-3 flex items-start gap-3",
        priority.bg,
        isCompleted && "opacity-60"
      )}
    >
      {/* Checkbox */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onToggle}
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
          isCompleted 
            ? "bg-green-500 text-white" 
            : "border-2 border-border hover:border-primary"
        )}
      >
        {isCompleted && <Check size={14} strokeWidth={3} />}
      </motion.button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-start gap-2">
          {/* Priority dot */}
          <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", priority.dot)} />
          
          <span className={cn(
            "font-medium text-sm",
            isCompleted && "line-through text-muted-foreground"
          )}>
            {task.title}
          </span>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1 ml-4">
            {task.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-2 ml-4">
          {/* Due date */}
          {dueText && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={10} />
              <span>{dueText}</span>
            </div>
          )}

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex items-center gap-1">
              {task.tags.slice(0, 2).map(tag => (
                <span 
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Voice indicator */}
          {task.sourceRecordingId && (
            <div className="flex items-center gap-1 text-xs text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span>from voice</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}



