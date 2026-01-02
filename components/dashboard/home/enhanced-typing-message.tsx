"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

/**
 * Enhanced Typing Message Component
 * 
 * Displays motivational message with typing animation, emojis, FOMO styling, and time loop.
 * Features:
 * - Typing animation that restarts after completion
 * - Emoji support with proper rendering
 * - FOMO styling (gradients, glows, pulsing)
 * - Highlighted key words
 * - Respects reduced motion preferences
 */

interface EnhancedTypingMessageProps {
  text: string | null
  isLoading: boolean
  className?: string
  loopDelay?: number // Delay before restarting typing (in ms, default 6000)
  variant?: "motivational" | "recap" // Different styling variants
}

/**
 * Parse text and extract emojis, highlighting key words
 */
function parseTextWithEmojis(text: string): Array<{ type: 'text' | 'emoji' | 'highlight', content: string }> {
  const parts: Array<{ type: 'text' | 'emoji' | 'highlight', content: string }> = []
  
  // Emoji regex (covers most emojis including skin tone modifiers)
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]/gu
  
  // Key words to highlight (action words, important terms)
  const highlightPatterns = [
    /\b(aujourd'hui|today|hoy|heute)\b/gi,
    /\b(prochain|next|próximo|nächste)\b/gi,
    /\b(réunion|meeting|reunión|treffen)\b/gi,
    /\b(match|game|partido|spiel)\b/gi,
    /\b(bouger|move|mover|bewegen)\b/gi,
    /\b(préparez|prepare|preparar|vorbereiten)\b/gi,
  ]
  
  let lastIndex = 0
  let match
  
  // Find all emojis and highlights
  const markers: Array<{ index: number, type: 'emoji' | 'highlight', length: number }> = []
  
  // Find emojis
  while ((match = emojiRegex.exec(text)) !== null) {
    markers.push({ index: match.index, type: 'emoji', length: match[0].length })
  }
  
  // Find highlight words
  highlightPatterns.forEach(pattern => {
    const regex = new RegExp(pattern.source, 'gi')
    while ((match = regex.exec(text)) !== null) {
      markers.push({ index: match.index, type: 'highlight', length: match[0].length })
    }
  })
  
  // Sort markers by index
  markers.sort((a, b) => a.index - b.index)
  
  // Build parts array
  markers.forEach(marker => {
    // Add text before marker
    if (marker.index > lastIndex) {
      const textPart = text.slice(lastIndex, marker.index)
      if (textPart) {
        parts.push({ type: 'text', content: textPart })
      }
    }
    
    // Add marker
    const markerContent = text.slice(marker.index, marker.index + marker.length)
    parts.push({ type: marker.type, content: markerContent })
    
    lastIndex = marker.index + marker.length
  })
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) })
  }
  
  // If no markers found, return whole text as text
  if (parts.length === 0) {
    parts.push({ type: 'text', content: text })
  }
  
  return parts
}

export function EnhancedTypingMessage({ 
  text, 
  isLoading, 
  className,
  loopDelay = 6000, // 6 seconds default
  variant = "motivational"
}: EnhancedTypingMessageProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [shouldLoop, setShouldLoop] = useState(true)
  const previousTextRef = useRef<string>("")
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const loopTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debug logging
  useEffect(() => {
    console.log('[EnhancedTypingMessage] Props:', {
      text,
      isLoading,
      variant,
      textLength: text?.length,
      textTrimmed: text?.trim(),
      displayedText,
      isTyping,
    })
  }, [text, isLoading, variant, displayedText, isTyping])

  // Check for reduced motion preference
  const prefersReducedMotion = 
    typeof window !== "undefined" && 
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  useEffect(() => {
    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current)
    }
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current)
    }

    // If text changed, restart typing
    if (text && text !== previousTextRef.current) {
      previousTextRef.current = text
      setShouldLoop(true)
      
      // Initialize displayedText immediately so text is visible right away
      setDisplayedText(text)
      
      // Start typing
      if (prefersReducedMotion) {
        setIsTyping(false)
        
        if (shouldLoop) {
          loopTimeoutRef.current = setTimeout(() => {
            setDisplayedText("")
            setTimeout(() => {
              if (text) {
                setDisplayedText(text)
              }
            }, 500)
          }, loopDelay)
        }
      } else {
        // Clear displayedText and start typing animation
        setDisplayedText("")
        setIsTyping(true)
        
        let currentIndex = 0
        const typingSpeed = variant === "motivational" ? 25 : 30
        
        const typeNextChar = () => {
          if (currentIndex < text.length) {
            setDisplayedText(text.slice(0, currentIndex + 1))
            currentIndex++
            
            const char = text[currentIndex - 1]
            const pause = char === '.' || char === ':' || char === '!' || char === '?'
              ? typingSpeed * 3
              : typingSpeed
            
            timeoutRef.current = setTimeout(typeNextChar, pause)
          } else {
            setIsTyping(false)
            
            if (shouldLoop) {
              loopTimeoutRef.current = setTimeout(() => {
                setDisplayedText("")
                setIsTyping(true)
                currentIndex = 0
                typeNextChar()
              }, loopDelay)
            }
          }
        }
        
        // Start typing after a short delay
        timeoutRef.current = setTimeout(typeNextChar, 200)
        
        // Safety fallback: if typing hasn't started after 500ms, show text directly
        safetyTimeoutRef.current = setTimeout(() => {
          setDisplayedText((current) => {
            if (current === "" && text) {
              console.warn('[EnhancedTypingMessage] Safety fallback: showing text directly')
              setIsTyping(false)
              return text
            }
            return current
          })
        }, 500)
      }
    } else if (!text) {
      setDisplayedText("")
      setIsTyping(false)
      setShouldLoop(false)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current)
      }
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current)
      }
    }
  }, [text, shouldLoop, loopDelay, prefersReducedMotion, variant])

  // Show loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          variant === "motivational" 
            ? "text-sm sm:text-base font-medium" 
            : "text-xs sm:text-sm",
          "text-muted-foreground",
          "flex items-center gap-2",
          className
        )}
      >
        <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" />
        <span>Loading...</span>
      </motion.div>
    )
  }

  // Show empty state with fallback
  if (!text || text.trim() === "") {
    // Don't return null - show a fallback message
    const hour = new Date().getHours()
    const fallbackMessage = hour < 12 
      ? "Ready to make today count?" 
      : hour < 17 
      ? "Let's keep the momentum going" 
      : "Wind down and reflect"
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          variant === "motivational"
            ? "text-sm sm:text-base font-medium"
            : "text-xs sm:text-sm",
          "leading-relaxed",
          "max-w-full",
          "text-muted-foreground",
          className
        )}
      >
        {fallbackMessage}
      </motion.div>
    )
  }

  // Fallback: always show text if available, regardless of typing state
  const textToDisplay = displayedText || text || ""
  
  // Parse text for emojis and highlights
  const parsedParts = parseTextWithEmojis(textToDisplay)

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        variant === "motivational"
          ? "text-sm sm:text-base font-medium"
          : "text-xs sm:text-sm",
        "leading-relaxed",
        "max-w-full",
        className
      )}
    >
      <span className="inline-block">
        {parsedParts.map((part, index) => {
          if (part.type === 'emoji') {
            return (
              <motion.span
                key={index}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.1
                }}
                className="inline-block mx-0.5"
                style={{ fontSize: variant === "motivational" ? "1.2em" : "1.1em" }}
              >
                {part.content}
              </motion.span>
            )
          } else if (part.type === 'highlight') {
            return (
              <motion.span
                key={index}
                className={cn(
                  "inline-block font-semibold",
                  variant === "motivational"
                    ? "text-gradient-primary bg-gradient-to-r from-teal-500 to-teal-400 bg-clip-text text-transparent"
                    : "text-amber-500 dark:text-amber-400"
                )}
                animate={{
                  textShadow: [
                    "0 0 0px rgba(13, 148, 136, 0)",
                    "0 0 8px rgba(13, 148, 136, 0.4)",
                    "0 0 0px rgba(13, 148, 136, 0)"
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {part.content}
              </motion.span>
            )
          } else {
            return (
              <span key={index} className="text-foreground">
                {part.content}
              </span>
            )
          }
        })}
        {isTyping && (
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={cn(
              "inline-block w-0.5 ml-0.5 align-middle",
              variant === "motivational" ? "h-4 sm:h-5" : "h-3 sm:h-4",
              "bg-teal-500 dark:bg-teal-400"
            )}
          />
        )}
      </span>
    </motion.div>
  )
}

