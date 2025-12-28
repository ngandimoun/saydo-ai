"use client"

import { motion } from "framer-motion"
import { Sparkles, FileText, Mail, FileSpreadsheet, StickyNote, ChevronRight, Loader2, Check } from "lucide-react"
import type { AIDocument } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * AI Outputs Component
 * 
 * Displays AI-generated documents and content.
 * Shows generation status and preview.
 * 
 * TODO (Backend Integration):
 * - Fetch generated documents from database
 * - Open document preview modal
 * - Download/export functionality
 * - Regenerate option
 */

interface AIOutputsProps {
  documents: AIDocument[]
}

export function AIOutputs({ documents }: AIOutputsProps) {
  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'email_draft': return Mail
      case 'report': return FileSpreadsheet
      case 'meeting_notes': return StickyNote
      default: return FileText
    }
  }

  const getDocumentColor = (type: string) => {
    switch (type) {
      case 'email_draft': return 'text-blue-500 bg-blue-500/20'
      case 'report': return 'text-green-500 bg-green-500/20'
      case 'meeting_notes': return 'text-purple-500 bg-purple-500/20'
      case 'summary': return 'text-teal-500 bg-teal-500/20'
      default: return 'text-orange-500 bg-orange-500/20'
    }
  }

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return 'Yesterday'
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'email_draft': return 'Email Draft'
      case 'meeting_notes': return 'Meeting Notes'
      case 'pitch_deck': return 'Pitch Deck'
      default: return type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
    }
  }

  return (
    <section className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-primary" />
        <h2 className="font-semibold text-foreground">AI Generated</h2>
      </div>

      {/* Documents list */}
      <div className="space-y-3">
        {documents.map((doc, index) => {
          const DocIcon = getDocumentIcon(doc.documentType)
          const colorClass = getDocumentColor(doc.documentType)
          const isGenerating = doc.status === 'generating'

          return (
            <motion.button
              key={doc.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "w-full p-4 rounded-2xl text-left",
                "bg-card border border-border/50",
                "hover:border-border transition-colors",
                isGenerating && "opacity-80"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  colorClass.split(' ')[1]
                )}>
                  {isGenerating ? (
                    <Loader2 size={20} className="animate-spin text-primary" />
                  ) : (
                    <DocIcon size={20} className={colorClass.split(' ')[0]} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm truncate">{doc.title}</h3>
                    {doc.status === 'ready' && (
                      <Check size={14} className="text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {getTypeLabel(doc.documentType)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(doc.generatedAt)}
                    </span>
                  </div>

                  {doc.previewText && !isGenerating && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {doc.previewText}
                    </p>
                  )}

                  {isGenerating && (
                    <p className="text-xs text-primary mt-2 italic">
                      Generating document...
                    </p>
                  )}
                </div>

                {/* Arrow */}
                {!isGenerating && (
                  <ChevronRight size={18} className="text-muted-foreground flex-shrink-0" />
                )}
              </div>
            </motion.button>
          )
        })}
      </div>
    </section>
  )
}



