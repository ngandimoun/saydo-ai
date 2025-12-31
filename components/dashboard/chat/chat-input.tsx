"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Mic, Square, Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Chat Input Component
 * 
 * Text input field with voice recording integration.
 * Features:
 * - Auto-resize textarea
 * - Keyboard shortcuts (Enter to send, Shift+Enter for new line)
 * - Voice recording button
 * - Disabled state during processing
 * - Visual feedback during recording
 * 
 * TODO (Backend Integration):
 * - Send text messages to API endpoint
 * - Handle API errors and retries
 * - Store message in database
 * - Track message delivery status
 * 
 * TODO (AI Integration):
 * - Real-time transcription display while recording
 * - Voice activity detection (auto-stop on silence)
 * - Send audio to transcription API
 * - Show transcription preview before sending
 */

interface ChatInputProps {
  onSendMessage: (message: string) => void
  onStartVoiceRecording?: () => void
  onStopVoiceRecording?: () => void
  isProcessing?: boolean
  isRecording?: boolean
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({
  onSendMessage,
  onStartVoiceRecording,
  onStopVoiceRecording,
  isProcessing = false,
  isRecording = false,
  disabled = false,
  placeholder = "Ask Saydo anything..."
}: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const handleSend = () => {
    const trimmedMessage = message.trim()
    if (trimmedMessage && !isProcessing && !disabled) {
      onSendMessage(trimmedMessage)
      setMessage("")
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleVoiceClick = () => {
    if (isRecording) {
      onStopVoiceRecording?.()
    } else {
      onStartVoiceRecording?.()
    }
  }

  const canSend = message.trim().length > 0 && !isProcessing && !disabled

  return (
    <div className={cn(
      "border-t border-border bg-background",
      "px-4 py-3 space-y-2"
    )}>
      {/* Recording Indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-3 py-2 bg-destructive/10 rounded-lg border border-destructive/20"
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-destructive"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-sm text-destructive font-medium">
              Recording... Tap to stop
            </span>
            {/* TODO (AI): Show real-time transcription preview here */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className={cn(
        "flex items-end gap-2",
        "bg-card border border-border rounded-2xl",
        "transition-all",
        isFocused && "ring-2 ring-primary ring-offset-2"
      )}>
        {/* Text Input */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled || isProcessing || isRecording}
          className={cn(
            "min-h-[44px] max-h-[120px] resize-none",
            "border-0 focus-visible:ring-0",
            "px-4 py-3",
            "text-sm"
          )}
          rows={1}
        />

        {/* Voice Button */}
        <button
          onClick={handleVoiceClick}
          disabled={disabled || isProcessing || !!message.trim()}
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
            "transition-colors touch-manipulation",
            isRecording
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
            (disabled || isProcessing) && "opacity-50 cursor-not-allowed",
            !!message.trim() && "opacity-50"
          )}
          aria-label={isRecording ? "Stop recording" : "Start voice recording"}
        >
          {isRecording ? (
            <Square size={18} />
          ) : (
            <Mic size={18} />
          )}
        </button>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90 transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "touch-manipulation"
          )}
          aria-label="Send message"
        >
          {isProcessing ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>

      {/* Helper Text */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>Press Enter to send, Shift+Enter for new line</span>
        {/* TODO (Backend): Show character count if needed */}
      </div>
    </div>
  )
}






