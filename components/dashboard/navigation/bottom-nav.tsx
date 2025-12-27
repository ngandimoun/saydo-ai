"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Home, Heart, Briefcase, Moon } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Bottom Tab Navigation
 * 
 * Fixed bottom navigation bar with 4 tabs and a gap for the center voice button.
 * Includes active state indicators and smooth animations.
 */

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  href: string
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, href: '/dashboard/home' },
  { id: 'health', label: 'Health', icon: Heart, href: '/dashboard/health' },
  // Gap for voice button will be in the middle
  { id: 'pro', label: 'Pro', icon: Briefcase, href: '/dashboard/pro' },
  { id: 'calm', label: 'Calm', icon: Moon, href: '/dashboard/calm' }
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
        "bg-card/95 backdrop-blur-lg",
        "border-t border-border/50",
        "pb-safe", // Safe area for notch devices
        className
      )}
    >
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
          <div className="w-16" />

          {/* Right tabs (Tasks, Calm) */}
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
      className={cn(
        "flex flex-col items-center justify-center gap-1 px-4 py-2 min-w-[64px]",
        "transition-colors duration-200",
        "touch-manipulation"
      )}
    >
      <div className="relative">
        <Icon 
          size={24} 
          className={cn(
            "transition-colors duration-200",
            isActive ? "text-primary" : "text-muted-foreground"
          )} 
        />
        
        {/* Active indicator dot */}
        {isActive && (
          <motion.div
            layoutId="nav-indicator"
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </div>

      <span 
        className={cn(
          "text-[10px] font-medium transition-colors duration-200",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      >
        {item.label}
      </span>
    </Link>
  )
}

