"use client"

import { motion } from "framer-motion"
import { Mic, Clock, CheckCircle2, Loader2, ChevronRight, Sparkles } from "lucide-react"
import type { VoiceNote } from "@/lib/dashboard/types"
import { formatDuration } from "@/lib/dashboard/time-utils"
import { cn } from "@/lib/utils"
import Link from "next/link"

/**
 * Voice Feed
 * 
 * Shows recent voice notes on the home tab.
 * Each note displays:
 * - Recording timestamp
 * - Duration
 * - Processing status
 * - AI-extracted summary
 * - What was created (tasks, reminders, etc.)
 * 
 * TODO (Backend Integration):
 * - Fetch voice notes from Supabase with pagination
 * - Real-time updates when new notes are processed
 * - Link to full voice timeline
 */

interface VoiceFeedProps {
  voiceNotes: VoiceNote[]
}

export function VoiceFeed({ voiceNotes }: VoiceFeedProps) {
  if (voiceNotes.length === 0) return null

  const recentNotes = voiceNotes.slice(0, 3) // Show latest 3

  return (
    <section className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic size={16} className="text-primary" />
          <h2 className="font-semibold text-foreground">Recent Voice Notes</h2>
        </div>
        <Link 
          href="/dashboard/voice"
          className="text-xs text-primary flex items-center gap-1 hover:underline"
        >
          View all
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* Voice note cards */}
      <div className="space-y-3">
        {recentNotes.map((note, index) => (
          <VoiceNoteCard key={note.id} note={note} index={index} />
        ))}
      </div>
    </section>
  )
}

interface VoiceNoteCardProps {
  note: VoiceNote
  index: number
}

function VoiceNoteCard({ note, index }: VoiceNoteCardProps) {
  const isProcessing = note.status === 'processing' || note.status === 'uploading'
  const isCompleted = note.status === 'completed'

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const extractedCount = 
    note.extractedTasks.length + 
    note.extractedReminders.length + 
    note.extractedHealthNotes.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "p-4 rounded-2xl",
        "bg-card border border-border/50",
        "hover:border-border transition-colors"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Status indicator */}
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
          isProcessing ? "bg-amber-500/20" : "bg-primary/20"
        )}>
          {isProcessing ? (
            <Loader2 size={18} className="text-amber-500 animate-spin" />
          ) : (
            <Mic size={18} className="text-primary" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Clock size={12} />
            <span>{formatRelativeTime(note.createdAt)}</span>
            <span>•</span>
            <span>{formatDuration(note.durationSeconds)}</span>
            {isCompleted && (
              <>
                <span>•</span>
                <CheckCircle2 size={12} className="text-green-500" />
                <span className="text-green-500">Processed</span>
              </>
            )}
          </div>

          {/* AI Summary */}
          {note.aiSummary && (
            <p className="text-sm text-foreground leading-relaxed mb-2">
              {note.aiSummary}
            </p>
          )}

          {/* Processing state */}
          {isProcessing && (
            <p className="text-sm text-muted-foreground italic">
              Saydo is processing your voice note...
            </p>
          )}

          {/* Extracted items */}
          {isCompleted && extractedCount > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Sparkles size={12} className="text-primary" />
              <span className="text-xs text-muted-foreground">
                Created {note.extractedTasks.length > 0 && `${note.extractedTasks.length} task${note.extractedTasks.length > 1 ? 's' : ''}`}
                {note.extractedReminders.length > 0 && `, ${note.extractedReminders.length} reminder${note.extractedReminders.length > 1 ? 's' : ''}`}
                {note.extractedHealthNotes.length > 0 && `, ${note.extractedHealthNotes.length} health note${note.extractedHealthNotes.length > 1 ? 's' : ''}`}
              </span>
            </div>
          )}

          {/* Context chain indicator */}
          {note.previousNoteId && (
            <div className="mt-2 text-xs text-primary flex items-center gap-1">
              <span className="w-4 h-px bg-primary/50" />
              Linked to previous note
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

