/**
 * Prefetch utilities for Quick Access sections
 * 
 * Prefetches React Query data when hovering over Quick Access buttons
 * to enable instant navigation with cached data.
 */

import { getQueryClient } from '@/lib/query-client'
import { createClient } from '@/lib/supabase'
import { getCalmAudioManager } from '@/lib/calm-audio'
import type { 
  ProactiveIntervention,
  HealthDocument,
  Task,
  Reminder,
  WorkFile,
  AIDocument,
  AudioContent,
  VoiceNote
} from '@/lib/dashboard/types'

// Health section prefetch functions
async function fetchInterventions(): Promise<ProactiveIntervention[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data: interventionsData } = await supabase
    .from('proactive_interventions')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false })
    .limit(10)

  if (!interventionsData) {
    return []
  }

  return interventionsData.map(i => ({
    id: i.id,
    userId: i.user_id,
    type: i.type as ProactiveIntervention['type'],
    title: i.title,
    description: i.description,
    urgencyLevel: i.urgency_level as ProactiveIntervention['urgencyLevel'],
    category: i.category as ProactiveIntervention['category'],
    context: i.context_data || i.context,
    biologicalReason: i.biological_reason,
    actionItems: i.action_items || [],
    dismissible: i.dismissible,
    validUntil: i.valid_until ? new Date(i.valid_until) : undefined,
    createdAt: new Date(i.created_at),
    isDismissed: i.is_dismissed,
    useCaseData: i.use_case_data,
  }))
}

async function fetchHealthDocuments(): Promise<HealthDocument[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data: docs } = await supabase
    .from('health_documents')
    .select('*')
    .eq('user_id', user.id)
    .order('uploaded_at', { ascending: false })
    .limit(10)

  if (!docs) {
    return []
  }

  return docs.map(d => ({
    id: d.id,
    userId: d.user_id,
    fileName: d.file_name,
    fileType: d.file_type,
    fileUrl: d.file_url,
    uploadedAt: new Date(d.uploaded_at),
    status: d.status as HealthDocument['status'],
    documentType: d.document_type,
    analysis: d.analysis,
    healthImpact: d.health_impact,
    allergyWarnings: d.allergy_warnings,
    recommendations: d.recommendations,
  }))
}

// Tasks section prefetch functions
async function fetchTasks(options: { includeCompleted?: boolean; limit?: number } = {}): Promise<Task[]> {
  const { includeCompleted = false, limit = 50 } = options
  
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)

  if (!includeCompleted) {
    query = query.neq('status', 'completed')
  }

  const { data: tasksData } = await query
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!tasksData) {
    return []
  }

  return tasksData.map(t => ({
    id: t.id,
    userId: t.user_id,
    title: t.title,
    description: t.description,
    priority: t.priority as Task['priority'],
    status: t.status as Task['status'],
    dueDate: t.due_date ? new Date(t.due_date) : undefined,
    dueTime: t.due_time,
    category: t.category,
    tags: t.tags || [],
    sourceRecordingId: t.source_recording_id,
    createdAt: new Date(t.created_at),
    completedAt: t.completed_at ? new Date(t.completed_at) : undefined,
  }))
}

async function fetchReminders(options: { includeCompleted?: boolean; limit?: number } = {}): Promise<Reminder[]> {
  const { includeCompleted = false, limit = 50 } = options
  
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  let query = supabase
    .from('reminders')
    .select('*')
    .eq('user_id', user.id)

  if (!includeCompleted) {
    query = query.eq('is_completed', false)
  }

  const { data: remindersData } = await query
    .order('reminder_time', { ascending: true })
    .limit(limit)

  if (!remindersData) {
    return []
  }

  return remindersData.map(r => ({
    id: r.id,
    userId: r.user_id,
    title: r.title,
    description: r.description,
    reminderTime: new Date(r.reminder_time),
    isRecurring: r.is_recurring,
    recurrencePattern: r.recurrence_pattern,
    isCompleted: r.is_completed,
    isSnoozed: r.is_snoozed,
    snoozeUntil: r.snooze_until ? new Date(r.snooze_until) : undefined,
    tags: r.tags || [],
    priority: r.priority || 'medium',
    type: r.type || 'reminder',
    sourceRecordingId: r.source_recording_id,
    createdAt: new Date(r.created_at),
  }))
}

// Pro section prefetch functions
async function fetchWorkFiles(): Promise<WorkFile[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data: filesData } = await supabase
    .from('work_files')
    .select('*')
    .eq('user_id', user.id)
    .order('uploaded_at', { ascending: false })
    .limit(10)

  if (!filesData) {
    return []
  }

  return filesData.map(f => ({
    id: f.id,
    userId: f.user_id,
    fileName: f.file_name,
    fileType: f.file_type,
    fileUrl: f.file_url,
    thumbnailUrl: f.thumbnail_url,
    fileSize: f.file_size,
    status: f.status,
    category: f.category,
    customName: f.custom_name,
    description: f.description,
    uploadedAt: new Date(f.uploaded_at),
  }))
}

async function fetchAIDocuments(options?: {
  limit?: number
  status?: 'generating' | 'ready' | 'failed' | 'archived'
  generationType?: 'explicit' | 'proactive' | 'suggestion'
  documentType?: string
}): Promise<AIDocument[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  let query = supabase
    .from('ai_documents')
    .select('*')
    .eq('user_id', user.id)
    .neq('status', 'archived')
    .order('generated_at', { ascending: false })
    .limit(options?.limit || 20)

  if (options?.status) {
    query = query.eq('status', options.status)
  }
  if (options?.generationType) {
    query = query.eq('generation_type', options.generationType)
  }
  if (options?.documentType) {
    query = query.eq('document_type', options.documentType)
  }

  const { data: docsData, error } = await query

  if (error) {
    console.error('[fetchAIDocuments] Error:', error)
    return []
  }

  if (!docsData) {
    return []
  }

  return docsData.map(d => ({
    id: d.id,
    userId: d.user_id,
    title: d.title,
    documentType: d.document_type,
    status: d.status,
    content: d.content,
    previewText: d.preview_text,
    sourceVoiceNoteIds: d.source_voice_note_ids || [],
    sourceFileIds: d.source_file_ids || [],
    language: d.language || 'en',
    tags: d.tags || [],
    professionContext: d.profession_context,
    confidenceScore: d.confidence_score,
    generationType: d.generation_type || 'explicit',
    version: d.version || 1,
    parentDocumentId: d.parent_document_id,
    generatedAt: new Date(d.generated_at),
    updatedAt: d.updated_at ? new Date(d.updated_at) : undefined,
  }))
}

async function fetchProductivityStats(): Promise<{
  tasksCreated: number
  aiDocumentsGenerated: number
  voiceNotesRecorded: number
  workFilesUploaded: number
}> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return {
      tasksCreated: 0,
      aiDocumentsGenerated: 0,
      voiceNotesRecorded: 0,
      workFilesUploaded: 0,
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Parallel fetch for performance
  const [tasksResult, voiceResult, workFilesResult, aiDocsResult] = await Promise.all([
    // Count tasks created today
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString()),
    
    // Count voice recordings created today
    supabase
      .from('voice_recordings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString()),
    
    // Count work files uploaded today
    supabase
      .from('work_files')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('uploaded_at', today.toISOString())
      .lt('uploaded_at', tomorrow.toISOString()),
    
    // Count AI documents generated today
    supabase
      .from('ai_documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'ready')
      .gte('generated_at', today.toISOString())
      .lt('generated_at', tomorrow.toISOString()),
  ])

  return {
    tasksCreated: tasksResult.count || 0,
    voiceNotesRecorded: voiceResult.count || 0,
    workFilesUploaded: workFilesResult.count || 0,
    aiDocumentsGenerated: aiDocsResult.count || 0,
  }
}

// Calm section prefetch functions
async function fetchCalmAudio(options: { genre?: string | null } = {}): Promise<AudioContent[]> {
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

// Voice Timeline section prefetch function
async function fetchVoiceTimeline(options: { limit?: number } = {}): Promise<VoiceNote[]> {
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

/**
 * Prefetch Health section data
 */
export async function prefetchHealthData() {
  const queryClient = getQueryClient()
  
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['health', 'interventions'],
      queryFn: fetchInterventions,
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 60 * 60 * 1000, // 1 hour
    }),
    queryClient.prefetchQuery({
      queryKey: ['health', 'documents'],
      queryFn: fetchHealthDocuments,
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 60 * 60 * 1000, // 1 hour
    }),
  ])
}

/**
 * Prefetch Tasks section data
 */
export async function prefetchTasksData() {
  const queryClient = getQueryClient()
  
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['tasks', { includeCompleted: false }],
      queryFn: () => fetchTasks({ includeCompleted: false }),
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 60 * 60 * 1000, // 1 hour
    }),
    queryClient.prefetchQuery({
      queryKey: ['reminders', { includeCompleted: false }],
      queryFn: () => fetchReminders({ includeCompleted: false }),
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 60 * 60 * 1000, // 1 hour
    }),
  ])
}

/**
 * Prefetch Pro section data
 */
export async function prefetchProData() {
  const queryClient = getQueryClient()
  
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['pro', 'work-files'],
      queryFn: fetchWorkFiles,
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 60 * 60 * 1000, // 1 hour
    }),
    queryClient.prefetchQuery({
      queryKey: ['pro', 'ai-documents', {}],
      queryFn: () => fetchAIDocuments({}),
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 60 * 60 * 1000, // 1 hour
    }),
    queryClient.prefetchQuery({
      queryKey: ['pro', 'productivity-stats'],
      queryFn: fetchProductivityStats,
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 60 * 60 * 1000, // 1 hour
    }),
  ])
}

/**
 * Prefetch Calm section data
 */
export async function prefetchCalmData() {
  const queryClient = getQueryClient()
  
  await queryClient.prefetchQuery({
    queryKey: ['calm-audio', { genre: null }],
    queryFn: () => fetchCalmAudio({ genre: null }),
    staleTime: 60 * 60 * 1000, // 1 hour (content changes infrequently)
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  })
}

/**
 * Prefetch Voice Timeline section data
 */
export async function prefetchVoiceTimelineData() {
  const queryClient = getQueryClient()
  
  await queryClient.prefetchQuery({
    queryKey: ['voice-timeline', { limit: 50 }],
    queryFn: () => fetchVoiceTimeline({ limit: 50 }),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

