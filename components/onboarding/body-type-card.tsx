"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface BodyTypeCardProps {
  id: string
  name: string
  description: string
  selected: boolean
  onSelect: (id: string) => void
}

export function BodyTypeCard({
  id,
  name,
  description,
  selected,
  onSelect
}: BodyTypeCardProps) {
  // Better body shape visualizations
  const getBodyShape = () => {
    switch (id) {
      case 'thin':
        return (
          <div className="flex items-end justify-center gap-1 h-20">
            <div className="w-6 h-10 bg-primary/20 rounded-t-full" />
            <div className="w-5 h-14 bg-primary/30 rounded-t-full" />
            <div className="w-6 h-10 bg-primary/20 rounded-t-full" />
          </div>
        )
      case 'slimFit':
        return (
          <div className="flex items-end justify-center gap-1 h-20">
            <div className="w-7 h-12 bg-primary/20 rounded-t-full" />
            <div className="w-6 h-16 bg-primary/30 rounded-t-full" />
            <div className="w-7 h-12 bg-primary/20 rounded-t-full" />
          </div>
        )
      case 'athletic':
        return (
          <div className="flex items-end justify-center gap-1 h-20">
            <div className="w-8 h-14 bg-primary/20 rounded-t-full" />
            <div className="w-7 h-20 bg-primary/30 rounded-t-full" />
            <div className="w-8 h-14 bg-primary/20 rounded-t-full" />
          </div>
        )
      case 'muscular':
        return (
          <div className="flex items-end justify-center gap-1 h-20">
            <div className="w-10 h-16 bg-primary/20 rounded-t-full" />
            <div className="w-9 h-24 bg-primary/30 rounded-t-full" />
            <div className="w-10 h-16 bg-primary/20 rounded-t-full" />
          </div>
        )
      case 'curvy':
        return (
          <div className="flex items-end justify-center gap-1 h-20">
            <div className="w-9 h-16 bg-primary/20 rounded-t-full" />
            <div className="w-8 h-20 bg-primary/30 rounded-t-full" />
            <div className="w-9 h-16 bg-primary/20 rounded-t-full" />
          </div>
        )
      case 'plusSize':
        return (
          <div className="flex items-end justify-center gap-1 h-20">
            <div className="w-11 h-16 bg-primary/20 rounded-t-full" />
            <div className="w-10 h-24 bg-primary/30 rounded-t-full" />
            <div className="w-11 h-16 bg-primary/20 rounded-t-full" />
          </div>
        )
      case 'ectomorph':
        return (
          <div className="flex items-end justify-center gap-1 h-20">
            <div className="w-6 h-11 bg-primary/20 rounded-t-full" />
            <div className="w-5 h-15 bg-primary/30 rounded-t-full" />
            <div className="w-6 h-11 bg-primary/20 rounded-t-full" />
          </div>
        )
      case 'mesomorph':
        return (
          <div className="flex items-end justify-center gap-1 h-20">
            <div className="w-8 h-14 bg-primary/20 rounded-t-full" />
            <div className="w-7 h-20 bg-primary/30 rounded-t-full" />
            <div className="w-8 h-14 bg-primary/20 rounded-t-full" />
          </div>
        )
      case 'endomorph':
        return (
          <div className="flex items-end justify-center gap-1 h-20">
            <div className="w-10 h-16 bg-primary/20 rounded-t-full" />
            <div className="w-9 h-24 bg-primary/30 rounded-t-full" />
            <div className="w-10 h-16 bg-primary/20 rounded-t-full" />
          </div>
        )
      default:
        return (
          <div className="flex items-end justify-center gap-1 h-20">
            <div className="w-8 h-14 bg-primary/20 rounded-t-full" />
            <div className="w-7 h-16 bg-primary/30 rounded-t-full" />
            <div className="w-8 h-14 bg-primary/20 rounded-t-full" />
          </div>
        )
    }
  }

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(id)}
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative p-6 rounded-2xl border-2 transition-all duration-300 text-center min-h-[200px] flex flex-col items-center justify-center gap-4",
        selected
          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
          : "border-border bg-card hover:border-primary/50 hover:bg-accent/50 hover:shadow-md"
      )}
    >
      {selected && (
        <motion.div
          layoutId="bodyTypeSelected"
          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <svg
            className="w-4 h-4 text-primary-foreground"
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
      
      <div className="flex items-center justify-center h-24 w-full">
        {getBodyShape()}
      </div>
      
      <div>
        <span className="font-semibold text-base block mb-1">{name}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
    </motion.button>
  )
}
