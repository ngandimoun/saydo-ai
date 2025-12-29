/**
 * Query hook for voice timeline
 * 
 * Caches voice timeline with related data (tasks, reminders, health notes).
 * Invalidates on recording updates.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import type { VoiceNote } from '@/lib/dashboard/types'

const QUERY_KEY = ['voice-timeline']

interface UseVoiceTimelineOptions {
  limit?: number
}

async function fetchVoiceTimeline(options: UseVoiceTimelineOptions = {}): Promise<VoiceNote[]> {
  const { limit = 50 } = options
  
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  // Fetch voice recordings
  const { data: recordings, error: recordingsError } = await supabase
    .from('voice_recordings')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (recordingsError || !recordings) {
    return []
  }

  // Fetch related tasks, reminders, and health notes
  const recordingIds = recordings.map(r => r.id)
  
  const [tasksResult, remindersResult, healthNotesResult] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, source_recording_id, title')
      .in('source_recording_id', recordingIds),
    supabase
      .from('reminders')
      .select('id, source_recording_id, title')
      .in('source_recording_id', recordingIds),
    supabase
      .from('health_notes')
      .select('id, source_recording_id, content')
      .in('source_recording_id', recordingIds),
  ])

  // Group by recording id
  const tasksByRecording = (tasksResult.data || []).reduce((acc, t) => {
    const id = t.source_recording_id
    if (id) {
      if (!acc[id]) acc[id] = []
      acc[id].push(t)
    }
    return acc
  }, {} as Record<string, typeof tasksResult.data>)

  const remindersByRecording = (remindersResult.data || []).reduce((acc, r) => {
    const id = r.source_recording_id
    if (id) {
      if (!acc[id]) acc[id] = []
      acc[id].push(r)
    }
    return acc
  }, {} as Record<string, typeof remindersResult.data>)

  const healthNotesByRecording = (healthNotesResult.data || []).reduce((acc, h) => {
    const id = h.source_recording_id
    if (id) {
      if (!acc[id]) acc[id] = []
      acc[id].push(h)
    }
    return acc
  }, {} as Record<string, typeof healthNotesResult.data>)

  // Map recordings to VoiceNote format
  return recordings.map(r => ({
    id: r.id,
    userId: r.user_id,
    durationSeconds: r.duration_seconds || 0,
    audioUrl: r.audio_url,
    transcription: r.transcription,
    status: r.status as VoiceNote['status'],
    contextChainId: r.context_chain_id,
    previousNoteId: r.previous_note_id,
    aiSummary: r.ai_summary,
    createdAt: new Date(r.created_at),
    extractedTasks: (tasksByRecording[r.id] || []).map(t => ({
      id: t.id,
      userId: r.user_id,
      title: t.title,
      priority: 'medium' as const,
      status: 'pending' as const,
      tags: [],
      createdAt: new Date(),
    })),
    extractedReminders: (remindersByRecording[r.id] || []).map(rem => ({
      id: rem.id,
      userId: r.user_id,
      title: rem.title,
      reminderTime: new Date(),
      isRecurring: false,
      isCompleted: false,
      isSnoozed: false,
      createdAt: new Date(),
    })),
    extractedHealthNotes: (healthNotesByRecording[r.id] || []).map(h => h.content),
  }))
}

export function useVoiceTimeline(options: UseVoiceTimelineOptions = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY, options],
    queryFn: () => fetchVoiceTimeline(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

export function useInvalidateVoiceTimeline() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: QUERY_KEY })
}

