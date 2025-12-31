"use client"

import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Calendar, X, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BulkActionsBarProps {
  selectedIds: Set<string>
  onMarkAsDone: () => void
  onReschedule: () => void
  onDismiss: () => void
  onClearSelection: () => void
  type: "task" | "reminder"
}

export function BulkActionsBar({
  selectedIds,
  onMarkAsDone,
  onReschedule,
  onDismiss,
  onClearSelection,
  type,
}: BulkActionsBarProps) {
  const count = selectedIds.size

  if (count === 0) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-20 left-0 right-0 z-50 px-4 pb-4"
      >
        <div className="max-w-lg mx-auto bg-card border border-border rounded-2xl shadow-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 size={16} className="text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">
                {count} {type === "task" ? "task" : "reminder"}{count === 1 ? "" : "s"} selected
              </span>
            </div>
            <button
              onClick={onClearSelection}
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Clear selection"
            >
              <X size={14} className="text-muted-foreground" />
            </button>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={onMarkAsDone}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            >
              <CheckCircle2 size={14} className="mr-1.5" />
              Mark as done
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onReschedule}
              className="flex-1"
            >
              <Calendar size={14} className="mr-1.5" />
              Reschedule
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDismiss}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}



