"use client"

import { motion } from "framer-motion"
import { CheckSquare, Clock, ChevronRight } from "lucide-react"
import type { Task } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"
import Link from "next/link"

/**
 * Tasks Preview Section
 * 
 * Shows a preview of tasks on the Home tab.
 * Displays top 3-4 tasks with a "View all" link.
 * Full tasks management is available in the dedicated tasks page.
 * 
 * TODO (Backend Integration):
 * - Fetch user's tasks from Supabase
 * - Real-time updates when tasks change
 * - Mark task as complete from preview
 */

interface TasksPreviewProps {
  tasks: Task[]
}

export function TasksPreview({ tasks }: TasksPreviewProps) {
  // Show only first 4 tasks
  const previewTasks = tasks.slice(0, 4)

  if (previewTasks.length === 0) return null

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-blue-500'
      default: return 'bg-gray-400'
    }
  }

  return (
    <section className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare size={16} className="text-blue-500" />
          <h2 className="font-semibold text-foreground">Your Tasks</h2>
          <span className="text-xs text-muted-foreground">
            ({tasks.length})
          </span>
        </div>
        <Link 
          href="/dashboard/tasks"
          className="text-xs text-primary flex items-center gap-1 hover:underline"
        >
          View all
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* Tasks list */}
      <div className="space-y-2">
        {previewTasks.map((task, index) => (
          <motion.button
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "w-full p-3 rounded-xl text-left",
              "bg-card border border-border/50",
              "hover:border-border transition-colors",
              "flex items-center gap-3"
            )}
          >
            {/* Checkbox */}
            <div className={cn(
              "w-5 h-5 rounded-full border-2 flex-shrink-0",
              task.status === 'completed' 
                ? "bg-green-500 border-green-500" 
                : "border-muted-foreground"
            )} />
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  getPriorityColor(task.priority)
                )} />
                <span className={cn(
                  "text-sm font-medium truncate",
                  task.status === 'completed' && "line-through text-muted-foreground"
                )}>
                  {task.title}
                </span>
              </div>
            </div>

            {/* Time indicator */}
            {task.dueTime && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock size={12} />
                <span>{task.dueTime}</span>
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </section>
  )
}

