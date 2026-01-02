"use client"

import { motion } from "framer-motion"
import { Sun, Cloud, Star, Moon } from "lucide-react"
import type { UserProfile } from "@/lib/dashboard/types"
import { getTimeOfDayGreeting, getTimeOfDay } from "@/lib/dashboard/time-utils"
import { cn } from "@/lib/utils"
import { springs, staggerContainer, staggerItem, fadeInUp } from "@/lib/motion-system"
import { TypingRecap } from "./typing-recap"
import { useBriefRecap } from "@/hooks/queries/use-brief-recap"
import { useMotivationalMessage } from "@/hooks/queries/use-motivational-message"
import { EnhancedTypingMessage } from "./enhanced-typing-message"

/**
 * Greeting Section - Airbnb-Inspired
 * 
 * Emotional greeting with time-aware messaging.
 * Exploration categories (like Airbnb's category chips).
 */

interface GreetingSectionProps {
  userProfile: UserProfile
}


export function GreetingSection({ 
  userProfile,
}: GreetingSectionProps) {
  const greeting = getTimeOfDayGreeting(userProfile.preferredName, userProfile.language)
  const timeOfDay = getTimeOfDay()
  
  const { 
    data: briefRecap, 
    isLoading: briefRecapLoading,
    isError: briefRecapError,
    error: briefRecapErrorDetails
  } = useBriefRecap()
  
  // Log for debugging
  if (briefRecapError) {
    console.error('[GreetingSection] Brief recap error:', briefRecapErrorDetails)
  }
  
  // Fetch personalized motivational message
  const { 
    data: motivationalMessage, 
    isLoading: motivationalMessageLoading,
    isError: motivationalMessageError,
    error: motivationalMessageErrorDetails
  } = useMotivationalMessage()
  
  // Log for debugging
  if (motivationalMessageError) {
    console.error('[GreetingSection] Motivational message error:', motivationalMessageErrorDetails)
  }
  
  // Capitalize first letter of name
  const capitalizeName = (name: string) => {
    if (!name) return name
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
  }
  
  const displayName = capitalizeName(userProfile.preferredName)

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
        <EnhancedTypingMessage
          text={motivationalMessage || null}
          isLoading={motivationalMessageLoading}
          variant="motivational"
          loopDelay={6000}
          className="text-sm font-medium"
        />
        {motivationalMessageError && (
          <p className="text-xs text-muted-foreground/60">
            (Using fallback message)
          </p>
        )}
        
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

      {/* Typing Recap */}
      <motion.div
        variants={fadeInUp}
        className="py-2"
      >
        <TypingRecap
          text={briefRecap || null}
          isLoading={briefRecapLoading}
          loopDelay={5000}
        />
        {briefRecapError && (
          <p className="text-xs text-muted-foreground/60">
            (Using fallback message)
          </p>
        )}
      </motion.div>
    </motion.section>
  )
}
