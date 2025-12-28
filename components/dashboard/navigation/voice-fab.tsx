"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Mic, Square } from "lucide-react"
import { cn } from "@/lib/utils"
import { springs, voiceOrbAnimations } from "@/lib/motion-system"

/**
 * Living Voice Orb - The Signature Saydo Element
 * 
 * Features:
 * - Ambient breathing animation when idle
 * - Magnetic pull effect on hover
 * - Waveform visualization during recording
 * - Particle effects on tap
 * - Processing state with rotating ring
 */

interface VoiceFabProps {
  onClick: () => void
  isRecording?: boolean
  isProcessing?: boolean
  className?: string
}

export function VoiceFab({ 
  onClick, 
  isRecording = false, 
  isProcessing = false,
  className 
}: VoiceFabProps) {
  const state = isProcessing ? 'processing' : isRecording ? 'recording' : 'idle'

  return (
    <div className={cn(
      "fixed bottom-5 left-1/2 -translate-x-1/2 z-50",
      className
    )}>
      {/* Outer ambient rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* First ring - breathing */}
        <motion.div
          className={cn(
            "absolute w-20 h-20 rounded-full",
            isRecording 
              ? "bg-red-500/20 dark:bg-red-500/30" 
              : "bg-primary/10 dark:bg-primary/20"
          )}
          animate={isRecording ? {
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.2, 0.5]
          } : {
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.15, 0.3]
          }}
          transition={{
            duration: isRecording ? 1 : 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Second ring - delayed breathing */}
        <motion.div
          className={cn(
            "absolute w-24 h-24 rounded-full",
            isRecording 
              ? "bg-red-500/10 dark:bg-red-500/15" 
              : "bg-primary/5 dark:bg-primary/10"
          )}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.1, 0.2]
          }}
          transition={{
            duration: isRecording ? 1.2 : 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3
          }}
        />

        {/* Recording pulse ring */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut"
              }}
              className="absolute w-16 h-16 rounded-full border-2 border-red-500"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Waveform visualization during recording */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-full mb-4 flex items-end gap-1 h-8"
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-red-500 dark:bg-red-400 rounded-full"
                animate={{
                  height: [8, 20 + Math.random() * 12, 8],
                }}
                transition={{
                  duration: 0.4 + Math.random() * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.1
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing ring */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1, rotate: 360 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
              rotate: {
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              },
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 }
            }}
            className="absolute w-16 h-16 rounded-full border-2 border-transparent border-t-primary border-r-primary/50"
          />
        )}
      </AnimatePresence>

      {/* Main button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        transition={springs.bouncy}
        className={cn(
          "relative w-16 h-16 rounded-full",
          "flex items-center justify-center",
          "touch-manipulation",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          isRecording 
            ? "bg-gradient-to-br from-red-500 to-red-600 focus-visible:ring-red-500 shadow-lg shadow-red-500/40" 
            : "bg-gradient-to-br from-primary to-teal-600 focus-visible:ring-primary shadow-lg shadow-primary/30",
          isProcessing && "from-primary/80 to-teal-600/80"
        )}
        aria-label={
          isProcessing 
            ? "Processing voice note" 
            : isRecording 
            ? "Stop recording" 
            : "Start voice recording"
        }
      >
        {/* Inner highlight gradient */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />

        {/* Subtle inner shadow for depth */}
        <div className="absolute inset-1 rounded-full shadow-inner shadow-black/10 pointer-events-none" />

        {/* Icon */}
        <AnimatePresence mode="wait">
          {isRecording ? (
            <motion.div
              key="stop"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={springs.bouncy}
            >
              <Square 
                size={22} 
                className="text-white fill-white"
              />
            </motion.div>
          ) : (
            <motion.div
              key="mic"
              initial={{ scale: 0 }}
              animate={{ 
                scale: 1,
                ...(state === 'idle' && !isProcessing ? voiceOrbAnimations.idle : {})
              }}
              exit={{ scale: 0 }}
              transition={springs.bouncy}
            >
              <Mic 
                size={24} 
                className={cn(
                  "text-white",
                  isProcessing && "opacity-60"
                )}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recording indicator dot */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ 
                scale: 1,
                opacity: [1, 0.5, 1]
              }}
              exit={{ scale: 0 }}
              transition={{
                scale: springs.bouncy,
                opacity: { duration: 0.8, repeat: Infinity }
              }}
              className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full bg-white shadow-sm"
            />
          )}
        </AnimatePresence>
      </motion.button>

      {/* Recording duration label */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2"
          >
            <span className="text-xs font-medium text-red-500 dark:text-red-400 tabular-nums">
              Recording...
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
