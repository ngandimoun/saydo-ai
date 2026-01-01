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
   * Get preview for the voice recording (lightweight - transcription + AI summary only)
   * This is the fast first step - no item extraction yet
   */
  const getPreview = useCallback(async (recordingId: string): Promise<VoiceProcessingResult> => {
    try {
      const response = await fetch('/api/voice/preview', {
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
        let errorMessage = `Preview failed: ${response.status}`
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
          errorMessage = `Preview failed: Server returned ${response.status} error`
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
      
      // Convert preview response to VoiceProcessingResult format
      // Preview only returns transcription + aiSummary, not extracted items
      return {
        success: result.success,
        transcription: result.transcription,
        language: result.language,
        // Preview doesn't extract items - that happens when user clicks "Done"
        extractedItems: result.aiSummary ? {
          tasks: [],
          reminders: [],
          healthNotes: [],
          generalNotes: [],
          summary: result.aiSummary,
        } : undefined,
        error: result.error,
      } as VoiceProcessingResult
    } catch (err) {
      logger.error('Voice preview failed', { error: err })
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Preview failed',
      }
    }
  }, [])

  /**
   * Process the voice recording with full AI extraction (called when user clicks "Done")
   * This is the heavy step - extracts items and saves to database
   */
  const processRecording = useCallback(async (
    recordingId: string,
    transcription: string,
    aiSummary?: string
  ): Promise<VoiceProcessingResult> => {
    try {
      const response = await fetch('/api/voice/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceRecordingId: recordingId,
          transcription: transcription,
          aiSummary: aiSummary,
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
        // Upload is complete (promise resolved), now get preview (fast - just transcription + summary)
        logger.info('Recording stopped, getting preview...', { 
          recordingId: result.recordingId,
          audioUrl: result.audioUrl 
        })
        
        // Use preview endpoint (lightweight - no item extraction yet)
        const previewResult = await getPreview(result.recordingId)
        setProcessingResult(previewResult)
        
        setIsProcessing(false)
        setDuration(0)
        
        options.onRecordingComplete?.({
          ...result,
          processing: previewResult,
        })
        
        logger.info('Voice preview generated', { result, previewResult })
        
        // Note: We don't dispatch tasks-updated here anymore
        // Items are extracted when user clicks "Done" (calls processRecording)
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
  }, [options, autoProcess, getPreview])

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
    getPreview, // Get transcription + summary (lightweight)
    processRecording, // Extract items + save (heavy) - called when user clicks "Done"
  }
}
