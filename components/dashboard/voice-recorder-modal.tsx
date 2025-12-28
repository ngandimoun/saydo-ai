"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Mic, Square, Pause, Play, Send, Trash2, Sparkles } from "lucide-react"
import { formatDuration } from "@/lib/dashboard/time-utils"
import { cn } from "@/lib/utils"
import { springs } from "@/lib/motion-system"
import { useVoiceRecorder } from "@/hooks/use-voice-recorder"
import { logger } from "@/lib/logger"

/**
 * Voice Recorder Modal - Airbnb-Inspired
 * 
 * Immersive full-screen recording experience with:
 * - Dynamic waveform visualization
 * - Gradient ambient backgrounds
 * - Real-time transcription preview
 * - Processing state with particle effects
 * 
 * Now integrated with real voice recording infrastructure
 */

interface VoiceRecorderModalProps {
  isOpen: boolean
  onClose: () => void
  onRecordingStart?: () => void
  onRecordingEnd?: () => void
  maxDuration?: number // in seconds, default 360 (6 min)
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'processing'

export function VoiceRecorderModal({ 
  isOpen, 
  onClose,
  onRecordingStart,
  onRecordingEnd,
  maxDuration = 360 
}: VoiceRecorderModalProps) {
  const [waveformData, setWaveformData] = useState<number[]>(
    Array(40).fill(0).map(() => Math.random() * 0.2 + 0.1)
  )
  const [transcription, setTranscription] = useState<string>("")

  // Use real voice recorder hook
  const {
    isRecording,
    duration,
    isProcessing,
    error: recorderError,
    startRecording,
    stopRecording,
  } = useVoiceRecorder({
    maxDuration,
    onRecordingComplete: (result) => {
      logger.info('Voice recording completed', { result })
      onRecordingEnd?.()
      onClose()
    },
    onError: (error) => {
      logger.error('Voice recording error', { error })
    },
  })

  // Determine state from recorder
  const state: RecordingState = isProcessing 
    ? 'processing' 
    : isRecording 
    ? 'recording' 
    : 'idle'

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setTranscription("")
      setWaveformData(Array(40).fill(0).map(() => Math.random() * 0.2 + 0.1))
    }
  }, [isOpen])

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
      // Could show a toast notification here
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
      // onRecordingEnd is called by the hook's onRecordingComplete
    } catch (error) {
      logger.error('Failed to stop recording', { error })
    }
  }, [stopRecording])

  // Cancel recording
  const cancelRecording = useCallback(() => {
    if (isRecording) {
      stopRecording().catch((error) => {
        logger.error('Failed to cancel recording', { error })
      })
    }
    onClose()
  }, [isRecording, stopRecording, onClose])

  // Calculate progress percentage
  const progress = (duration / maxDuration) * 100
  const isNearLimit = progress > 80

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
                Max {Math.floor(maxDuration / 60)} minutes
              </span>
              
              <div className="w-10" />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center w-full">
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

              {/* Real-time Transcription Preview */}
              <AnimatePresence>
                {transcription && state !== 'processing' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="w-full max-w-sm"
                  >
                    <div className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={12} className="text-primary" />
                        <span className="text-xs font-medium text-white/50">Live Transcription</span>
                      </div>
                      <p className="text-sm text-white/80 italic leading-relaxed">
                        "{transcription}"
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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

              {(state === 'recording' || state === 'paused') && (
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

                  {/* Stop button (recording can't be paused, only stopped) */}
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
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
