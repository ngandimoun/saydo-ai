"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

/**
 * Skeleton Loading Component - Saydo-Branded
 * 
 * Elegant loading placeholders with:
 * - Shimmer effect with Saydo teal gradient
 * - Various preset shapes
 * - Composition utilities for complex layouts
 */

interface SkeletonProps {
  className?: string
  animated?: boolean
}

export function Skeleton({ className, animated = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-muted",
        animated && "relative overflow-hidden",
        className
      )}
    >
      {animated && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
          animate={{
            x: ["-100%", "100%"]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </div>
  )
}

/**
 * Skeleton Text - Multiple lines of text
 */
interface SkeletonTextProps {
  lines?: number
  className?: string
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  )
}

/**
 * Skeleton Avatar - Circular avatar placeholder
 */
interface SkeletonAvatarProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function SkeletonAvatar({ size = "md", className }: SkeletonAvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14"
  }

  return (
    <Skeleton className={cn("rounded-full", sizeClasses[size], className)} />
  )
}

/**
 * Skeleton Card - Card placeholder
 */
interface SkeletonCardProps {
  hasImage?: boolean
  className?: string
}

export function SkeletonCard({ hasImage = false, className }: SkeletonCardProps) {
  return (
    <div className={cn("rounded-2xl bg-card border border-border p-4 space-y-3", className)}>
      {hasImage && (
        <Skeleton className="h-32 w-full rounded-xl" />
      )}
      <div className="flex items-center gap-3">
        <SkeletonAvatar size="sm" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  )
}

/**
 * Skeleton List Item - List item placeholder
 */
interface SkeletonListItemProps {
  hasIcon?: boolean
  className?: string
}

export function SkeletonListItem({ hasIcon = true, className }: SkeletonListItemProps) {
  return (
    <div className={cn("flex items-center gap-3 p-3", className)}>
      {hasIcon && (
        <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
      )}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

/**
 * Skeleton Dashboard - Full dashboard placeholder
 */
export function SkeletonDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 pt-4 pb-8 space-y-6 max-w-lg mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
      </div>

      {/* Greeting */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>

      {/* Category chips */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-full" />
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>

      {/* List items */}
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonListItem key={i} />
        ))}
      </div>
    </motion.div>
  )
}

/**
 * Skeleton Health Dashboard
 */
export function SkeletonHealthDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 pt-6 pb-8 space-y-6 max-w-lg mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-6 w-28" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="w-24 h-9 rounded-full" />
          <Skeleton className="w-28 h-9 rounded-full" />
        </div>
      </div>

      {/* Bio profile card */}
      <Skeleton className="h-48 rounded-2xl" />

      {/* Health rings */}
      <div className="flex justify-around py-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Skeleton className="w-20 h-20 rounded-full" />
            <Skeleton className="w-12 h-3" />
            <Skeleton className="w-8 h-4" />
          </div>
        ))}
      </div>

      {/* Interventions */}
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </motion.div>
  )
}

/**
 * Skeleton Calm Zone
 */
export function SkeletonCalmZone() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 pt-6 pb-8 space-y-6 max-w-lg mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-1">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      {/* Search */}
      <Skeleton className="h-12 rounded-2xl" />

      {/* Category pills */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-20 rounded-full" />
        ))}
      </div>

      {/* Featured */}
      <Skeleton className="h-44 rounded-3xl" />

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    </motion.div>
  )
}







