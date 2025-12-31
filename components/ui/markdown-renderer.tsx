"use client"

import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"

interface MarkdownRendererProps {
  content: string
  className?: string
  contentType?: 'tweet' | 'post' | 'email' | 'report' | 'general'
}

/**
 * Styled Markdown Renderer Component
 * 
 * Renders markdown content with beautiful, consistent styling.
 * Supports headers, bold text, lists, horizontal rules, and other markdown elements.
 * Content-type aware styling for different document types.
 */
export function MarkdownRenderer({ content, className, contentType = 'general' }: MarkdownRendererProps) {
  const isSocialPost = contentType === 'tweet' || contentType === 'post'
  const isReport = contentType === 'report'
  const isEmail = contentType === 'email'

  return (
    <div className={cn(
      "prose prose-sm max-w-none",
      isSocialPost && "prose-compact",
      isReport && "prose-lg",
      className
    )}>
      <ReactMarkdown
        components={{
          // Headers
          h1: ({ children }) => (
            <h1 className={cn(
              "font-semibold text-foreground mb-3 mt-4 first:mt-0",
              isSocialPost ? "text-base" : isReport ? "text-2xl" : "text-xl"
            )}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className={cn(
              "font-semibold text-foreground mb-2 mt-3 first:mt-0",
              isSocialPost ? "text-sm" : isReport ? "text-xl" : "text-lg"
            )}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className={cn(
              "font-semibold text-foreground mb-2 mt-3 first:mt-0 text-primary",
              isSocialPost ? "text-xs" : isReport ? "text-lg" : "text-base"
            )}>
              {children}
            </h3>
          ),
          // Paragraphs
          p: ({ children }) => {
            return (
              <p className={cn(
                "text-foreground/90 leading-relaxed mb-2 last:mb-0",
                isSocialPost ? "text-sm" : isReport ? "text-base" : "text-sm"
              )}>
                {children}
              </p>
            )
          },
          // Bold text
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          // Italic text
          em: ({ children }) => (
            <em className="italic text-foreground/90">
              {children}
            </em>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className={cn(
              "list-disc list-outside space-y-1.5 mb-3 ml-4",
              isSocialPost && "space-y-1 mb-2"
            )}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className={cn(
              "list-decimal list-outside space-y-1.5 mb-3 ml-4",
              isSocialPost && "space-y-1 mb-2"
            )}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className={cn(
              "text-foreground/90 leading-relaxed pl-1",
              isSocialPost ? "text-xs" : "text-sm"
            )}>
              {children}
            </li>
          ),
          // Horizontal Rule (---)
          hr: () => (
            <hr className={cn(
              "my-4 border-0 border-t border-border/30",
              isSocialPost && "my-3",
              isReport && "my-6"
            )} />
          ),
          // Code
          code: ({ children, className }) => {
            const isInline = !className
            return isInline ? (
              <code className="px-1 py-0.5 rounded bg-muted text-foreground text-xs font-mono">
                {children}
              </code>
            ) : (
              <code className={className}>{children}</code>
            )
          },
          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className={cn(
              "border-l-2 border-primary/30 pl-3 italic text-foreground/80 my-3",
              isSocialPost && "my-2 text-xs",
              isReport && "my-4"
            )}>
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

