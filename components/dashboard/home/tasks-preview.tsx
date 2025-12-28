"use client"

import { motion } from "framer-motion"
import { CheckSquare, Clock, ChevronRight, Sparkles } from "lucide-react"
import type { Task } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { springs, staggerContainer, staggerItem } from "@/lib/motion-system"
import { EmptyState } from "@/components/ui/empty-state"

/**
 * Tasks Preview Section - Airbnb-Inspired
 * 
 * Shows a preview of tasks on the Home tab.
 * Features:
 * - Clean, scannable task list
 * - Priority indicators with color coding
 * - Smooth stagger animations
 * - Empty state with encouragement
 * 
 * TODO (Backend Integration):
 * - Fetch user's tasks from Supabase
 * - Real-time updates when tasks change
 * - Mark task as complete from preview
 */

interface TasksPreviewProps {
  tasks: Task[]
}

const priorityConfig = {
  urgent: { color: 'bg-red-500', ring: 'ring-red-500/20' },
  high: { color: 'bg-orange-500', ring: 'ring-orange-500/20' },
  medium: { color: 'bg-blue-500', ring: 'ring-blue-500/20' },
  low: { color: 'bg-gray-400', ring: 'ring-gray-400/20' },
}

export function TasksPreview({ tasks }: TasksPreviewProps) {
  // Show only first 4 pending tasks
  const previewTasks = tasks
    .filter(t => t.status !== 'completed')
    .slice(0, 4)

  const completedCount = tasks.filter(t => t.status === 'completed').length

  return (
    <motion.section 
      className="space-y-4"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Section header */}
      <motion.div 
        variants={staggerItem}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10">
            <CheckSquare size={14} className="text-blue-500" />
          </div>
          <h2 className="font-display font-semibold text-foreground">Today's Tasks</h2>
          {completedCount > 0 && (
            <span className="text-xs text-emerald-500 font-medium">
              {completedCount} done
            </span>
          )}
        </div>
        <Link 
          href="/dashboard/tasks"
          className="text-xs text-primary font-medium flex items-center gap-1 hover:underline group"
        >
          View all
          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </motion.div>

      {/* Tasks list or empty state */}
      {previewTasks.length === 0 ? (
        <motion.div variants={staggerItem}>
          <div className="p-6 rounded-2xl bg-card border border-border/50 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
              <Sparkles size={20} className="text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">All caught up!</p>
            <p className="text-xs text-muted-foreground">
              Record a voice note to create tasks
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {previewTasks.map((task, index) => {
            const priority = priorityConfig[task.priority] || priorityConfig.medium
            
            return (
              <motion.button
                key={task.id}
                variants={staggerItem}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.99 }}
                transition={springs.snappy}
                className={cn(
                  "w-full p-3.5 rounded-xl text-left",
                  "bg-card border border-border/50",
                  "hover:border-border hover:shadow-sm",
                  "transition-all duration-200",
                  "flex items-center gap-3 group"
                )}
              >
                {/* Checkbox */}
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex-shrink-0",
                    "border-muted-foreground/50 group-hover:border-primary",
                    "transition-colors duration-200"
                  )} 
                />
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      priority.color
                    )} />
                    <span className="text-sm font-medium truncate text-foreground">
                      {task.title}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Time indicator */}
                {task.dueTime && (
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-lg",
                    "text-xs font-medium",
                    "bg-muted text-muted-foreground"
                  )}>
                    <Clock size={10} />
                    <span>{task.dueTime}</span>
                  </div>
                )}

                {/* Hover chevron */}
                <ChevronRight 
                  size={16} 
                  className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" 
                />
              </motion.button>
            )
          })}
        </div>
      )}
    </motion.section>
  )
}
