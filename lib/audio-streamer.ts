/**
 * Audio Streaming from Supabase Storage
 * 
 * Handles streaming audio files from Supabase Storage buckets
 * with support for:
 * - Direct URL streaming
 * - CDN optimization
 * - Preloading next track
 * - Caching recently played tracks
 */

import { createClient } from './supabase'

export interface AudioStreamOptions {
  bucket: string
  path: string
  preload?: boolean
}

export class AudioStreamer {
  private supabase = createClient()
  private cache: Map<string, string> = new Map()

  /**
   * Get public URL for audio file in Supabase Storage
   */
  async getAudioUrl(bucket: string, path: string): Promise<string> {
    const cacheKey = `${bucket}/${path}`
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    // Get public URL from Supabase
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    const url = data.publicUrl
    
    // Cache the URL
    this.cache.set(cacheKey, url)
    
    return url
  }

  /**
   * Get signed URL for private audio file (with expiration)
   */
  async getSignedAudioUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`)
    }

    return data.signedUrl
  }

  /**
   * Preload audio file (for playlist)
   */
  async preloadAudio(bucket: string, path: string): Promise<string> {
    const url = await this.getAudioUrl(bucket, path)
    
    // Create a hidden audio element to preload
    if (typeof window !== 'undefined') {
      const audio = new Audio()
      audio.preload = 'auto'
      audio.src = url
      // Don't play, just preload
    }
    
    return url
  }

  /**
   * Stream audio from Calm Zone bucket
   */
  async streamCalmAudio(path: string): Promise<string> {
    return this.getAudioUrl('calm-audio', path)
  }

  /**
   * Stream voice recording (private, requires auth)
   */
  async streamVoiceRecording(path: string): Promise<string> {
    // Voice recordings are private, use signed URL
    return this.getSignedAudioUrl('voice-recordings', path, 3600)
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Remove specific item from cache
   */
  removeFromCache(bucket: string, path: string): void {
    const cacheKey = `${bucket}/${path}`
    this.cache.delete(cacheKey)
  }
}

// Singleton instance
let streamerInstance: AudioStreamer | null = null

export function getAudioStreamer(): AudioStreamer {
  if (!streamerInstance) {
    streamerInstance = new AudioStreamer()
  }
  return streamerInstance
}


