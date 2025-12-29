"use client"

import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"

interface MarkdownRendererProps {
  content: string
  className?: string
}

/**
 * Styled Markdown Renderer Component
 * 
 * Renders markdown content with beautiful, consistent styling.
 * Supports headers, bold text, lists, and other markdown elements.
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-sm max-w-none", className)}>
      <ReactMarkdown
        components={{
          // Headers
          h1: ({ children }) => (
            <h1 className="text-xl font-semibold text-foreground mb-3 mt-4 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-foreground mb-2 mt-3 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-foreground mb-2 mt-3 first:mt-0 text-primary">
              {children}
            </h3>
          ),
          // Paragraphs
          p: ({ children }) => (
            <p className="text-sm text-foreground/90 leading-relaxed mb-2 last:mb-0">
              {children}
            </p>
          ),
          // Bold text
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-outside space-y-1.5 mb-2 ml-4">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside space-y-1.5 mb-2 ml-4">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-sm text-foreground/90 leading-relaxed pl-1">
              {children}
            </li>
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
            <blockquote className="border-l-2 border-primary/30 pl-3 italic text-foreground/80 my-2">
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

