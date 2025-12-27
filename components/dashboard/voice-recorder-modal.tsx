"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Mic, Square, Pause, Play, Send, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDuration } from "@/lib/dashboard/time-utils"
import { cn } from "@/lib/utils"

/**
 * Voice Recorder Modal
 * 
 * Full-screen modal for voice recording.
 * Features:
 * - Max 6 minutes recording time
 * - Visual waveform animation
 * - Timer display
 * - Pause/resume support
 * - Cancel and send actions
 * 
 * TODO (Backend Integration):
 * - Use MediaRecorder API to capture audio
 * - Upload to Supabase Storage
 * - Send to AI for transcription and processing
 * - Link recordings contextually (context_chain_id)
 * 
 * TODO (AI Integration):
 * - Real-time transcription display
 * - Show AI processing status
 * - Extract tasks/reminders from transcription
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
  const [state, setState] = useState<RecordingState>('idle')
  const [duration, setDuration] = useState(0)
  const [waveformData, setWaveformData] = useState<number[]>(
    Array(30).fill(0).map(() => Math.random() * 0.3)
  )

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setState('idle')
      setDuration(0)
    }
  }, [isOpen])

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (state === 'recording' && duration < maxDuration) {
      interval = setInterval(() => {
        setDuration(prev => {
          if (prev >= maxDuration - 1) {
            setState('paused')
            return maxDuration
          }
          return prev + 1
        })
        // Simulate waveform
        setWaveformData(Array(30).fill(0).map(() => 
          0.2 + Math.random() * 0.8
        ))
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [state, duration, maxDuration])

  // Start recording
  const startRecording = useCallback(() => {
    /**
     * TODO (Web Audio API):
     * 
     * const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
     * const mediaRecorder = new MediaRecorder(stream)
     * const chunks: Blob[] = []
     * 
     * mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
     * mediaRecorder.onstop = () => {
     *   const blob = new Blob(chunks, { type: 'audio/webm' })
     *   // Upload to Supabase Storage
     * }
     * 
     * mediaRecorder.start()
     */
    setState('recording')
    onRecordingStart?.()
  }, [onRecordingStart])

  // Pause recording
  const pauseRecording = useCallback(() => {
    setState('paused')
    // Flatten waveform
    setWaveformData(Array(30).fill(0).map(() => 0.1))
  }, [])

  // Resume recording
  const resumeRecording = useCallback(() => {
    setState('recording')
  }, [])

  // Stop and send
  const sendRecording = useCallback(() => {
    setState('processing')
    
    /**
     * TODO (Backend):
     * 1. Stop MediaRecorder
     * 2. Upload blob to Supabase Storage
     * 3. Create record in voice_recordings table
     * 4. Trigger AI processing (transcription, extraction)
     * 5. Close modal and show toast
     */
    
    // Simulate processing
    setTimeout(() => {
      onRecordingEnd?.()
      onClose()
      setState('idle')
      setDuration(0)
    }, 2000)
  }, [onClose, onRecordingEnd])

  // Cancel recording
  const cancelRecording = useCallback(() => {
    setState('idle')
    setDuration(0)
    onRecordingEnd?.()
    onClose()
  }, [onClose, onRecordingEnd])

  // Calculate progress percentage
  const progress = (duration / maxDuration) * 100

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background"
        >
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />

          {/* Content */}
          <div className="relative h-full flex flex-col items-center justify-between py-8 px-6 max-w-lg mx-auto">
            {/* Header */}
            <div className="w-full flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={cancelRecording}
                className="rounded-full"
              >
                <X size={24} />
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Max {Math.floor(maxDuration / 60)} minutes
              </span>
              
              <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center w-full">
              {/* Timer */}
              <motion.div
                key={duration}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-6xl sm:text-7xl font-light tabular-nums mb-8"
              >
                {formatDuration(duration)}
              </motion.div>

              {/* Waveform Visualization */}
              <div className="flex items-center justify-center gap-1 h-24 mb-8 w-full max-w-xs">
                {waveformData.map((height, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: state === 'recording' 
                        ? `${height * 100}%` 
                        : `${10 + Math.random() * 10}%`
                    }}
                    transition={{
                      duration: 0.1,
                      ease: "easeOut"
                    }}
                    className={cn(
                      "w-1.5 rounded-full",
                      state === 'recording' ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                    style={{ minHeight: '8px' }}
                  />
                ))}
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-xs h-1 bg-muted rounded-full overflow-hidden mb-4">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    progress > 80 ? "bg-amber-500" : "bg-primary"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>

              {/* Time remaining */}
              <p className="text-sm text-muted-foreground">
                {formatDuration(maxDuration - duration)} remaining
              </p>

              {/* Status Text */}
              <motion.p
                key={state}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-muted-foreground text-center mt-8"
              >
                {state === 'idle' && "Tap the button to start recording"}
                {state === 'recording' && "Listening... speak naturally"}
                {state === 'paused' && "Recording paused"}
                {state === 'processing' && "Processing your voice note..."}
              </motion.p>

              {/* Real-time Transcription Preview */}
              {/* 
                TODO (AI): Show real-time transcription
                <div className="mt-6 p-4 bg-card rounded-xl max-w-xs">
                  <p className="text-sm text-muted-foreground italic">
                    "So first, I've got that product review meeting on Thursday at 10..."
                  </p>
                </div>
              */}
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
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startRecording}
                    className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30"
                  >
                    <Mic size={32} className="text-primary-foreground" />
                  </motion.button>
                </motion.div>
              )}

              {(state === 'recording' || state === 'paused') && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-6"
                >
                  {/* Delete */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={cancelRecording}
                    className="w-14 h-14 rounded-full bg-muted flex items-center justify-center"
                  >
                    <Trash2 size={22} className="text-muted-foreground" />
                  </motion.button>

                  {/* Pause/Resume */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={state === 'recording' ? pauseRecording : resumeRecording}
                    className={cn(
                      "w-20 h-20 rounded-full flex items-center justify-center shadow-lg",
                      state === 'recording' 
                        ? "bg-primary shadow-primary/30" 
                        : "bg-amber-500 shadow-amber-500/30"
                    )}
                  >
                    {state === 'recording' ? (
                      <Pause size={32} className="text-white" />
                    ) : (
                      <Play size={32} className="text-white ml-1" />
                    )}
                  </motion.button>

                  {/* Send */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={sendRecording}
                    disabled={duration === 0}
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center",
                      duration > 0 
                        ? "bg-green-500" 
                        : "bg-muted"
                    )}
                  >
                    <Send 
                      size={22} 
                      className={duration > 0 ? "text-white" : "text-muted-foreground"} 
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
                  <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  <p className="text-muted-foreground">Saydo is thinking...</p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

