/**
 * Query hook for voice recordings
 * 
 * Caches voice recordings with 5 minute stale time.
 * Invalidates on new recording.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import type { VoiceNote } from '@/lib/dashboard/types'

const QUERY_KEY = ['voice-recordings']

interface UseVoiceRecordingsOptions {
  limit?: number
}

async function fetchVoiceRecordings(options: UseVoiceRecordingsOptions = {}): Promise<VoiceNote[]> {
  const { limit = 50 } = options
  
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data: recordings } = await supabase
    .from('voice_recordings')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!recordings) {
    return []
  }

  return recordings.map(r => ({
    id: r.id,
    userId: r.user_id,
    durationSeconds: r.duration_seconds,
    audioUrl: r.audio_url,
    transcription: r.transcription,
    status: r.status as VoiceNote['status'],
    contextChainId: r.context_chain_id,
    createdAt: new Date(r.created_at),
    extractedTasks: [],
    extractedReminders: [],
    extractedHealthNotes: [],
    aiSummary: r.ai_summary,
  }))
}

export function useVoiceRecordings(options: UseVoiceRecordingsOptions = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY, options],
    queryFn: () => fetchVoiceRecordings(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

export function useInvalidateVoiceRecordings() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: QUERY_KEY })
}




