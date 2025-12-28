"use client"

import { motion } from "framer-motion"
import { Sparkles, TrendingUp, Heart, Zap, Brain, Moon, Coffee, Sun, Cloud, Star } from "lucide-react"
import type { UserProfile } from "@/lib/dashboard/types"
import { getTimeOfDayGreeting, getTimeOfDay } from "@/lib/dashboard/time-utils"
import { cn } from "@/lib/utils"
import { springs, staggerContainer, staggerItem, fadeInUp } from "@/lib/motion-system"
import { SummaryCard } from "@/components/ui/card"

/**
 * Greeting Section - Airbnb-Inspired
 * 
 * Emotional greeting with time-aware messaging.
 * "How Saydo helped you" achievement cards.
 * Exploration categories (like Airbnb's category chips).
 */

interface GreetingSectionProps {
  userProfile: UserProfile
}

// Exploration categories - Airbnb style
const explorationCategories = [
  { id: 'energy', label: 'Energy', icon: Zap, color: 'text-amber-500 bg-amber-500/10' },
  { id: 'focus', label: 'Focus', icon: Brain, color: 'text-indigo-500 bg-indigo-500/10' },
  { id: 'calm', label: 'Calm', icon: Moon, color: 'text-purple-500 bg-purple-500/10' },
  { id: 'morning', label: 'Morning', icon: Coffee, color: 'text-orange-500 bg-orange-500/10' },
]

export function GreetingSection({ userProfile }: GreetingSectionProps) {
  const greeting = getTimeOfDayGreeting(userProfile.preferredName, userProfile.language)
  const hour = new Date().getHours()
  const timeOfDay = getTimeOfDay()
  
  // Capitalize first letter of name
  const capitalizeName = (name: string) => {
    if (!name) return name
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
  }
  
  const displayName = capitalizeName(userProfile.preferredName)
  
  // Time-aware messaging
  const getTimeMessage = () => {
    if (hour < 12) return "Ready to make today count?"
    if (hour < 17) return "Let's keep the momentum going"
    return "Wind down and reflect"
  }

  // Get time-based icons
  const getTimeIcons = () => {
    switch (timeOfDay) {
      case 'morning':
        return {
          primary: Sun,
          primaryColor: 'text-amber-500',
          secondary: null,
          secondaryColor: '',
          stars: 0
        }
      case 'afternoon':
        return {
          primary: Sun,
          primaryColor: 'text-orange-500',
          secondary: Cloud,
          secondaryColor: 'text-slate-400',
          stars: 0
        }
      case 'evening':
        return {
          primary: Moon,
          primaryColor: 'text-indigo-400',
          secondary: null,
          secondaryColor: '',
          stars: 2
        }
      case 'night':
        return {
          primary: Moon,
          primaryColor: 'text-purple-400',
          secondary: null,
          secondaryColor: '',
          stars: 3
        }
      default:
        return {
          primary: Sun,
          primaryColor: 'text-amber-500',
          secondary: null,
          secondaryColor: '',
          stars: 0
        }
    }
  }

  const timeIcons = getTimeIcons()
  const PrimaryIcon = timeIcons.primary
  const SecondaryIcon = timeIcons.secondary

  // Mock data - TODO: Fetch from backend
  const proSummary = {
    text: "Organized 3 meetings and drafted 2 follow-up emails from your voice notes.",
    metric: "7 tasks completed today"
  }

  const healthSummary = {
    text: "Your iron levels suggest adding more leafy greens. I've updated your meal plan.",
    metric: "3 insights generated"
  }

  return (
    <motion.section 
      className="space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Greeting */}
      <motion.div
        variants={fadeInUp}
        className="space-y-2"
      >
        <motion.p 
          className="text-sm font-medium text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0.7, 1, 0.7],
          }}
          transition={{ 
            delay: 0.1,
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {getTimeMessage()}
        </motion.p>
        
        <h1 className="font-display relative">
          {/* Time-based decorative icons */}
          <div className="absolute -left-8 sm:-left-12 top-0 bottom-0 flex items-center">
            <motion.div
              animate={{
                y: [0, -8, 0],
                rotate: [0, 5, 0],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2
              }}
              className={cn("relative", timeIcons.primaryColor)}
            >
              <PrimaryIcon size={32} className="opacity-80" />
              {timeIcons.stars > 0 && (
                <>
                  {Array.from({ length: timeIcons.stars }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
                        top: `${-15 + i * 20}px`,
                        left: `${20 + i * 15}px`,
                      }}
                      animate={{
                        opacity: [0.3, 0.8, 0.3],
                        scale: [0.8, 1, 0.8],
                      }}
                      transition={{
                        duration: 2 + i * 0.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.3
                      }}
                    >
                      <Star size={12} className="text-yellow-300 fill-yellow-300" />
                    </motion.div>
                  ))}
                </>
              )}
            </motion.div>
            {SecondaryIcon && (
              <motion.div
                className={cn("absolute left-10", timeIcons.secondaryColor)}
                animate={{
                  y: [0, 6, 0],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              >
                <SecondaryIcon size={24} className="opacity-70" />
              </motion.div>
            )}
          </div>

          <motion.span 
            className="block text-3xl sm:text-4xl font-semibold text-foreground tracking-tight relative z-10"
            variants={staggerItem}
            animate={{
              scale: [1, 1.02, 1],
              opacity: [1, 0.95, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3
            }}
          >
            {greeting.split(',')[0]},
          </motion.span>
          <motion.span 
            className="block text-3xl sm:text-4xl font-bold text-primary tracking-tight mt-1 relative z-10"
            variants={staggerItem}
            animate={{
              scale: [1, 1.03, 1],
              opacity: [1, 0.9, 1],
              filter: [
                "brightness(1)",
                "brightness(1.1)",
                "brightness(1)"
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.6
            }}
          >
            {displayName}
          </motion.span>
        </h1>
      </motion.div>

      {/* Exploration Categories - Airbnb Style */}
      <motion.div
        variants={fadeInUp}
        className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide"
      >
        {explorationCategories.map((cat, index) => {
          const Icon = cat.icon
          return (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.05, ...springs.gentle }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full",
                "bg-card border border-border",
                "text-sm font-medium text-foreground",
                "hover:border-primary/30 hover:bg-primary/5",
                "transition-colors duration-200",
                "whitespace-nowrap flex-shrink-0"
              )}
            >
              <div className={cn("p-1 rounded-lg", cat.color)}>
                <Icon size={14} />
              </div>
              {cat.label}
            </motion.button>
          )
        })}
      </motion.div>

      {/* How Saydo Helped You - Achievement Cards */}
      <motion.div
        variants={fadeInUp}
        className="grid grid-cols-2 gap-3"
      >
        {/* Pro Life Summary */}
        <SummaryCard
          icon={<TrendingUp size={18} />}
          iconColor="teal"
          label="Pro Life"
          title="Work Summary"
          description={proSummary.text}
          metric={proSummary.metric}
        />

        {/* Health Summary */}
        <SummaryCard
          icon={<Heart size={18} />}
          iconColor="rose"
          label="Health"
          title="Health Summary"
          description={healthSummary.text}
          metric={healthSummary.metric}
        />
      </motion.div>

      {/* Ask Saydo - Conversational Input */}
      <motion.button
        variants={fadeInUp}
        whileHover={{ scale: 1.01, y: -2 }}
        whileTap={{ scale: 0.99 }}
        transition={springs.gentle}
        className={cn(
          "w-full p-4 rounded-2xl",
          "bg-card border border-border",
          "flex items-center gap-4",
          "hover:border-primary/30 hover:shadow-md",
          "transition-all duration-200",
          "text-left group"
        )}
      >
        <div className={cn(
          "p-2.5 rounded-xl",
          "bg-gradient-to-br from-primary/10 to-teal-500/5",
          "group-hover:from-primary/15 group-hover:to-teal-500/10",
          "transition-colors duration-200"
        )}>
          <Sparkles size={18} className="text-primary" />
        </div>
        <div className="flex-1">
          <span className="text-muted-foreground text-sm">
            Ask anything about your health or work...
          </span>
        </div>
        <motion.div
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-muted-foreground/50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </motion.div>
      </motion.button>
    </motion.section>
  )
}
