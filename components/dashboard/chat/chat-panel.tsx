"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Minimize2, Sparkles } from "lucide-react"
import { ChatMessage, TypingIndicator, type ChatMessage as ChatMessageType } from "./chat-message"
import { ChatInput } from "./chat-input"
import { cn } from "@/lib/utils"
import { springs } from "@/lib/motion-system"

/**
 * Chat Panel Component - Airbnb-Inspired
 * 
 * Immersive chat interface with:
 * - Glass-morphism styling
 * - Smooth animations
 * - Ambient gradient header
 * - Auto-scroll to latest message
 */

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
  onMinimize?: () => void
  messages: ChatMessageType[]
  onSendMessage: (message: string) => void
  onStartVoiceRecording?: () => void
  onStopVoiceRecording?: () => void
  isProcessing?: boolean
  isRecording?: boolean
  className?: string
}

export function ChatPanel({
  isOpen,
  onClose,
  onMinimize,
  messages,
  onSendMessage,
  onStartVoiceRecording,
  onStopVoiceRecording,
  isProcessing = false,
  isRecording = false,
  className
}: ChatPanelProps) {
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isProcessing])

  // Focus management when panel opens
  useEffect(() => {
    if (isOpen) {
      // Focus on input when panel opens
    }
  }, [isOpen])

  const handlePlayVoice = (messageId: string) => {
    setPlayingVoiceId(messageId)
  }

  const handlePauseVoice = () => {
    setPlayingVoiceId(null)
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.95 }}
      transition={springs.gentle}
      className={cn(
        // Position: above bottom nav with safe area for PWA
        "fixed right-4 left-4 z-50",
        "bottom-[calc(5.5rem+env(safe-area-inset-bottom))]",
        "rounded-3xl",
        "shadow-2xl flex flex-col",
        "max-h-[70vh]",
        "max-w-md mx-auto",
        "overflow-hidden",
        // Glass-morphism effect
        "bg-card/95 backdrop-blur-xl",
        "border border-border/50",
        // Dark mode glow
        "dark:shadow-primary/10",
        className
      )}
      role="dialog"
      aria-label="Chat with Saydo"
    >
      {/* Header with gradient */}
      <div className="relative">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-teal-500/10 to-cyan-500/10" />
        
        <div className="relative flex items-center justify-between px-4 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            {/* Animated status indicator */}
            <motion.div 
              className="relative"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={springs.bouncy}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles size={18} className="text-white" />
              </div>
              <motion.div 
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            
            <div>
              <h2 className="saydo-headline text-lg font-semibold">Saydo</h2>
              <p className="text-xs text-muted-foreground">Your AI companion</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {onMinimize && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onMinimize}
                className="p-2 hover:bg-muted/50 rounded-xl transition-colors"
                aria-label="Minimize chat"
              >
                <Minimize2 size={18} className="text-muted-foreground" />
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 hover:bg-muted/50 rounded-xl transition-colors"
              aria-label="Close chat"
            >
              <X size={18} className="text-muted-foreground" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-hide"
        style={{ scrollBehavior: "smooth" }}
      >
        {messages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center justify-center h-full text-center py-8"
          >
            <motion.div 
              className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-teal-500/20 flex items-center justify-center mb-4"
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles size={32} className="text-primary" />
            </motion.div>
            <h3 className="saydo-headline text-lg font-semibold mb-2">Start a conversation</h3>
            <p className="saydo-body text-sm text-muted-foreground max-w-xs">
              Ask me anything about your health, work, or daily activities.
            </p>
            
            {/* Suggestion chips */}
            <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-xs">
              {[
                "Which vitamins today?",
                "My schedule",
                "Health summary"
              ].map((suggestion, i) => (
                <motion.button
                  key={suggestion}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSendMessage(suggestion)}
                  className={cn(
                    "px-3 py-2 rounded-full text-xs font-medium",
                    "bg-muted/50 hover:bg-muted",
                    "border border-border/50 hover:border-primary/30",
                    "transition-all duration-200"
                  )}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05, ...springs.gentle }}
                >
                  <ChatMessage
                    message={message}
                    onPlayVoice={handlePlayVoice}
                    onPauseVoice={handlePauseVoice}
                    isVoicePlaying={playingVoiceId === message.id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <TypingIndicator />
              </motion.div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border/50 bg-card/50 backdrop-blur-sm">
        <ChatInput
          onSendMessage={onSendMessage}
          onStartVoiceRecording={onStartVoiceRecording}
          onStopVoiceRecording={onStopVoiceRecording}
          isProcessing={isProcessing}
          isRecording={isRecording}
          disabled={false}
        />
      </div>
    </motion.div>
  )
}
