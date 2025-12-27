"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Heart, CheckSquare, Moon, Mic } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Quick Actions Grid
 * 
 * Quick navigation buttons to main sections.
 * These mirror the bottom nav tabs for easy access.
 */

interface QuickAction {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  href: string
  color: string
  bgColor: string
}

const quickActions: QuickAction[] = [
  {
    id: 'health',
    label: 'Health',
    icon: Heart,
    href: '/dashboard/health',
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10 hover:bg-rose-500/20'
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: CheckSquare,
    href: '/dashboard/tasks',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10 hover:bg-blue-500/20'
  },
  {
    id: 'calm',
    label: 'Calm',
    icon: Moon,
    href: '/dashboard/calm',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10 hover:bg-indigo-500/20'
  },
  {
    id: 'record',
    label: 'Record',
    icon: Mic,
    href: '#', // Opens voice recorder instead
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10 hover:bg-teal-500/20'
  }
]

export function QuickActions() {
  const router = useRouter()

  const handleAction = (action: QuickAction) => {
    if (action.id === 'record') {
      // Voice recording is handled by the FAB
      // This could open the voice modal
      return
    }
    router.push(action.href)
  }

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        {quickActions.map((action, index) => {
          const Icon = action.icon
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleAction(action)}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl",
                "transition-colors touch-manipulation",
                action.bgColor
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                action.bgColor.replace('/10', '/20').replace('/20', '/30')
              )}>
                <Icon size={22} className={action.color} />
              </div>
              <span className="text-xs font-medium text-foreground">
                {action.label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </section>
  )
}

