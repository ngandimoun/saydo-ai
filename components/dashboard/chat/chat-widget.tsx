"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle } from "lucide-react"
import { ChatPanel } from "./chat-panel"
import { ChatMessage as ChatMessageType } from "./chat-message"
import { cn } from "@/lib/utils"
import { springs } from "@/lib/motion-system"

/**
 * Chat Widget Component - Airbnb-Inspired
 * 
 * Floating chat widget with:
 * - Real AI responses via streaming API
 * - Responses in user's preferred language
 * - Animated breathing effect when idle
 * - Glass-morphism styling
 * - Smooth expand/collapse transitions
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

  /**
   * Send message to the AI chat API with streaming support
   */
  const handleSendMessage = useCallback(async (messageText: string) => {
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
    const loadingId = `loading-${Date.now()}`
    const loadingMessage: ChatMessageType = {
      id: loadingId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    }

    setMessages(prev => [...prev, loadingMessage])
    setIsProcessing(true)

    try {
      // Call the streaming chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      // Create assistant message for streaming
      const assistantId = `assistant-${Date.now()}`
      let fullContent = ''

      // Remove loading message and add streaming message
      setMessages(prev => {
        const withoutLoading = prev.filter(m => m.id !== loadingId)
        return [...withoutLoading, {
          id: assistantId,
          role: 'assistant' as const,
          content: '',
          timestamp: new Date(),
          isStreaming: true,
        }]
      })

      // Read the stream
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'text') {
                fullContent += data.content
                
                // Update the message with new content
                setMessages(prev => prev.map(m => 
                  m.id === assistantId 
                    ? { ...m, content: fullContent }
                    : m
                ))
              } else if (data.type === 'done') {
                // Mark streaming as complete
                setMessages(prev => prev.map(m => 
                  m.id === assistantId 
                    ? { ...m, isStreaming: false }
                    : m
                ))
              } else if (data.type === 'error') {
                throw new Error(data.error)
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

    } catch (error) {
      console.error('Chat error:', error)
      
      // Remove loading message and add error response
      setMessages(prev => {
        const withoutLoading = prev.filter(m => m.id !== loadingId)
        return [...withoutLoading, {
          id: `error-${Date.now()}`,
          role: 'assistant' as const,
          content: error instanceof Error 
            ? `Sorry, I encountered an error: ${error.message}. Please try again.`
            : 'Sorry, something went wrong. Please try again.',
          timestamp: new Date(),
          isError: true,
        }]
      })
    } finally {
      setIsProcessing(false)
    }
  }, [])

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
