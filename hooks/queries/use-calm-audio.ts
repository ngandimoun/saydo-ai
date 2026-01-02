/**
 * Query hook for calm audio content
 * 
 * Caches audio content by genre with 1 hour stale time
 * (content changes infrequently).
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getCalmAudioManager } from '@/lib/calm-audio'
import type { AudioContent } from '@/lib/dashboard/types'

const QUERY_KEY = ['calm-audio']

interface UseCalmAudioOptions {
  genre?: string | null
}

async function fetchCalmAudio(options: UseCalmAudioOptions = {}): Promise<AudioContent[]> {
  const { genre } = options
  const manager = getCalmAudioManager()
  
  // Load audio content from database - filter by genre tag if provided
  const content = await manager.getAudioContent(genre || undefined)
  
  // Get streaming URLs for each audio file
  const contentWithUrls = await Promise.all(
    content.map(async (item) => {
      try {
        const streamUrl = await manager.getAudioStreamUrl(item)
        return { ...item, audioUrl: streamUrl }
      } catch (error) {
        // Fallback to original URL if streaming fails
        return item
      }
    })
  )
  
  return contentWithUrls
}

export function useCalmAudio(options: UseCalmAudioOptions = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY, options],
    queryFn: () => fetchCalmAudio(options),
    staleTime: 60 * 60 * 1000, // 1 hour (content changes infrequently)
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  })
}

export function useInvalidateCalmAudio() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: QUERY_KEY })
}




