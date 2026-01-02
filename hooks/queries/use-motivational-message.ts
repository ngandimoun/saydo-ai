/**
 * Query hook for motivational message
 * 
 * Fetches and caches personalized motivational message with time-based caching.
 * Cache key includes time of day to ensure messages refresh when time period changes.
 */

import { useQuery } from '@tanstack/react-query'
import { getTimeOfDay } from '@/lib/dashboard/time-utils'

const QUERY_KEY_BASE = ['motivational-message']

async function fetchMotivationalMessage(): Promise<string> {
  try {
    const response = await fetch('/api/dashboard/motivational-message')
    
    if (!response.ok) {
      console.error('[useMotivationalMessage] API error:', response.status, response.statusText)
      throw new Error(`Failed to fetch motivational message: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('[useMotivationalMessage] API response:', data)
    
    if (!data.success) {
      console.error('[useMotivationalMessage] API returned success=false:', data.error)
      throw new Error(data.error || 'Failed to fetch motivational message')
    }

    const message = data.message as string
    console.log('[useMotivationalMessage] Extracted message:', message)
    
    if (!message || message.trim() === '') {
      console.warn('[useMotivationalMessage] Message is empty, returning fallback')
      // Return a fallback message instead of empty string
      const hour = new Date().getHours()
      if (hour < 12) return "Ready to make today count?"
      if (hour < 17) return "Let's keep the momentum going"
      return "Wind down and reflect"
    }

    return message
  } catch (error) {
    console.error('[useMotivationalMessage] Fetch error:', error)
    throw error
  }
}

/**
 * Hook to fetch and cache motivational message
 * 
 * Cache is based on time of day (morning/afternoon/evening/night)
 * - staleTime: 30 seconds (reduced to ensure fresh data on refresh)
 * - gcTime: 2 hours (kept in cache for 2 hours)
 * - Automatically refetches when time of day changes
 * - Refetches on mount/refresh and window focus for fresh messages
 */
export function useMotivationalMessage() {
  // Get current time of day for cache key
  const timeOfDay = getTimeOfDay()
  
  // Include time of day in query key so cache invalidates when time period changes
  const queryKey = [...QUERY_KEY_BASE, timeOfDay]

  const query = useQuery({
    queryKey,
    queryFn: fetchMotivationalMessage,
    staleTime: 30 * 1000, // 30 seconds - reduced to ensure fresh data on refresh
    gcTime: 2 * 60 * 60 * 1000, // 2 hours - keep in cache for 2 hours
    retry: 1, // Retry once on failure
    refetchOnMount: true, // Refetch when component mounts (in case time of day changed)
    refetchOnWindowFocus: true, // Refetch when window regains focus to ensure fresh data
  })

  // Debug logging
  console.log('[useMotivationalMessage] Query state:', {
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    data: query.data,
    status: query.status,
  })

  return query
}

