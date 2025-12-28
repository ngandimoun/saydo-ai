"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { CheckSquare, Plus, Clock, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TaskCard } from "./task-card"
import { ReminderCard } from "./reminder-card"
import { getMockTasks, getMockReminders } from "@/lib/dashboard/mock-data"
import type { Task, Reminder } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Tasks Section
 * 
 * Smart task management with:
 * - To-do list with priorities
 * - Time-based reminders
 * - Quick add functionality
 * 
 * TODO (Backend Integration):
 * - Fetch tasks and reminders from Supabase
 * - Real-time sync across devices
 * - Push notifications for reminders
 * 
 * TODO (AI Integration):
 * - Auto-extract tasks from voice notes
 * - Smart priority detection
 * - Suggested due dates based on context
 */

interface TasksSectionProps {
  className?: string
}

type TabType = 'tasks' | 'reminders'

export function TasksSection({ className }: TasksSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('tasks')
  const [tasks, setTasks] = useState<Task[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])

  // Load mock data
  useEffect(() => {
    /**
     * TODO (Backend):
     * const { data: tasks } = await supabase
     *   .from('tasks')
     *   .select('*')
     *   .eq('user_id', userId)
     *   .neq('status', 'completed')
     *   .order('priority', { ascending: true })
     * 
     * const { data: reminders } = await supabase
     *   .from('reminders')
     *   .select('*')
     *   .eq('user_id', userId)
     *   .eq('is_completed', false)
     */
    setTasks(getMockTasks())
    setReminders(getMockReminders())
  }, [])

  // Toggle task completion
  const toggleTask = (taskId: string) => {
    /**
     * TODO (Backend):
     * await supabase
     *   .from('tasks')
     *   .update({ status: 'completed', completed_at: new Date() })
     *   .eq('id', taskId)
     */
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } as Task
        : t
    ))
  }

  // Complete reminder
  const completeReminder = (reminderId: string) => {
    /**
     * TODO (Backend):
     * await supabase
     *   .from('reminders')
     *   .update({ is_completed: true })
     *   .eq('id', reminderId)
     */
    setReminders(prev => prev.filter(r => r.id !== reminderId))
  }

  // Snooze reminder
  const snoozeReminder = (reminderId: string) => {
    /**
     * TODO (Backend):
     * const snoozeTime = new Date(Date.now() + 30 * 60 * 1000) // 30 mins
     * await supabase
     *   .from('reminders')
     *   .update({ is_snoozed: true, snooze_until: snoozeTime })
     *   .eq('id', reminderId)
     */
    setReminders(prev => prev.filter(r => r.id !== reminderId))
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



