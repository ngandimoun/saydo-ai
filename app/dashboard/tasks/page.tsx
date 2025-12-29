"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckSquare, Plus, Clock, Calendar, ChevronRight, FileText, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import type { Task, Reminder } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase"
import { logger } from "@/lib/logger"
import { useTasksRealtime, useRemindersRealtime } from "@/hooks/use-realtime"
import { formatSmartDateTime } from "@/lib/dashboard/time-utils"
import { useProfile } from "@/hooks/queries"
import type { Language } from "@/lib/dashboard/label-translations"
import { sortTasksChronologically, sortRemindersChronologically, getOverdueTasks, getOverdueReminders } from "@/lib/dashboard/task-sorting"
import { SmartSuggestions } from "@/components/dashboard/tasks/smart-suggestions"
import { BulkActionsBar } from "@/components/dashboard/tasks/bulk-actions-bar"
import { RescheduleDialog } from "@/components/dashboard/tasks/reschedule-dialog"

/**
 * Tasks Tab Page
 * 
 * Full-screen tasks view showing:
 * - Tabs for To-dos and Reminders
 * - Task cards with priority indicators
 * - Add task button
 * - Quick actions
 */

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<'todos' | 'reminders'>('todos')
  const [tasks, setTasks] = useState<Task[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [newTaskIds, setNewTaskIds] = useState<Set<string>>(new Set())
  const [newReminderIds, setNewReminderIds] = useState<Set<string>>(new Set())
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
  const [selectedReminderIds, setSelectedReminderIds] = useState<Set<string>>(new Set())
  const [showOverdueSection, setShowOverdueSection] = useState(true)
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  const [rescheduleType, setRescheduleType] = useState<'task' | 'reminder'>('task')
  const { data: userProfile } = useProfile()
  const userLanguage = (userProfile?.language || 'en') as Language
  
  // Track last refresh time to prevent duplicate refreshes
  const lastRefreshTimeRef = useRef<number>(0)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Extract loadData into useCallback for reuse
  const loadData = useCallback(async (showNotification = false) => {
    // Debounce: prevent multiple rapid refreshes
    const now = Date.now()
    if (now - lastRefreshTimeRef.current < 1000) {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      refreshTimeoutRef.current = setTimeout(() => {
        loadData(showNotification)
      }, 1000 - (now - lastRefreshTimeRef.current))
      return
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError("Please sign in to view your tasks")
        setIsLoading(false)
        return
      }

      setUserId(user.id)

      // Fetch tasks from Supabase
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)

      if (tasksError) {
        logger.error('Failed to fetch tasks', { error: tasksError })
      } else if (tasksData) {
        const newTasks = tasksData.map(t => ({
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

        // Apply smart chronological sorting
        const sortedTasks = sortTasksChronologically(newTasks)

        // Detect new tasks
        if (showNotification) {
          setTasks(currentTasks => {
            if (currentTasks.length > 0) {
              const currentTaskIds = new Set(currentTasks.map(t => t.id))
              const newlyAdded = sortedTasks.filter(t => !currentTaskIds.has(t.id))
              if (newlyAdded.length > 0) {
                setNewTaskIds(new Set(newlyAdded.map(t => t.id)))
                // Clear highlight after 3 seconds
                setTimeout(() => {
                  setNewTaskIds(new Set())
                }, 3000)
              }
            }
            return sortedTasks
          })
        } else {
          setTasks(sortedTasks)
        }
      }

      // Fetch reminders from Supabase
      const { data: remindersData, error: remindersError } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false)

      if (remindersError) {
        logger.error('Failed to fetch reminders', { error: remindersError })
      } else if (remindersData) {
        const newReminders = remindersData.map(r => ({
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
        const sortedReminders = sortRemindersChronologically(newReminders)

        // Detect new reminders
        if (showNotification) {
          setReminders(currentReminders => {
            if (currentReminders.length > 0) {
              const currentReminderIds = new Set(currentReminders.map(r => r.id))
              const newlyAdded = sortedReminders.filter(r => !currentReminderIds.has(r.id))
              if (newlyAdded.length > 0) {
                setNewReminderIds(new Set(newlyAdded.map(r => r.id)))
                // Clear highlight after 3 seconds
                setTimeout(() => {
                  setNewReminderIds(new Set())
                }, 3000)
              }
            }
            return sortedReminders
          })
        } else {
          setReminders(sortedReminders)
        }
      }
    } catch (err) {
      logger.error('Failed to load tasks page data', { error: err })
      setError("Failed to load tasks")
    }
    
    setIsLoading(false)
    lastRefreshTimeRef.current = Date.now()
  }, [])

  // Initial load
  useEffect(() => {
    loadData()
  }, [loadData])

  // Listen for storage events to refresh when voice processing completes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'voice-processing-complete' || e.key === 'tasks-updated') {
        console.log('[TasksPage] Refresh triggered by storage event', { key: e.key })
        loadData(true)
      }
    }

    // Listen for same-tab localStorage changes
    const handleLocalStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail) {
        console.log('[TasksPage] Refresh triggered by custom event', customEvent.detail)
        loadData(true)
      } else {
        console.log('[TasksPage] Refresh triggered by custom event')
        loadData(true)
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
          console.log('[TasksPage] Refresh triggered by localStorage poll')
          loadData(true)
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
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [loadData])

  // Subscribe to realtime task updates
  useTasksRealtime(
    userId || '',
    (task) => {
      logger.info('[TasksPage] Task updated via realtime', { task })
      // Debounce realtime updates
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      refreshTimeoutRef.current = setTimeout(() => {
        loadData(true)
      }, 500)
    },
    !!userId
  )

  // Subscribe to realtime reminder updates
  useRemindersRealtime(
    userId || '',
    (reminder) => {
      logger.info('[TasksPage] Reminder updated via realtime', { reminder })
      // Debounce realtime updates
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      refreshTimeoutRef.current = setTimeout(() => {
        loadData(true)
      }, 500)
    },
    !!userId
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <CheckSquare size={28} className="text-muted-foreground" />
        </div>
        <p className="text-foreground mb-2">{error}</p>
        <p className="text-sm text-muted-foreground">Try refreshing the page</p>
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

      {/* Smart Suggestions */}
      <SmartSuggestions
        tasks={tasks}
        reminders={reminders}
        onMarkAllDone={async () => {
          const overdueTasks = getOverdueTasks(tasks)
          const overdueReminders = getOverdueReminders(reminders)
          const allIds = [...overdueTasks.map(t => t.id), ...overdueReminders.map(r => r.id)]
          
          if (allIds.length === 0) return
          
          try {
            const response = await fetch('/api/tasks/bulk', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'complete', taskIds: overdueTasks.map(t => t.id) })
            })
            if (response.ok) {
              loadData(true)
            }
          } catch (error) {
            console.error('Failed to mark all as done:', error)
          }
          
          if (overdueReminders.length > 0) {
            try {
              const response = await fetch('/api/reminders/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'complete', reminderIds: overdueReminders.map(r => r.id) })
              })
              if (response.ok) {
                loadData(true)
              }
            } catch (error) {
              console.error('Failed to mark reminders as done:', error)
            }
          }
        }}
        onRescheduleAll={() => {
          setRescheduleType(activeTab === 'todos' ? 'task' : 'reminder')
          setShowRescheduleDialog(true)
        }}
        onDismiss={() => {}}
      />

      {/* Overdue Section */}
      {(() => {
        const overdueTasks = getOverdueTasks(tasks)
        const overdueReminders = getOverdueReminders(reminders)
        const hasOverdue = (activeTab === 'todos' && overdueTasks.length > 0) || 
                          (activeTab === 'reminders' && overdueReminders.length > 0)
        
        if (!hasOverdue) return null
        
        const overdueItems = activeTab === 'todos' ? overdueTasks : overdueReminders
        
        return (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <button
              onClick={() => setShowOverdueSection(!showOverdueSection)}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-xl",
                "bg-red-500/10 border border-red-500/20",
                "hover:bg-red-500/15 transition-colors"
              )}
            >
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-red-500" />
                <span className="font-semibold text-sm text-red-600">
                  Overdue ({overdueItems.length})
                </span>
              </div>
              {showOverdueSection ? (
                <ChevronUp size={18} className="text-red-500" />
              ) : (
                <ChevronDown size={18} className="text-red-500" />
              )}
            </button>
            
            {showOverdueSection && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                {activeTab === 'todos' ? (
                  overdueTasks.map((task, index) => {
                    const isSelected = selectedTaskIds.has(task.id)
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "p-3 rounded-xl border",
                          "bg-red-500/5 border-red-500/20",
                          isSelected && "ring-2 ring-red-500/50"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTaskIds(prev => new Set([...prev, task.id]))
                              } else {
                                setSelectedTaskIds(prev => {
                                  const next = new Set(prev)
                                  next.delete(task.id)
                                  return next
                                })
                              }
                            }}
                            className="w-5 h-5 rounded border-2 border-red-500/50"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{task.title}</h4>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                ) : (
                  overdueReminders.map((reminder, index) => {
                    const isSelected = selectedReminderIds.has(reminder.id)
                    return (
                      <motion.div
                        key={reminder.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "p-3 rounded-xl border",
                          "bg-red-500/5 border-red-500/20",
                          isSelected && "ring-2 ring-red-500/50"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedReminderIds(prev => new Set([...prev, reminder.id]))
                              } else {
                                setSelectedReminderIds(prev => {
                                  const next = new Set(prev)
                                  next.delete(reminder.id)
                                  return next
                                })
                              }
                            }}
                            className="w-5 h-5 rounded border-2 border-red-500/50"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{reminder.title}</h4>
                            {reminder.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                {reminder.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </motion.div>
            )}
          </motion.div>
        )
      })()}

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
            {tasks.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText size={28} className="text-muted-foreground" />
                </div>
                <p className="text-foreground mb-2">No tasks yet</p>
                <p className="text-sm text-muted-foreground">
                  Record a voice note to extract tasks automatically
                </p>
              </motion.div>
            ) : (
              tasks.map((task, index) => {
                const isNew = newTaskIds.has(task.id)
                return (
                <motion.button
                  key={task.id}
                  initial={{ opacity: 0, y: 10, scale: isNew ? 0.95 : 1 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    scale: 1,
                    backgroundColor: isNew ? ['rgba(34, 197, 94, 0.1)', 'rgba(0, 0, 0, 0)'] : undefined,
                  }}
                  transition={{ 
                    delay: index * 0.05,
                    backgroundColor: { duration: 0.3, delay: 0.1 }
                  }}
                  className={cn(
                    "w-full p-4 rounded-2xl text-left",
                    "bg-card border border-border/50",
                    "hover:border-border transition-colors",
                    isNew && "ring-2 ring-green-500/50 ring-offset-2 ring-offset-background"
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
                        {task.dueDate && (() => {
                          const dateDisplay = formatSmartDateTime(task.dueDate, task.dueTime, userLanguage)
                          return dateDisplay ? (
                            <span className={cn("flex items-center gap-1", dateDisplay.color)}>
                              <Clock size={12} />
                              {dateDisplay.text}
                            </span>
                          ) : null
                        })()}
                        {task.tags?.map(tag => (
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
                )
              })
            )}
          </motion.div>
        ) : (
          <motion.div
            key="reminders"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-3"
          >
            {reminders.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Clock size={28} className="text-muted-foreground" />
                </div>
                <p className="text-foreground mb-2">No reminders yet</p>
                <p className="text-sm text-muted-foreground">
                  Voice notes can create reminders for you
                </p>
              </motion.div>
            ) : (
              reminders.map((reminder, index) => {
                const isNew = newReminderIds.has(reminder.id)
                return (
                <motion.button
                  key={reminder.id}
                  initial={{ opacity: 0, y: 10, scale: isNew ? 0.95 : 1 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    scale: 1,
                    backgroundColor: isNew ? ['rgba(34, 197, 94, 0.1)', 'rgba(0, 0, 0, 0)'] : undefined,
                  }}
                  transition={{ 
                    delay: index * 0.05,
                    backgroundColor: { duration: 0.3, delay: 0.1 }
                  }}
                  className={cn(
                    "w-full p-4 rounded-2xl text-left",
                    "bg-card border border-border/50",
                    "hover:border-border transition-colors",
                    isNew && "ring-2 ring-green-500/50 ring-offset-2 ring-offset-background"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Clock size={18} className="text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium">{reminder.title}</h3>
                      {(() => {
                        const timeDisplay = formatSmartDateTime(reminder.reminderTime, undefined, userLanguage)
                        return timeDisplay ? (
                          <p className={cn("text-sm", timeDisplay.color)}>
                            {timeDisplay.text}
                            {reminder.isRecurring && ` • ${reminder.recurrencePattern}`}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {reminder.isRecurring && reminder.recurrencePattern}
                          </p>
                        )
                      })()}
                    </div>
                    <ChevronRight size={18} className="text-muted-foreground" />
                  </div>
                </motion.button>
                )
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Actions Bar */}
      {activeTab === 'todos' && selectedTaskIds.size > 0 && (
        <BulkActionsBar
          selectedIds={selectedTaskIds}
          onMarkAsDone={async () => {
            try {
              const response = await fetch('/api/tasks/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  action: 'complete', 
                  taskIds: Array.from(selectedTaskIds) 
                })
              })
              if (response.ok) {
                setSelectedTaskIds(new Set())
                loadData(true)
              }
            } catch (error) {
              console.error('Failed to mark tasks as done:', error)
            }
          }}
          onReschedule={() => {
            setRescheduleType('task')
            setShowRescheduleDialog(true)
          }}
          onDismiss={async () => {
            try {
              const response = await fetch('/api/tasks/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  action: 'dismiss', 
                  taskIds: Array.from(selectedTaskIds) 
                })
              })
              if (response.ok) {
                setSelectedTaskIds(new Set())
                loadData(true)
              }
            } catch (error) {
              console.error('Failed to dismiss tasks:', error)
            }
          }}
          onClearSelection={() => setSelectedTaskIds(new Set())}
          type="task"
        />
      )}

      {activeTab === 'reminders' && selectedReminderIds.size > 0 && (
        <BulkActionsBar
          selectedIds={selectedReminderIds}
          onMarkAsDone={async () => {
            try {
              const response = await fetch('/api/reminders/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  action: 'complete', 
                  reminderIds: Array.from(selectedReminderIds) 
                })
              })
              if (response.ok) {
                setSelectedReminderIds(new Set())
                loadData(true)
              }
            } catch (error) {
              console.error('Failed to mark reminders as done:', error)
            }
          }}
          onReschedule={() => {
            setRescheduleType('reminder')
            setShowRescheduleDialog(true)
          }}
          onDismiss={async () => {
            try {
              const response = await fetch('/api/reminders/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  action: 'dismiss', 
                  reminderIds: Array.from(selectedReminderIds) 
                })
              })
              if (response.ok) {
                setSelectedReminderIds(new Set())
                loadData(true)
              }
            } catch (error) {
              console.error('Failed to dismiss reminders:', error)
            }
          }}
          onClearSelection={() => setSelectedReminderIds(new Set())}
          type="reminder"
        />
      )}

      {/* Reschedule Dialog for Bulk */}
      {showRescheduleDialog && (
        <RescheduleDialog
          isOpen={showRescheduleDialog}
          onClose={() => setShowRescheduleDialog(false)}
          onConfirm={async (date: string, time?: string) => {
            try {
              if (rescheduleType === 'task') {
                const ids = Array.from(selectedTaskIds.size > 0 ? selectedTaskIds : getOverdueTasks(tasks).map(t => t.id))
                const response = await fetch('/api/tasks/bulk', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    action: 'reschedule', 
                    taskIds: ids,
                    dueDate: date,
                    dueTime: time
                  })
                })
                if (response.ok) {
                  setSelectedTaskIds(new Set())
                  loadData(true)
                }
              } else {
                const ids = Array.from(selectedReminderIds.size > 0 ? selectedReminderIds : getOverdueReminders(reminders).map(r => r.id))
                // Construct date from separate date and time parameters
                const dateTime = new Date(`${date}T${time || '09:00'}`)
                // Validate the date before sending
                if (isNaN(dateTime.getTime())) {
                  console.error('Invalid date/time combination:', { date, time })
                  return
                }
                const response = await fetch('/api/reminders/bulk', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    action: 'reschedule', 
                    reminderIds: ids,
                    reminderTime: dateTime.toISOString()
                  })
                })
                if (response.ok) {
                  setSelectedReminderIds(new Set())
                  loadData(true)
                } else {
                  const errorData = await response.json().catch(() => ({}))
                  console.error('Failed to reschedule reminders:', errorData)
                }
              }
            } catch (error) {
              console.error('Failed to reschedule:', error)
            }
            setShowRescheduleDialog(false)
          }}
          item={rescheduleType === 'task' ? getOverdueTasks(tasks)[0] || tasks[0] : getOverdueReminders(reminders)[0] || reminders[0]}
          type={rescheduleType}
        />
      )}
    </motion.div>
  )
}




