"use client"

import { useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useChat } from "./chat-provider"
import { ChatMessage } from "./chat-message"
import { ChatInput } from "./chat-input"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Chat Modal Component
 * 
 * Full-screen on mobile, modal on desktop.
 * Displays conversation history and input for new messages.
 */
export function ChatModal() {
  const { isOpen, setIsOpen, messages, isLoading, sendMessage } = useChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  // Scroll to bottom on mount
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
      }, 100)
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className={cn(
          "p-0 gap-0 max-w-full w-full h-full sm:h-[80vh] sm:max-w-2xl sm:rounded-lg",
          "flex flex-col",
          "bg-background"
        )}
        showCloseButton={true}
      >
        {/* Header */}
        <div className="border-b bg-background px-4 py-3 sm:px-6">
          <DialogTitle>Chat with Saydo</DialogTitle>
          <DialogDescription>
            Your AI assistant is here to help
          </DialogDescription>
        </div>

        {/* Messages container */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Start a conversation</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Ask me anything! I can help with tasks, health questions, work documents, and more.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex gap-3 px-4 py-3 bg-muted/30">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">
                      Saydo
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Thinking...
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </DialogContent>
    </Dialog>
  )
}

