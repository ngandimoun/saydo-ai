/**
 * Query hook for brief recap
 * 
 * Fetches and caches brief recap with daily invalidation.
 * Cache key includes today's date to ensure fresh data each day.
 * Auto-refetches on mount for frequent updates.
 */

import { useQuery } from '@tanstack/react-query'

/**
 * Get today's date string in YYYY-MM-DD format for cache key
 */
function getTodayDateString(): string {
  const today = new Date()
  return today.toISOString().split('T')[0] // Returns YYYY-MM-DD
}

async function fetchBriefRecap(): Promise<string> {
  try {
    const response = await fetch('/api/dashboard/brief-recap')
    
    if (!response.ok) {
      console.error('[useBriefRecap] API error:', response.status, response.statusText)
      throw new Error(`Failed to fetch brief recap: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('[useBriefRecap] API response:', data)
    
    if (!data.success) {
      console.error('[useBriefRecap] API returned success=false:', data.error)
      throw new Error(data.error || 'Failed to fetch brief recap')
    }

    const recap = data.recap as string
    console.log('[useBriefRecap] Extracted recap:', recap)
    
    if (!recap || recap.trim() === '') {
      console.warn('[useBriefRecap] Recap is empty, returning fallback')
      return "Welcome back! Ready to make today count?"
    }

    return recap
  } catch (error) {
    console.error('[useBriefRecap] Fetch error:', error)
    throw error
  }
}

/**
 * Hook to fetch and cache brief recap
 * 
 * Cache key includes today's date to ensure daily invalidation.
 * staleTime is 0 to always refetch on mount/refresh for fresh "today" data.
 */
export function useBriefRecap() {
  // Include today's date in cache key so it invalidates daily
  const today = getTodayDateString()
  const queryKey = ['brief-recap', today]
  
  const query = useQuery({
    queryKey,
    queryFn: fetchBriefRecap,
    staleTime: 0, // Always consider data stale - ensures fresh data on mount/refresh
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 1, // Retry once on failure
    refetchOnMount: true, // Always refetch on mount since staleTime is 0
    refetchOnWindowFocus: true, // Refetch when window regains focus to ensure fresh data
  })

  // Debug logging
  console.log('[useBriefRecap] Query state:', {
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    data: query.data,
    status: query.status,
  })

  return query
}

