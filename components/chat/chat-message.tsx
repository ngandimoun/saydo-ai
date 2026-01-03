"use client"

import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import { Bot, User } from "lucide-react"
import Image from "next/image"
import { ChatMessage as ChatMessageType } from "./chat-provider"
import { useState } from "react"

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const imageUrls = message.image_urls || []

  return (
    <>
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
        <div className="flex-1 space-y-2 overflow-hidden">
          <div className="text-sm font-medium text-muted-foreground">
            {isUser ? "You" : "Saydo"}
          </div>
          
          {/* Images */}
          {imageUrls.length > 0 && (
            <div className={cn(
              "flex gap-2 flex-wrap",
              imageUrls.length === 1 ? "max-w-md" : ""
            )}>
              {imageUrls.map((url, index) => (
                <div
                  key={index}
                  className="relative rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setExpandedImage(url)}
                >
                  <Image
                    src={url}
                    alt={`Image ${index + 1}`}
                    width={200}
                    height={200}
                    className="object-cover"
                    style={{
                      width: imageUrls.length === 1 ? "100%" : "150px",
                      height: imageUrls.length === 1 ? "auto" : "150px",
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Text content */}
          {message.content && (
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
          )}
        </div>
      </div>

      {/* Expanded image modal */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <Image
              src={expandedImage}
              alt="Expanded image"
              width={1200}
              height={1200}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}

