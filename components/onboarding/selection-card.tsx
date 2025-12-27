"use client"

import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface SelectionCardProps {
  id: string
  name: string
  selected: boolean
  onSelect: (id: string) => void
  multiSelect?: boolean
  className?: string
  icon?: React.ReactNode
  color?: string
  /** Optional: provide a unique group name to enable shared layout animation between cards */
  layoutGroup?: string
}

export function SelectionCard({
  id,
  name,
  selected,
  onSelect,
  multiSelect = false,
  className,
  icon,
  color,
  layoutGroup
}: SelectionCardProps) {
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(id)}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative p-4 rounded-xl border-2 transition-all duration-200 text-left",
        selected
          ? "border-primary bg-primary/10 shadow-md"
          : "border-border bg-card hover:border-primary/50 hover:bg-accent/50",
        className
      )}
    >
      <AnimatePresence>
        {selected && (
          <motion.div
            // Only use shared layoutId if layoutGroup is provided (for small card sets)
            // For large card sets like languages (50+), individual animations work better
            layoutId={layoutGroup ? `${layoutGroup}-indicator` : undefined}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <svg
              className="w-3 h-3 text-primary-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex items-center gap-3">
        {icon && (
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            color || "bg-primary/10"
          )}>
            {icon}
          </div>
        )}
        <span className="font-medium text-sm">{name}</span>
      </div>
    </motion.button>
  )
}

