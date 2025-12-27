"use client"

import { useState, createContext, useContext, useCallback } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { LanguageProvider } from "@/lib/language-context"
import { BottomNav } from "@/components/dashboard/navigation/bottom-nav"
import { VoiceFab } from "@/components/dashboard/navigation/voice-fab"
import { VoiceRecorderModal } from "@/components/dashboard/voice-recorder-modal"
import { MiniPlayer } from "@/components/dashboard/player/mini-player"
import { FullPlayer, type FullPlayerTrack } from "@/components/dashboard/player/full-player"
import { springs } from "@/lib/motion-system"

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
  // Basic controls
  setTrack: (track: AudioTrack) => void
  play: () => void
  pause: () => void
  seek: (time: number) => void
  close: () => void
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

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
    scale: 0.98,
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    },
  },
}

interface DashboardLayoutClientProps {
  children: React.ReactNode
}

export function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  const pathname = usePathname()
  
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

  // Play next track
  const playNext = useCallback(() => {
    if (!currentTrack || playlist.length === 0) return
    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id)
    if (currentIndex < playlist.length - 1) {
      setCurrentTrack(playlist[currentIndex + 1])
      setCurrentTime(0)
      setIsPlaying(true)
    }
  }, [currentTrack, playlist])

  // Play previous track
  const playPrevious = useCallback(() => {
    if (!currentTrack || playlist.length === 0) return
    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id)
    if (currentIndex > 0) {
      setCurrentTrack(playlist[currentIndex - 1])
      setCurrentTime(0)
      setIsPlaying(true)
    }
  }, [currentTrack, playlist])

  // Open full player with track and optional playlist
  const openFullPlayer = useCallback((track: AudioTrack, newPlaylist?: AudioTrack[]) => {
    setCurrentTrack(track)
    if (newPlaylist) {
      setPlaylist(newPlaylist)
    }
    setCurrentTime(0)
    setIsPlaying(true)
    setIsFullPlayerOpen(true)
  }, [])

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
    setTrack: (track) => {
      setCurrentTrack(track)
      setCurrentTime(0)
      setIsPlaying(true)
    },
    play: () => setIsPlaying(true),
    pause: () => setIsPlaying(false),
    seek: (time) => setCurrentTime(time),
    close: () => {
      setCurrentTrack(null)
      setIsPlaying(false)
      setCurrentTime(0)
      setPlaylist([])
      setIsFullPlayerOpen(false)
    },
    openFullPlayer,
    closeFullPlayer,
    next: playNext,
    previous: playPrevious,
  }

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
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onSeek={(time) => setCurrentTime(time)}
                  onClose={() => audioPlayerValue.close()}
                  onExpand={() => setIsFullPlayerOpen(true)}
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
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onSeek={(time) => setCurrentTime(time)}
                onClose={closeFullPlayer}
                onNext={playNext}
                onPrevious={playPrevious}
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
        </div>
      </AudioPlayerContext.Provider>
    </LanguageProvider>
  )
}

