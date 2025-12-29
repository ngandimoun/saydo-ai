"use client"

import { motion } from "framer-motion"
import { Mic, Clock, CheckCircle2, Loader2, ChevronRight, Sparkles, Link2 } from "lucide-react"
import type { VoiceNote } from "@/lib/dashboard/types"
import { formatDuration } from "@/lib/dashboard/time-utils"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { springs, staggerContainer, staggerItem, fadeInUp } from "@/lib/motion-system"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"

/**
 * Voice Feed - Airbnb-Inspired
 * 
 * Shows recent voice notes with scroll-triggered reveals.
 * Features:
 * - Clean card design with status indicators
 * - AI-extracted summary display
 * - Connection indicators between related notes
 * - Staggered animations
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
  const recentNotes = voiceNotes.slice(0, 3) // Show latest 3

  return (
    <motion.section 
      className="space-y-4"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Section header */}
      <motion.div 
        variants={staggerItem}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Mic size={14} className="text-primary" />
          </div>
          <h2 className="font-display font-semibold text-foreground">Voice Notes</h2>
          <span className="text-xs text-muted-foreground">
            ({voiceNotes.length})
          </span>
        </div>
        <Link 
          href="/dashboard/voice"
          className="text-xs text-primary font-medium flex items-center gap-1 hover:underline group"
        >
          View timeline
          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </motion.div>

      {/* Voice note cards or empty state */}
      {recentNotes.length === 0 ? (
        <motion.div variants={staggerItem}>
          <div className="p-6 rounded-2xl bg-card border border-border/50 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Mic size={20} className="text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No voice notes yet</p>
            <p className="text-xs text-muted-foreground">
              Tap the mic to record your first thought
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {recentNotes.map((note, index) => (
            <VoiceNoteCard key={note.id} note={note} index={index} />
          ))}
        </div>
      )}
    </motion.section>
  )
}

interface VoiceNoteCardProps {
  note: VoiceNote
  index: number
}

function VoiceNoteCard({ note, index }: VoiceNoteCardProps) {
  const router = useRouter()
  const isProcessing = note.status === 'processing' || note.status === 'uploading'
  const isCompleted = note.status === 'completed'

  const handleClick = () => {
    // Navigate to voice timeline with this note highlighted
    router.push(`/dashboard/voice?id=${note.id}`)
  }

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
    (note.extractedTasks?.length ?? 0) + 
    (note.extractedReminders?.length ?? 0) + 
    (note.extractedHealthNotes?.length ?? 0)

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      transition={springs.snappy}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      className={cn(
        "p-4 rounded-2xl cursor-pointer",
        "bg-card border border-border/50",
        "hover:border-border hover:shadow-sm",
        "transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary/50"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Status indicator */}
        <motion.div 
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
            isProcessing ? "bg-amber-500/10" : "bg-primary/10"
          )}
          animate={isProcessing ? { rotate: [0, 360] } : {}}
          transition={isProcessing ? { duration: 2, repeat: Infinity, ease: "linear" } : {}}
        >
          {isProcessing ? (
            <Loader2 size={20} className="text-amber-500" />
          ) : (
            <Mic size={20} className="text-primary" />
          )}
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground mb-1.5">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {formatRelativeTime(note.createdAt)}
            </span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            <span>{formatDuration(note.durationSeconds)}</span>
            {isCompleted && (
              <>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                <span className="flex items-center gap-1 text-emerald-500">
                  <CheckCircle2 size={11} />
                  Processed
                </span>
              </>
            )}
          </div>

          {/* AI Summary */}
          {note.aiSummary && (
            <div className="mb-2">
              <MarkdownRenderer 
                content={note.aiSummary}
                className="text-foreground text-sm"
              />
            </div>
          )}

          {/* Processing state */}
          {isProcessing && (
            <div className="flex items-center gap-2">
              <motion.div
                className="flex gap-1"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-amber-500"
                    animate={{ y: [0, -3, 0] }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      delay: i * 0.15
                    }}
                  />
                ))}
              </motion.div>
              <span className="text-sm text-muted-foreground italic">
                Processing your thoughts...
              </span>
            </div>
          )}

          {/* Extracted items */}
          {isCompleted && extractedCount > 0 && (
            <motion.div 
              className="flex items-center gap-2 mt-2"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/5 border border-primary/10">
                <Sparkles size={11} className="text-primary" />
                <span className="text-xs font-medium text-primary">
                  {(note.extractedTasks?.length ?? 0) > 0 && `${note.extractedTasks?.length ?? 0} task${(note.extractedTasks?.length ?? 0) > 1 ? 's' : ''}`}
                  {(note.extractedTasks?.length ?? 0) > 0 && (note.extractedReminders?.length ?? 0) > 0 && ' · '}
                  {(note.extractedReminders?.length ?? 0) > 0 && `${note.extractedReminders?.length ?? 0} reminder${(note.extractedReminders?.length ?? 0) > 1 ? 's' : ''}`}
                </span>
              </div>
            </motion.div>
          )}

          {/* Context chain indicator */}
          {note.previousNoteId && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link2 size={11} />
              <span>Linked to previous note</span>
            </div>
          )}
        </div>

        {/* Chevron */}
        <ChevronRight size={16} className="text-muted-foreground/50 mt-3" />
      </div>
    </motion.div>
  )
}
