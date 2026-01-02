"use client"

import { motion } from "framer-motion"
import { MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { springs } from "@/lib/motion-system"
import { useChat } from "./chat-provider"

/**
 * Chat Floating Action Button
 * 
 * Floating button in bottom-right corner to open chat modal.
 * Similar to VoiceFab but for chat functionality.
 */
export function ChatFab() {
  const { isOpen, setIsOpen } = useChat()

  return (
    <div className={cn(
      "fixed bottom-20 right-4 z-50",
      "sm:bottom-24 sm:right-6"
    )}>
      {/* Outer ambient ring */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className={cn(
            "absolute w-14 h-14 rounded-full",
            isOpen
              ? "bg-primary/20 dark:bg-primary/30"
              : "bg-primary/10 dark:bg-primary/20"
          )}
          animate={isOpen ? {
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.15, 0.3]
          } : {
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.15, 0.3]
          }}
          transition={{
            duration: isOpen ? 1 : 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Main button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        transition={springs.bouncy}
        suppressHydrationWarning
        className={cn(
          "relative w-14 h-14 rounded-full",
          "flex items-center justify-center",
          "touch-manipulation",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          isOpen
            ? "bg-gradient-to-br from-primary/80 to-teal-600/80 focus-visible:ring-primary shadow-lg shadow-primary/30"
            : "bg-gradient-to-br from-primary to-teal-600 focus-visible:ring-primary shadow-lg shadow-primary/30"
        )}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {/* Inner highlight gradient */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />

        {/* Subtle inner shadow for depth */}
        <div className="absolute inset-1 rounded-full shadow-inner shadow-black/10 pointer-events-none" />

        {/* Icon */}
        <motion.div
          animate={{
            scale: isOpen ? 0.9 : 1,
            rotate: isOpen ? 180 : 0
          }}
          transition={springs.bouncy}
        >
          <MessageCircle 
            size={24} 
            className="text-white"
          />
        </motion.div>
      </motion.button>
    </div>
  )
}

