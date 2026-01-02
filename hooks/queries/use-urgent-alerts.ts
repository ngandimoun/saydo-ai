/**
 * Query hook for urgent alerts
 * 
 * Caches urgent alerts with 2 minute stale time.
 * Auto-refetches every 2 minutes.
 * Invalidates on dismiss/read.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import type { UrgentAlert } from '@/lib/dashboard/types'

const QUERY_KEY = ['urgent-alerts']

async function fetchUrgentAlerts(): Promise<UrgentAlert[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data: alerts } = await supabase
    .from('urgent_alerts')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false })
    .limit(5)

  if (!alerts) {
    return []
  }

  return alerts.map(a => ({
    id: a.id,
    userId: a.user_id,
    title: a.title,
    description: a.description,
    urgencyLevel: a.urgency_level as UrgentAlert['urgencyLevel'],
    category: a.category as UrgentAlert['category'],
    audioSummaryUrl: a.audio_summary_url,
    sourceType: a.source_type as UrgentAlert['sourceType'],
    sourceId: a.source_id,
    isRead: a.is_read,
    isDismissed: a.is_dismissed,
    createdAt: new Date(a.created_at),
    expiresAt: a.expires_at ? new Date(a.expires_at) : undefined,
  }))
}

export function useUrgentAlerts() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchUrgentAlerts,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 2 * 60 * 1000, // Auto-refetch every 2 minutes
  })
}

export function useInvalidateUrgentAlerts() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: QUERY_KEY })
}




