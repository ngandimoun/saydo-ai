"use client"

import { motion } from "framer-motion"
import { MessageCircle, User, Bot, Loader2, Play, Pause } from "lucide-react"
import { cn } from "@/lib/utils"
// TODO (Backend): Consider using date-fns or similar library for better date formatting
// import { formatDistanceToNow } from "date-fns"

/**
 * Format time ago helper
 * TODO (Backend): Replace with date-fns or similar library for better i18n support
 */
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

/**
 * Chat Message Component
 * 
 * Displays individual messages in the conversation:
 * - User messages (right-aligned, primary color)
 * - AI/System messages (left-aligned, muted background)
 * - Timestamp display
 * - Loading state for pending responses
 * - Voice playback button for voice responses
 * - Typing indicator animation
 * 
 * TODO (Backend Integration):
 * - Fetch message timestamps from database
 * - Store message read status
 * - Track message delivery status
 * 
 * TODO (AI Integration):
 * - Display markdown-formatted responses
 * - Show code blocks with syntax highlighting
 * - Render links and formatted text
 * - Display data visualizations (charts, tables)
 */

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isLoading?: boolean
  hasVoiceResponse?: boolean
  voiceUrl?: string
  error?: string
}

interface ChatMessageProps {
  message: ChatMessage
  onPlayVoice?: (messageId: string) => void
  onPauseVoice?: (messageId: string) => void
  isVoicePlaying?: boolean
}

export function ChatMessage({ 
  message, 
  onPlayVoice, 
  onPauseVoice,
  isVoicePlaying = false 
}: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  const isAssistant = message.role === 'assistant'

  // Format timestamp
  const timeAgo = formatTimeAgo(message.timestamp)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex gap-3 mb-4",
        isUser && "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser && "bg-primary text-primary-foreground",
        isAssistant && "bg-muted text-muted-foreground",
        isSystem && "bg-secondary text-secondary-foreground"
      )}>
        {isUser ? (
          <User size={16} />
        ) : isAssistant ? (
          <Bot size={16} />
        ) : (
          <MessageCircle size={16} />
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex flex-col gap-1 max-w-[80%]",
        isUser && "items-end"
      )}>
        {/* Message Bubble */}
        <div className={cn(
          "rounded-2xl px-4 py-2.5",
          "text-sm leading-relaxed",
          isUser && "bg-primary text-primary-foreground rounded-br-sm",
          isAssistant && "bg-muted text-foreground rounded-bl-sm",
          isSystem && "bg-secondary text-secondary-foreground rounded-bl-sm",
          message.error && "bg-destructive/10 text-destructive border border-destructive/20"
        )}>
          {message.isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-muted-foreground">Saydo is thinking...</span>
            </div>
          ) : message.error ? (
            <div className="space-y-1">
              <p className="font-medium">Error</p>
              <p>{message.error}</p>
              {/* TODO (Backend): Add retry button that calls API again */}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="whitespace-pre-wrap break-words">
                {message.content}
              </p>
              
              {/* Voice Response Controls */}
              {message.hasVoiceResponse && message.voiceUrl && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-current/20">
                  <button
                    onClick={() => {
                      if (isVoicePlaying) {
                        onPauseVoice?.(message.id)
                      } else {
                        onPlayVoice?.(message.id)
                      }
                    }}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1 rounded-lg",
                      "hover:bg-current/10 transition-colors",
                      "text-xs font-medium"
                    )}
                    aria-label={isVoicePlaying ? "Pause voice response" : "Play voice response"}
                  >
                    {isVoicePlaying ? (
                      <>
                        <Pause size={12} />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play size={12} />
                        <span>Listen</span>
                      </>
                    )}
                  </button>
                  {/* TODO (Backend): Add audio progress indicator */}
                  {/* TODO (Backend): Add audio duration display */}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        {!message.isLoading && (
          <span className={cn(
            "text-xs text-muted-foreground px-1",
            isUser && "text-right"
          )}>
            {timeAgo}
          </span>
        )}
      </div>
    </motion.div>
  )
}

/**
 * Typing Indicator Component
 * 
 * Shows animated dots when AI is typing/processing
 */
export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 mb-4"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
        <Bot size={16} />
      </div>
      <div className="flex items-center gap-1 px-4 py-2.5 bg-muted rounded-2xl rounded-bl-sm">
        <motion.div
          className="w-2 h-2 rounded-full bg-muted-foreground"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="w-2 h-2 rounded-full bg-muted-foreground"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="w-2 h-2 rounded-full bg-muted-foreground"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
        />
      </div>
    </motion.div>
  )
}

