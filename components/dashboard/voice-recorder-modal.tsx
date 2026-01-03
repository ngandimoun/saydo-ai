"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Mic, Square, Send, Trash2, Sparkles, Check, ListTodo, Heart, FileText } from "lucide-react"
import { formatDuration } from "@/lib/dashboard/time-utils"
import { cn } from "@/lib/utils"
import { springs } from "@/lib/motion-system"
import { useVoiceRecorder, type VoiceProcessingResult } from "@/hooks/use-voice-recorder"
import { logger } from "@/lib/logger"
import { processVoiceJob } from "@/lib/voice-processing-service"
import { setupBeforeUnloadHandler } from "@/lib/audio-player-persistence"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase"

/**
 * Voice Recorder Modal - Airbnb-Inspired
 * 
 * Immersive full-screen recording experience with:
 * - Dynamic waveform visualization
 * - Gradient ambient backgrounds
 * - Real-time transcription preview
 * - AI processing with task extraction
 * - Results display with extracted items
 */

interface VoiceRecorderModalProps {
  isOpen: boolean
  onClose: () => void
  onRecordingStart?: () => void
  onRecordingEnd?: (result?: VoiceProcessingResult) => void
  maxDuration?: number // in seconds, default 1800 (30 min)
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'processing' | 'complete'

export function VoiceRecorderModal({ 
  isOpen, 
  onClose,
  onRecordingStart,
  onRecordingEnd,
  maxDuration = 1800 
}: VoiceRecorderModalProps) {
  const [waveformData, setWaveformData] = useState<number[]>(
    Array(40).fill(0).map(() => Math.random() * 0.2 + 0.1)
  )
  const [showResults, setShowResults] = useState(false)
  const [recordingId, setRecordingId] = useState<string | null>(null)
  const [editedTranscription, setEditedTranscription] = useState<string>('')
  const [editedAiSummary, setEditedAiSummary] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Use real voice recorder hook with AI processing
  const {
    isRecording,
    duration,
    isProcessing,
    processingResult,
    error: recorderError,
    startRecording,
    stopRecording,
    cancelRecording: cancelRecordingHook,
    getRecordingId,
  } = useVoiceRecorder({
    maxDuration,
    autoProcess: true, // Enable AI processing
    onRecordingComplete: (result) => {
      logger.info('Voice recording completed', { result })
      if (result.processing) {
        // Store recording ID and initialize edited values
        setRecordingId(result.recordingId)
        setEditedTranscription(result.processing.transcription || '')
        setEditedAiSummary(result.processing.extractedItems?.summary || '')
        setShowResults(true)
        onRecordingEnd?.(result.processing)
      } else {
        onRecordingEnd?.()
        onClose()
      }
    },
    onError: (error) => {
      logger.error('Voice recording error', { error })
    },
  })

  // Determine state from recorder
  const state: RecordingState = showResults
    ? 'complete'
    : isProcessing 
    ? 'processing' 
    : isRecording 
    ? 'recording' 
    : 'idle'

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setShowResults(false)
      setWaveformData(Array(40).fill(0).map(() => Math.random() * 0.2 + 0.1))
      setRecordingId(null)
      setEditedTranscription('')
      setEditedAiSummary('')
      setSaveError(null)
      setIsSaving(false)
    }
  }, [isOpen])

  // Update edited values when processing result changes
  useEffect(() => {
    if (processingResult?.success) {
      if (processingResult.transcription && !editedTranscription) {
        setEditedTranscription(processingResult.transcription)
      }
      if (processingResult.extractedItems?.summary && !editedAiSummary) {
        setEditedAiSummary(processingResult.extractedItems.summary)
      }
    }
  }, [processingResult, editedTranscription, editedAiSummary])

  // Smooth waveform animation when recording
  useEffect(() => {
    if (state !== 'recording') return
    
    const waveInterval = setInterval(() => {
      setWaveformData(prev => prev.map(() => 
        0.15 + Math.random() * 0.85
      ))
    }, 100)

    return () => clearInterval(waveInterval)
  }, [state])

  // Show error if recording failed
  useEffect(() => {
    if (recorderError) {
      logger.error('Recording error', { error: recorderError })
    }
  }, [recorderError])

  // Start recording
  const handleStartRecording = useCallback(async () => {
    try {
      await startRecording()
      onRecordingStart?.()
    } catch (error) {
      logger.error('Failed to start recording', { error })
    }
  }, [startRecording, onRecordingStart])

  // Stop and send
  const sendRecording = useCallback(async () => {
    try {
      await stopRecording()
    } catch (error) {
      logger.error('Failed to stop recording', { error })
    }
  }, [stopRecording])

  // Delete recording from database and storage
  const deleteRecording = useCallback(async (recordingIdToDelete: string) => {
    try {
      const supabase = createClient()
      
      // Get recording to find storage path
      const { data: recording, error: fetchError } = await supabase
        .from('voice_recordings')
        .select('audio_url')
        .eq('id', recordingIdToDelete)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" - that's okay, recording might not exist yet
        logger.error('Failed to fetch recording for deletion', { error: fetchError })
      }

      // Delete from storage if audio_url exists
      if (recording?.audio_url) {
        try {
          // Extract storage path from URL
          // Format: https://[project].supabase.co/storage/v1/object/sign/voice-recordings/[path]?token=...
          // Or: https://[project].supabase.co/storage/v1/object/public/voice-recordings/[path]
          const url = new URL(recording.audio_url)
          const pathMatch = url.pathname.match(/\/voice-recordings\/(.+)$/)
          if (pathMatch && pathMatch[1]) {
            const storagePath = decodeURIComponent(pathMatch[1])
            const { error: storageError } = await supabase.storage
              .from('voice-recordings')
              .remove([storagePath])

            if (storageError) {
              logger.error('Failed to delete recording from storage', { error: storageError })
              // Continue with database deletion anyway
            }
          }
        } catch (urlError) {
          logger.error('Failed to parse audio URL for deletion', { error: urlError })
          // Continue with database deletion anyway
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('voice_recordings')
        .delete()
        .eq('id', recordingIdToDelete)

      if (dbError) {
        logger.error('Failed to delete recording from database', { error: dbError })
      } else {
        logger.info('Recording deleted successfully', { recordingId: recordingIdToDelete })
      }
    } catch (error) {
      logger.error('Error deleting recording', { error, recordingId: recordingIdToDelete })
    }
  }, [])

  // Cancel recording
  const cancelRecording = useCallback(async () => {
    // Get recording ID before cancelling
    const currentRecordingId = getRecordingId() || recordingId

    // Cancel the recording/processing
    cancelRecordingHook()

    // Delete recording from database and storage if it exists
    if (currentRecordingId) {
      await deleteRecording(currentRecordingId)
    }

    // Reset local state
    setRecordingId(null)
    setShowResults(false)
    setEditedTranscription('')
    setEditedAiSummary('')

    // Close modal
    onClose()
  }, [cancelRecordingHook, getRecordingId, recordingId, deleteRecording, onClose])

  // Process edited transcription and save items
  const handleDone = useCallback(async () => {
    if (!recordingId) {
      onClose()
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      // Create job for background processing
      const jobId = crypto.randomUUID()
      const job = {
        id: jobId,
        recordingId,
        transcription: editedTranscription.trim(),
        aiSummary: editedAiSummary.trim() || undefined,
        status: 'pending' as const,
        attempts: 0,
        maxAttempts: 3,
        createdAt: Date.now(),
      }

      // Log to console for debugging
      console.log('[Voice Recorder] Starting voice processing job', {
        jobId,
        recordingId,
        transcriptionLength: editedTranscription.trim().length,
        hasAiSummary: !!editedAiSummary.trim(),
      })

      // Show toast notification
      toast.loading('Processing your voice note...', {
        id: `voice-job-${jobId}`,
        description: 'This will continue in the background',
      })

      // Start processing in background (don't await - let it run async)
      // This will either register background sync or process immediately
      processVoiceJob(job)
        .then(() => {
          console.log('[Voice Recorder] Voice processing job started successfully', { jobId })
          // Toast will be updated by the processing service when complete
        })
        .catch((error) => {
          console.error('[Voice Recorder] Voice processing job failed to start', { error, jobId, recordingId })
          logger.error('Voice processing job failed to start', { error, jobId, recordingId })
          // Job is saved in IndexedDB, so it can be retried later
          toast.error('Failed to start processing', {
            id: `voice-job-${jobId}`,
            description: 'The job has been saved and will be retried automatically',
          })
        })

      logger.info('Voice processing job started', { 
        jobId,
        recordingId,
      })

      // Reset saving state and close modal immediately
      // Processing will continue in background
      // User will get notification when complete
      setIsSaving(false)
      onClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start processing'
      logger.error('Failed to create voice processing job', { error, recordingId })
      setSaveError(errorMessage)
      setIsSaving(false)
    }
  }, [recordingId, editedTranscription, editedAiSummary, onClose])

  // Setup beforeunload handler to ensure job is saved
  useEffect(() => {
    if (!isSaving || !recordingId) return

    const cleanup = setupBeforeUnloadHandler(() => ({
      // Job is already saved in IndexedDB by processVoiceJob
      // This handler ensures state is persisted
      currentTrackId: null,
      playlist: [],
      currentTime: 0,
      isPlaying: false,
      volume: 1,
      isMuted: false,
      isShuffled: false,
      repeatMode: 'off' as const,
    }))

    return cleanup
  }, [isSaving, recordingId])

  // Calculate progress percentage
  const progress = (duration / maxDuration) * 100
  const isNearLimit = progress > 80

  // Count extracted items
  const extractedCounts = processingResult?.extractedItems ? {
    tasks: processingResult.extractedItems.tasks.length,
    reminders: processingResult.extractedItems.reminders.length,
    healthNotes: processingResult.extractedItems.healthNotes.length,
    notes: processingResult.extractedItems.generalNotes.length,
  } : { tasks: 0, reminders: 0, healthNotes: 0, notes: 0 }

  const totalExtracted = extractedCounts.tasks + extractedCounts.reminders + extractedCounts.healthNotes + extractedCounts.notes

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50"
        >
          {/* Animated Gradient Background */}
          <motion.div 
            className="absolute inset-0"
            animate={{
              background: state === 'recording' 
                ? [
                    'linear-gradient(180deg, rgba(13, 148, 136, 0.15) 0%, #0C1222 50%, #0C1222 100%)',
                    'linear-gradient(180deg, rgba(20, 184, 166, 0.2) 0%, #0C1222 50%, #0C1222 100%)',
                    'linear-gradient(180deg, rgba(13, 148, 136, 0.15) 0%, #0C1222 50%, #0C1222 100%)',
                  ]
                : state === 'complete'
                ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.15) 0%, #0C1222 50%, #0C1222 100%)'
                : 'linear-gradient(180deg, rgba(13, 148, 136, 0.08) 0%, #0C1222 50%, #0C1222 100%)'
            }}
            transition={{ duration: 3, repeat: state === 'recording' ? Infinity : 0 }}
          />

          {/* Ambient orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl"
              animate={state === 'recording' ? {
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              } : {}}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div 
              className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl"
              animate={state === 'recording' ? {
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.4, 0.2],
              } : {}}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </div>

          {/* Content */}
          <div className="relative h-full flex flex-col items-center justify-between py-8 px-6 max-w-lg mx-auto">
            {/* Header */}
            <div className="w-full flex items-center justify-between">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={cancelRecording}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-colors"
              >
                <X size={20} />
              </motion.button>
              
              <span className="text-sm text-white/60 font-medium">
                {state === 'complete' ? 'Processing Complete' : `Max ${Math.floor(maxDuration / 60)} minutes`}
              </span>
              
              <div className="w-10" />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0">
              {/* Results View */}
              {state === 'complete' && processingResult?.success && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-sm flex flex-col h-full max-h-full overflow-hidden"
                >
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 -mr-2">
                  {/* Success Icon */}
                  <div className="flex justify-center mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={springs.bouncy}
                      className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center"
                    >
                      <Check size={36} className="text-emerald-400" />
                    </motion.div>
                  </div>

                  {/* Transcription */}
                  {processingResult.transcription && (
                    <div className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                      <p className="text-sm text-white/60 mb-2">Transcription</p>
                      <div className="max-h-[200px] overflow-y-auto">
                        <textarea
                          value={editedTranscription}
                          onChange={(e) => setEditedTranscription(e.target.value)}
                          className="w-full text-white/90 text-sm leading-relaxed bg-transparent border-none outline-none resize-none focus:ring-0 p-0 min-h-[60px]"
                          rows={Math.max(3, editedTranscription.split('\n').length)}
                          placeholder="Transcription will appear here..."
                        />
                      </div>
                    </div>
                  )}

                  {/* Extracted Items Summary */}
                  {totalExtracted > 0 && (
                    <div className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                      <p className="text-sm text-white/60 mb-3">Extracted Items</p>
                      <div className="grid grid-cols-2 gap-3">
                        {extractedCounts.tasks > 0 && (
                          <div className="flex items-center gap-2 text-white/80">
                            <ListTodo size={16} className="text-primary" />
                            <span className="text-sm">{extractedCounts.tasks} task{extractedCounts.tasks > 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {extractedCounts.healthNotes > 0 && (
                          <div className="flex items-center gap-2 text-white/80">
                            <Heart size={16} className="text-rose-400" />
                            <span className="text-sm">{extractedCounts.healthNotes} health note{extractedCounts.healthNotes > 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {extractedCounts.notes > 0 && (
                          <div className="flex items-center gap-2 text-white/80">
                            <FileText size={16} className="text-blue-400" />
                            <span className="text-sm">{extractedCounts.notes} note{extractedCounts.notes > 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {processingResult?.success && (
                    <div className="p-4 bg-primary/10 backdrop-blur-sm rounded-2xl border border-primary/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={14} className="text-primary" />
                        <span className="text-xs font-medium text-primary">AI Summary</span>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        <textarea
                          value={editedAiSummary}
                          onChange={(e) => setEditedAiSummary(e.target.value)}
                          className="w-full text-white/90 text-sm leading-relaxed bg-transparent border-none outline-none resize-none focus:ring-0 p-0 min-h-[100px]"
                          rows={Math.max(4, editedAiSummary.split('\n').length)}
                          placeholder="AI Summary will appear here..."
                        />
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {saveError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm"
                    >
                      {saveError}
                    </motion.div>
                  )}
                  </div>

                  {/* Done Button - Always visible at bottom */}
                  <div className="flex-shrink-0 pt-4 mt-auto">
                    <motion.button
                      whileHover={!isSaving ? { scale: 1.02 } : {}}
                      whileTap={!isSaving ? { scale: 0.98 } : {}}
                      onClick={handleDone}
                      disabled={isSaving}
                      className={cn(
                        "w-full py-3 px-6 bg-primary rounded-xl text-white font-medium",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "flex items-center justify-center gap-2"
                      )}
                    >
                      {isSaving ? (
                        <>
                          <motion.div
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Done</span>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Recording View */}
              {state !== 'complete' && (
                <>
                  {/* Timer */}
                  <motion.div
                    key={duration}
                    initial={{ scale: 1.05, opacity: 0.8 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={cn(
                      "text-7xl sm:text-8xl font-display font-light tabular-nums mb-6",
                      isNearLimit ? "text-amber-400" : "text-white"
                    )}
                  >
                    {formatDuration(duration)}
                  </motion.div>

                  {/* Waveform Visualization */}
                  <div className="flex items-center justify-center gap-0.5 h-28 mb-6 w-full max-w-sm">
                    {waveformData.map((height, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          height: `${height * 100}%`,
                          opacity: state === 'recording' ? 0.8 + height * 0.2 : 0.3,
                        }}
                        transition={{
                          duration: state === 'recording' ? 0.08 : 0.3,
                          ease: "easeOut"
                        }}
                        className={cn(
                          "w-1 rounded-full",
                          state === 'recording' 
                            ? "bg-gradient-to-t from-primary to-teal-400" 
                            : "bg-white/20"
                        )}
                        style={{ minHeight: '4px' }}
                      />
                    ))}
                  </div>

                  {/* Progress Bar */}
                  {state === 'recording' && (
                    <>
                      <div className="w-full max-w-sm h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                        <motion.div
                          className={cn(
                            "h-full rounded-full",
                            isNearLimit 
                              ? "bg-gradient-to-r from-amber-500 to-orange-500" 
                              : "bg-gradient-to-r from-primary to-teal-400"
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>

                      {/* Time remaining */}
                      <p className={cn(
                        "text-sm font-medium",
                        isNearLimit ? "text-amber-400" : "text-white/50"
                      )}>
                        {formatDuration(maxDuration - duration)} remaining
                      </p>
                    </>
                  )}

                  {/* Status Text */}
                  <motion.p
                    key={state}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-white/60 text-center mt-6 mb-4"
                  >
                    {state === 'idle' && "Tap the button to start recording"}
                    {state === 'recording' && "Listening... speak naturally"}
                    {state === 'paused' && "Recording paused"}
                    {state === 'processing' && "Processing your voice note..."}
                  </motion.p>
                </>
              )}
            </div>

            {/* Controls */}
            <div className="w-full">
              {state === 'idle' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center"
                >
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    transition={springs.bouncy}
                    onClick={handleStartRecording}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shadow-2xl shadow-primary/40 relative"
                  >
                    {/* Inner glow */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/25 to-transparent" />
                    <Mic size={36} className="text-white relative z-10" />
                  </motion.button>
                </motion.div>
              )}

              {state === 'recording' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-8"
                >
                  {/* Delete */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={springs.snappy}
                    onClick={cancelRecording}
                    className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10"
                  >
                    <Trash2 size={22} className="text-white/70" />
                  </motion.button>

                  {/* Stop button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={springs.bouncy}
                    onClick={sendRecording}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shadow-xl shadow-primary/30 relative"
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent" />
                    <Square size={24} className="text-white relative z-10" />
                  </motion.button>

                  {/* Send */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={springs.snappy}
                    onClick={sendRecording}
                    disabled={duration === 0}
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center border",
                      duration > 0 
                        ? "bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/30" 
                        : "bg-white/10 border-white/10"
                    )}
                  >
                    <Send 
                      size={22} 
                      className={duration > 0 ? "text-white" : "text-white/30"} 
                    />
                  </motion.button>
                </motion.div>
              )}

              {state === 'processing' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-4"
                >
                  {/* Processing animation */}
                  <div className="relative">
                    <motion.div
                      className="w-20 h-20 rounded-full border-4 border-primary/20"
                      style={{ borderTopColor: 'var(--primary)' }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles size={24} className="text-primary" />
                    </div>
                  </div>
                  <p className="text-white/60 font-medium">Saydo is processing...</p>
                  <p className="text-white/40 text-sm">Extracting tasks and insights</p>
                  
                  {/* Cancel button during processing */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={springs.snappy}
                    onClick={cancelRecording}
                    className="mt-4 w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10 hover:bg-red-500/20 hover:border-red-500/50"
                  >
                    <Trash2 size={22} className="text-white/70" />
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
