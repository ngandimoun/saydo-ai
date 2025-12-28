"use client"

import { motion } from "framer-motion"
import { Heart, CheckSquare, Moon, Mic } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Quick Actions Grid
 * 
 * Fast access to main sections: Health, Tasks, Calm, Voice.
 * Tapping navigates or opens the relevant modal.
 * 
 * TODO (Navigation):
 * - Implement smooth scroll to section
 * - Or open modal for quick actions
 */

interface QuickActionsProps {
  className?: string
}

const actions = [
  {
    id: 'health',
    label: 'Health',
    icon: Heart,
    color: 'from-rose-500 to-rose-600',
    bgLight: 'bg-rose-50 dark:bg-rose-500/10',
    textColor: 'text-rose-500'
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: CheckSquare,
    color: 'from-blue-500 to-blue-600',
    bgLight: 'bg-blue-50 dark:bg-blue-500/10',
    textColor: 'text-blue-500'
  },
  {
    id: 'calm',
    label: 'Calm',
    icon: Moon,
    color: 'from-indigo-500 to-purple-600',
    bgLight: 'bg-indigo-50 dark:bg-indigo-500/10',
    textColor: 'text-indigo-500'
  },
  {
    id: 'voice',
    label: 'Record',
    icon: Mic,
    color: 'from-primary to-teal-600',
    bgLight: 'bg-teal-50 dark:bg-primary/10',
    textColor: 'text-primary'
  }
]

export function QuickActions({ className }: QuickActionsProps) {
  const handleAction = (actionId: string) => {
    /**
     * TODO:
     * - 'health': Scroll to health section or open modal
     * - 'tasks': Scroll to tasks section
     * - 'calm': Scroll to calm section
     * - 'voice': Open voice recorder modal
     */
    console.log('Action:', actionId)
    
    // For now, scroll to section
    const element = document.getElementById(`section-${actionId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section className={cn("", className)}>
      <div className="grid grid-cols-4 gap-3">
        {actions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index, duration: 0.3 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAction(action.id)}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-2xl",
              action.bgLight,
              "transition-all duration-200"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              "bg-gradient-to-br shadow-sm",
              action.color
            )}>
              <action.icon size={22} className="text-white" />
            </div>
            <span className={cn("text-xs font-medium", action.textColor)}>
              {action.label}
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  )
}



