/**
 * Calm Zone Audio Management
 * 
 * Handles audio content for the Calm Zone:
 * - Fetching audio from Supabase
 * - Streaming from Supabase Storage
 * - Progress tracking
 */

import { createClient } from './supabase'
import { getAudioStreamer } from './audio-streamer'
import type { AudioContent } from './dashboard/types'

export class CalmAudioManager {
  private supabase = createClient()
  private streamer = getAudioStreamer()

  /**
   * Get all audio content from database
   */
  async getAudioContent(category?: string): Promise<AudioContent[]> {
    let query = this.supabase
      .from('audio_content')
      .select('*')
      .order('created_at', { ascending: false })

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch audio content: ${error.message}`)
    }

    return (data || []).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category as AudioContent['category'],
      durationSeconds: item.duration_seconds,
      audioUrl: item.audio_url,
      thumbnailUrl: item.thumbnail_url || undefined,
      narrator: item.narrator || undefined,
      tags: item.tags || [],
      isFeatured: item.is_featured || false,
      playCount: item.play_count || 0,
      createdAt: new Date(item.created_at),
    }))
  }

  /**
   * Get audio URL for streaming
   */
  async getAudioStreamUrl(audioContent: AudioContent): Promise<string> {
    // If audioUrl is already a full URL, return it
    if (audioContent.audioUrl.startsWith('http')) {
      return audioContent.audioUrl
    }

    // Otherwise, get from Supabase Storage
    return this.streamer.streamCalmAudio(audioContent.audioUrl)
  }

  /**
   * Update play progress
   */
  async updateProgress(
    audioId: string,
    progressSeconds: number,
    isCompleted: boolean = false
  ): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return

    // Upsert progress
    const { error } = await this.supabase
      .from('audio_progress')
      .upsert({
        user_id: user.id,
        audio_id: audioId,
        progress_seconds: progressSeconds,
        is_completed: isCompleted,
        last_played_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,audio_id',
      })

    if (error) {
      console.error('Failed to update audio progress:', error)
    }

    // Update play count if completed
    if (isCompleted) {
      await this.supabase.rpc('increment_audio_play_count', { audio_id: audioId })
    }
  }

  /**
   * Get user's progress for an audio
   */
  async getProgress(audioId: string): Promise<{
    progressSeconds: number
    isCompleted: boolean
  } | null> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await this.supabase
      .from('audio_progress')
      .select('progress_seconds, is_completed')
      .eq('user_id', user.id)
      .eq('audio_id', audioId)
      .single()

    if (error || !data) return null

    return {
      progressSeconds: data.progress_seconds || 0,
      isCompleted: data.is_completed || false,
    }
  }
}

// Singleton instance
let managerInstance: CalmAudioManager | null = null

export function getCalmAudioManager(): CalmAudioManager {
  if (!managerInstance) {
    managerInstance = new CalmAudioManager()
  }
  return managerInstance
}


