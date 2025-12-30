"use client"

import { useState, useEffect, useRef, useMemo } from "react"
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
import { getValidAudioUrl, getAudioErrorMessage } from "@/lib/audio-url-utils"

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
  const [audioLoading, setAudioLoading] = useState<Record<string, boolean>>({})
  const [audioErrors, setAudioErrors] = useState<Record<string, string>>({})

  // Use query hook for cached voice timeline
  const { data: voiceNotesData = [], isLoading, error: queryError } = useVoiceTimeline({ limit: 50 })
  const error = queryError ? "Failed to load voice recordings" : null

  // Local state for editable notes (allows editing transcriptions)
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([])
  
  // Use a ref to track previous data and prevent infinite loops
  const previousDataRef = useRef<string>('')

  // Create a stable string representation of the data for comparison
  const dataKey = useMemo(() => {
    return JSON.stringify(voiceNotesData.map(note => ({
      id: note.id,
      transcription: note.transcription,
      aiSummary: note.aiSummary,
      status: note.status,
    })))
  }, [voiceNotesData])

  // Sync voiceNotes from query data only when data actually changes
  useEffect(() => {
    if (dataKey !== previousDataRef.current) {
      previousDataRef.current = dataKey
      setVoiceNotes(voiceNotesData)
    }
  }, [dataKey, voiceNotesData])

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
                      {note.audioUrl && (() => {
                        const audioId = note.id
                        const isLoading = audioLoading[audioId]
                        const errorMessage = audioErrors[audioId]
                        
                        return (
                          <div className="mt-3 space-y-2">
                            <button
                              onClick={async () => {
                                const audio = audioRefs.current[audioId]
                                
                                // Clear any previous error
                                setAudioErrors(prev => {
                                  const newErrors = { ...prev }
                                  delete newErrors[audioId]
                                  return newErrors
                                })
                                
                                if (!audio) {
                                  // Validate audio URL exists
                                  if (!note.audioUrl || note.audioUrl.trim() === '') {
                                    const errorMsg = 'Invalid audio URL - please try again'
                                    setAudioErrors(prev => ({ ...prev, [audioId]: errorMsg }))
                                    logger.error('Audio URL is empty', { audioId, noteId: note.id })
                                    return
                                  }

                                  // Set loading state
                                  setAudioLoading(prev => ({ ...prev, [audioId]: true }))
                                  
                                  try {
                                    // Get valid audio URL (refresh if expired)
                                    const validUrl = await getValidAudioUrl(note.audioUrl)
                                    
                                    // Validate URL is not empty after refresh
                                    if (!validUrl || validUrl.trim() === '') {
                                      throw new Error('Audio URL is empty after refresh')
                                    }
                                    
                                    // Create audio element
                                    const newAudio = new Audio()
                                    
                                    // Set preload to none to prevent auto-loading
                                    newAudio.preload = 'none'
                                    
                                    // Set src explicitly to ensure it's set
                                    newAudio.src = validUrl
                                    
                                    // Verify src is actually set
                                    if (!newAudio.src || newAudio.src.trim() === '' || newAudio.src === window.location.href) {
                                      throw new Error(`Audio src is empty or invalid after setting. Expected: ${validUrl}, Got: ${newAudio.src}`)
                                    }
                                    
                                    newAudio.addEventListener('ended', () => {
                                      setPlayingId(null)
                                    })
                                    
                                    newAudio.addEventListener('error', (e) => {
                                      const error = newAudio.error
                                      const networkState = newAudio.networkState
                                      const currentSrc = newAudio.src
                                      
                                      // Check if src is actually empty
                                      const isSrcEmpty = !currentSrc || currentSrc.trim() === '' || currentSrc === window.location.href
                                      
                                      // Get more context about the error
                                      let errorContext = {
                                        error: error || e,
                                        audioUrl: validUrl,
                                        currentSrc: currentSrc,
                                        isSrcEmpty: isSrcEmpty,
                                        errorCode: error?.code,
                                        errorMessage: error?.message,
                                        networkState: networkState,
                                        readyState: newAudio.readyState,
                                      }
                                      
                                      let errorMsg: string
                                      if (isSrcEmpty) {
                                        errorMsg = 'Audio source is empty - please try again'
                                        logger.error('Audio src is empty in error handler', errorContext)
                                      } else {
                                        errorMsg = getAudioErrorMessage(error || e, validUrl)
                                        logger.error('Audio playback error', errorContext)
                                      }
                                      
                                      setAudioErrors(prev => ({ ...prev, [audioId]: errorMsg }))
                                      setPlayingId(null)
                                      setAudioLoading(prev => {
                                        const newLoading = { ...prev }
                                        delete newLoading[audioId]
                                        return newLoading
                                      })
                                    })
                                    
                                    newAudio.addEventListener('loadeddata', () => {
                                      setAudioLoading(prev => {
                                        const newLoading = { ...prev }
                                        delete newLoading[audioId]
                                        return newLoading
                                      })
                                    })
                                    
                                    // Verify src one more time before storing
                                    if (!newAudio.src || newAudio.src.trim() === '') {
                                      throw new Error('Audio src is empty before storing reference')
                                    }
                                    
                                    audioRefs.current[audioId] = newAudio
                                    
                                    // Play the audio
                                    await newAudio.play()
                                    setPlayingId(audioId)
                                  } catch (err) {
                                    let errorMsg: string
                                    
                                    // Check if it's a validation error
                                    if (err instanceof Error && err.message.includes('Audio URL')) {
                                      errorMsg = err.message
                                    } else {
                                      errorMsg = getAudioErrorMessage(err, note.audioUrl)
                                    }
                                    
                                    logger.error('Failed to play audio', { error: err, audioUrl: note.audioUrl })
                                    
                                    setAudioErrors(prev => ({ ...prev, [audioId]: errorMsg }))
                                    setPlayingId(null)
                                    setAudioLoading(prev => {
                                      const newLoading = { ...prev }
                                      delete newLoading[audioId]
                                      return newLoading
                                    })
                                  }
                                } else {
                                  // Toggle play/pause
                                  if (playingId === audioId) {
                                    audio.pause()
                                    setPlayingId(null)
                                  } else {
                                    // Verify src is set before playing
                                    if (!audio.src || audio.src.trim() === '' || audio.src === window.location.href) {
                                      const errorMsg = 'Audio source is empty - please try again'
                                      logger.error('Audio src is empty when trying to play existing audio', { 
                                        audioId, 
                                        currentSrc: audio.src,
                                        networkState: audio.networkState,
                                        readyState: audio.readyState
                                      })
                                      setAudioErrors(prev => ({ ...prev, [audioId]: errorMsg }))
                                      return
                                    }
                                    
                                    // Stop any currently playing audio
                                    Object.values(audioRefs.current).forEach(a => {
                                      if (a !== audio) a.pause()
                                    })
                                    
                                    try {
                                      await audio.play()
                                      setPlayingId(audioId)
                                    } catch (err) {
                                      const errorMsg = getAudioErrorMessage(err, audio.src)
                                      
                                      logger.error('Failed to play audio', { 
                                        error: err, 
                                        audioUrl: audio.src,
                                        networkState: audio.networkState,
                                        readyState: audio.readyState,
                                        errorCode: audio.error?.code
                                      })
                                      
                                      setAudioErrors(prev => ({ ...prev, [audioId]: errorMsg }))
                                      setPlayingId(null)
                                    }
                                  }
                                }
                              }}
                              disabled={isLoading}
                              className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-full",
                                "bg-muted text-sm transition-colors touch-manipulation",
                                isLoading && "opacity-50 cursor-not-allowed",
                                playingId === note.id
                                  ? "text-foreground bg-primary/20"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {isLoading ? (
                                <>
                                  <Loader2 size={12} className="animate-spin" />
                                  Loading...
                                </>
                              ) : playingId === note.id ? (
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
                            
                            {/* Error message */}
                            {errorMessage && (
                              <p className="text-xs text-red-500 mt-1">
                                {errorMessage}
                              </p>
                            )}
                          </div>
                        )
                      })()}
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




