"use client"

import { motion } from "framer-motion"
import { Mic } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Floating Voice Action Button (FAB)
 * 
 * Center floating button in the bottom navigation.
 * This is the primary action for voice recording.
 * Elevated above the nav bar with a prominent design.
 */

interface VoiceFabProps {
  onClick: () => void
  isRecording?: boolean
  className?: string
}

export function VoiceFab({ onClick, isRecording = false, className }: VoiceFabProps) {
  return (
    <div className={cn(
      "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
      className
    )}>
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/20"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.2, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ width: 64, height: 64, marginLeft: -4, marginTop: -4 }}
      />

      {/* Recording pulse */}
      {isRecording && (
        <motion.div
          className="absolute inset-0 rounded-full bg-red-500"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.6, 0, 0.6]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeOut"
          }}
          style={{ width: 56, height: 56 }}
        />
      )}

      {/* Main button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={cn(
          "relative w-14 h-14 rounded-full",
          "flex items-center justify-center",
          "shadow-lg",
          "touch-manipulation",
          isRecording 
            ? "bg-red-500 shadow-red-500/40" 
            : "bg-gradient-to-br from-primary to-teal-600 shadow-primary/40"
        )}
        aria-label={isRecording ? "Stop recording" : "Start voice recording"}
      >
        {/* Inner highlight */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/20 pointer-events-none" />

        {/* Icon */}
        <motion.div
          animate={isRecording ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.8, repeat: isRecording ? Infinity : 0 }}
        >
          <Mic 
            size={24} 
            className="text-white"
          />
        </motion.div>

        {/* Recording indicator dot */}
        {isRecording && (
          <motion.div
            className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-white"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
        )}
      </motion.button>
    </div>
  )
}

