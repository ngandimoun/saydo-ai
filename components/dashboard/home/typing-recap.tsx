"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

/**
 * Typing Recap Component
 * 
 * Displays brief recap with typing animation effect, emojis, FOMO styling, and time loop.
 * Mobile-friendly, PWA-friendly, accessible.
 */

interface TypingRecapProps {
  text: string | null
  isLoading: boolean
  className?: string
  loopDelay?: number // Delay before restarting typing (in ms, default 5000)
}

/**
 * Parse text and extract emojis, highlighting key sections
 */
function parseRecapText(text: string): Array<{ type: 'text' | 'emoji' | 'highlight', content: string }> {
  const parts: Array<{ type: 'text' | 'emoji' | 'highlight', content: string }> = []
  
  // Emoji regex
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]/gu
  
  // Patterns for highlighting (Today/Prochain sections)
  const highlightPatterns = [
    /(Aujourd'hui|Today|Hoy|Heute)\s*:/gi,
    /(Prochain|Next|Próximo|Nächste)\s*:/gi,
  ]
  
  let lastIndex = 0
  let match
  
  const markers: Array<{ index: number, type: 'emoji' | 'highlight', length: number }> = []
  
  // Find emojis
  while ((match = emojiRegex.exec(text)) !== null) {
    markers.push({ index: match.index, type: 'emoji', length: match[0].length })
  }
  
  // Find highlight sections
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
    if (marker.index > lastIndex) {
      const textPart = text.slice(lastIndex, marker.index)
      if (textPart) {
        parts.push({ type: 'text', content: textPart })
      }
    }
    
    const markerContent = text.slice(marker.index, marker.index + marker.length)
    parts.push({ type: marker.type, content: markerContent })
    
    lastIndex = marker.index + marker.length
  })
  
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) })
  }
  
  if (parts.length === 0) {
    parts.push({ type: 'text', content: text })
  }
  
  return parts
}

export function TypingRecap({ text, isLoading, className, loopDelay = 5000 }: TypingRecapProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [shouldLoop, setShouldLoop] = useState(true)
  const previousTextRef = useRef<string>("")
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const loopTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debug logging
  useEffect(() => {
    console.log('[TypingRecap] Props:', {
      text,
      isLoading,
      textLength: text?.length,
      textTrimmed: text?.trim(),
      displayedText,
      isTyping,
    })
  }, [text, isLoading, displayedText, isTyping])

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
        const typingSpeed = 30
        
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
            
            // Set up loop to restart typing after delay
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
              console.warn('[TypingRecap] Safety fallback: showing text directly')
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
  }, [text, shouldLoop, loopDelay, prefersReducedMotion])

  // Show loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "text-xs sm:text-sm text-muted-foreground",
          "flex items-center gap-2",
          className
        )}
      >
        <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" />
        <span>Loading recap...</span>
      </motion.div>
    )
  }

  // Show empty state with fallback
  if (!text || text.trim() === "") {
    // Don't return null - show a fallback message
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "text-xs sm:text-sm",
          "leading-relaxed",
          "max-w-full",
          "text-muted-foreground",
          className
        )}
      >
        Welcome back! Ready to make today count?
      </motion.div>
    )
  }

  // Fallback: always show text if available, regardless of typing state
  const textToDisplay = displayedText || text || ""
  
  // Parse text for emojis and highlights
  const parsedParts = parseRecapText(textToDisplay)

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "text-xs sm:text-sm",
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
                style={{ fontSize: "1.1em" }}
              >
                {part.content}
              </motion.span>
            )
          } else if (part.type === 'highlight') {
            // Color code: "Aujourd'hui/Today" in teal, "Prochain/Next" in amber
            const isToday = /(Aujourd'hui|Today|Hoy|Heute)/i.test(part.content)
            return (
              <motion.span
                key={index}
                className={cn(
                  "inline-block font-semibold",
                  isToday 
                    ? "text-teal-500 dark:text-teal-400" 
                    : "text-amber-500 dark:text-amber-400"
                )}
                animate={{
                  textShadow: [
                    "0 0 0px currentColor",
                    isToday 
                      ? "0 0 6px rgba(13, 148, 136, 0.4)"
                      : "0 0 6px rgba(245, 158, 11, 0.4)",
                    "0 0 0px currentColor"
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
              <span key={index} className="text-muted-foreground">
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
            className="inline-block w-0.5 h-3 sm:h-4 bg-teal-500 dark:bg-teal-400 ml-0.5 align-middle"
          />
        )}
      </span>
    </motion.div>
  )
}

