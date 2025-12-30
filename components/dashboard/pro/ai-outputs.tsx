"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Sparkles, FileText, Mail, FileSpreadsheet, StickyNote, 
  ChevronRight, Loader2, Check, Copy, Share2, MoreVertical,
  Trash2, RefreshCw, ExternalLink, X, CheckCircle2,
  MessageSquare, ClipboardList, Newspaper, Heart, Briefcase,
  ArrowRight
} from "lucide-react"
import type { AIDocument } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"
import { 
  useAIDocuments, 
  useAIDocumentsRealtime, 
  useArchiveAIDocument,
  useDeleteAIDocument 
} from "@/hooks/queries/use-pro-data"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

/**
 * AI Outputs Component - Mobile-First PWA Experience
 * 
 * Features:
 * - Touch-optimized cards with swipe gestures
 * - One-tap copy to clipboard
 * - Share to social platforms
 * - Full content modal (mobile-friendly)
 * - Realtime updates via subscription
 * - Generation type badges (proactive, suggestion)
 */

interface AIOutputsProps {
  documents?: AIDocument[]
  showHeader?: boolean
  maxItems?: number
  onViewAll?: () => void
}

// Document type to icon mapping
const DOCUMENT_ICONS: Record<string, typeof FileText> = {
  social_post: MessageSquare,
  email_draft: Mail,
  email: Mail,
  report: FileSpreadsheet,
  shift_report: ClipboardList,
  meeting_notes: StickyNote,
  summary: FileText,
  sermon_notes: Heart,
  proposal: Briefcase,
  memo: StickyNote,
  notes: StickyNote,
  post: MessageSquare,
  article: Newspaper,
}

// Document type to color mapping
const DOCUMENT_COLORS: Record<string, string> = {
  social_post: "text-blue-500 bg-blue-500/20",
  email_draft: "text-indigo-500 bg-indigo-500/20",
  email: "text-indigo-500 bg-indigo-500/20",
  report: "text-green-500 bg-green-500/20",
  shift_report: "text-emerald-500 bg-emerald-500/20",
  meeting_notes: "text-purple-500 bg-purple-500/20",
  summary: "text-teal-500 bg-teal-500/20",
  sermon_notes: "text-rose-500 bg-rose-500/20",
  proposal: "text-amber-500 bg-amber-500/20",
  memo: "text-cyan-500 bg-cyan-500/20",
  notes: "text-slate-500 bg-slate-500/20",
  post: "text-blue-500 bg-blue-500/20",
  article: "text-orange-500 bg-orange-500/20",
}

// Generation type badges
const GENERATION_BADGES: Record<string, { label: string; className: string }> = {
  proactive: { label: "AI Suggested", className: "bg-purple-500/20 text-purple-600" },
  suggestion: { label: "Suggestion", className: "bg-amber-500/20 text-amber-600" },
  explicit: { label: "Requested", className: "bg-blue-500/20 text-blue-600" },
}

export function AIOutputs({ 
  documents: propDocuments, 
  showHeader = true, 
  maxItems = 10,
  onViewAll 
}: AIOutputsProps) {
  // Fetch documents if not provided
  const { data: fetchedDocuments, isLoading } = useAIDocuments({
    limit: maxItems,
    status: 'ready',
  })
  
  // Setup realtime subscription
  useAIDocumentsRealtime()
  
  // Use prop documents or fetched documents
  const documents = propDocuments || fetchedDocuments || []
  
  // Modal state
  const [selectedDoc, setSelectedDoc] = useState<AIDocument | null>(null)
  const [copied, setCopied] = useState(false)
  
  // Mutations
  const archiveMutation = useArchiveAIDocument()
  const deleteMutation = useDeleteAIDocument()

  const getDocumentIcon = useCallback((type: string) => {
    const normalizedType = type.toLowerCase().replace(/\s+/g, '_')
    return DOCUMENT_ICONS[normalizedType] || FileText
  }, [])

  const getDocumentColor = useCallback((type: string) => {
    const normalizedType = type.toLowerCase().replace(/\s+/g, '_')
    return DOCUMENT_COLORS[normalizedType] || "text-orange-500 bg-orange-500/20"
  }, [])

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const formatTypeLabel = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
  }

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      toast.success("Copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy")
    }
  }

  const handleShare = async (doc: AIDocument) => {
    const shareData = {
      title: doc.title,
      text: doc.content,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      await handleCopy(doc.content)
    }
  }

  const handleArchive = async (docId: string) => {
    try {
      await archiveMutation.mutateAsync(docId)
      toast.success("Document archived")
      setSelectedDoc(null)
    } catch {
      toast.error("Failed to archive")
    }
  }

  const handleDelete = async (docId: string) => {
    try {
      await deleteMutation.mutateAsync(docId)
      toast.success("Document deleted")
      setSelectedDoc(null)
    } catch {
      toast.error("Failed to delete")
    }
  }

  if (isLoading && !propDocuments) {
    return (
      <section className="space-y-4">
        {showHeader && (
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <h2 className="font-semibold text-foreground">AI Generated</h2>
          </div>
        )}
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      </section>
    )
  }

  if (documents.length === 0) {
    return (
      <section className="space-y-4">
        {showHeader && (
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <h2 className="font-semibold text-foreground">AI Generated</h2>
          </div>
        )}
        <div className="p-6 rounded-2xl bg-card border border-border/50 text-center">
          <Sparkles size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No AI-generated content yet.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Record a voice note and I&apos;ll draft content for you.
          </p>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="space-y-4">
        {/* Section header */}
        {showHeader && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <h2 className="font-semibold text-foreground">AI Generated</h2>
              {documents.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({documents.length})
                </span>
              )}
            </div>
            {onViewAll && documents.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewAll}
                className="text-xs text-primary"
              >
                View All
                <ArrowRight size={14} className="ml-1" />
              </Button>
            )}
          </div>
        )}

        {/* Documents list - Mobile optimized */}
        <div className="space-y-3">
          {documents.map((doc, index) => {
            const DocIcon = getDocumentIcon(doc.documentType)
            const colorClass = getDocumentColor(doc.documentType)
            const isGenerating = doc.status === 'generating'
            const generationBadge = GENERATION_BADGES[doc.generationType]

            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "relative p-4 rounded-2xl",
                  "bg-card border border-border/50",
                  "hover:border-border transition-all duration-200",
                  "active:scale-[0.98]", // Touch feedback
                  isGenerating && "opacity-80"
                )}
              >
                {/* Main content - clickable */}
                <button
                  onClick={() => !isGenerating && setSelectedDoc(doc)}
                  className="w-full text-left"
                  disabled={isGenerating}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                      colorClass.split(' ')[1]
                    )}>
                      {isGenerating ? (
                        <Loader2 size={22} className="animate-spin text-primary" />
                      ) : (
                        <DocIcon size={22} className={colorClass.split(' ')[0]} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-8">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-sm">{doc.title}</h3>
                        {doc.status === 'ready' && (
                          <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {formatTypeLabel(doc.documentType)}
                        </span>
                        {generationBadge && doc.generationType !== 'explicit' && (
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            generationBadge.className
                          )}>
                            {generationBadge.label}
                          </span>
                        )}
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
                          Generating...
                        </p>
                      )}

                      {/* Tags */}
                      {doc.tags && doc.tags.length > 0 && !isGenerating && (
                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                          {doc.tags.slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground"
                            >
                              #{tag}
                            </span>
                          ))}
                          {doc.tags.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{doc.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                {/* Quick actions - positioned absolute */}
                {!isGenerating && (
                  <div className="absolute top-4 right-4 flex items-center gap-1">
                    {/* Copy button - always visible on mobile */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopy(doc.content)
                      }}
                      className="p-2 rounded-lg hover:bg-muted/50 active:bg-muted transition-colors"
                      aria-label="Copy content"
                    >
                      {copied ? (
                        <Check size={16} className="text-green-500" />
                      ) : (
                        <Copy size={16} className="text-muted-foreground" />
                      )}
                    </button>

                    {/* More options */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg hover:bg-muted/50 active:bg-muted transition-colors"
                          aria-label="More options"
                        >
                          <MoreVertical size={16} className="text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setSelectedDoc(doc)}>
                          <ExternalLink size={14} className="mr-2" />
                          View Full
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare(doc)}>
                          <Share2 size={14} className="mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopy(doc.content)}>
                          <Copy size={14} className="mr-2" />
                          Copy
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleArchive(doc.id)}
                          className="text-amber-600"
                        >
                          <RefreshCw size={14} className="mr-2" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(doc.id)}
                          className="text-red-600"
                        >
                          <Trash2 size={14} className="mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}

                {/* Arrow indicator */}
                {!isGenerating && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 hidden md:block">
                    <ChevronRight size={18} className="text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Document Modal - Mobile-First Bottom Sheet Style */}
      <AnimatePresence>
        {selectedDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedDoc(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "fixed bottom-0 left-0 right-0 max-h-[90vh]",
                "bg-background rounded-t-3xl",
                "overflow-hidden flex flex-col",
                "md:left-1/2 md:-translate-x-1/2 md:max-w-2xl md:rounded-2xl md:bottom-auto md:top-1/2 md:-translate-y-1/2"
              )}
            >
              {/* Handle bar (mobile) */}
              <div className="flex justify-center py-3 md:hidden">
                <div className="w-12 h-1.5 rounded-full bg-muted" />
              </div>

              {/* Header */}
              <div className="flex items-start justify-between px-6 pb-4 border-b border-border">
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-lg">{selectedDoc.title}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {formatTypeLabel(selectedDoc.documentType)}
                    </span>
                    {selectedDoc.language && (
                      <span className="text-xs text-muted-foreground">
                        {selectedDoc.language.toUpperCase()}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(selectedDoc.generatedAt)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {selectedDoc.content}
                  </pre>
                </div>

                {/* Tags */}
                {selectedDoc.tags && selectedDoc.tags.length > 0 && (
                  <div className="flex items-center gap-2 mt-6 flex-wrap">
                    {selectedDoc.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons - sticky at bottom */}
              <div className="p-4 border-t border-border bg-background flex items-center gap-3">
                <Button
                  onClick={() => handleCopy(selectedDoc.content)}
                  variant="outline"
                  className="flex-1"
                >
                  <Copy size={16} className="mr-2" />
                  Copy
                </Button>
                <Button
                  onClick={() => handleShare(selectedDoc)}
                  className="flex-1"
                >
                  <Share2 size={16} className="mr-2" />
                  Share
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
