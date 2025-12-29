/**
 * React Query Client Configuration
 * 
 * Configures TanStack Query with optimal caching strategies:
 * - Default stale time: 5 minutes
 * - Cache time: 30 minutes
 * - Retry logic for failed requests
 * - DevTools in development
 */

import { QueryClient } from '@tanstack/react-query'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 5 minutes
        staleTime: 5 * 60 * 1000, // 5 minutes
        // Cache data for 30 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
        // Retry failed requests up to 3 times
        retry: 3,
        // Retry delay increases exponentially
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch on window focus in production (disabled in dev for better DX)
        refetchOnWindowFocus: process.env.NODE_ENV === 'production',
        // Refetch on reconnect
        refetchOnReconnect: true,
        // Don't refetch on mount if data is fresh
        refetchOnMount: false,
      },
      mutations: {
        // Retry mutations once
        retry: 1,
        // Retry delay for mutations
        retryDelay: 1000,
      },
    },
  })
}

// Singleton instance
let queryClientInstance: QueryClient | null = null

export function getQueryClient() {
  if (!queryClientInstance) {
    queryClientInstance = createQueryClient()
  }
  return queryClientInstance
}

