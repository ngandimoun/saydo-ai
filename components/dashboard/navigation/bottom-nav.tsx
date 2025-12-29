"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Home, Heart, Briefcase, Moon } from "lucide-react"
import { cn } from "@/lib/utils"
import { springs } from "@/lib/motion-system"

/**
 * Bottom Tab Navigation - Airbnb-Inspired
 * 
 * Features:
 * - Glass-morphism backdrop with blur
 * - Spring-animated active indicator
 * - Smooth icon transitions
 * - Gap for center voice FAB
 */

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  href: string
  activeColor: string
}

const navItems: NavItem[] = [
  { 
    id: 'home', 
    label: 'Home', 
    icon: Home, 
    href: '/dashboard/home',
    activeColor: 'text-primary'
  },
  { 
    id: 'health', 
    label: 'Health', 
    icon: Heart, 
    href: '/dashboard/health',
    activeColor: 'text-rose-500'
  },
  // Gap for voice button will be in the middle
  { 
    id: 'pro', 
    label: 'Pro', 
    icon: Briefcase, 
    href: '/dashboard/pro',
    activeColor: 'text-primary'
  },
  { 
    id: 'calm', 
    label: 'Calm', 
    icon: Moon, 
    href: '/dashboard/calm',
    activeColor: 'text-indigo-500'
  }
]

interface BottomNavProps {
  className?: string
}

export function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname()

  // Determine active tab
  const getActiveTab = () => {
    if (pathname?.includes('/health')) return 'health'
    if (pathname?.includes('/pro')) return 'pro'
    if (pathname?.includes('/calm')) return 'calm'
    return 'home'
  }

  const activeTab = getActiveTab()

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40",
        // Glass-morphism effect
        "bg-card/80 dark:bg-card/60",
        "backdrop-blur-xl saturate-150",
        "border-t border-border/50 dark:border-white/5",
        // Safe area for notch devices
        "pb-safe",
        className
      )}
    >
      {/* Subtle top gradient for depth */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="max-w-lg mx-auto px-2">
        <div className="flex items-center justify-around h-16 relative">
          {/* Left tabs (Home, Health) */}
          {navItems.slice(0, 2).map((item) => (
            <NavTab 
              key={item.id}
              item={item}
              isActive={activeTab === item.id}
            />
          ))}

          {/* Spacer for center voice button */}
          <div className="w-20" aria-hidden="true" />

          {/* Right tabs (Pro, Calm) */}
          {navItems.slice(2).map((item) => (
            <NavTab 
              key={item.id}
              item={item}
              isActive={activeTab === item.id}
            />
          ))}
        </div>
      </div>
    </nav>
  )
}

interface NavTabProps {
  item: NavItem
  isActive: boolean
}

function NavTab({ item, isActive }: NavTabProps) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      prefetch={true}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1",
        "px-5 py-2 min-w-[72px]",
        "transition-colors duration-200",
        "touch-manipulation",
        "group"
      )}
    >
      {/* Active background pill */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            layoutId="nav-active-bg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={springs.snappy}
            className={cn(
              "absolute inset-x-2 inset-y-1",
              "rounded-2xl",
              "bg-primary/10 dark:bg-primary/15"
            )}
          />
        )}
      </AnimatePresence>

      {/* Icon container */}
      <motion.div 
        className="relative z-10"
        animate={isActive ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}
        transition={springs.snappy}
      >
        <Icon 
          size={22} 
          className={cn(
            "transition-colors duration-200",
            isActive 
              ? item.activeColor 
              : "text-muted-foreground group-hover:text-foreground"
          )} 
        />
        
        {/* Active indicator dot */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={springs.bouncy}
              className={cn(
                "absolute -bottom-1 left-1/2 -translate-x-1/2",
                "w-1 h-1 rounded-full",
                item.id === 'health' ? "bg-rose-500" :
                item.id === 'calm' ? "bg-indigo-500" :
                "bg-primary"
              )}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Label */}
      <motion.span 
        className={cn(
          "relative z-10 text-[11px] font-medium",
          "transition-colors duration-200",
          isActive 
            ? item.activeColor 
            : "text-muted-foreground group-hover:text-foreground"
        )}
        animate={isActive ? { y: 0, opacity: 1 } : { y: 0, opacity: 0.7 }}
        transition={{ duration: 0.2 }}
      >
        {item.label}
      </motion.span>
    </Link>
  )
}
