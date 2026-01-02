"use client"

import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import { Bot, User } from "lucide-react"
import { ChatMessage as ChatMessageType } from "./chat-provider"

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3",
        isUser ? "bg-background" : "bg-muted/30"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isUser ? (
          <User size={16} />
        ) : (
          <Bot size={16} />
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 space-y-1 overflow-hidden">
        <div className="text-sm font-medium text-muted-foreground">
          {isUser ? "You" : "Saydo"}
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none break-words text-sm">
          {isUser ? (
            <p className="whitespace-pre-wrap text-foreground">{message.content}</p>
          ) : (
            <ReactMarkdown
              className="text-foreground [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-2 [&>ul]:ml-4 [&>ul]:list-disc [&>ol]:mb-2 [&>ol]:ml-4 [&>ol]:list-decimal [&>code]:rounded [&>code]:bg-muted [&>code]:px-1 [&>code]:py-0.5 [&>code]:text-xs [&>pre]:mb-2 [&>pre]:overflow-x-auto [&>pre]:rounded [&>pre]:bg-muted [&>pre]:p-3 [&>pre>code]:bg-transparent [&>pre>code]:p-0"
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  )
}

