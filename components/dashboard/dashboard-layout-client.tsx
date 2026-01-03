"use client"

import { useState, createContext, useContext, useCallback, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { LanguageProvider } from "@/lib/language-context"
import { LocationUpdaterProvider } from "@/components/location-updater-provider"
import { NotificationProvider } from "@/components/providers/notification-provider"
import { BottomNav } from "@/components/dashboard/navigation/bottom-nav"
import { VoiceFab } from "@/components/dashboard/navigation/voice-fab"
import { VoiceRecorderModal } from "@/components/dashboard/voice-recorder-modal"
import { ChatFab } from "@/components/chat/chat-fab"
import { ChatModal } from "@/components/chat/chat-modal"
import { MiniPlayer } from "@/components/dashboard/player/mini-player"
import { FullPlayer, type FullPlayerTrack } from "@/components/dashboard/player/full-player"
import { springs } from "@/lib/motion-system"
import { getAudioPlayer, isMockAudioUrl } from "@/lib/audio-player"
import { logger } from "@/lib/logger"
import type { AudioTrack as MediaSessionTrack } from "@/lib/media-session"
import {
  savePlayerState,
  savePlayerStateImmediate,
  loadPlayerState,
  clearPlayerState,
  setupBeforeUnloadHandler,
} from "@/lib/audio-player-persistence"
import {
  loadPendingJobs,
} from "@/lib/voice-processing-persistence"
import {
  retryJob,
  setupServiceWorkerMessageHandler,
  getJobBroadcastChannel,
  processVoiceJob,
} from "@/lib/voice-processing-service"

/**
 * Dashboard Layout - Airbnb-Inspired
 * 
 * This layout wraps all dashboard tab pages with:
 * - Smooth page transitions between tabs
 * - Bottom navigation bar with glass-morphism
 * - Center floating voice orb
 * - Persistent mini audio player (when navigating away from Calm Zone)
 * - Full-screen audio player (Spotify-like, opens from Calm Zone)
 * - Voice recording modal
 */

// Extended track type with category and thumbnail
export interface AudioTrack {
  id: string
  title: string
  narrator?: string
  audioUrl: string
  durationSeconds: number
  thumbnailUrl?: string
  category?: string
}

// Audio player context for sharing state across tabs
interface AudioPlayerState {
  isPlaying: boolean
  isFullPlayerOpen: boolean
  currentTrack: AudioTrack | null
  playlist: AudioTrack[]
  currentTime: number
  audioError: string | null
  // Basic controls
  setTrack: (track: AudioTrack) => void
  play: () => void
  pause: () => void
  seek: (time: number) => void
  close: () => void
  clearError: () => void
  // Full player controls
  openFullPlayer: (track: AudioTrack, playlist?: AudioTrack[]) => void
  closeFullPlayer: () => void
  // Playlist navigation
  next: () => void
  previous: () => void
}

const AudioPlayerContext = createContext<AudioPlayerState | null>(null)

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext)
  if (!context) {
    throw new Error('useAudioPlayer must be used within DashboardLayout')
  }
  return context
}

// Page transition variants - Optimized for faster navigation
const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
    scale: 0.99,
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2, // Reduced from 0.35 for faster perceived navigation
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.99,
    transition: {
      duration: 0.15, // Reduced from 0.2 for faster perceived navigation
      ease: [0.4, 0, 1, 1],
    },
  },
}

interface DashboardLayoutClientProps {
  children: React.ReactNode
}

export function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  const pathname = usePathname()
  const audioPlayerRef = useRef<ReturnType<typeof getAudioPlayer> | null>(null)
  
  // Voice recorder state
  const [isRecorderOpen, setIsRecorderOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null)
  const [playlist, setPlaylist] = useState<AudioTrack[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const isMountedRef = useRef(true)
  
  // Shuffle and repeat state
  const [isShuffled, setIsShuffled] = useState(false)
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off')
  const originalPlaylistRef = useRef<AudioTrack[]>([])
  const shouldAutoPlayRef = useRef(false)
  const repeatModeRef = useRef<'off' | 'all' | 'one'>('off')
  const playlistRef = useRef<AudioTrack[]>([])
  const currentTrackRef = useRef<AudioTrack | null>(null)
  const isPlayingRef = useRef(false)
  const isRestoringRef = useRef(false)
  const savedCurrentTimeRef = useRef<number | null>(null)
  
  // Keep refs in sync with state
  useEffect(() => {
    repeatModeRef.current = repeatMode
  }, [repeatMode])
  
  useEffect(() => {
    playlistRef.current = playlist
  }, [playlist])
  
  useEffect(() => {
    currentTrackRef.current = currentTrack
  }, [currentTrack])

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  // Setup voice processing service worker message handler
  useEffect(() => {
    if (typeof window === 'undefined') return

    const cleanup = setupServiceWorkerMessageHandler()

    // Listen for job status updates via BroadcastChannel
    const broadcastChannel = getJobBroadcastChannel()
    if (broadcastChannel) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'job-status') {
          const { jobId, status, result } = event.data
          logger.info('Voice job status update', { jobId, status, result })

          // Dispatch events to trigger UI refresh if completed
          if (status === 'completed' && result) {
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
              }
            }
          }
        }
      }

      broadcastChannel.addEventListener('message', handleMessage)

      return () => {
        broadcastChannel.removeEventListener('message', handleMessage)
        cleanup()
      }
    }

    return cleanup
  }, [])

  // Check for pending voice processing jobs on mount and periodically
  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkPendingJobs = async () => {
      try {
        const pendingJobs = await loadPendingJobs()
        
        if (pendingJobs.length > 0) {
          console.log('[Dashboard] Found pending voice processing jobs', { count: pendingJobs.length })
          logger.info('Found pending voice processing jobs', { count: pendingJobs.length })

          // Process all pending and failed jobs
          for (const job of pendingJobs) {
            if (job.status === 'failed' && job.attempts < job.maxAttempts) {
              console.log('[Dashboard] Retrying failed voice job', { jobId: job.id })
              logger.info('Retrying failed voice job', { jobId: job.id })
              await retryJob(job.id)
            } else if (job.status === 'pending') {
              // Process pending jobs immediately
              console.log('[Dashboard] Processing pending voice job', { jobId: job.id })
              logger.info('Processing pending voice job', { jobId: job.id })
              // Don't await - let them process in parallel
              processVoiceJob(job).catch((error) => {
                console.error('[Dashboard] Failed to process pending job', { jobId: job.id, error })
                logger.error('Failed to process pending job', { jobId: job.id, error })
              })
            } else if (job.status === 'processing') {
              // Check if job has been processing for too long (>5 minutes) and retry
              const age = Date.now() - job.createdAt
              if (age > 5 * 60 * 1000) {
                console.log('[Dashboard] Job stuck in processing, retrying', { jobId: job.id, age })
                const retryJobData: VoiceProcessingJob = {
                  ...job,
                  status: 'pending',
                  attempts: 0,
                  error: undefined,
                }
                processVoiceJob(retryJobData).catch((error) => {
                  console.error('[Dashboard] Failed to retry stuck job', { jobId: job.id, error })
                })
              }
            }
          }
        }
      } catch (error) {
        console.error('[Dashboard] Failed to check pending jobs', { error })
        logger.error('Failed to check pending jobs', { error })
      }
    }

    // Check immediately and then periodically
    checkPendingJobs()
    const interval = setInterval(checkPendingJobs, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  // Check for urgent tasks and reminders periodically
  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkUrgentItems = async () => {
      try {
        const response = await fetch('/api/notifications/check-urgent', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.notificationsCreated > 0) {
            console.log('[Dashboard] Created notifications for urgent items', {
              count: data.notificationsCreated,
            })
            logger.info('Created notifications for urgent items', {
              count: data.notificationsCreated,
            })
          }
        } else {
          console.error('[Dashboard] Failed to check urgent items', {
            status: response.status,
          })
        }
      } catch (error) {
        console.error('[Dashboard] Error checking urgent items', { error })
        logger.error('Error checking urgent items', { error })
      }
    }

    // Check immediately and then periodically (every 5 minutes)
    checkUrgentItems()
    const interval = setInterval(checkUrgentItems, 5 * 60 * 1000) // Check every 5 minutes

    return () => clearInterval(interval)
  }, [])

  // Initialize audio player
  useEffect(() => {
    if (typeof window === 'undefined') return

    isMountedRef.current = true
    audioPlayerRef.current = getAudioPlayer()

    // Restore player state after audio player is initialized
    const restoreState = async () => {
      try {
        const savedState = await loadPlayerState()
        if (savedState && savedState.currentTrackId) {
          // Find the track in the saved playlist
          const savedTrack = savedState.playlist.find(
            (t) => t.id === savedState.currentTrackId
          )

          if (savedTrack) {
            // Set restoring flag
            isRestoringRef.current = true
            savedCurrentTimeRef.current = savedState.currentTime

            // Restore playlist and track
            setPlaylist(savedState.playlist)
            originalPlaylistRef.current = [...savedState.playlist]
            setCurrentTrack(savedTrack)
            setCurrentTime(savedState.currentTime)
            setVolume(savedState.volume)
            setIsMuted(savedState.isMuted)
            setIsShuffled(savedState.isShuffled)
            setRepeatMode(savedState.repeatMode)

            // Restore playing state if it was playing
            if (savedState.isPlaying) {
              // Wait for audio source to be set and ready, then seek and play
              const attemptRestore = () => {
                if (!isMountedRef.current || !audioPlayerRef.current) {
                  return false
                }

                const readyState = audioPlayerRef.current.getReadyState()
                // HAVE_FUTURE_DATA (3) or HAVE_ENOUGH_DATA (4) means we can seek and play
                if (readyState >= 3 && savedCurrentTimeRef.current !== null) {
                  // Seek to saved position
                  audioPlayerRef.current.seek(savedCurrentTimeRef.current)
                  setCurrentTime(savedCurrentTimeRef.current)
                  
                  // Resume playback
                  shouldAutoPlayRef.current = true
                  setIsPlaying(true)
                  
                  // Clear restoring flag
                  isRestoringRef.current = false
                  savedCurrentTimeRef.current = null
                  return true
                }
                return false
              }

              // Try immediately first
              if (!attemptRestore()) {
                // If not ready, wait and retry
                const timeouts: NodeJS.Timeout[] = []
                const delays = [100, 200, 300, 500, 1000]
                
                delays.forEach((delay) => {
                  const timeoutId = setTimeout(() => {
                    if (isRestoringRef.current && attemptRestore()) {
                      // Successfully restored, clear remaining timeouts
                      timeouts.forEach(clearTimeout)
                    }
                  }, delay)
                  timeouts.push(timeoutId)
                })

                // Fallback: clear restoring flag after max delay
                setTimeout(() => {
                  if (isRestoringRef.current) {
                    isRestoringRef.current = false
                    savedCurrentTimeRef.current = null
                  }
                }, 2000)
              }
            } else {
              // Not playing, just seek to saved position
              const attemptSeek = () => {
                if (!isMountedRef.current || !audioPlayerRef.current) {
                  return false
                }

                const readyState = audioPlayerRef.current.getReadyState()
                if (readyState >= 3 && savedCurrentTimeRef.current !== null) {
                  audioPlayerRef.current.seek(savedCurrentTimeRef.current)
                  setCurrentTime(savedCurrentTimeRef.current)
                  isRestoringRef.current = false
                  savedCurrentTimeRef.current = null
                  return true
                }
                return false
              }

              if (!attemptSeek()) {
                setTimeout(() => {
                  attemptSeek()
                  if (isRestoringRef.current) {
                    isRestoringRef.current = false
                    savedCurrentTimeRef.current = null
                  }
                }, 500)
              }
            }
          }
        }
      } catch (error) {
        logger.error('Failed to restore player state', { error })
        isRestoringRef.current = false
        savedCurrentTimeRef.current = null
      }
    }

    // Restore state after a short delay to ensure audio player is ready
    setTimeout(() => {
      restoreState()
    }, 100)

    audioPlayerRef.current.setCallbacks({
      onPlay: () => {
        if (isMountedRef.current) {
          setIsPlaying(true)
          setAudioError(null)
        }
      },
      onPause: () => {
        // Don't set isPlaying to false if we're about to auto-play a new track
        // This prevents interference when switching tracks
        // Use a small delay to check shouldAutoPlayRef after it might have been set
        if (isMountedRef.current) {
          setTimeout(() => {
            // Only update isPlaying if we're not in the middle of an auto-play transition
            // The track change effect will handle setting isPlaying appropriately
            if (isMountedRef.current && !shouldAutoPlayRef.current) {
              setIsPlaying(false)
            }
          }, 50)
        }
      },
      onEnded: () => {
        if (!isMountedRef.current) return
        
        setIsPlaying(false)
        setCurrentTime(0)
        
        // Handle repeat modes - use refs to get current values
        const currentRepeatMode = repeatModeRef.current
        const currentPlaylist = playlistRef.current
        const currentTrackValue = currentTrackRef.current
        
        if (currentRepeatMode === 'one') {
          // Repeat current track
          if (audioPlayerRef.current && currentTrackValue) {
            audioPlayerRef.current.seek(0)
            setIsPlaying(true)
          }
        } else if (currentRepeatMode === 'all') {
          // Loop playlist
          const currentIndex = currentPlaylist.findIndex(t => t.id === currentTrackValue?.id)
          if (currentIndex === currentPlaylist.length - 1) {
            // At end of playlist, play first track
            if (currentPlaylist.length > 0) {
              setCurrentTrack(currentPlaylist[0])
              setCurrentTime(0)
              shouldAutoPlayRef.current = true
            }
          } else {
            // Play next track - need to call the function that uses current state
            const nextIndex = currentIndex + 1
            if (nextIndex < currentPlaylist.length) {
              setCurrentTrack(currentPlaylist[nextIndex])
              setCurrentTime(0)
              shouldAutoPlayRef.current = true
            }
          }
        } else {
          // Repeat off - play next track if available
          const currentIndex = currentPlaylist.findIndex(t => t.id === currentTrackValue?.id)
          if (currentIndex < currentPlaylist.length - 1) {
            setCurrentTrack(currentPlaylist[currentIndex + 1])
            setCurrentTime(0)
            shouldAutoPlayRef.current = true
          }
        }
      },
      onTimeUpdate: (time) => {
        if (isMountedRef.current) {
          setCurrentTime(time)
        }
      },
      onLoadedMetadata: (dur) => {
        if (isMountedRef.current) {
          setDuration(dur)
        }
      },
      onCanPlay: () => {
        // Handle restore: seek to saved position and resume playback
        if (isRestoringRef.current && isMountedRef.current && audioPlayerRef.current && savedCurrentTimeRef.current !== null) {
          const savedTime = savedCurrentTimeRef.current
          audioPlayerRef.current.seek(savedTime)
          setCurrentTime(savedTime)
          
          // Resume playback if it was playing
          if (shouldAutoPlayRef.current) {
            shouldAutoPlayRef.current = false
            setTimeout(() => {
              if (isMountedRef.current && audioPlayerRef.current) {
                setIsPlaying(true)
              }
            }, 10)
          }
          
          // Clear restoring flag
          isRestoringRef.current = false
          savedCurrentTimeRef.current = null
          return
        }
        
        // Auto-play when audio is ready after track change
        if (shouldAutoPlayRef.current && isMountedRef.current && audioPlayerRef.current) {
          shouldAutoPlayRef.current = false
          // Use a small delay to ensure the track change effect has completed
          // and the audio element is fully ready
          setTimeout(() => {
            if (isMountedRef.current && audioPlayerRef.current) {
              setIsPlaying(true)
            }
          }, 10)
        }
      },
      onError: (error) => {
        if (!isMountedRef.current) return
        
        // Check if this is a mock URL error - handle gracefully without error spam
        const isMock = (error as any).isMockUrl
        if (isMock) {
          // This is expected for placeholder content - show user-friendly message
          setAudioError('This audio is not yet available')
          logger.info('Audio unavailable - placeholder content', { url: (error as any).url })
        } else {
          // Real error - log it
          logger.error('Audio player error', { error })
          setAudioError('Unable to play audio')
        }
        setIsPlaying(false)
        shouldAutoPlayRef.current = false
      },
    })

    return () => {
      isMountedRef.current = false
      if (audioPlayerRef.current) {
        audioPlayerRef.current.destroy()
        audioPlayerRef.current = null
      }
    }
  }, [])

  // Play next track
  const playNext = useCallback(() => {
    if (!currentTrack || playlist.length === 0) return
    
    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id)
    if (currentIndex === -1 || currentIndex >= playlist.length - 1) {
      // Handle repeat mode
      if (repeatModeRef.current === 'all' && playlist.length > 0) {
        // Loop to first track
        setCurrentTrack(playlist[0])
        setCurrentTime(0)
        shouldAutoPlayRef.current = true
        return
      }
      return
    }
    
    const nextTrack = playlist[currentIndex + 1]
    // Set auto-play flag BEFORE changing track
    shouldAutoPlayRef.current = true
    setCurrentTrack(nextTrack)
    setCurrentTime(0)
    // Ensure playing state is set immediately for better UX
    // The track change effect will handle actual playback
  }, [currentTrack, playlist])

  // Play previous track
  const playPrevious = useCallback(() => {
    if (!currentTrack || playlist.length === 0) return
    
    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id)
    if (currentIndex <= 0) {
      // Handle repeat mode
      if (repeatModeRef.current === 'all' && playlist.length > 0) {
        // Loop to last track
        setCurrentTrack(playlist[playlist.length - 1])
        setCurrentTime(0)
        shouldAutoPlayRef.current = true
        return
      }
      return
    }
    
    const prevTrack = playlist[currentIndex - 1]
    // Set auto-play flag BEFORE changing track
    shouldAutoPlayRef.current = true
    setCurrentTrack(prevTrack)
    setCurrentTime(0)
    // Ensure playing state is set immediately for better UX
    // The track change effect will handle actual playback
  }, [currentTrack, playlist])

  // Toggle shuffle
  const toggleShuffle = useCallback(() => {
    if (isShuffled) {
      // Restore original playlist order
      if (originalPlaylistRef.current.length > 0) {
        // Preserve current playing state using ref to get current value
        const wasPlaying = isPlayingRef.current
        setPlaylist([...originalPlaylistRef.current])
        setIsShuffled(false)
        // Restore playing state if it was playing
        if (wasPlaying) {
          // Use requestAnimationFrame to ensure playlist update completes
          requestAnimationFrame(() => {
            if (isMountedRef.current && isPlayingRef.current === wasPlaying) {
              setIsPlaying(true)
            }
          })
        }
      }
    } else {
      // Save original order and shuffle
      if (playlist.length > 0 && currentTrackRef.current) {
        // Preserve current playing state using ref to get current value
        const wasPlaying = isPlayingRef.current
        const currentTrackValue = currentTrackRef.current
        
        // Save original order
        originalPlaylistRef.current = [...playlist]
        
        // Separate current track from the rest
        const currentTrackId = currentTrackValue.id
        const otherTracks = playlist.filter(t => t.id !== currentTrackId)
        
        // Shuffle the other tracks (Fisher-Yates algorithm)
        const shuffled = [...otherTracks]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        
        // Create new playlist: current track at its original position, rest shuffled
        const newPlaylist = [...playlist]
        // Replace all tracks except current with shuffled ones
        let shuffledIndex = 0
        for (let i = 0; i < newPlaylist.length; i++) {
          if (newPlaylist[i].id !== currentTrackId) {
            newPlaylist[i] = shuffled[shuffledIndex++]
          }
        }
        
        setPlaylist(newPlaylist)
        setIsShuffled(true)
        
        // Restore playing state if it was playing
        if (wasPlaying) {
          // Use requestAnimationFrame to ensure playlist update completes
          requestAnimationFrame(() => {
            if (isMountedRef.current && isPlayingRef.current === wasPlaying) {
              setIsPlaying(true)
            }
          })
        }
      } else if (playlist.length > 0) {
        // No current track, just shuffle normally
        originalPlaylistRef.current = [...playlist]
        const shuffled = [...playlist]
        // Fisher-Yates shuffle algorithm
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        setPlaylist(shuffled)
        setIsShuffled(true)
      }
    }
  }, [isShuffled, playlist])

  // Toggle repeat mode
  const toggleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all'
      if (prev === 'all') return 'one'
      return 'off'
    })
  }, [])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!audioPlayerRef.current) return
    
    if (isMuted) {
      // Unmute - restore previous volume
      audioPlayerRef.current.setVolume(volume)
      setIsMuted(false)
    } else {
      // Mute - save current volume and set to 0
      const currentVolume = audioPlayerRef.current.getVolume()
      setVolume(currentVolume)
      audioPlayerRef.current.setVolume(0)
      setIsMuted(true)
    }
  }, [isMuted, volume])

  // Set volume
  const setVolumeValue = useCallback((newVolume: number) => {
    if (!audioPlayerRef.current) return
    
    const clampedVolume = Math.max(0, Math.min(1, newVolume))
    audioPlayerRef.current.setVolume(clampedVolume)
    setVolume(clampedVolume)
    setIsMuted(clampedVolume === 0)
  }, [])

  // Update audio player when track changes (set source only, don't play)
  useEffect(() => {
    if (!audioPlayerRef.current || !currentTrack || !isMountedRef.current) return

    // Pause current playback when switching tracks (unless we're restoring)
    if (!isRestoringRef.current) {
      // Set isPlaying to false first to ensure clean state
      setIsPlaying(false)
      audioPlayerRef.current.pause()
    }

    // Setup Media Session API for background playback
    const mediaSessionTrack: MediaSessionTrack = {
      id: currentTrack.id,
      title: currentTrack.title,
      narrator: currentTrack.narrator,
      audioUrl: currentTrack.audioUrl,
      durationSeconds: currentTrack.durationSeconds,
      thumbnailUrl: currentTrack.thumbnailUrl,
      category: currentTrack.category,
    }

    audioPlayerRef.current.setMediaSessionTrack(mediaSessionTrack, {
      onPrevious: playPrevious,
      onNext: playNext,
      onSeek: (time) => {
        if (audioPlayerRef.current && isMountedRef.current) {
          audioPlayerRef.current.seek(time)
          setCurrentTime(time)
        }
      },
    })

    // Check if URL is a mock/placeholder before setting source
    if (isMockAudioUrl(currentTrack.audioUrl)) {
      setAudioError('This audio is not yet available')
      setIsPlaying(false)
      shouldAutoPlayRef.current = false
      return
    }

    setAudioError(null)
    const isValid = audioPlayerRef.current.setSource(currentTrack.audioUrl)
    
    if (!isValid) {
      setAudioError('This audio is not yet available')
      setIsPlaying(false)
      shouldAutoPlayRef.current = false
      return
    }
    
    // Reset time when switching tracks (unless we're restoring from saved state)
    if (!isRestoringRef.current) {
      audioPlayerRef.current.seek(0)
      setCurrentTime(0)
    }
    
    // If we should auto-play, set up auto-play mechanism
    if (shouldAutoPlayRef.current) {
      // Function to check if audio is ready and play
      const checkAndPlay = () => {
        if (!audioPlayerRef.current || !isMountedRef.current) {
          return false
        }
        
        // If shouldAutoPlayRef was cleared, don't play
        if (!shouldAutoPlayRef.current) {
          return false
        }
        
        const readyState = audioPlayerRef.current.getReadyState()
        // HAVE_FUTURE_DATA (3) or HAVE_ENOUGH_DATA (4) means we can play
        if (readyState >= 3) {
          shouldAutoPlayRef.current = false
          // Use requestAnimationFrame to ensure this happens after pause callback
          requestAnimationFrame(() => {
            if (isMountedRef.current && audioPlayerRef.current) {
              setIsPlaying(true)
            }
          })
          return true
        }
        return false
      }
      
      // Check immediately first (audio might already be loaded)
      if (!checkAndPlay()) {
        // Audio not ready yet - set up retry mechanism
        // The onCanPlay callback should handle it, but we also have fallback timeouts
        const timeouts: NodeJS.Timeout[] = []
        const delays = [50, 100, 200, 300, 500, 1000]
        
        delays.forEach((delay) => {
          const timeoutId = setTimeout(() => {
            if (shouldAutoPlayRef.current) {
              checkAndPlay()
            }
          }, delay)
          timeouts.push(timeoutId)
        })
        
        // Cleanup timeouts if component unmounts or track changes
        return () => {
          timeouts.forEach(clearTimeout)
        }
      }
    }
  }, [currentTrack, playNext, playPrevious])

  // Sync playing state with audio player (single source of truth for play/pause)
  useEffect(() => {
    if (!audioPlayerRef.current || !isMountedRef.current) return

    if (isPlaying) {
      audioPlayerRef.current.play().catch((error) => {
        if (!isMountedRef.current) return
        
        // Handle AbortError silently (expected when interrupting play)
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
        
        const isMock = (error as any).isMockUrl
        if (isMock) {
          setAudioError('This audio is not yet available')
        } else {
          logger.error('Failed to play audio', { error })
          setAudioError('Unable to play audio')
        }
        setIsPlaying(false)
      })
    } else {
      audioPlayerRef.current.pause()
    }
  }, [isPlaying])

  // Open full player with track and optional playlist
  const openFullPlayer = useCallback((track: AudioTrack, newPlaylist?: AudioTrack[]) => {
    // If switching to a different track while one is playing, pause first
    if (currentTrack && currentTrack.id !== track.id && isPlaying) {
      audioPlayerRef.current?.pause()
      setIsPlaying(false)
    }
    
    setCurrentTrack(track)
    if (newPlaylist) {
      setPlaylist(newPlaylist)
      originalPlaylistRef.current = [...newPlaylist]
    }
    setCurrentTime(0)
    setAudioError(null)
    setIsFullPlayerOpen(true)
    
    // Check if URL is valid before attempting to play
    if (isMockAudioUrl(track.audioUrl)) {
      setAudioError('This audio is not yet available')
      setIsPlaying(false)
      shouldAutoPlayRef.current = false
    } else {
      // Set flag to auto-play when audio is ready
      shouldAutoPlayRef.current = true
      // The track change effect will set the source, and onCanPlay will trigger play
    }
  }, [currentTrack, isPlaying])

  // Close full player (show mini player if track is still playing)
  const closeFullPlayer = useCallback(() => {
    setIsFullPlayerOpen(false)
  }, [])

  const audioPlayerValue: AudioPlayerState = {
    isPlaying,
    isFullPlayerOpen,
    currentTrack,
    playlist,
    currentTime,
    audioError,
    setTrack: (track) => {
      setCurrentTrack(track)
      setCurrentTime(0)
      setAudioError(null)
      
      // Check for mock URLs before attempting to play
      if (isMockAudioUrl(track.audioUrl)) {
        setAudioError('This audio is not yet available')
        setIsPlaying(false)
        return
      }
      
      // Set playing state - the track change and isPlaying effects will handle the rest
      setIsPlaying(true)
    },
    play: () => {
      // Check if current track has a valid URL
      if (currentTrack && isMockAudioUrl(currentTrack.audioUrl)) {
        setAudioError('This audio is not yet available')
        setIsPlaying(false)
        return
      }
      
      // Set playing state - the isPlaying effect will handle actual playback
      setIsPlaying(true)
    },
    pause: () => {
      audioPlayerRef.current?.pause()
      setIsPlaying(false)
    },
    seek: (time) => {
      audioPlayerRef.current?.seek(time)
      setCurrentTime(time)
    },
    close: () => {
      audioPlayerRef.current?.stop()
      setCurrentTrack(null)
      setIsPlaying(false)
      setCurrentTime(0)
      setPlaylist([])
      setIsFullPlayerOpen(false)
      setAudioError(null)
      // Clear persisted state
      clearPlayerState()
    },
    clearError: () => {
      setAudioError(null)
    },
    openFullPlayer,
    closeFullPlayer,
    next: playNext,
    previous: playPrevious,
  }

  // Save state when it changes (debounced)
  useEffect(() => {
    if (!currentTrack) return // Don't save if no track

    savePlayerState({
      currentTrackId: currentTrack.id,
      playlist,
      currentTime,
      isPlaying,
      volume,
      isMuted,
      isShuffled,
      repeatMode,
    })
  }, [currentTrack, playlist, currentTime, isPlaying, volume, isMuted, isShuffled, repeatMode])

  // Save state immediately on critical changes (track change, play/pause)
  useEffect(() => {
    if (!currentTrack) return

    savePlayerStateImmediate({
      currentTrackId: currentTrack.id,
      playlist,
      currentTime,
      isPlaying,
      volume,
      isMuted,
      isShuffled,
      repeatMode,
    })
  }, [currentTrack?.id, isPlaying]) // Only on track ID change or play/pause

  // Setup beforeunload handler
  useEffect(() => {
    const cleanup = setupBeforeUnloadHandler(() => ({
      currentTrackId: currentTrack?.id || null,
      playlist,
      currentTime,
      isPlaying,
      volume,
      isMuted,
      isShuffled,
      repeatMode,
    }))

    return cleanup
  }, [currentTrack, playlist, currentTime, isPlaying, volume, isMuted, isShuffled, repeatMode])

  const handleVoiceButtonClick = () => {
    if (isRecording) {
      // If already recording, stop and process
      setIsRecording(false)
      setIsProcessing(true)
      // Simulate processing
      setTimeout(() => setIsProcessing(false), 2000)
    } else if (!isProcessing) {
      // Open the recorder modal
      setIsRecorderOpen(true)
    }
  }

  const handleRecordingStart = () => {
    setIsRecording(true)
  }

  const handleRecordingEnd = () => {
    setIsRecording(false)
    setIsProcessing(true)
    // TODO: Process voice note
    setTimeout(() => setIsProcessing(false), 2000)
  }

  // Check if we're on the Calm page
  const isOnCalmPage = pathname?.includes('/calm')

  return (
    <LanguageProvider>
      <LocationUpdaterProvider>
        <NotificationProvider>
          <AudioPlayerContext.Provider value={audioPlayerValue}>
          <div className="min-h-screen bg-background overflow-x-hidden">
            {/* Main content area with page transitions */}
            <main className="pb-28 min-h-screen">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={pathname}
                  initial="initial"
                  animate="enter"
                  exit="exit"
                  variants={pageVariants}
                  className="min-h-screen"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Mini audio player - shown when NOT on full player and track exists */}
            <AnimatePresence>
              {currentTrack && !isFullPlayerOpen && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  transition={springs.gentle}
                >
                  <MiniPlayer
                    track={currentTrack}
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    error={audioError}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onSeek={(time) => {
                      audioPlayerRef.current?.seek(time)
                      setCurrentTime(time)
                    }}
                    onClose={() => audioPlayerValue.close()}
                    onExpand={() => setIsFullPlayerOpen(true)}
                    onNext={playNext}
                    onPrevious={playPrevious}
                    onToggleShuffle={toggleShuffle}
                    onToggleRepeat={toggleRepeat}
                    isShuffled={isShuffled}
                    repeatMode={repeatMode}
                    hasNext={(() => {
                      if (!currentTrack || playlist.length === 0) return false
                      const currentIndex = playlist.findIndex(t => t.id === currentTrack.id)
                      return currentIndex >= 0 && currentIndex < playlist.length - 1
                    })()}
                    hasPrevious={(() => {
                      if (!currentTrack || playlist.length === 0) return false
                      const currentIndex = playlist.findIndex(t => t.id === currentTrack.id)
                      return currentIndex > 0
                    })()}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Full-screen audio player - Spotify-like */}
            <AnimatePresence>
              {isFullPlayerOpen && currentTrack && (
                <FullPlayer
                  isOpen={isFullPlayerOpen}
                  track={currentTrack}
                  playlist={playlist}
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  error={audioError}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onSeek={(time) => {
                    audioPlayerRef.current?.seek(time)
                    setCurrentTime(time)
                  }}
                  onClose={closeFullPlayer}
                  onNext={playNext}
                  onPrevious={playPrevious}
                  isShuffled={isShuffled}
                  onToggleShuffle={toggleShuffle}
                  repeatMode={repeatMode}
                  onToggleRepeat={toggleRepeat}
                  isMuted={isMuted}
                  onToggleMute={toggleMute}
                  volume={volume}
                  onVolumeChange={setVolumeValue}
                />
              )}
            </AnimatePresence>

            {/* Bottom navigation - hidden when full player is open */}
            {!isFullPlayerOpen && <BottomNav />}

            {/* Center voice FAB - hidden when full player is open */}
            {!isFullPlayerOpen && (
              <VoiceFab 
                onClick={handleVoiceButtonClick}
                isRecording={isRecording}
                isProcessing={isProcessing}
              />
            )}

            {/* Voice recorder modal */}
            <VoiceRecorderModal
              isOpen={isRecorderOpen}
              onClose={() => setIsRecorderOpen(false)}
              onRecordingStart={handleRecordingStart}
              onRecordingEnd={handleRecordingEnd}
            />

            {/* Chat FAB - always visible in dashboard */}
            <ChatFab />

            {/* Chat modal */}
            <ChatModal />
          </div>
        </AudioPlayerContext.Provider>
        </NotificationProvider>
      </LocationUpdaterProvider>
    </LanguageProvider>
  )
}

