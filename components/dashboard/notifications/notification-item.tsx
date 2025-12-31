"use client"

import { motion } from "framer-motion"
import { CheckCircle2, Circle, AlertTriangle, Info, Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * Notification Item Component
 * 
 * Individual notification card with:
 * - Type-based icons
 * - Read/unread state
 * - Action buttons
 * - Dismiss functionality
 */

interface NotificationItemProps {
  notification: {
    id: string
    title: string
    body: string
    type: string
    priority: string
    is_read: boolean
    action_url?: string
    action_label?: string
    created_at: string
  }
  onRead?: (id: string) => void
  onDismiss?: (id: string) => void
  className?: string
}

const typeIcons: Record<string, React.ReactNode> = {
  intervention: <AlertTriangle className="w-4 h-4" />,
  achievement: <Sparkles className="w-4 h-4" />,
  challenge: <CheckCircle2 className="w-4 h-4" />,
  recommendation: <Info className="w-4 h-4" />,
  reminder: <Circle className="w-4 h-4" />,
  system: <Info className="w-4 h-4" />,
  health_alert: <AlertTriangle className="w-4 h-4" />,
}

const priorityColors: Record<string, string> = {
  high: "border-red-500/20 bg-red-500/5",
  medium: "border-amber-500/20 bg-amber-500/5",
  low: "border-border bg-muted/30",
}

export function NotificationItem({
  notification,
  onRead,
  onDismiss,
  className,
}: NotificationItemProps) {
  const isUnread = !notification.is_read
  const priorityColor = priorityColors[notification.priority] || priorityColors.low

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-lg border transition-all",
        isUnread && priorityColor,
        !isUnread && "border-border bg-muted/30",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-1.5 rounded-full flex-shrink-0",
          isUnread ? "bg-primary/10" : "bg-muted"
        )}>
          <div className={cn(
            isUnread ? "text-primary" : "text-muted-foreground"
          )}>
            {typeIcons[notification.type] || <Info className="w-4 h-4" />}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-medium mb-1",
                isUnread && "font-semibold"
              )}>
                {notification.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {notification.body}
              </p>
            </div>

            {isUnread && (
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
            )}
          </div>

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground">
              {new Date(notification.created_at).toLocaleString()}
            </span>

            <div className="flex items-center gap-2">
              {notification.action_url && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (onRead && isUnread) {
                      onRead(notification.id)
                    }
                    window.location.href = notification.action_url!
                  }}
                  className="h-7 text-xs rounded-full"
                >
                  {notification.action_label || "View"}
                </Button>
              )}
              {onDismiss && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDismiss(notification.id)}
                  className="h-7 w-7 p-0 rounded-full"
                >
                  <X size={12} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}


