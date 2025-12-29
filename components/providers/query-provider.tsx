"use client"

/**
 * React Query Provider
 * 
 * Wraps the app with QueryClientProvider to enable React Query throughout the app.
 * Optionally includes DevTools in development.
 */

import { QueryClientProvider } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query-client'
import { useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import DevTools to avoid including in production bundle
const ReactQueryDevtools = process.env.NODE_ENV === 'development'
  ? dynamic(() =>
      import('@tanstack/react-query-devtools').then((d) => ({
        default: d.ReactQueryDevtools,
      })),
      { ssr: false }
    )
  : () => null

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Use useState to ensure we only create one instance per component lifecycle
  const [queryClient] = useState(() => getQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
