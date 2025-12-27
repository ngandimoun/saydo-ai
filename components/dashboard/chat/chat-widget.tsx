"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X, Sparkles } from "lucide-react"
import { ChatPanel } from "./chat-panel"
import { ChatMessage as ChatMessageType } from "./chat-message"
import { cn } from "@/lib/utils"
import { springs } from "@/lib/motion-system"

/**
 * Chat Widget Component - Airbnb-Inspired
 * 
 * Floating chat widget with:
 * - Animated breathing effect when idle
 * - Glass-morphism styling
 * - Smooth expand/collapse transitions
 * - Context-aware positioning
 */

interface ChatWidgetProps {
  className?: string
  pageContext?: {
    page: 'home' | 'health' | 'pro' | 'calm'
    userId?: string
  }
}

export function ChatWidget({ className, pageContext }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)

  // Simulate a welcome message after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (messages.length === 0) {
        setHasUnread(true)
      }
    }, 5000)
    return () => clearTimeout(timer)
  }, [messages.length])

  const handleSendMessage = async (messageText: string) => {
    setHasUnread(false)
    
    // Add user message immediately
    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])

    // Add loading message
    const loadingMessage: ChatMessageType = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    }

    setMessages(prev => [...prev, loadingMessage])
    setIsProcessing(true)

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Mock response
    const mockResponse = generateMockResponse(messageText)

    // Remove loading message and add response
    setMessages(prev => {
      const withoutLoading = prev.filter(m => !m.isLoading)
      return [...withoutLoading, mockResponse]
    })

    setIsProcessing(false)
  }

  const handleStartVoiceRecording = () => {
    setIsRecording(true)
  }

  const handleStopVoiceRecording = async () => {
    setIsRecording(false)
  }

  const handleToggle = () => {
    setIsOpen(prev => !prev)
    setHasUnread(false)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleMinimize = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* Floating Button - Positioned above bottom nav with safe area */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            transition={springs.bouncy}
            onClick={handleToggle}
            className={cn(
              // Position: above bottom nav (64px) + some margin + safe area
              "fixed right-4 z-50",
              "bottom-[calc(5rem+env(safe-area-inset-bottom))]",
              "w-14 h-14 rounded-full",
              "bg-gradient-to-br from-primary to-teal-600",
              "text-white shadow-xl shadow-primary/40",
              "flex items-center justify-center",
              "touch-manipulation",
              // Glass ring effect on hover
              "before:absolute before:inset-0 before:rounded-full",
              "before:bg-gradient-to-b before:from-white/30 before:to-transparent",
              "before:opacity-0 hover:before:opacity-100 before:transition-opacity",
              className
            )}
            aria-label="Open chat with Saydo"
          >
            {/* Breathing animation */}
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/20"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.2, 0.5]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/10"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.3, 0.1, 0.3]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            />

            {/* Icon */}
            <motion.div
              className="relative z-10"
              animate={hasUnread ? { rotate: [0, 10, -10, 0] } : {}}
              transition={{ duration: 0.5, repeat: hasUnread ? Infinity : 0, repeatDelay: 2 }}
            >
              <MessageCircle size={24} />
            </motion.div>
            
            {/* Unread indicator */}
            <AnimatePresence>
              {hasUnread && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 border-2 border-card flex items-center justify-center"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <ChatPanel
            isOpen={isOpen}
            onClose={handleClose}
            onMinimize={handleMinimize}
            messages={messages}
            onSendMessage={handleSendMessage}
            onStartVoiceRecording={handleStartVoiceRecording}
            onStopVoiceRecording={handleStopVoiceRecording}
            isProcessing={isProcessing}
            isRecording={isRecording}
          />
        )}
      </AnimatePresence>
    </>
  )
}

/**
 * Generate mock response for UI demonstration
 */
function generateMockResponse(question: string): ChatMessageType {
  const lowerQuestion = question.toLowerCase()

  // Health-related responses
  if (lowerQuestion.includes('vitamin') || lowerQuestion.includes('supplement')) {
    return {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: "Just Vitamin D and Magnesium. Your labs say your B12 is already optimal, so don't waste money on that today. Take the D3 with your lunch - it needs fat to absorb.",
      timestamp: new Date(),
      hasVoiceResponse: true,
      voiceUrl: '/mock-voice-response.mp3'
    }
  }

  // Schedule-related responses
  if (lowerQuestion.includes('schedule') || lowerQuestion.includes('meeting') || lowerQuestion.includes('calendar')) {
    return {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: "You have 3 meetings today: 10am team standup, 2pm client call, and 4pm project review. I've blocked out 1-2pm for focused work based on your productivity patterns.",
      timestamp: new Date()
    }
  }

  // Health summary
  if (lowerQuestion.includes('health') || lowerQuestion.includes('summary')) {
    return {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: "Your health is looking great! Energy at 78%, stress is manageable at 35%, and recovery is optimal at 82%. Your iron levels have improved since last week. Keep up the leafy greens!",
      timestamp: new Date(),
      hasVoiceResponse: true,
      voiceUrl: '/mock-voice-response.mp3'
    }
  }

  // Running/exercise-related responses
  if (lowerQuestion.includes('run') || lowerQuestion.includes('exercise') || lowerQuestion.includes('workout')) {
    return {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: "Based on your recovery metrics and today's schedule, I'd recommend a light 30-minute run. Your stress levels are moderate, so it should help. Avoid high intensity - your body needs recovery time.",
      timestamp: new Date(),
      hasVoiceResponse: true,
      voiceUrl: '/mock-voice-response.mp3'
    }
  }

  // Default response
  return {
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content: "I understand your question. Once connected to the backend, I'll be able to provide detailed answers based on your personal data. For now, I'm in demo mode showing what's possible!",
    timestamp: new Date()
  }
}
