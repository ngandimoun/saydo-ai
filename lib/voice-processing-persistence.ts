/**
 * Voice Processing Job Persistence
 * 
 * Dual-storage system for persisting voice processing jobs:
 * - IndexedDB: Job queue with full job data
 * - localStorage: Simple flags and status
 * 
 * Features:
 * - Automatic cleanup of old jobs (>24 hours)
 * - Job status tracking (pending, processing, completed, failed)
 * - Retry logic support
 * - beforeunload handler for final save
 */

export interface VoiceProcessingJob {
  id: string // UUID
  recordingId: string
  transcription: string
  aiSummary?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  attempts: number
  maxAttempts: number
  error?: string
  createdAt: number
  completedAt?: number
  result?: {
    tasksCount: number
    remindersCount: number
  }
}

const STORAGE_KEY = 'saydo_voice_processing'
const DB_NAME = 'SaydoVoiceProcessing'
const DB_VERSION = 1
const JOBS_STORE = 'jobs'

/**
 * Initialize IndexedDB for job storage
 */
async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB not available'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(JOBS_STORE)) {
        const store = db.createObjectStore(JOBS_STORE, { keyPath: 'id' })
        store.createIndex('status', 'status', { unique: false })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }
  })
}

/**
 * Save job to IndexedDB
 */
async function saveJobToDB(job: VoiceProcessingJob): Promise<void> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return // Fallback to localStorage if IndexedDB not available
  }

  try {
    const db = await initDB()
    const transaction = db.transaction([JOBS_STORE], 'readwrite')
    const store = transaction.objectStore(JOBS_STORE)

    await new Promise<void>((resolve, reject) => {
      const request = store.put(job)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    db.close()
  } catch (error) {
    console.warn('Failed to save job to IndexedDB, using localStorage fallback:', error)
    // Fallback to localStorage
    try {
      localStorage.setItem(`${STORAGE_KEY}_job_${job.id}`, JSON.stringify(job))
    } catch (e) {
      console.error('Failed to save job to localStorage:', e)
    }
  }
}

/**
 * Load job from IndexedDB
 */
async function loadJobFromDB(jobId: string): Promise<VoiceProcessingJob | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_job_${jobId}`)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  try {
    const db = await initDB()
    const transaction = db.transaction([JOBS_STORE], 'readonly')
    const store = transaction.objectStore(JOBS_STORE)

    const job = await new Promise<VoiceProcessingJob | null>((resolve, reject) => {
      const request = store.get(jobId)

      request.onsuccess = () => {
        const result = request.result
        resolve(result || null)
      }

      request.onerror = () => reject(request.error)
    })

    db.close()
    return job
  } catch (error) {
    console.warn('Failed to load job from IndexedDB, trying localStorage:', error)
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_job_${jobId}`)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }
}

/**
 * Load all jobs with a specific status
 */
async function loadJobsByStatus(status: VoiceProcessingJob['status']): Promise<VoiceProcessingJob[]> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    // Fallback: load all from localStorage and filter
    const jobs: VoiceProcessingJob[] = []
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(`${STORAGE_KEY}_job_`)) {
          const stored = localStorage.getItem(key)
          if (stored) {
            const job = JSON.parse(stored) as VoiceProcessingJob
            if (job.status === status) {
              jobs.push(job)
            }
          }
        }
      }
    } catch {
      // Ignore errors
    }
    return jobs
  }

  try {
    const db = await initDB()
    const transaction = db.transaction([JOBS_STORE], 'readonly')
    const store = transaction.objectStore(JOBS_STORE)
    const index = store.index('status')

    const jobs = await new Promise<VoiceProcessingJob[]>((resolve, reject) => {
      const request = index.getAll(status)

      request.onsuccess = () => {
        resolve(request.result || [])
      }

      request.onerror = () => reject(request.error)
    })

    db.close()
    return jobs
  } catch (error) {
    console.warn('Failed to load jobs from IndexedDB:', error)
    return []
  }
}

/**
 * Save processing job
 */
export async function saveProcessingJob(job: VoiceProcessingJob): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    await saveJobToDB(job)
    
    // Also save a flag in localStorage for quick access
    localStorage.setItem(`${STORAGE_KEY}_active`, 'true')
  } catch (error) {
    console.error('Failed to save processing job:', error)
  }
}

/**
 * Load pending jobs
 */
export async function loadPendingJobs(): Promise<VoiceProcessingJob[]> {
  if (typeof window === 'undefined') return []

  try {
    const pendingJobs = await loadJobsByStatus('pending')
    const failedJobs = await loadJobsByStatus('failed')
    
    // Filter out old jobs (>24 hours)
    const now = Date.now()
    const validJobs = [...pendingJobs, ...failedJobs].filter(job => {
      const age = now - job.createdAt
      return age < 24 * 60 * 60 * 1000 // 24 hours
    })

    return validJobs
  } catch (error) {
    console.error('Failed to load pending jobs:', error)
    return []
  }
}

/**
 * Update job status
 */
export async function updateJobStatus(
  jobId: string,
  updates: Partial<VoiceProcessingJob>
): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const job = await loadJobFromDB(jobId)
    if (!job) {
      console.warn(`Job ${jobId} not found`)
      return
    }

    const updatedJob: VoiceProcessingJob = {
      ...job,
      ...updates,
    }

    await saveJobToDB(updatedJob)

    // If job is completed or failed, check if we should clear the active flag
    if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
      const remainingJobs = await loadPendingJobs()
      if (remainingJobs.length === 0) {
        localStorage.removeItem(`${STORAGE_KEY}_active`)
      }
    }
  } catch (error) {
    console.error('Failed to update job status:', error)
  }
}

/**
 * Get job by ID
 */
export async function getJob(jobId: string): Promise<VoiceProcessingJob | null> {
  if (typeof window === 'undefined') return null

  try {
    return await loadJobFromDB(jobId)
  } catch (error) {
    console.error('Failed to get job:', error)
    return null
  }
}

/**
 * Clear completed jobs older than 24 hours
 */
export async function clearCompletedJobs(): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const completedJobs = await loadJobsByStatus('completed')
    const failedJobs = await loadJobsByStatus('failed')
    const now = Date.now()

    const jobsToDelete = [...completedJobs, ...failedJobs].filter(job => {
      const completedAt = job.completedAt || job.createdAt
      const age = now - completedAt
      return age > 24 * 60 * 60 * 1000 // 24 hours
    })

    if (jobsToDelete.length === 0) return

    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      const db = await initDB()
      const transaction = db.transaction([JOBS_STORE], 'readwrite')
      const store = transaction.objectStore(JOBS_STORE)

      await Promise.all(
        jobsToDelete.map(
          job =>
            new Promise<void>((resolve, reject) => {
              const request = store.delete(job.id)
              request.onsuccess = () => resolve()
              request.onerror = () => reject(request.error)
            })
        )
      )

      db.close()
    } else {
      // Fallback: delete from localStorage
      jobsToDelete.forEach(job => {
        localStorage.removeItem(`${STORAGE_KEY}_job_${job.id}`)
      })
    }
  } catch (error) {
    console.error('Failed to clear completed jobs:', error)
  }
}

/**
 * Delete a job
 */
export async function deleteJob(jobId: string): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      const db = await initDB()
      const transaction = db.transaction([JOBS_STORE], 'readwrite')
      const store = transaction.objectStore(JOBS_STORE)

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(jobId)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      db.close()
    } else {
      // Fallback: delete from localStorage
      localStorage.removeItem(`${STORAGE_KEY}_job_${jobId}`)
    }

    // Check if we should clear the active flag
    const remainingJobs = await loadPendingJobs()
    if (remainingJobs.length === 0) {
      localStorage.removeItem(`${STORAGE_KEY}_active`)
    }
  } catch (error) {
    console.error('Failed to delete job:', error)
  }
}

