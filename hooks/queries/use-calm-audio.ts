/**
 * Query hook for calm audio content
 * 
 * Caches audio content by category with 1 hour stale time
 * (content changes infrequently).
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getCalmAudioManager } from '@/lib/calm-audio'
import type { AudioContent } from '@/lib/dashboard/types'

const QUERY_KEY = ['calm-audio']

interface UseCalmAudioOptions {
  category?: string
}

async function fetchCalmAudio(options: UseCalmAudioOptions = {}): Promise<AudioContent[]> {
  const { category } = options
  const manager = getCalmAudioManager()
  
  // Load audio content from database
  const content = await manager.getAudioContent(category === 'all' ? undefined : category)
  
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



