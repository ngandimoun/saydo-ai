"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Heart, CheckSquare, Moon, Mic, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"
import { springs, staggerContainer, staggerItem } from "@/lib/motion-system"
import { prefetchHealthData, prefetchTasksData, prefetchProData, prefetchCalmData } from "@/lib/prefetch-utils"

/**
 * Quick Actions Grid - Airbnb-Inspired
 * 
 * Quick navigation buttons to main sections.
 * Features:
 * - Elevated card design with subtle shadows
 * - Spring animations on hover/tap
 * - Consistent color system
 */

interface QuickAction {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  href: string
  iconColor: string
  bgGradient: string
  description?: string
}

const quickActions: QuickAction[] = [
  {
    id: 'health',
    label: 'Health',
    icon: Heart,
    href: '/dashboard/health',
    iconColor: 'text-rose-500',
    bgGradient: 'from-rose-500/10 to-pink-500/5',
    description: 'Track vitals'
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: CheckSquare,
    href: '/dashboard/tasks',
    iconColor: 'text-blue-500',
    bgGradient: 'from-blue-500/10 to-indigo-500/5',
    description: 'View todos'
  },
  {
    id: 'pro',
    label: 'Pro',
    icon: Briefcase,
    href: '/dashboard/pro',
    iconColor: 'text-primary',
    bgGradient: 'from-primary/10 to-teal-500/5',
    description: 'Work files'
  },
  {
    id: 'calm',
    label: 'Calm',
    icon: Moon,
    href: '/dashboard/calm',
    iconColor: 'text-indigo-500',
    bgGradient: 'from-indigo-500/10 to-purple-500/5',
    description: 'Relax'
  }
]

export function QuickActions() {
  const handlePrefetch = (actionId: string) => {
    switch (actionId) {
      case 'health':
        prefetchHealthData().catch(console.error)
        break
      case 'tasks':
        prefetchTasksData().catch(console.error)
        break
      case 'pro':
        prefetchProData().catch(console.error)
        break
      case 'calm':
        prefetchCalmData().catch(console.error)
        break
    }
  }

  return (
    <motion.section 
      className="space-y-4"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Section header */}
      <motion.div 
        variants={staggerItem}
        className="flex items-center justify-between"
      >
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Quick Access
        </h2>
      </motion.div>

      {/* Actions grid */}
      <div className="grid grid-cols-4 gap-3">
        {quickActions.map((action, index) => {
          const Icon = action.icon
          return (
            <motion.div
              key={action.id}
              variants={staggerItem}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={springs.snappy}
            >
              <Link
                href={action.href}
                prefetch={true}
                onMouseEnter={() => handlePrefetch(action.id)}
                onTouchStart={() => handlePrefetch(action.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl",
                  "bg-gradient-to-br border border-border/50",
                  "hover:border-border hover:shadow-md",
                  "transition-all duration-200 touch-manipulation",
                  "block",
                  action.bgGradient
                )}
              >
                <motion.div 
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center",
                    "bg-card shadow-sm"
                  )}
                  whileHover={{ rotate: 5 }}
                  transition={springs.bouncy}
                >
                  <Icon size={22} className={action.iconColor} />
                </motion.div>
                <span className="text-xs font-medium text-foreground">
                  {action.label}
                </span>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </motion.section>
  )
}
