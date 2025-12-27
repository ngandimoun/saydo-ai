"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Mic, Clock, CheckCircle2, Loader2, Link2, ChevronLeft, Play } from "lucide-react"
import { getMockVoiceNotes } from "@/lib/dashboard/mock-data"
import type { VoiceNote } from "@/lib/dashboard/types"
import { formatDuration } from "@/lib/dashboard/time-utils"
import { cn } from "@/lib/utils"
import Link from "next/link"

/**
 * Voice Timeline Page
 * 
 * Full-screen view of all voice recordings.
 * Shows:
 * - Chronological timeline of recordings
 * - Context connections between related notes
 * - Processing status
 * - What was extracted from each note
 * 
 * TODO (Backend Integration):
 * - Fetch all voice notes with pagination
 * - Real-time status updates
 * - Playback functionality
 */

export default function VoicePage() {
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      setVoiceNotes(getMockVoiceNotes())
      setIsLoading(false)
    }
    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays === 1) return 'Yesterday'
    return `${diffDays} days ago`
  }

  // Group notes by context chain
  const groupedNotes = voiceNotes.reduce((acc, note) => {
    const chainId = note.contextChainId || note.id
    if (!acc[chainId]) acc[chainId] = []
    acc[chainId].push(note)
    return acc
  }, {} as Record<string, VoiceNote[]>)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 pt-6 pb-8 space-y-6 max-w-lg mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link 
          href="/dashboard/home"
          className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors touch-manipulation"
        >
          <ChevronLeft size={22} />
        </Link>
        <div className="flex items-center gap-2">
          <Mic size={20} className="text-primary" />
          <h1 className="text-2xl font-semibold">Voice Timeline</h1>
        </div>
      </div>

      {/* Info text */}
      <p className="text-sm text-muted-foreground">
        Your voice notes are automatically connected. Related notes are grouped together.
      </p>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.entries(groupedNotes).map(([chainId, notes]) => (
          <div key={chainId} className="space-y-3">
            {/* Chain indicator */}
            {notes.length > 1 && (
              <div className="flex items-center gap-2 text-xs text-primary">
                <Link2 size={12} />
                <span>Connected conversation ({notes.length} notes)</span>
              </div>
            )}

            {notes.map((note, index) => {
              const isProcessing = note.status === 'processing' || note.status === 'uploading'
              const isCompleted = note.status === 'completed'
              const extractedCount = 
                note.extractedTasks.length + 
                note.extractedReminders.length + 
                note.extractedHealthNotes.length

              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "relative p-4 rounded-2xl",
                    "bg-card border border-border/50",
                    notes.length > 1 && index > 0 && "ml-6"
                  )}
                >
                  {/* Connection line */}
                  {notes.length > 1 && index > 0 && (
                    <div className="absolute -left-3 top-6 w-3 h-px bg-primary/50" />
                  )}

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
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock size={12} />
                          <span>{formatRelativeTime(note.createdAt)}</span>
                          <span>•</span>
                          <span>{formatDuration(note.durationSeconds)}</span>
                        </div>
                        {isCompleted && (
                          <CheckCircle2 size={14} className="text-green-500" />
                        )}
                      </div>

                      {/* AI Summary */}
                      {note.aiSummary && (
                        <p className="text-sm text-foreground mt-2 leading-relaxed">
                          {note.aiSummary}
                        </p>
                      )}

                      {/* Processing state */}
                      {isProcessing && (
                        <p className="text-sm text-muted-foreground italic mt-2">
                          Processing your voice note...
                        </p>
                      )}

                      {/* Transcription preview */}
                      {note.transcription && (
                        <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">
                          "{note.transcription}"
                        </p>
                      )}

                      {/* Extracted items */}
                      {isCompleted && extractedCount > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {note.extractedTasks.length > 0 && (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                              {note.extractedTasks.length} task{note.extractedTasks.length > 1 ? 's' : ''}
                            </span>
                          )}
                          {note.extractedReminders.length > 0 && (
                            <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">
                              {note.extractedReminders.length} reminder{note.extractedReminders.length > 1 ? 's' : ''}
                            </span>
                          )}
                          {note.extractedHealthNotes.length > 0 && (
                            <span className="text-xs px-2 py-1 rounded-full bg-rose-500/20 text-rose-400">
                              {note.extractedHealthNotes.length} health note{note.extractedHealthNotes.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Play button */}
                      {note.audioUrl && (
                        <button
                          className={cn(
                            "flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full",
                            "bg-muted text-sm text-muted-foreground",
                            "hover:text-foreground transition-colors touch-manipulation"
                          )}
                        >
                          <Play size={12} />
                          Play recording
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

