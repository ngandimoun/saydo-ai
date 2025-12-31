"use client"

import { motion } from "framer-motion"
import { Zap, AlertTriangle, Heart, TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { HealthStatus } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"
import { springs, healthRingAnimations } from "@/lib/motion-system"

/**
 * Health Status Rings Component - Airbnb-Inspired
 * 
 * Living biometric dashboard with:
 * - Animated SVG rings with gradient fills
 * - Pulsing glow effects synchronized with data
 * - Contextual colors with smooth transitions
 * - Trend indicators
 * 
 * TODO (Wearable Integration):
 * - Connect to Apple HealthKit for real-time data
 * - Connect to Google Fit API
 * - Connect to Oura Ring API
 * - Poll every 5 minutes or use WebSocket for live updates
 */

interface HealthStatusRingsProps {
  healthStatus: HealthStatus
  showTrends?: boolean
  className?: string
}

// Gradient IDs for SVG definitions
const GRADIENT_IDS = {
  energy: 'energy-gradient',
  stress: 'stress-gradient',
  recovery: 'recovery-gradient',
}

// Color configurations based on health status
const getHealthConfig = (value: number, type: 'energy' | 'stress' | 'recovery') => {
  const isStress = type === 'stress'
  const isGood = isStress ? value < 40 : value >= 60
  const isWarning = isStress ? (value >= 40 && value < 60) : (value >= 40 && value < 60)
  const isCritical = isStress ? value >= 60 : value < 40

  if (type === 'energy') {
    return {
      gradient: ['#F59E0B', '#FBBF24'], // Amber
      glowColor: 'rgba(245, 158, 11, 0.4)',
      textClass: value >= 60 ? 'text-amber-500' : value >= 40 ? 'text-amber-400' : 'text-amber-300',
      bgClass: 'bg-amber-500/10',
      status: value >= 60 ? 'good' : value >= 40 ? 'moderate' : 'low',
    }
  } else if (type === 'stress') {
    if (value < 40) {
      return {
        gradient: ['#10B981', '#34D399'], // Green
        glowColor: 'rgba(16, 185, 129, 0.4)',
        textClass: 'text-emerald-500',
        bgClass: 'bg-emerald-500/10',
        status: 'low',
      }
    } else if (value < 60) {
      return {
        gradient: ['#F59E0B', '#FBBF24'], // Amber
        glowColor: 'rgba(245, 158, 11, 0.4)',
        textClass: 'text-amber-500',
        bgClass: 'bg-amber-500/10',
        status: 'moderate',
      }
    } else {
      return {
        gradient: ['#EF4444', '#F87171'], // Red
        glowColor: 'rgba(239, 68, 68, 0.4)',
        textClass: 'text-red-500',
        bgClass: 'bg-red-500/10',
        status: 'high',
      }
    }
  } else {
    // Recovery
    if (value >= 60) {
      return {
        gradient: ['#10B981', '#34D399'], // Green
        glowColor: 'rgba(16, 185, 129, 0.4)',
        textClass: 'text-emerald-500',
        bgClass: 'bg-emerald-500/10',
        status: 'good',
      }
    } else if (value >= 40) {
      return {
        gradient: ['#F59E0B', '#FBBF24'], // Amber
        glowColor: 'rgba(245, 158, 11, 0.4)',
        textClass: 'text-amber-500',
        bgClass: 'bg-amber-500/10',
        status: 'moderate',
      }
    } else {
      return {
        gradient: ['#EF4444', '#F87171'], // Red
        glowColor: 'rgba(239, 68, 68, 0.4)',
        textClass: 'text-red-500',
        bgClass: 'bg-red-500/10',
        status: 'low',
      }
    }
  }
}

// Animated SVG Ring with gradient
interface AnimatedRingProps {
  percentage: number
  gradientId: string
  gradientColors: string[]
  glowColor: string
  size?: number
  strokeWidth?: number
  delay?: number
}

function AnimatedRing({ 
  percentage, 
  gradientId,
  gradientColors,
  glowColor,
  size = 72, 
  strokeWidth = 7,
  delay = 0 
}: AnimatedRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Gradient Definition */}
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={gradientColors[0]} />
          <stop offset="100%" stopColor={gradientColors[1]} />
        </linearGradient>
        {/* Glow filter */}
        <filter id={`${gradientId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        className="text-muted-foreground/10 dark:text-muted-foreground/5"
      />
      
      {/* Progress circle with gradient */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        filter={`url(#${gradientId}-glow)`}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ 
          duration: 1.5, 
          delay, 
          ease: [0.4, 0, 0.2, 1] 
        }}
      />
    </svg>
  )
}

// Trend indicator component
function TrendIndicator({ trend }: { trend?: 'up' | 'down' | 'stable' }) {
  if (!trend) return null
  
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const color = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.5, ...springs.bouncy }}
    >
      <Icon size={12} className={color} />
    </motion.div>
  )
}

// Individual ring component with label
interface RingDisplayProps {
  value: number
  type: 'energy' | 'stress' | 'recovery'
  icon: React.ReactNode
  label: string
  delay: number
  trend?: 'up' | 'down' | 'stable'
}

function RingDisplay({ value, type, icon, label, delay, trend }: RingDisplayProps) {
  const config = getHealthConfig(value, type)
  
  return (
    <motion.div 
      className="flex flex-col items-center gap-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.15, ...springs.gentle }}
    >
      {/* Ring container with glow */}
      <motion.div 
        className={cn(
          "relative p-3 rounded-full",
          config.bgClass
        )}
        animate={config.status === 'good' ? healthRingAnimations.pulse : {}}
      >
        {/* Animated ring */}
        <AnimatedRing 
          percentage={value} 
          gradientId={GRADIENT_IDS[type]}
          gradientColors={config.gradient}
          glowColor={config.glowColor}
          size={72}
          delay={delay * 0.2}
        />
        
        {/* Center icon */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay * 0.2 + 0.5, ...springs.bouncy }}
        >
          <div className={config.textClass}>
            {icon}
          </div>
        </motion.div>
      </motion.div>
      
      {/* Label and value */}
      <div className="text-center">
        <p className="text-xs font-medium text-muted-foreground mb-0.5">
          {label}
        </p>
        <div className="flex items-center justify-center gap-1">
          <motion.p 
            className={cn("text-lg font-display font-semibold tabular-nums", config.textClass)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay * 0.2 + 0.8 }}
          >
            {Math.round(value)}%
          </motion.p>
          <TrendIndicator trend={trend} />
        </div>
      </div>
    </motion.div>
  )
}

export function HealthStatusRings({ healthStatus, showTrends = true, className }: HealthStatusRingsProps) {
  // Use trends from healthStatus if available (from smart health status hook)
  // Otherwise fallback to stable trends
  const trends = healthStatus.trends || {
    energy: 'stable' as const,
    stress: 'stable' as const,
    recovery: 'stable' as const,
  }

  return (
    <div className={cn("flex items-center justify-around gap-6 py-2", className)}>
      <RingDisplay
        value={healthStatus.energy}
        type="energy"
        icon={<Zap size={22} />}
        label="Energy"
        delay={0}
        trend={showTrends ? trends.energy : undefined}
      />
      
      <RingDisplay
        value={healthStatus.stress}
        type="stress"
        icon={<AlertTriangle size={22} />}
        label="Stress"
        delay={1}
        trend={showTrends ? trends.stress : undefined}
      />
      
      <RingDisplay
        value={healthStatus.recovery}
        type="recovery"
        icon={<Heart size={22} />}
        label="Recovery"
        delay={2}
        trend={showTrends ? trends.recovery : undefined}
      />
    </div>
  )
}
