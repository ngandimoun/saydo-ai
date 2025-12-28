/**
 * React Hook for Voice Recorder
 * 
 * Provides React interface for voice recording functionality
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { getVoiceRecorder, type RecordingOptions, type RecordingResult } from '@/lib/voice-recorder'
import { logger } from '@/lib/logger'

export interface UseVoiceRecorderOptions {
  maxDuration?: number
  onRecordingComplete?: (result: RecordingResult) => void
  onError?: (error: Error) => void
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}) {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const recorderRef = useRef<ReturnType<typeof getVoiceRecorder> | null>(null)

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

      const recordingOptions: RecordingOptions = {
        maxDuration: options.maxDuration || 360,
        onProgress: (dur) => {
          setDuration(dur)
        },
        onChunkUploaded: () => {
          setIsProcessing(true)
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
      const result = await recorderRef.current.stopRecording()
      
      if (result) {
        setIsProcessing(true)
        // Wait a bit for upload to complete
        setTimeout(() => {
          setIsProcessing(false)
          options.onRecordingComplete?.(result)
        }, 2000)
      }
      
      setDuration(0)
      logger.info('Voice recording stopped', { result })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to stop recording')
      setError(error)
      setIsProcessing(false)
      logger.error('Failed to stop recording', { error })
      options.onError?.(error)
    }
  }, [options])

  const getRecordingId = useCallback(() => {
    return recorderRef.current?.getRecordingId() || null
  }, [])

  return {
    isRecording,
    duration,
    isProcessing,
    error,
    startRecording,
    stopRecording,
    getRecordingId,
  }
}

