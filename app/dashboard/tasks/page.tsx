"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckSquare, Plus, Clock, Calendar, ChevronRight } from "lucide-react"
import { getMockTasks, getMockReminders } from "@/lib/dashboard/mock-data"
import type { Task, Reminder } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Tasks Tab Page
 * 
 * Full-screen tasks view showing:
 * - Tabs for To-dos and Reminders
 * - Task cards with priority indicators
 * - Add task button
 * - Quick actions
 * 
 * TODO (Backend Integration):
 * - CRUD operations via Supabase
 * - Real-time sync
 * - Drag-and-drop reordering
 */

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<'todos' | 'reminders'>('todos')
  const [tasks, setTasks] = useState<Task[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      setTasks(getMockTasks())
      setReminders(getMockReminders())
      setIsLoading(false)
    }
    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-blue-500'
      default: return 'bg-gray-400'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 pt-6 pb-8 space-y-6 max-w-lg mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare size={20} className="text-blue-500" />
          <h1 className="text-2xl font-semibold">Smart Tasks</h1>
        </div>
        <button
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full",
            "bg-card border border-border",
            "hover:bg-muted transition-colors touch-manipulation"
          )}
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('todos')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
            "transition-colors touch-manipulation",
            activeTab === 'todos' 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <CheckSquare size={14} />
          To-do
          <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-xs">
            {tasks.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('reminders')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
            "transition-colors touch-manipulation",
            activeTab === 'reminders' 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <Clock size={14} />
          Reminders
          <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-xs">
            {reminders.length}
          </span>
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'todos' ? (
          <motion.div
            key="todos"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-3"
          >
            {tasks.map((task, index) => (
              <motion.button
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "w-full p-4 rounded-2xl text-left",
                  "bg-card border border-border/50",
                  "hover:border-border transition-colors"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5",
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
                      <h3 className={cn(
                        "font-medium",
                        task.status === 'completed' && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </h3>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {task.dueTime || 'Today'}
                        </span>
                      )}
                      {task.tags.map(tag => (
                        <span 
                          key={tag}
                          className="px-2 py-0.5 rounded bg-muted"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="reminders"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-3"
          >
            {reminders.map((reminder, index) => (
              <motion.button
                key={reminder.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "w-full p-4 rounded-2xl text-left",
                  "bg-card border border-border/50",
                  "hover:border-border transition-colors"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Clock size={18} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">{reminder.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {reminder.reminderTime.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                      {reminder.isRecurring && ` • ${reminder.recurrencePattern}`}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-muted-foreground" />
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

