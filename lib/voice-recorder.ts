/**
 * Voice Recording Infrastructure
 * 
 * Handles 6-minute maximum voice recordings using:
 * - Web Audio API + MediaRecorder
 * - Real-time upload to Supabase Storage
 * - Recording status tracking
 * - Cross-platform compatibility
 */

import { createClient } from './supabase'
import { logger } from './logger'

export interface RecordingOptions {
  maxDuration?: number // in seconds, default 360 (6 minutes)
  mimeType?: string // default 'audio/webm'
  onProgress?: (duration: number) => void
  onChunkUploaded?: (chunkNumber: number) => void
}

export interface RecordingResult {
  recordingId: string
  audioUrl: string
  duration: number
  fileSize: number
}

export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null
  private startTime: number = 0
  private duration: number = 0
  private maxDuration: number = 360 // 6 minutes
  private options: RecordingOptions = {}
  private supabase = createClient()
  private recordingId: string | null = null
  private intervalId: NodeJS.Timeout | null = null

  /**
   * Start recording
   */
  async startRecording(options: RecordingOptions = {}): Promise<void> {
    this.options = options
    this.maxDuration = options.maxDuration || 360
    this.audioChunks = []
    this.duration = 0

    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      // Determine best MIME type
      const mimeType = this.getBestMimeType(options.mimeType)
      
      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: 128000, // 128 kbps for good quality
      })

      // Create recording in database first
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data: recording, error: recordingError } = await this.supabase
        .from('voice_recordings')
        .insert({
          user_id: user.id,
          duration_seconds: 0,
          status: 'recording',
        })
        .select()
        .single()

      if (recordingError || !recording) {
        throw new Error(`Failed to create recording: ${recordingError?.message}`)
      }

      this.recordingId = recording.id

      // Setup event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = async () => {
        await this.handleRecordingStop()
      }

      this.mediaRecorder.onerror = (event) => {
        logger.error('MediaRecorder error', { error: event })
        this.options.onProgress?.(this.duration)
      }

      // Start recording
      this.mediaRecorder.start(1000) // Collect data every second
      this.startTime = Date.now()

      // Track duration
      this.intervalId = setInterval(() => {
        this.duration = Math.floor((Date.now() - this.startTime) / 1000)
        this.options.onProgress?.(this.duration)

        // Auto-stop at max duration
        if (this.duration >= this.maxDuration) {
          this.stopRecording()
        }
      }, 100)

      logger.info('Voice recording started', { recordingId: this.recordingId })
    } catch (error) {
      logger.error('Failed to start recording', { error })
      this.cleanup()
      throw error
    }
  }

  /**
   * Stop recording
   */
  async stopRecording(): Promise<RecordingResult | null> {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      return null
    }

    this.mediaRecorder.stop()
    this.cleanup()

    // Wait for onstop handler to complete
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.getResult())
      }, 500)
    })
  }

  /**
   * Get current recording duration
   */
  getDuration(): number {
    return this.duration
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording'
  }

  /**
   * Get recording ID
   */
  getRecordingId(): string | null {
    return this.recordingId
  }

  private async handleRecordingStop() {
    if (!this.recordingId) return

    try {
      // Combine all audio chunks
      const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' })
      const fileSize = audioBlob.size

      // Update duration
      this.duration = Math.floor((Date.now() - this.startTime) / 1000)

      // Upload to Supabase Storage
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const fileName = `${user.id}/${Date.now()}-${this.recordingId}.webm`
      
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('voice-recordings')
        .upload(fileName, audioBlob, {
          contentType: audioBlob.type,
          upsert: false,
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get public URL (signed URL for private bucket)
      const { data: urlData } = this.supabase.storage
        .from('voice-recordings')
        .createSignedUrl(fileName, 3600)

      const audioUrl = urlData?.signedUrl || ''

      // Update recording in database
      const { error: updateError } = await this.supabase
        .from('voice_recordings')
        .update({
          duration_seconds: this.duration,
          audio_url: audioUrl,
          status: 'processing', // Will be updated to 'completed' after transcription
        })
        .eq('id', this.recordingId)

      if (updateError) {
        logger.error('Failed to update recording', { error: updateError })
      }

      logger.info('Voice recording completed', {
        recordingId: this.recordingId,
        duration: this.duration,
        fileSize,
      })

      this.options.onChunkUploaded?.(1)
    } catch (error) {
      logger.error('Error handling recording stop', { error })
      
      // Update status to failed
      if (this.recordingId) {
        await this.supabase
          .from('voice_recordings')
          .update({ status: 'failed' })
          .eq('id', this.recordingId)
      }
    }
  }

  private getBestMimeType(preferred?: string): string {
    if (preferred && MediaRecorder.isTypeSupported(preferred)) {
      return preferred
    }

    // Try common formats in order of preference
    const formats = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
    ]

    for (const format of formats) {
      if (MediaRecorder.isTypeSupported(format)) {
        return format
      }
    }

    // Fallback to default
    return 'audio/webm'
  }

  private cleanup() {
    // Stop media tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }

    // Clear interval
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.mediaRecorder = null
  }

  private getResult(): RecordingResult | null {
    if (!this.recordingId) return null

    return {
      recordingId: this.recordingId,
      audioUrl: '', // Will be set after upload
      duration: this.duration,
      fileSize: this.audioChunks.reduce((sum, chunk) => sum + chunk.size, 0),
    }
  }
}

// Singleton instance
let recorderInstance: VoiceRecorder | null = null

export function getVoiceRecorder(): VoiceRecorder {
  if (!recorderInstance) {
    recorderInstance = new VoiceRecorder()
  }
  return recorderInstance
}

