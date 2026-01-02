/**
 * Audio Player State Persistence
 * 
 * Dual-storage system for persisting audio player state:
 * - localStorage: Simple state (isPlaying, currentTime, volume, etc.)
 * - IndexedDB: Playlists and full track data (handles large playlists)
 * 
 * Features:
 * - Debounced saves (every 2 seconds or on critical changes)
 * - Automatic restore on mount
 * - beforeunload handler for final save
 */

import type { AudioTrack } from '@/components/dashboard/dashboard-layout-client'

export interface PersistedPlayerState {
  currentTrackId: string | null
  playlist: AudioTrack[]
  currentTime: number
  isPlaying: boolean
  volume: number
  isMuted: boolean
  isShuffled: boolean
  repeatMode: 'off' | 'all' | 'one'
  timestamp: number
}

const STORAGE_KEY = 'saydo_audio_player_state'
const DB_NAME = 'SaydoAudioPlayer'
const DB_VERSION = 1
const PLAYLIST_STORE = 'playlists'

// Debounce timer
let saveTimeout: NodeJS.Timeout | null = null
const SAVE_DEBOUNCE_MS = 2000

/**
 * Initialize IndexedDB for playlist storage
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
      if (!db.objectStoreNames.contains(PLAYLIST_STORE)) {
        db.createObjectStore(PLAYLIST_STORE, { keyPath: 'id' })
      }
    }
  })
}

/**
 * Save playlist to IndexedDB
 */
async function savePlaylistToDB(playlist: AudioTrack[]): Promise<void> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return // Fallback to localStorage if IndexedDB not available
  }

  try {
    const db = await initDB()
    const transaction = db.transaction([PLAYLIST_STORE], 'readwrite')
    const store = transaction.objectStore(PLAYLIST_STORE)

    // Save playlist with timestamp
    await new Promise<void>((resolve, reject) => {
      const request = store.put({
        id: 'current',
        playlist,
        timestamp: Date.now(),
      })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    db.close()
  } catch (error) {
    console.warn('Failed to save playlist to IndexedDB, using localStorage fallback:', error)
    // Fallback to localStorage
    try {
      localStorage.setItem(`${STORAGE_KEY}_playlist`, JSON.stringify(playlist))
    } catch (e) {
      console.error('Failed to save playlist to localStorage:', e)
    }
  }
}

/**
 * Load playlist from IndexedDB
 */
async function loadPlaylistFromDB(): Promise<AudioTrack[] | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_playlist`)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  try {
    const db = await initDB()
    const transaction = db.transaction([PLAYLIST_STORE], 'readonly')
    const store = transaction.objectStore(PLAYLIST_STORE)

    const playlist = await new Promise<AudioTrack[] | null>((resolve, reject) => {
      const request = store.get('current')

      request.onsuccess = () => {
        const result = request.result
        resolve(result?.playlist || null)
      }

      request.onerror = () => reject(request.error)
    })

    db.close()
    return playlist
  } catch (error) {
    console.warn('Failed to load playlist from IndexedDB, trying localStorage:', error)
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_playlist`)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }
}

/**
 * Save player state (debounced)
 */
export async function savePlayerState(state: Omit<PersistedPlayerState, 'timestamp'>): Promise<void> {
  if (typeof window === 'undefined') return

  // Clear existing timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }

  // Debounce save
  saveTimeout = setTimeout(async () => {
    try {
      const persistedState: PersistedPlayerState = {
        ...state,
        timestamp: Date.now(),
      }

      // Save simple state to localStorage
      const simpleState = {
        currentTrackId: persistedState.currentTrackId,
        currentTime: persistedState.currentTime,
        isPlaying: persistedState.isPlaying,
        volume: persistedState.volume,
        isMuted: persistedState.isMuted,
        isShuffled: persistedState.isShuffled,
        repeatMode: persistedState.repeatMode,
        timestamp: persistedState.timestamp,
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(simpleState))

      // Save playlist to IndexedDB (or localStorage fallback)
      if (persistedState.playlist.length > 0) {
        await savePlaylistToDB(persistedState.playlist)
      } else {
        // Clear playlist if empty
        try {
          const db = await initDB()
          const transaction = db.transaction([PLAYLIST_STORE], 'readwrite')
          const store = transaction.objectStore(PLAYLIST_STORE)
          store.delete('current')
          db.close()
        } catch {
          localStorage.removeItem(`${STORAGE_KEY}_playlist`)
        }
      }
    } catch (error) {
      console.error('Failed to save player state:', error)
    }
  }, SAVE_DEBOUNCE_MS)
}

/**
 * Save player state immediately (for critical changes like track change)
 */
export async function savePlayerStateImmediate(
  state: Omit<PersistedPlayerState, 'timestamp'>
): Promise<void> {
  if (typeof window === 'undefined') return

  // Clear debounce timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout)
    saveTimeout = null
  }

  try {
    const persistedState: PersistedPlayerState = {
      ...state,
      timestamp: Date.now(),
    }

    // Save simple state to localStorage
    const simpleState = {
      currentTrackId: persistedState.currentTrackId,
      currentTime: persistedState.currentTime,
      isPlaying: persistedState.isPlaying,
      volume: persistedState.volume,
      isMuted: persistedState.isMuted,
      isShuffled: persistedState.isShuffled,
      repeatMode: persistedState.repeatMode,
      timestamp: persistedState.timestamp,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(simpleState))

    // Save playlist to IndexedDB (or localStorage fallback)
    if (persistedState.playlist.length > 0) {
      await savePlaylistToDB(persistedState.playlist)
    } else {
      // Clear playlist if empty
      try {
        const db = await initDB()
        const transaction = db.transaction([PLAYLIST_STORE], 'readwrite')
        const store = transaction.objectStore(PLAYLIST_STORE)
        store.delete('current')
        db.close()
      } catch {
        localStorage.removeItem(`${STORAGE_KEY}_playlist`)
      }
    }
  } catch (error) {
    console.error('Failed to save player state:', error)
  }
}

/**
 * Load player state
 */
export async function loadPlayerState(): Promise<PersistedPlayerState | null> {
  if (typeof window === 'undefined') return null

  try {
    // Load simple state from localStorage
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const simpleState = JSON.parse(stored)

    // Load playlist from IndexedDB (or localStorage fallback)
    const playlist = await loadPlaylistFromDB()

    // Check if state is too old (older than 24 hours, don't restore)
    const age = Date.now() - (simpleState.timestamp || 0)
    if (age > 24 * 60 * 60 * 1000) {
      clearPlayerState()
      return null
    }

    return {
      currentTrackId: simpleState.currentTrackId || null,
      playlist: playlist || [],
      currentTime: simpleState.currentTime || 0,
      isPlaying: simpleState.isPlaying || false,
      volume: simpleState.volume ?? 1,
      isMuted: simpleState.isMuted || false,
      isShuffled: simpleState.isShuffled || false,
      repeatMode: simpleState.repeatMode || 'off',
      timestamp: simpleState.timestamp || Date.now(),
    }
  } catch (error) {
    console.error('Failed to load player state:', error)
    return null
  }
}

/**
 * Clear player state
 */
export function clearPlayerState(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(`${STORAGE_KEY}_playlist`)

    // Clear IndexedDB
    if ('indexedDB' in window) {
      initDB()
        .then((db) => {
          const transaction = db.transaction([PLAYLIST_STORE], 'readwrite')
          const store = transaction.objectStore(PLAYLIST_STORE)
          store.delete('current')
          db.close()
        })
        .catch(() => {
          // Ignore errors
        })
    }
  } catch (error) {
    console.error('Failed to clear player state:', error)
  }
}

/**
 * Setup beforeunload handler for final save
 */
export function setupBeforeUnloadHandler(
  getState: () => Omit<PersistedPlayerState, 'timestamp'>
): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handleBeforeUnload = () => {
    // Save immediately on beforeunload
    savePlayerStateImmediate(getState())
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('pagehide', handleBeforeUnload) // For mobile browsers

  // Return cleanup function
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
    window.removeEventListener('pagehide', handleBeforeUnload)
  }
}

