/**
 * React Hook for Voice Recorder
 * 
 * Provides React interface for voice recording functionality
 * Integrates with voice processing API for AI extraction
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { getVoiceRecorder, type RecordingOptions, type RecordingResult } from '@/lib/voice-recorder'
import { logger } from '@/lib/logger'

export interface VoiceProcessingResult {
  success: boolean
  transcription?: string
  language?: string
  extractedItems?: {
    tasks: Array<{
      id?: string
      title: string
      priority: string
      dueDate?: string
      category?: string
    }>
    reminders: Array<{
      title: string
      reminderTime?: string
    }>
    healthNotes: Array<{
      content: string
      category: string
    }>
    generalNotes: Array<{
      content: string
    }>
    summary: string
  }
  error?: string
}

export interface UseVoiceRecorderOptions {
  maxDuration?: number
  onRecordingComplete?: (result: RecordingResult & { processing?: VoiceProcessingResult }) => void
  onError?: (error: Error) => void
  autoProcess?: boolean // If true, automatically process with AI after upload (default: true)
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}) {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingResult, setProcessingResult] = useState<VoiceProcessingResult | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const recorderRef = useRef<ReturnType<typeof getVoiceRecorder> | null>(null)

  const autoProcess = options.autoProcess ?? true

  // Initialize recorder
  useEffect(() => {
    if (typeof window === 'undefined') return

    recorderRef.current = getVoiceRecorder()

    return () => {
      // Cleanup on unmount
      if (recorderRef.current?.isRecording()) {
        recorderRef.current.stopRecording()
      }
    }
  }, [])

  /**
   * Process the voice recording with AI
   */
  const processRecording = useCallback(async (recordingId: string): Promise<VoiceProcessingResult> => {
    try {
      const response = await fetch('/api/voice/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceRecordingId: recordingId,
        }),
      })

      if (!response.ok) {
        // Try to parse error response
        let errorMessage = `Processing failed: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If response is not JSON (e.g., HTML error page), get text
          const text = await response.text()
          logger.error('API returned non-JSON response', { 
            status: response.status,
            contentType: response.headers.get('content-type'),
            textPreview: text.substring(0, 200),
          })
          errorMessage = `Processing failed: Server returned ${response.status} error`
        }
        throw new Error(errorMessage)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        const text = await response.text()
        logger.error('API returned non-JSON response', { 
          contentType,
          textPreview: text.substring(0, 200),
        })
        throw new Error('Server returned invalid response format')
      }

      const result = await response.json()
      return result as VoiceProcessingResult
    } catch (err) {
      logger.error('Voice processing failed', { error: err })
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Processing failed',
      }
    }
  }, [])

  const startRecording = useCallback(async () => {
    if (!recorderRef.current) {
      const error = new Error('Recorder not initialized')
      setError(error)
      options.onError?.(error)
      return
    }

    try {
      setError(null)
      setIsProcessing(false)
      setProcessingResult(null)

      const recordingOptions: RecordingOptions = {
        maxDuration: options.maxDuration || 1800,
        onProgress: (dur) => {
          setDuration(dur)
        },
        onChunkUploaded: () => {
          // Upload complete, processing will start
        },
      }

      await recorderRef.current.startRecording(recordingOptions)
      setIsRecording(true)
      logger.info('Voice recording started')
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start recording')
      setError(error)
      setIsRecording(false)
      logger.error('Failed to start recording', { error })
      options.onError?.(error)
    }
  }, [options])

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) return

    try {
      setIsRecording(false)
      setIsProcessing(true)
      
      const result = await recorderRef.current.stopRecording()
      
      if (result && autoProcess) {
        // Upload is complete (promise resolved), now process with AI
        logger.info('Recording stopped, processing with AI...', { 
          recordingId: result.recordingId,
          audioUrl: result.audioUrl 
        })
        
        const processingResult = await processRecording(result.recordingId)
        setProcessingResult(processingResult)
        
        setIsProcessing(false)
        setDuration(0)
        
        options.onRecordingComplete?.({
          ...result,
          processing: processingResult,
        })
        
        logger.info('Voice recording processed', { result, processingResult })
        
        // Dispatch events to trigger UI refresh
        if (processingResult.success && (processingResult.extractedItems?.tasks?.length || processingResult.extractedItems?.reminders?.length)) {
          // Dispatch custom event for tasks section to refresh
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('voice-processing-complete', {
              detail: {
                tasksCount: processingResult.extractedItems?.tasks?.length || 0,
                remindersCount: processingResult.extractedItems?.reminders?.length || 0,
              }
            }))
            window.dispatchEvent(new CustomEvent('tasks-updated'))
            
            // Also set localStorage to trigger cross-tab refresh
            localStorage.setItem('voice-processing-complete', Date.now().toString())
            localStorage.setItem('tasks-updated', Date.now().toString())
          }
        }
      } else if (result) {
        // Just upload, no AI processing
        setIsProcessing(false)
        setDuration(0)
        options.onRecordingComplete?.(result)
        logger.info('Voice recording stopped', { result })
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to stop recording')
      setError(error)
      setIsProcessing(false)
      logger.error('Failed to stop recording', { error })
      options.onError?.(error)
    }
  }, [options, autoProcess, processRecording])

  const getRecordingId = useCallback(() => {
    return recorderRef.current?.getRecordingId() || null
  }, [])

  return {
    isRecording,
    duration,
    isProcessing,
    processingResult,
    error,
    startRecording,
    stopRecording,
    getRecordingId,
    processRecording, // Expose for manual processing
  }
}
