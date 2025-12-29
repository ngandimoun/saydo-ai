"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { CheckSquare, Plus, Clock, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TaskCard } from "./task-card"
import { ReminderCard } from "./reminder-card"
import type { Task, Reminder } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase"
import { logger } from "@/lib/logger"
import { useTasksRealtime, useRemindersRealtime } from "@/hooks/use-realtime"
import { sortTasksChronologically, sortRemindersChronologically } from "@/lib/dashboard/task-sorting"

/**
 * Tasks Section
 * 
 * Smart task management with:
 * - To-do list with priorities
 * - Time-based reminders
 * - Quick add functionality
 * - AI-extracted tasks from voice notes
 */

interface TasksSectionProps {
  className?: string
}

type TabType = 'tasks' | 'reminders'

export function TasksSection({ className }: TasksSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('tasks')
  const [tasks, setTasks] = useState<Task[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  // Load real data from Supabase
  const loadData = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return
      
      setUserId(user.id)

      console.log('[TasksSection] Loading data', { userId: user.id })

      // Fetch tasks (we'll sort chronologically in the frontend)
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'completed')

      if (tasksError) {
        console.error('[TasksSection] Failed to fetch tasks', { error: tasksError })
        logger.error('Failed to fetch tasks', { error: tasksError })
      } else if (tasksData) {
        console.log('[TasksSection] Fetched tasks', { count: tasksData.length })
        const mappedTasks = tasksData.map(t => ({
          id: t.id,
          userId: t.user_id,
          title: t.title,
          description: t.description,
          priority: t.priority as Task['priority'],
          status: t.status as Task['status'],
          dueDate: t.due_date ? new Date(t.due_date) : undefined,
          dueTime: t.due_time,
          category: t.category,
          tags: t.tags || [],
          sourceRecordingId: t.source_recording_id,
          createdAt: new Date(t.created_at),
          completedAt: t.completed_at ? new Date(t.completed_at) : undefined,
        }))
        // Apply chronological sorting
        const sortedTasks = sortTasksChronologically(mappedTasks)
        setTasks(sortedTasks)
      } else {
        console.log('[TasksSection] No tasks found')
        setTasks([])
      }

      // Fetch reminders with all smart features
      const { data: remindersData, error: remindersError } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false)

      if (remindersError) {
        console.error('[TasksSection] Failed to fetch reminders', { error: remindersError })
        logger.error('Failed to fetch reminders', { error: remindersError })
      } else if (remindersData) {
        console.log('[TasksSection] Fetched reminders', { count: remindersData.length })
        const mappedReminders = remindersData.map(r => ({
          id: r.id,
          userId: r.user_id,
          title: r.title,
          description: r.description,
          reminderTime: new Date(r.reminder_time),
          isRecurring: r.is_recurring,
          recurrencePattern: r.recurrence_pattern,
          isCompleted: r.is_completed,
          isSnoozed: r.is_snoozed,
          snoozeUntil: r.snooze_until ? new Date(r.snooze_until) : undefined,
          tags: r.tags || [],
          priority: r.priority || 'medium',
          type: r.type || 'reminder',
          sourceRecordingId: r.source_recording_id,
          createdAt: new Date(r.created_at),
        }))
        // Apply smart chronological sorting
        const sortedReminders = sortRemindersChronologically(mappedReminders)
        setReminders(sortedReminders)
      } else {
        console.log('[TasksSection] No reminders found')
        setReminders([])
      }
    } catch (error) {
      console.error('[TasksSection] Error loading data', { error })
      logger.error('Failed to load tasks section data', { error })
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadData()
  }, [loadData])

  // Listen for storage events to refresh when voice processing completes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'voice-processing-complete' || e.key === 'tasks-updated') {
        console.log('[TasksSection] Refresh triggered by storage event', { key: e.key })
        loadData()
      }
    }

    // Listen for same-tab localStorage changes
    const handleLocalStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail) {
        console.log('[TasksSection] Refresh triggered by custom event', customEvent.detail)
        loadData()
      } else {
        console.log('[TasksSection] Refresh triggered by custom event')
        loadData()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('voice-processing-complete', handleLocalStorageChange)
    window.addEventListener('tasks-updated', handleLocalStorageChange)

    // Poll localStorage for changes (for same-tab updates)
    const pollInterval = setInterval(() => {
      const lastUpdate = localStorage.getItem('tasks-updated')
      if (lastUpdate) {
        const lastUpdateTime = parseInt(lastUpdate, 10)
        const now = Date.now()
        // If update was within last 5 seconds, refresh
        if (now - lastUpdateTime < 5000) {
          console.log('[TasksSection] Refresh triggered by localStorage poll')
          loadData()
          // Clear the flag to avoid repeated refreshes
          localStorage.removeItem('tasks-updated')
        }
      }
    }, 2000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('voice-processing-complete', handleLocalStorageChange)
      window.removeEventListener('tasks-updated', handleLocalStorageChange)
      clearInterval(pollInterval)
    }
  }, [loadData])

  // Subscribe to realtime task updates
  useTasksRealtime(
    userId || '',
    (taskData) => {
      const t = taskData as any
      const task: Task = {
        id: t.id,
        userId: t.user_id,
        title: t.title,
        description: t.description,
        priority: t.priority as Task['priority'],
        status: t.status as Task['status'],
        dueDate: t.due_date ? new Date(t.due_date) : undefined,
        dueTime: t.due_time,
        category: t.category,
        tags: t.tags || [],
        sourceRecordingId: t.source_recording_id,
        createdAt: new Date(t.created_at),
        completedAt: t.completed_at ? new Date(t.completed_at) : undefined,
      }
      
      setTasks(prev => {
        const existing = prev.findIndex(pt => pt.id === task.id)
        let updatedTasks: Task[]
        
        if (existing >= 0) {
          // Filter out completed tasks from the list
          if (task.status === 'completed') {
            updatedTasks = prev.filter(pt => pt.id !== task.id)
          } else {
            updatedTasks = prev.map((pt, i) => i === existing ? task : pt)
          }
        } else {
          // Only add if not completed
          if (task.status !== 'completed') {
            updatedTasks = [task, ...prev]
          } else {
            updatedTasks = prev
          }
        }
        
        // Apply chronological sorting after update
        return sortTasksChronologically(updatedTasks)
      })
    },
    !!userId
  )

  // Subscribe to realtime reminder updates
  useRemindersRealtime(
    userId || '',
    (reminderData) => {
      const r = reminderData as any
      const reminder: Reminder = {
        id: r.id,
        userId: r.user_id,
        title: r.title,
        description: r.description,
        reminderTime: new Date(r.reminder_time),
        isRecurring: r.is_recurring,
        recurrencePattern: r.recurrence_pattern,
        isCompleted: r.is_completed,
        isSnoozed: r.is_snoozed,
        snoozeUntil: r.snooze_until ? new Date(r.snooze_until) : undefined,
        tags: r.tags || [],
        priority: r.priority || 'medium',
        type: r.type || 'reminder',
        sourceRecordingId: r.source_recording_id,
        createdAt: new Date(r.created_at),
      }
      
      setReminders(prev => {
        const existing = prev.findIndex(pr => pr.id === reminder.id)
        if (existing >= 0) {
          // Filter out completed reminders
          if (reminder.isCompleted) {
            return prev.filter(pr => pr.id !== reminder.id)
          }
          return prev.map((pr, i) => i === existing ? reminder : pr)
        }
        // Only add if not completed
        if (!reminder.isCompleted) {
          return [reminder, ...prev]
        }
        return prev
      })
    },
    !!userId
  )

  // Toggle task completion
  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null

    // Optimistic update
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, status: newStatus, completedAt: completedAt ? new Date(completedAt) : undefined } as Task
        : t
    ))

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus, completed_at: completedAt })
        .eq('id', taskId)

      if (error) {
        logger.error('Failed to update task', { error })
        // Revert on error
        setTasks(prev => prev.map(t => t.id === taskId ? task : t))
      }
    } catch (error) {
      logger.error('Failed to toggle task', { error })
      setTasks(prev => prev.map(t => t.id === taskId ? task : t))
    }
  }

  // Complete reminder
  const completeReminder = async (reminderId: string) => {
    // Optimistic update
    setReminders(prev => prev.filter(r => r.id !== reminderId))

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('reminders')
        .update({ is_completed: true })
        .eq('id', reminderId)

      if (error) {
        logger.error('Failed to complete reminder', { error })
        // Reload reminders on error
      }
    } catch (error) {
      logger.error('Failed to complete reminder', { error })
    }
  }

  // Snooze reminder
  const snoozeReminder = async (reminderId: string) => {
    const snoozeTime = new Date(Date.now() + 30 * 60 * 1000) // 30 mins
    
    // Optimistic update
    setReminders(prev => prev.filter(r => r.id !== reminderId))

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('reminders')
        .update({ is_snoozed: true, snooze_until: snoozeTime.toISOString() })
        .eq('id', reminderId)

      if (error) {
        logger.error('Failed to snooze reminder', { error })
      }
    } catch (error) {
      logger.error('Failed to snooze reminder', { error })
    }
  }

  // Count pending items
  const pendingTasks = tasks.filter(t => t.status !== 'completed').length
  const activeReminders = reminders.length

  return (
    <section id="section-tasks" className={cn("", className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
            <CheckSquare size={16} className="text-blue-500" />
          </div>
          <h2 className="saydo-headline text-xl text-foreground">Smart Tasks</h2>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="rounded-full gap-2"
          onClick={() => {
            /**
             * TODO: Open quick add modal
             * Could also trigger voice recording for task creation
             */
            console.log('Add new task')
          }}
        >
          <Plus size={14} />
          <span className="hidden sm:inline">Add</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('tasks')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
            activeTab === 'tasks'
              ? "bg-blue-500 text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          <CheckSquare size={14} />
          To-do
          {pendingTasks > 0 && (
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-xs",
              activeTab === 'tasks' 
                ? "bg-white/20" 
                : "bg-blue-500/10 text-blue-500"
            )}>
              {pendingTasks}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
            activeTab === 'reminders'
              ? "bg-amber-500 text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          <Clock size={14} />
          Reminders
          {activeReminders > 0 && (
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-xs",
              activeTab === 'reminders' 
                ? "bg-white/20" 
                : "bg-amber-500/10 text-amber-500"
            )}>
              {activeReminders}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: activeTab === 'tasks' ? -10 : 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'tasks' && (
          <div className="space-y-2">
            {tasks.length > 0 ? (
              // Tasks are already sorted chronologically
              tasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTask(task.id)}
                  delay={index * 0.05}
                />
              ))
            ) : (
              <EmptyState
                icon={CheckSquare}
                title="All caught up!"
                description="No pending tasks. Voice record a new one?"
              />
            )}
          </div>
        )}

        {activeTab === 'reminders' && (
          <div className="space-y-2">
            {reminders.length > 0 ? (
              reminders.map((reminder, index) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  onComplete={() => completeReminder(reminder.id)}
                  onSnooze={() => snoozeReminder(reminder.id)}
                  delay={index * 0.05}
                />
              ))
            ) : (
              <EmptyState
                icon={Bell}
                title="No reminders"
                description="You're all set for now"
              />
            )}
          </div>
        )}
      </motion.div>
    </section>
  )
}

// Empty state component
interface EmptyStateProps {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  description: string
}

function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-8"
    >
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
        <Icon size={20} className="text-muted-foreground" />
      </div>
      <p className="font-medium text-foreground text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </motion.div>
  )
}




