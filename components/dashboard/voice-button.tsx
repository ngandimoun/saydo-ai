"use client"

import { motion } from "framer-motion"
import { Mic } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Floating Voice Button
 * 
 * Always visible at bottom-right of screen.
 * This is the primary way users interact with Saydo.
 * Tapping opens the full-screen voice recorder.
 * 
 * Design:
 * - Large touch target (56px+)
 * - Subtle glow animation when idle
 * - Magnetic hover effect on desktop
 * 
 * TODO (Future):
 * - Add haptic feedback on mobile
 * - Long-press for quick actions menu
 * - Show recording indicator if already recording in background
 */

interface VoiceButtonProps {
  onClick: () => void
  isRecording?: boolean
  className?: string
}

export function VoiceButton({ onClick, isRecording = false, className }: VoiceButtonProps) {
  return (
    <div className={cn(
      "fixed bottom-6 right-4 sm:right-6 z-50",
      className
    )}>
      {/* Breathing glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/30 blur-xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Recording pulse - shows when actively recording */}
      {isRecording && (
        <motion.div
          className="absolute inset-0 rounded-full bg-red-500"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      )}

      {/* Main Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={cn(
          "relative w-14 h-14 sm:w-16 sm:h-16 rounded-full",
          "flex items-center justify-center",
          "shadow-lg shadow-primary/30",
          "touch-manipulation",
          isRecording 
            ? "bg-red-500 hover:bg-red-600" 
            : "bg-gradient-to-br from-primary to-teal-600 hover:from-primary/90 hover:to-teal-500"
        )}
        aria-label={isRecording ? "Stop recording" : "Start voice recording"}
      >
        {/* Inner glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/20 pointer-events-none" />

        {/* Icon */}
        <motion.div
          animate={isRecording ? {
            scale: [1, 1.2, 1],
          } : {}}
          transition={{
            duration: 1,
            repeat: isRecording ? Infinity : 0,
            ease: "easeInOut"
          }}
        >
          <Mic 
            size={24} 
            className={cn(
              "text-white",
              isRecording && "text-white"
            )} 
          />
        </motion.div>

        {/* Recording dot indicator */}
        {isRecording && (
          <motion.div
            className="absolute top-1 right-1 w-3 h-3 rounded-full bg-white"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Label hint - shows briefly on first visit */}
      {/* 
        TODO: Show this only on first visit using localStorage
        <motion.span
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute right-full mr-3 whitespace-nowrap text-sm text-muted-foreground bg-card px-3 py-1.5 rounded-full shadow-sm"
        >
          Tap to speak
        </motion.span>
      */}
    </div>
  )
}




