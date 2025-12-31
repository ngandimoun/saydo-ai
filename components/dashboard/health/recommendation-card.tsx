"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { 
  Utensils, 
  Droplets, 
  Dumbbell, 
  Moon, 
  Pill, 
  Heart, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Clock,
  Repeat,
  Lightbulb,
  ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Health Recommendation Card
 * 
 * Displays a specific actionable recommendation with:
 * - Tap to expand (mobile-friendly, no hover dependency)
 * - Specific examples and alternatives
 * - How to use instructions
 * - Full description always visible
 */

interface RecommendationData {
  id: string
  userId: string
  type: string
  title: string
  description?: string
  reason?: string
  imageUrl?: string
  timing?: string
  frequency?: string
  specificExamples?: string[]
  alternatives?: string[]
  howToUse?: string
  createdAt: Date
}

interface RecommendationCardProps {
  recommendation: RecommendationData
  delay?: number
}

// Type to icon/color mapping - theme-aware for dark mode
const typeConfig: Record<string, {
  icon: React.ComponentType<{ size?: number; className?: string }>
  gradient: string
  iconBg: string
  bgColor: string
  borderColor: string
}> = {
  food: {
    icon: Utensils,
    gradient: 'from-emerald-500/10 to-green-500/5 dark:from-emerald-500/20 dark:to-green-500/10',
    iconBg: 'bg-emerald-500 dark:bg-emerald-400',
    bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    borderColor: 'border-emerald-500/20 dark:border-emerald-400/30'
  },
  drink: {
    icon: Droplets,
    gradient: 'from-blue-500/10 to-cyan-500/5 dark:from-blue-500/20 dark:to-cyan-500/10',
    iconBg: 'bg-blue-500 dark:bg-blue-400',
    bgColor: 'bg-blue-500/10 dark:bg-blue-500/20',
    borderColor: 'border-blue-500/20 dark:border-blue-400/30'
  },
  exercise: {
    icon: Dumbbell,
    gradient: 'from-orange-500/10 to-amber-500/5 dark:from-orange-500/20 dark:to-amber-500/10',
    iconBg: 'bg-orange-500 dark:bg-orange-400',
    bgColor: 'bg-orange-500/10 dark:bg-orange-500/20',
    borderColor: 'border-orange-500/20 dark:border-orange-400/30'
  },
  lifestyle: {
    icon: Heart,
    gradient: 'from-rose-500/10 to-pink-500/5 dark:from-rose-500/20 dark:to-pink-500/10',
    iconBg: 'bg-rose-500 dark:bg-rose-400',
    bgColor: 'bg-rose-500/10 dark:bg-rose-500/20',
    borderColor: 'border-rose-500/20 dark:border-rose-400/30'
  },
  sleep: {
    icon: Moon,
    gradient: 'from-indigo-500/10 to-purple-500/5 dark:from-indigo-500/20 dark:to-purple-500/10',
    iconBg: 'bg-indigo-500 dark:bg-indigo-400',
    bgColor: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    borderColor: 'border-indigo-500/20 dark:border-indigo-400/30'
  },
  supplement: {
    icon: Pill,
    gradient: 'from-amber-500/10 to-yellow-500/5 dark:from-amber-500/20 dark:to-yellow-500/10',
    iconBg: 'bg-amber-500 dark:bg-amber-400',
    bgColor: 'bg-amber-500/10 dark:bg-amber-500/20',
    borderColor: 'border-amber-500/20 dark:border-amber-400/30'
  }
}

export function RecommendationCard({ recommendation, delay = 0 }: RecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const config = typeConfig[recommendation.type] || typeConfig.food
  const Icon = config.icon
  const hasImage = recommendation.imageUrl && !imageError

  const hasDetails = recommendation.description || 
                     recommendation.reason || 
                     recommendation.specificExamples?.length || 
                     recommendation.alternatives?.length ||
                     recommendation.howToUse

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "border",
        config.borderColor,
        "bg-gradient-to-br",
        config.gradient
      )}
    >
      {/* Clickable Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-4"
      >
        <div className="flex items-start gap-3">
          {/* Icon Badge */}
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            "shadow-sm",
            config.iconBg
          )}>
            <Icon size={20} className="text-white" />
          </div>

          {/* Title & Basic Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-foreground leading-tight">
              {recommendation.title}
            </h4>
            
            {/* Timing/Frequency Pills */}
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {recommendation.timing && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 text-muted-foreground">
                  <Clock size={10} />
                  {recommendation.timing}
                </span>
              )}
              {recommendation.frequency && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 text-muted-foreground">
                  <Repeat size={10} />
                  {recommendation.frequency}
                </span>
              )}
            </div>
          </div>

          {/* Expand/Collapse Indicator */}
          {hasDetails && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0"
            >
              <ChevronDown size={18} className="text-muted-foreground" />
            </motion.div>
          )}
        </div>

        {/* Description Preview (always visible, truncated) */}
        {recommendation.description && !isExpanded && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 pl-[52px]">
            {recommendation.description}
          </p>
        )}
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
              {/* Full Description */}
              {recommendation.description && (
                <p className="text-sm text-foreground leading-relaxed">
                  {recommendation.description}
                </p>
              )}

              {/* Image if available */}
              {hasImage && (
                <div className="relative h-32 rounded-xl overflow-hidden">
                  <Image
                    src={recommendation.imageUrl!}
                    alt={recommendation.title}
                    fill
                    className={cn(
                      "object-cover transition-opacity duration-300",
                      imageLoaded ? "opacity-100" : "opacity-0"
                    )}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                </div>
              )}

              {/* Why This Is Recommended */}
              {recommendation.reason && (
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-card/60 backdrop-blur-sm border border-border/30">
                  <Sparkles size={14} className="text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      Pourquoi cette recommandation
                    </span>
                    <p className="text-xs text-foreground mt-0.5">
                      {recommendation.reason}
                    </p>
                  </div>
                </div>
              )}

              {/* Specific Examples */}
              {recommendation.specificExamples && recommendation.specificExamples.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Lightbulb size={10} />
                    Exemples spécifiques
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {recommendation.specificExamples.map((example, idx) => (
                      <span 
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-full bg-card border border-border text-foreground"
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Alternatives */}
              {recommendation.alternatives && recommendation.alternatives.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <ArrowRight size={10} />
                    Alternatives
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {recommendation.alternatives.map((alt, idx) => (
                      <span 
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-full bg-card/80 backdrop-blur-sm border border-dashed border-border/50 text-muted-foreground"
                      >
                        {alt}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* How to Use */}
              {recommendation.howToUse && (
                <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/10">
                  <span className="text-[10px] font-medium text-primary uppercase tracking-wide">
                    Comment utiliser
                  </span>
                  <p className="text-xs text-foreground mt-0.5">
                    {recommendation.howToUse}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
