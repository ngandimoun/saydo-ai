"use client"

import { useState, createContext, useContext } from "react"
import { LanguageProvider } from "@/lib/language-context"
import { BottomNav } from "@/components/dashboard/navigation/bottom-nav"
import { VoiceFab } from "@/components/dashboard/navigation/voice-fab"
import { VoiceRecorderModal } from "@/components/dashboard/voice-recorder-modal"
import { MiniPlayer } from "@/components/dashboard/player/mini-player"

/**
 * Dashboard Layout
 * 
 * This layout wraps all dashboard tab pages with:
 * - Bottom navigation bar
 * - Center floating voice button
 * - Persistent mini audio player
 * - Voice recording modal
 * 
 * TODO (Backend Integration):
 * - Add authentication check - redirect to login if not authenticated
 * - Fetch user preferences from Supabase on mount
 * - Add real-time subscription for notifications
 * - Load user's language preference from database
 */

// Audio player context for sharing state across tabs
interface AudioPlayerState {
  isPlaying: boolean
  currentTrack: {
    id: string
    title: string
    narrator?: string
    audioUrl: string
    durationSeconds: number
  } | null
  currentTime: number
  setTrack: (track: AudioPlayerState['currentTrack']) => void
  play: () => void
  pause: () => void
  seek: (time: number) => void
  close: () => void
}

const AudioPlayerContext = createContext<AudioPlayerState | null>(null)

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext)
  if (!context) {
    throw new Error('useAudioPlayer must be used within DashboardLayout')
  }
  return context
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // Voice recorder state
  const [isRecorderOpen, setIsRecorderOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<AudioPlayerState['currentTrack']>(null)
  const [currentTime, setCurrentTime] = useState(0)

  const audioPlayerValue: AudioPlayerState = {
    isPlaying,
    currentTrack,
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
    }
  }

  const handleVoiceButtonClick = () => {
    if (isRecording) {
      // If already recording, stop
      setIsRecording(false)
    } else {
      // Open the recorder modal
      setIsRecorderOpen(true)
    }
  }

  const handleRecordingStart = () => {
    setIsRecording(true)
  }

  const handleRecordingEnd = () => {
    setIsRecording(false)
  }

  return (
    <LanguageProvider>
      <AudioPlayerContext.Provider value={audioPlayerValue}>
        {/* 
          TODO: Add authentication wrapper here
          <AuthGuard>{children}</AuthGuard>
        */}
        <div className="min-h-screen bg-background">
          {/* Main content area with bottom padding for nav */}
          <main className="pb-28">
            {children}
          </main>

          {/* Persistent mini audio player - above nav bar */}
          {currentTrack && (
            <MiniPlayer
              track={currentTrack}
              isPlaying={isPlaying}
              currentTime={currentTime}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onSeek={(time) => setCurrentTime(time)}
              onClose={() => audioPlayerValue.close()}
            />
          )}

          {/* Bottom navigation */}
          <BottomNav />

          {/* Center voice FAB */}
          <VoiceFab 
            onClick={handleVoiceButtonClick}
            isRecording={isRecording}
          />

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
