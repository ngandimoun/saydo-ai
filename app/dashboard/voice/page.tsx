"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Mic, Clock, CheckCircle2, Loader2, Link2, ChevronLeft, Play, Pause, FileAudio, Check } from "lucide-react"
import type { VoiceNote } from "@/lib/dashboard/types"
import { formatDuration } from "@/lib/dashboard/time-utils"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { logger } from "@/lib/logger"
import { useVoiceTimeline } from "@/hooks/queries"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"

/**
 * Voice Timeline Page
 * 
 * Full-screen view of all voice recordings.
 * Shows:
 * - Chronological timeline of recordings
 * - Context connections between related notes
 * - Processing status
 * - What was extracted from each note
 */

export default function VoicePage() {
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({})
  const [savingStatus, setSavingStatus] = useState<Record<string, { type: 'transcription' | 'aiSummary', status: 'saving' | 'saved' | 'error', errorMessage?: string }>>({})
  const originalValuesRef = useRef<Record<string, { transcription?: string, aiSummary?: string }>>({})

  // Use query hook for cached voice timeline
  const { data: voiceNotes = [], isLoading, error: queryError } = useVoiceTimeline({ limit: 50 })
  const error = queryError ? "Failed to load voice recordings" : null

  // Store original values for comparison when data loads
  useEffect(() => {
    voiceNotes.forEach(note => {
      originalValuesRef.current[note.id] = {
        transcription: note.transcription || '',
        aiSummary: note.aiSummary || '',
      }
    })
  }, [voiceNotes])

  // Cleanup audio elements on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause()
        audio.src = ''
      })
      audioRefs.current = {}
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Mic size={28} className="text-muted-foreground" />
        </div>
        <p className="text-foreground mb-2">{error}</p>
        <p className="text-sm text-muted-foreground">Try refreshing the page</p>
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

  // Save function for transcription and AI summary
  const saveField = async (recordingId: string, type: 'transcription' | 'aiSummary', value: string) => {
    const statusKey = `${recordingId}-${type}`
    const fieldName = type === 'transcription' ? 'transcription' : 'aiSummary'
    
    // Get original value for comparison
    const originalValue = originalValuesRef.current[recordingId]?.[fieldName] || ''
    const trimmedValue = value.trim()
    
    // Don't save if value hasn't actually changed
    if (trimmedValue === originalValue) {
      logger.debug('Value unchanged, skipping save', { recordingId, type, value: trimmedValue })
      return
    }
    
    logger.info('Saving field', { recordingId, type, valueLength: trimmedValue.length })
    
    // Set saving status
    setSavingStatus(prev => ({
      ...prev,
      [statusKey]: { type, status: 'saving' }
    }))

    try {
      const requestBody = {
        recordingId,
        [fieldName]: trimmedValue,
      }
      
      logger.debug('Sending save request', { recordingId, type, body: requestBody })
      
      const response = await fetch('/api/voice/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure cookies are sent
        body: JSON.stringify(requestBody),
      })

      logger.debug('Save response received', { 
        recordingId, 
        type, 
        status: response.status, 
        ok: response.ok 
      })

      if (!response.ok) {
        let errorMessage = 'Failed to save'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.details || errorMessage
          logger.error('Save API error response', { 
            recordingId, 
            type, 
            status: response.status,
            error: errorData 
          })
        } catch (parseError) {
          const text = await response.text()
          logger.error('Failed to parse error response', { 
            recordingId, 
            type, 
            status: response.status,
            responseText: text 
          })
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      logger.info('Save successful', { recordingId, type, result })

      // Update original value reference
      if (originalValuesRef.current[recordingId]) {
        originalValuesRef.current[recordingId][fieldName] = trimmedValue
      } else {
        originalValuesRef.current[recordingId] = {
          [fieldName]: trimmedValue,
        }
      }

      // Update local state
      setVoiceNotes(prev => prev.map(note => 
        note.id === recordingId 
          ? { ...note, [fieldName]: trimmedValue }
          : note
      ))

      // Set saved status
      setSavingStatus(prev => ({
        ...prev,
        [statusKey]: { type, status: 'saved' }
      }))

      // Clear saved status after 2 seconds
      setTimeout(() => {
        setSavingStatus(prev => {
          const newStatus = { ...prev }
          delete newStatus[statusKey]
          return newStatus
        })
      }, 2000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      logger.error('Failed to save field', { 
        error: err, 
        recordingId, 
        type, 
        errorMessage,
        stack: err instanceof Error ? err.stack : undefined
      })
      
      setSavingStatus(prev => ({
        ...prev,
        [statusKey]: { 
          type, 
          status: 'error',
          errorMessage: errorMessage.length > 50 ? errorMessage.substring(0, 50) + '...' : errorMessage
        }
      }))

      // Clear error status after 5 seconds (longer so user can see it)
      setTimeout(() => {
        setSavingStatus(prev => {
          const newStatus = { ...prev }
          delete newStatus[statusKey]
          return newStatus
        })
      }, 5000)
    }
  }

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
        {voiceNotes.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <FileAudio size={28} className="text-muted-foreground" />
            </div>
            <p className="text-foreground mb-2">No voice notes yet</p>
            <p className="text-sm text-muted-foreground">
              Tap the microphone button to record your first voice note
            </p>
          </motion.div>
        ) : null}
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

                      {/* Processing state */}
                      {isProcessing && (
                        <p className="text-sm text-muted-foreground italic mt-2">
                          Processing your voice note...
                        </p>
                      )}

                      {/* Smart Transcription */}
                      {isCompleted && (() => {
                        const statusKey = `${note.id}-transcription`
                        const status = savingStatus[statusKey]
                        return (
                          <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Transcription</p>
                              {status && (
                                <div className="flex flex-col items-end gap-1">
                                  <div className="flex items-center gap-1">
                                    {status.status === 'saving' && (
                                      <>
                                        <Loader2 size={12} className="text-muted-foreground animate-spin" />
                                        <span className="text-xs text-muted-foreground">Saving...</span>
                                      </>
                                    )}
                                    {status.status === 'saved' && (
                                      <>
                                        <Check size={12} className="text-green-500" />
                                        <span className="text-xs text-green-500">Saved</span>
                                      </>
                                    )}
                                    {status.status === 'error' && (
                                      <>
                                        <span className="text-xs text-red-500">Error</span>
                                      </>
                                    )}
                                  </div>
                                  {status.status === 'error' && status.errorMessage && (
                                    <span className="text-xs text-red-500 max-w-[200px] text-right" title={status.errorMessage}>
                                      {status.errorMessage}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="max-h-[200px] overflow-y-auto">
                              <textarea
                                value={note.transcription || ''}
                                onChange={(e) => {
                                  setVoiceNotes(prev => prev.map(n => 
                                    n.id === note.id ? { ...n, transcription: e.target.value } : n
                                  ))
                                }}
                                onBlur={(e) => {
                                  const newValue = e.target.value
                                  saveField(note.id, 'transcription', newValue)
                                }}
                                className="w-full text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-transparent border-none outline-none resize-none focus:ring-0 p-0 min-h-[60px]"
                                rows={Math.max(3, (note.transcription || '').split('\n').length)}
                              />
                            </div>
                          </div>
                        )
                      })()}

                      {/* AI Summary */}
                      {isCompleted && (() => {
                        const statusKey = `${note.id}-aiSummary`
                        const status = savingStatus[statusKey]
                        return (
                          <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs text-primary font-semibold uppercase tracking-wide">AI Summary</p>
                              {status && (
                                <div className="flex flex-col items-end gap-1">
                                  <div className="flex items-center gap-1">
                                    {status.status === 'saving' && (
                                      <>
                                        <Loader2 size={12} className="text-primary animate-spin" />
                                        <span className="text-xs text-primary">Saving...</span>
                                      </>
                                    )}
                                    {status.status === 'saved' && (
                                      <>
                                        <Check size={12} className="text-green-500" />
                                        <span className="text-xs text-green-500">Saved</span>
                                      </>
                                    )}
                                    {status.status === 'error' && (
                                      <>
                                        <span className="text-xs text-red-500">Error</span>
                                      </>
                                    )}
                                  </div>
                                  {status.status === 'error' && status.errorMessage && (
                                    <span className="text-xs text-red-500 max-w-[200px] text-right" title={status.errorMessage}>
                                      {status.errorMessage}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="max-h-[300px] overflow-y-auto pr-2 -mr-2">
                              <MarkdownRenderer 
                                content={note.aiSummary || ''}
                                className="text-foreground"
                              />
                            </div>
                          </div>
                        )
                      })()}

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
                        <div className="mt-3">
                          <button
                            onClick={() => {
                              const audioId = note.id
                              const audio = audioRefs.current[audioId]
                              
                              if (!audio) {
                                // Create audio element if it doesn't exist
                                const newAudio = new Audio(note.audioUrl)
                                newAudio.addEventListener('ended', () => {
                                  setPlayingId(null)
                                })
                                newAudio.addEventListener('error', (e) => {
                                  logger.error('Audio playback error', { error: e, audioUrl: note.audioUrl })
                                  setPlayingId(null)
                                })
                                audioRefs.current[audioId] = newAudio
                                
                                // Play the audio
                                newAudio.play().catch((err) => {
                                  logger.error('Failed to play audio', { error: err })
                                  setPlayingId(null)
                                })
                                setPlayingId(audioId)
                              } else {
                                // Toggle play/pause
                                if (playingId === audioId) {
                                  audio.pause()
                                  setPlayingId(null)
                                } else {
                                  // Stop any currently playing audio
                                  Object.values(audioRefs.current).forEach(a => {
                                    if (a !== audio) a.pause()
                                  })
                                  audio.play().catch((err) => {
                                    logger.error('Failed to play audio', { error: err })
                                    setPlayingId(null)
                                  })
                                  setPlayingId(audioId)
                                }
                              }
                            }}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-full",
                              "bg-muted text-sm transition-colors touch-manipulation",
                              playingId === note.id
                                ? "text-foreground bg-primary/20"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {playingId === note.id ? (
                              <>
                                <Pause size={12} />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play size={12} />
                                Play recording
                              </>
                            )}
                          </button>
                        </div>
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




