"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, X, CheckCircle2, Calendar, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Task, Reminder } from "@/lib/dashboard/types"
import {
  getOverdueTasks,
  getOverdueReminders,
} from "@/lib/dashboard/task-sorting"

interface SmartSuggestionsProps {
  tasks: Task[]
  reminders: Reminder[]
  onMarkAllDone: () => void
  onRescheduleAll: () => void
  onDismiss: () => void
}

export function SmartSuggestions({
  tasks,
  reminders,
  onMarkAllDone,
  onRescheduleAll,
  onDismiss,
}: SmartSuggestionsProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  const overdueTasks = getOverdueTasks(tasks)
  const overdueReminders = getOverdueReminders(reminders)
  const totalOverdue = overdueTasks.length + overdueReminders.length

  if (isDismissed || totalOverdue === 0) {
    return null
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={20} className="text-amber-500" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground mb-1">
              You have {totalOverdue} overdue {totalOverdue === 1 ? "item" : "items"}
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              {overdueTasks.length > 0 && `${overdueTasks.length} task${overdueTasks.length === 1 ? "" : "s"}`}
              {overdueTasks.length > 0 && overdueReminders.length > 0 && " and "}
              {overdueReminders.length > 0 && `${overdueReminders.length} reminder${overdueReminders.length === 1 ? "" : "s"}`}
            </p>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onMarkAllDone}
                className="text-xs h-8 bg-green-500/10 border-green-500/20 text-green-600 hover:bg-green-500/20"
              >
                <CheckCircle2 size={14} className="mr-1.5" />
                Mark all as done
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onRescheduleAll}
                className="text-xs h-8 bg-blue-500/10 border-blue-500/20 text-blue-600 hover:bg-blue-500/20"
              >
                <Calendar size={14} className="mr-1.5" />
                Reschedule all
              </Button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-amber-500/20 transition-colors flex-shrink-0"
            aria-label="Dismiss"
          >
            <X size={14} className="text-amber-600" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}




