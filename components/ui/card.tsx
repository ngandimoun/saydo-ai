"use client"

import * as React from "react"
import { motion, type HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"
import { springs, cardHover } from "@/lib/motion-system"

// ============================================
// BASE CARD COMPONENTS
// ============================================

interface CardProps extends React.ComponentProps<"div"> {
  variant?: "default" | "glass" | "featured" | "glow" | "spotlight"
  interactive?: boolean
}

function Card({ 
  className, 
  variant = "default", 
  interactive = false,
  ...props 
}: CardProps) {
  const baseStyles = "flex flex-col gap-4 rounded-2xl"
  
  const variantStyles = {
    default: "bg-card text-card-foreground border border-border shadow-sm",
    glass: "bg-glass-bg backdrop-blur-[var(--glass-blur)] border border-glass-border",
    featured: "bg-gradient-to-br from-primary to-teal-600 text-white shadow-lg",
    glow: "bg-card text-card-foreground border border-border shadow-sm relative overflow-hidden",
    spotlight: "bg-card text-card-foreground border border-border shadow-sm relative overflow-hidden",
  }

  const interactiveStyles = interactive 
    ? "cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 active:scale-[0.99]" 
    : ""

  return (
    <div
      data-slot="card"
      data-variant={variant}
      className={cn(
        baseStyles,
        variantStyles[variant],
        interactiveStyles,
        className
      )}
      {...props}
    />
  )
}

// ============================================
// ANIMATED CARD (with Framer Motion)
// ============================================

interface AnimatedCardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  variant?: "default" | "glass" | "featured" | "glow"
}

const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantStyles = {
      default: "bg-card text-card-foreground border border-border",
      glass: "bg-glass-bg backdrop-blur-[var(--glass-blur)] border border-glass-border",
      featured: "bg-gradient-to-br from-primary to-teal-600 text-white",
      glow: "bg-card text-card-foreground border border-border relative overflow-hidden",
    }

    return (
      <motion.div
        ref={ref}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        variants={cardHover}
        className={cn(
          "flex flex-col gap-4 rounded-2xl cursor-pointer",
          variantStyles[variant],
          className
        )}
        {...props}
      />
    )
  }
)
AnimatedCard.displayName = "AnimatedCard"

// ============================================
// CARD SUB-COMPONENTS
// ============================================

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-col gap-1.5 p-5 pb-0",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn(
        "font-display text-lg font-semibold leading-tight tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn(
        "text-sm text-muted-foreground font-body leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "absolute top-4 right-4",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("p-5 pt-0", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center gap-2 p-5 pt-0",
        className
      )}
      {...props}
    />
  )
}

// ============================================
// SPECIALIZED CARD VARIANTS
// ============================================

/**
 * Story Card - Full-bleed image with text overlay (Calm zone)
 */
interface StoryCardProps extends React.ComponentProps<"div"> {
  image?: string
  category?: string
  title: string
  description?: string
  duration?: string
  onClick?: () => void
}

function StoryCard({
  className,
  image,
  category,
  title,
  description,
  duration,
  onClick,
  ...props
}: StoryCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={springs.snappy}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl cursor-pointer",
        "bg-gradient-to-br from-indigo-600 to-purple-700",
        "min-h-[180px] group",
        className
      )}
      {...props}
    >
      {/* Background image */}
      {image && (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${image})` }}
        />
      )}
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-5">
        {category && (
          <span className="text-xs font-semibold uppercase tracking-wider text-white/80 mb-1">
            {category}
          </span>
        )}
        <h3 className="text-lg font-display font-bold text-white mb-1">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-white/70 line-clamp-2">
            {description}
          </p>
        )}
        {duration && (
          <span className="text-xs text-white/60 mt-2">
            {duration}
          </span>
        )}
      </div>
    </motion.div>
  )
}

/**
 * Insight Card - Icon-led with colored accent bar (Health)
 */
interface InsightCardProps extends React.ComponentProps<"div"> {
  icon: React.ReactNode
  color?: "teal" | "rose" | "amber" | "indigo"
  title: string
  description: string
  metric?: string
  onClick?: () => void
}

function InsightCard({
  className,
  icon,
  color = "teal",
  title,
  description,
  metric,
  onClick,
  ...props
}: InsightCardProps) {
  const colorStyles = {
    teal: "border-l-primary bg-primary/5",
    rose: "border-l-rose-500 bg-rose-500/5",
    amber: "border-l-amber-500 bg-amber-500/5",
    indigo: "border-l-indigo-500 bg-indigo-500/5",
  }

  const iconColors = {
    teal: "text-primary bg-primary/10",
    rose: "text-rose-500 bg-rose-500/10",
    amber: "text-amber-500 bg-amber-500/10",
    indigo: "text-indigo-500 bg-indigo-500/10",
  }

  return (
    <motion.div
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.99 }}
      transition={springs.snappy}
      onClick={onClick}
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl border-l-4 cursor-pointer",
        colorStyles[color],
        className
      )}
      {...props}
    >
      <div className={cn(
        "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
        iconColors[color]
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-display font-semibold text-foreground">
          {title}
        </h4>
        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
          {description}
        </p>
        {metric && (
          <span className="text-xs font-medium text-muted-foreground mt-2 block">
            {metric}
          </span>
        )}
      </div>
    </motion.div>
  )
}

/**
 * Task Card - Checkbox with priority ribbon (Tasks)
 */
interface TaskCardProps extends React.ComponentProps<"div"> {
  title: string
  description?: string
  priority?: "urgent" | "high" | "medium" | "low"
  time?: string
  tags?: string[]
  completed?: boolean
  onToggle?: () => void
}

function TaskCard({
  className,
  title,
  description,
  priority = "medium",
  time,
  tags = [],
  completed = false,
  onToggle,
  ...props
}: TaskCardProps) {
  const priorityColors = {
    urgent: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-blue-500",
    low: "bg-gray-400",
  }

  return (
    <motion.div
      whileHover={{ scale: 1.01, x: 4 }}
      whileTap={{ scale: 0.99 }}
      transition={springs.snappy}
      className={cn(
        "flex items-start gap-4 p-4 rounded-2xl",
        "bg-card border border-border",
        "cursor-pointer transition-colors hover:bg-muted/50",
        className
      )}
      {...props}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle?.()
        }}
        className={cn(
          "flex-shrink-0 w-6 h-6 rounded-full border-2 mt-0.5",
          "flex items-center justify-center transition-all",
          completed
            ? "bg-primary border-primary"
            : "border-muted-foreground hover:border-primary"
        )}
      >
        {completed && (
          <svg className="w-3.5 h-3.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full flex-shrink-0", priorityColors[priority])} />
          <h4 className={cn(
            "font-display font-medium",
            completed && "line-through text-muted-foreground"
          )}>
            {title}
          </h4>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          {time && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {time}
            </span>
          )}
          {tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded bg-muted">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Summary Card - Large typography with supporting metrics (Home)
 */
interface SummaryCardProps extends React.ComponentProps<"div"> {
  icon: React.ReactNode
  iconColor?: "teal" | "rose" | "amber" | "indigo"
  label: string
  title: string
  description: string
  metric?: string
}

function SummaryCard({
  className,
  icon,
  iconColor = "teal",
  label,
  title,
  description,
  metric,
  ...props
}: SummaryCardProps) {
  const colorStyles = {
    teal: "border-primary/30 [&_[data-icon]]:text-primary [&_[data-icon]]:bg-primary/10 [&_[data-label]]:text-primary",
    rose: "border-rose-500/30 [&_[data-icon]]:text-rose-500 [&_[data-icon]]:bg-rose-500/10 [&_[data-label]]:text-rose-500",
    amber: "border-amber-500/30 [&_[data-icon]]:text-amber-500 [&_[data-icon]]:bg-amber-500/10 [&_[data-label]]:text-amber-500",
    indigo: "border-indigo-500/30 [&_[data-icon]]:text-indigo-500 [&_[data-icon]]:bg-indigo-500/10 [&_[data-label]]:text-indigo-500",
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={springs.gentle}
      className={cn(
        "p-5 rounded-2xl border",
        "bg-gradient-to-br from-card to-card/80",
        colorStyles[iconColor],
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3 mb-3">
        <div data-icon className="p-2 rounded-xl">
          {icon}
        </div>
        <span data-label className="text-xs font-semibold uppercase tracking-wider mt-1">
          {label}
        </span>
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed font-body">
        {description}
      </p>
      {metric && (
        <p className="text-xs text-muted-foreground mt-3">
          {metric}
        </p>
      )}
    </motion.div>
  )
}

export {
  Card,
  AnimatedCard,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  StoryCard,
  InsightCard,
  TaskCard,
  SummaryCard,
}
