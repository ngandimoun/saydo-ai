/**
 * Voice Processing Background Service
 * 
 * Handles background processing of voice recordings:
 * - Uses Background Sync API when available
 * - Falls back to fetch with keepalive
 * - Retry logic with exponential backoff
 * - Status updates via BroadcastChannel
 * - Notifications on completion
 */

import {
  saveProcessingJob,
  updateJobStatus,
  getJob,
  deleteJob,
  loadPendingJobs,
  type VoiceProcessingJob,
} from './voice-processing-persistence'
import { logger } from './logger'

const SYNC_TAG = 'voice-processing'
const MAX_ATTEMPTS = 3
const RETRY_DELAYS = [1000, 5000, 15000] // Exponential backoff in ms

// BroadcastChannel for cross-tab communication
let broadcastChannel: BroadcastChannel | null = null

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  broadcastChannel = new BroadcastChannel('voice-processing')
}

/**
 * Broadcast job status update
 */
function broadcastStatus(jobId: string, status: VoiceProcessingJob['status'], result?: VoiceProcessingJob['result']) {
  if (broadcastChannel) {
    broadcastChannel.postMessage({
      type: 'job-status',
      jobId,
      status,
      result,
    })
  }
}

/**
 * Show notification when job completes
 */
async function showCompletionNotification(job: VoiceProcessingJob) {
  if (typeof window === 'undefined') return

  try {
    // Check if notifications are supported and permission is granted
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return
    }

    // Use service worker for better PWA experience
    const registration = await navigator.serviceWorker.ready

    const tasksCount = job.result?.tasksCount || 0
    const remindersCount = job.result?.remindersCount || 0
    const totalItems = tasksCount + remindersCount

    let body = 'Voice processing completed'
    if (totalItems > 0) {
      const items = []
      if (tasksCount > 0) items.push(`${tasksCount} task${tasksCount > 1 ? 's' : ''}`)
      if (remindersCount > 0) items.push(`${remindersCount} reminder${remindersCount > 1 ? 's' : ''}`)
      body = `Created ${items.join(' and ')}`
    }

    await registration.showNotification('Voice Processing Complete', {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `voice-job-${job.id}`,
      data: {
        jobId: job.id,
        actionUrl: '/dashboard/tasks',
        tasksCount,
        remindersCount,
      },
      requireInteraction: false,
    })
  } catch (error) {
    logger.error('Failed to show completion notification', { error, jobId: job.id })
  }
}

/**
 * Process voice job via API
 */
async function processJobAPI(job: VoiceProcessingJob): Promise<{ success: boolean; result?: VoiceProcessingJob['result']; error?: string }> {
  try {
    console.log('[Voice Processing] Calling API', {
      jobId: job.id,
      recordingId: job.recordingId,
      transcriptionLength: job.transcription.length,
      hasAiSummary: !!job.aiSummary,
    })

    const response = await fetch('/api/voice/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      keepalive: true, // Keep request alive even if page closes
      body: JSON.stringify({
        sourceRecordingId: job.recordingId,
        transcription: job.transcription,
        aiSummary: job.aiSummary,
      }),
    })

    console.log('[Voice Processing] API response status', {
      jobId: job.id,
      status: response.status,
      ok: response.ok,
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData: { error?: string } = {}
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText || 'Unknown error' }
      }
      
      console.error('[Voice Processing] API error response', {
        jobId: job.id,
        status: response.status,
        error: errorData.error || errorText,
      })
      
      throw new Error(errorData.error || `Failed to process: ${response.status}`)
    }

    const result = await response.json()
    console.log('[Voice Processing] API success', {
      jobId: job.id,
      tasksCount: result.saved?.tasks || 0,
      remindersCount: result.saved?.reminders || 0,
      success: result.success,
    })

    return {
      success: true,
      result: {
        tasksCount: result.saved?.tasks || 0,
        remindersCount: result.saved?.reminders || 0,
      },
    }
  } catch (error) {
    console.error('[Voice Processing] API error caught', {
      jobId: job.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
    })
    logger.error('Voice processing API error', { error, jobId: job.id })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Process a voice job with retry logic
 */
async function processJobWithRetry(job: VoiceProcessingJob): Promise<void> {
  console.log('[Voice Processing] Starting processJobWithRetry', {
    jobId: job.id,
    attempts: job.attempts,
    maxAttempts: job.maxAttempts,
  })

  // Update status to processing
  await updateJobStatus(job.id, { status: 'processing' })
  broadcastStatus(job.id, 'processing')
  console.log('[Voice Processing] Job status updated to processing', { jobId: job.id })

  let lastError: string | undefined

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const apiResult = await processJobAPI(job)

      if (apiResult.success && apiResult.result) {
        console.log('[Voice Processing] Job completed successfully', {
          jobId: job.id,
          tasksCount: apiResult.result.tasksCount,
          remindersCount: apiResult.result.remindersCount,
        })

        // Success - update job and show notification
        await updateJobStatus(job.id, {
          status: 'completed',
          completedAt: Date.now(),
          result: apiResult.result,
        })

        broadcastStatus(job.id, 'completed', apiResult.result)

        // Update toast notification
        if (typeof window !== 'undefined') {
          const { toast } = await import('sonner')
          toast.success('Voice processing complete!', {
            id: `voice-job-${job.id}`,
            description: `Created ${apiResult.result.tasksCount} task${apiResult.result.tasksCount !== 1 ? 's' : ''} and ${apiResult.result.remindersCount} reminder${apiResult.result.remindersCount !== 1 ? 's' : ''}`,
          })
        }

        // Dispatch events to trigger UI refresh
        if (typeof window !== 'undefined') {
          if (apiResult.result.tasksCount > 0 || apiResult.result.remindersCount > 0) {
            window.dispatchEvent(
              new CustomEvent('voice-processing-complete', {
                detail: {
                  tasksCount: apiResult.result.tasksCount,
                  remindersCount: apiResult.result.remindersCount,
                },
              })
            )
            window.dispatchEvent(new CustomEvent('tasks-updated'))
            localStorage.setItem('voice-processing-complete', Date.now().toString())
            localStorage.setItem('tasks-updated', Date.now().toString())
          }
        }

        // Show notification
        const updatedJob = await getJob(job.id)
        if (updatedJob) {
          await showCompletionNotification(updatedJob)
        }

        return
      } else {
        lastError = apiResult.error || 'Processing failed'
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Voice processing attempt failed', {
        jobId: job.id,
        attempt: attempt + 1,
        error: lastError,
      })
    }

    // If not the last attempt, wait before retrying
    if (attempt < MAX_ATTEMPTS - 1) {
      const delay = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1]
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // All attempts failed
  console.error('[Voice Processing] Job failed after all retries', {
    jobId: job.id,
    error: lastError,
    attempts: job.attempts,
  })

  await updateJobStatus(job.id, {
    status: 'failed',
    error: lastError,
    completedAt: Date.now(),
  })

  broadcastStatus(job.id, 'failed')

  // Update toast notification
  if (typeof window !== 'undefined') {
    const { toast } = await import('sonner')
    toast.error('Voice processing failed', {
      id: `voice-job-${job.id}`,
      description: 'The job will be retried automatically',
    })
  }

  logger.error('Voice processing failed after all retries', {
    jobId: job.id,
    error: lastError,
  })
}

/**
 * Register background sync for voice processing
 */
async function registerBackgroundSync(job: VoiceProcessingJob): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready

    if (!('sync' in registration)) {
      // Background Sync not supported
      return false
    }

    // Store job data in cache for service worker to access
    if ('caches' in window) {
      try {
        const cache = await caches.open('voice-jobs')
        await cache.put(
          `job-${job.id}`,
          new Response(JSON.stringify({
            recordingId: job.recordingId,
            transcription: job.transcription,
            aiSummary: job.aiSummary,
          }))
        )
      } catch (cacheError) {
        logger.warn('Failed to cache job data', { error: cacheError, jobId: job.id })
        // Continue anyway - service worker can request from client
      }
    }

    // Register sync event
    await registration.sync.register(`${SYNC_TAG}-${job.id}`)
    return true
  } catch (error) {
    logger.error('Failed to register background sync', { error, jobId: job.id })
    return false
  }
}

/**
 * Process voice job (main entry point)
 */
export async function processVoiceJob(job: VoiceProcessingJob): Promise<void> {
  console.log('[Voice Processing] Starting processVoiceJob', {
    jobId: job.id,
    recordingId: job.recordingId,
    status: job.status,
  })

  try {
    // Save job first (critical - must complete)
    await saveProcessingJob(job)
    console.log('[Voice Processing] Job saved to IndexedDB', { jobId: job.id })
  } catch (error) {
    console.error('[Voice Processing] Failed to save job (continuing anyway)', {
      jobId: job.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    // Continue even if save fails - we'll try to process anyway
  }

  // Try to register background sync in the background (non-blocking)
  // This is just a backup - don't wait for it
  registerBackgroundSync(job)
    .then((syncRegistered) => {
      if (syncRegistered) {
        console.log('[Voice Processing] Background sync registered as backup', { jobId: job.id })
        logger.info('Background sync registered for voice job', { jobId: job.id })
      }
    })
    .catch((error) => {
      console.warn('[Voice Processing] Background sync registration failed (non-critical)', {
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      // Ignore errors - background sync is optional
    })

  // ALWAYS process immediately - don't wait for anything
  console.log('[Voice Processing] Processing immediately', { jobId: job.id })
  logger.info('Processing voice job immediately', { jobId: job.id })
  
  // Process immediately - don't await, let it run in background
  // But wrap in try-catch to ensure errors are logged
  processJobWithRetry(job)
    .then(() => {
      console.log('[Voice Processing] Job processing completed', { jobId: job.id })
    })
    .catch((error) => {
      console.error('[Voice Processing] Fatal error in processJobWithRetry', {
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      })
      // Update job status to failed
      updateJobStatus(job.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: Date.now(),
      }).catch((updateError) => {
        console.error('[Voice Processing] Failed to update job status', {
          jobId: job.id,
          error: updateError,
        })
      })
    })
}

/**
 * Retry a failed job
 */
export async function retryJob(jobId: string): Promise<void> {
  const job = await getJob(jobId)
  if (!job) {
    logger.warn('Job not found for retry', { jobId })
    return
  }

  // Reset job for retry
  const retryJob: VoiceProcessingJob = {
    ...job,
    status: 'pending',
    attempts: 0,
    error: undefined,
  }

  await processVoiceJob(retryJob)
}

/**
 * Get BroadcastChannel for listening to job updates
 */
export function getJobBroadcastChannel(): BroadcastChannel | null {
  return broadcastChannel
}

/**
 * Manually retry all pending jobs
 * Can be called from browser console: window.retryPendingVoiceJobs()
 */
export async function retryAllPendingJobs(): Promise<void> {
  if (typeof window === 'undefined') return

  console.log('[Voice Processing] Retrying all pending jobs')
  const pendingJobs = await loadPendingJobs()
  
  console.log(`[Voice Processing] Found ${pendingJobs.length} pending jobs`)
  
  for (const job of pendingJobs) {
    console.log(`[Voice Processing] Retrying job ${job.id}`, {
      status: job.status,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
    })
    
    try {
      // Reset job for retry
      const retryJob: VoiceProcessingJob = {
        ...job,
        status: 'pending',
        attempts: 0,
        error: undefined,
      }
      
      await processVoiceJob(retryJob)
    } catch (error) {
      console.error(`[Voice Processing] Failed to retry job ${job.id}`, error)
    }
  }
  
  console.log('[Voice Processing] Finished retrying pending jobs')
}

// Expose to window for manual retry from console
if (typeof window !== 'undefined') {
  (window as any).retryPendingVoiceJobs = retryAllPendingJobs
  (window as any).processVoiceJob = processVoiceJob // Also expose main function for debugging
  console.log('[Voice Processing] Debug functions available: window.retryPendingVoiceJobs(), window.processVoiceJob(job)')
}

/**
 * Setup service worker message handler for background sync
 */
export function setupServiceWorkerMessageHandler() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return () => {}
  }

  const handleMessage = async (event: MessageEvent) => {
    // Handle request for job data from service worker
    if (event.data?.type === 'GET_VOICE_JOB') {
      const { jobId } = event.data
      const job = await getJob(jobId)
      
      // Respond via message channel if available
      if (event.ports?.[0]) {
        if (job) {
          event.ports[0].postMessage({ 
            job: {
              recordingId: job.recordingId,
              transcription: job.transcription,
              aiSummary: job.aiSummary,
            }
          })
        } else {
          event.ports[0].postMessage({ error: 'Job not found' })
        }
      }
    } 
    // Handle job completion notification from service worker
    else if (event.data?.type === 'VOICE_JOB_COMPLETE') {
      const { jobId, result } = event.data
      
      // Update job status
      await updateJobStatus(jobId, {
        status: 'completed',
        completedAt: Date.now(),
        result,
      })

      broadcastStatus(jobId, 'completed', result)

      // Dispatch events to trigger UI refresh
      if (typeof window !== 'undefined') {
        if (result.tasksCount > 0 || result.remindersCount > 0) {
          window.dispatchEvent(
            new CustomEvent('voice-processing-complete', {
              detail: {
                tasksCount: result.tasksCount,
                remindersCount: result.remindersCount,
              },
            })
          )
          window.dispatchEvent(new CustomEvent('tasks-updated'))
          localStorage.setItem('voice-processing-complete', Date.now().toString())
          localStorage.setItem('tasks-updated', Date.now().toString())
        }
      }
    } 
    // Handle job failure notification from service worker
    else if (event.data?.type === 'VOICE_JOB_FAILED') {
      const { jobId, error } = event.data
      
      // Update job status
      await updateJobStatus(jobId, {
        status: 'failed',
        error,
        completedAt: Date.now(),
      })

      broadcastStatus(jobId, 'failed')
    }
  }

  navigator.serviceWorker.addEventListener('message', handleMessage)

  // Return cleanup function
  return () => {
    navigator.serviceWorker.removeEventListener('message', handleMessage)
  }
}

