"use client"

import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Calendar, X, Clock } from "lucide-react"
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
import { formatSmartDateTime } from "@/lib/dashboard/time-utils"
import { useProfile } from "@/hooks/queries"
import type { Language } from "@/lib/dashboard/label-translations"

interface CompletionDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  onReschedule: () => void
  item: Task | Reminder
  type: "task" | "reminder"
}

export function CompletionDialog({
  isOpen,
  onClose,
  onConfirm,
  onReschedule,
  item,
  type,
}: CompletionDialogProps) {
  const { data: userProfile } = useProfile()
  const userLanguage = (userProfile?.language || "en") as Language

  const isTask = type === "task"
  const task = isTask ? (item as Task) : null
  const reminder = !isTask ? (item as Reminder) : null

  // Get due date/time display
  const dateDisplay = isTask
    ? formatSmartDateTime(task?.dueDate, task?.dueTime, userLanguage)
    : formatSmartDateTime(reminder?.reminderTime, undefined, userLanguage)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 size={24} className="text-green-500" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Mark as done?
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                {isTask
                  ? "This task will be marked as completed."
                  : "This reminder will be marked as completed."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-3">
          {/* Item details */}
          <div className="p-3 rounded-lg bg-muted/50">
            <h4 className="font-medium text-sm mb-1">{item.title}</h4>
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            )}
            {dateDisplay && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <Clock size={12} />
                <span>{dateDisplay.text}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {item.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={onReschedule}
            className="w-full sm:w-auto"
          >
            <Calendar size={16} className="mr-2" />
            Reschedule
          </Button>
          <Button
            onClick={onConfirm}
            className="w-full sm:w-auto bg-green-500 hover:bg-green-600"
          >
            <CheckCircle2 size={16} className="mr-2" />
            Mark as done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}



