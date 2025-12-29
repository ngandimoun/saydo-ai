"use client"

import { useState } from "react"
import { Calendar, Clock, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Task, Reminder } from "@/lib/dashboard/types"

interface RescheduleDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (date: string, time?: string) => void
  item: Task | Reminder
  type: "task" | "reminder"
}

export function RescheduleDialog({
  isOpen,
  onClose,
  onConfirm,
  item,
  type,
}: RescheduleDialogProps) {
  const isTask = type === "task"
  const task = isTask ? (item as Task) : null
  const reminder = !isTask ? (item as Reminder) : null

  // Get current due date/time
  const currentDate = isTask
    ? task?.dueDate
      ? new Date(task.dueDate)
      : new Date()
    : reminder
    ? reminder.reminderTime
    : new Date()

  // Initialize state with current values or defaults
  const [selectedDate, setSelectedDate] = useState<string>(
    currentDate.toISOString().split("T")[0]
  )
  const [selectedTime, setSelectedTime] = useState<string>(
    isTask && task?.dueTime
      ? task.dueTime
      : currentDate.toTimeString().slice(0, 5)
  )
  const [quickOption, setQuickOption] = useState<
    "tomorrow" | "next-week" | "custom" | null
  >(null)

  // Quick options
  const handleQuickOption = (option: "tomorrow" | "next-week") => {
    const now = new Date()
    let targetDate = new Date()

    if (option === "tomorrow") {
      targetDate.setDate(now.getDate() + 1)
      setSelectedDate(targetDate.toISOString().split("T")[0])
      setSelectedTime("09:00")
    } else if (option === "next-week") {
      targetDate.setDate(now.getDate() + 7)
      setSelectedDate(targetDate.toISOString().split("T")[0])
      setSelectedTime("09:00")
    }

    setQuickOption(option)
  }

  const handleConfirm = () => {
    // Pass date and time separately for both tasks and reminders
    // The parent component will construct the ISO string for reminders
    onConfirm(selectedDate, selectedTime)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Calendar size={24} className="text-blue-500" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Reschedule {isTask ? "Task" : "Reminder"}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Choose a new date and time
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Item title */}
          <div className="p-3 rounded-lg bg-muted/50">
            <h4 className="font-medium text-sm">{item.title}</h4>
          </div>

          {/* Quick options */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Quick options
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={quickOption === "tomorrow" ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickOption("tomorrow")}
                className="flex-1"
              >
                Tomorrow
              </Button>
              <Button
                type="button"
                variant={quickOption === "next-week" ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickOption("next-week")}
                className="flex-1"
              >
                Next week
              </Button>
            </div>
          </div>

          {/* Custom date/time */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">
              Custom date & time
            </p>

            {/* Date picker */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Calendar size={12} />
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  setQuickOption("custom")
                }}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Time picker (for tasks) */}
            {isTask && (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock size={12} />
                  Time
                </label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => {
                    setSelectedTime(e.target.value)
                    setQuickOption("custom")
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            {/* Time picker (for reminders - combined) */}
            {!isTask && (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock size={12} />
                  Time
                </label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => {
                    setSelectedTime(e.target.value)
                    setQuickOption("custom")
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="w-full sm:w-auto">
            <Calendar size={16} className="mr-2" />
            Reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

