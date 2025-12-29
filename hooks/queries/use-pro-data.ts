/**
 * Query hooks for pro/work data
 * 
 * Caches work files, AI documents, end of day summary, productivity stats.
 * Invalidates on file upload/document generation.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import type { WorkFile, AIDocument, EndOfDaySummary } from '@/lib/dashboard/types'

const QUERY_KEY = ['pro']

// Work Files
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
    uploadedAt: new Date(f.uploaded_at),
  }))
}

// AI Documents
async function fetchAIDocuments(): Promise<AIDocument[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data: docsData } = await supabase
    .from('ai_documents')
    .select('*')
    .eq('user_id', user.id)
    .order('generated_at', { ascending: false })
    .limit(10)

  if (!docsData) {
    return []
  }

  return docsData.map(d => ({
    id: d.id,
    userId: d.user_id,
    title: d.title,
    documentType: d.document_type,
    status: d.status,
    contentUrl: d.content_url,
    previewText: d.preview_text,
    sourceVoiceNoteIds: d.source_voice_note_ids,
    sourceFileIds: d.source_file_ids,
    generatedAt: new Date(d.generated_at),
  }))
}

// End of Day Summary
async function fetchEndOfDaySummary(): Promise<EndOfDaySummary | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { data: summaryData } = await supabase
    .from('end_of_day_summaries')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', today.toISOString())
    .lt('date', tomorrow.toISOString())
    .single()

  if (!summaryData) {
    return null
  }

  return {
    id: summaryData.id,
    userId: summaryData.user_id,
    date: new Date(summaryData.date),
    keyAchievements: summaryData.key_achievements || [],
    pendingItems: summaryData.pending_items || [],
    tomorrowPriorities: summaryData.tomorrow_priorities || [],
    insights: summaryData.insights || [],
    overallProductivity: summaryData.overall_productivity,
    hoursWorked: summaryData.hours_worked,
    tasksCompleted: summaryData.tasks_completed,
    voiceNotesRecorded: summaryData.voice_notes_recorded,
    createdAt: new Date(summaryData.created_at),
  }
}

// Productivity Stats
async function fetchProductivityStats(): Promise<{
  tasksCompleted: number
  focusTime: string
  meetings: number
  aiAssists: number
}> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return {
      tasksCompleted: 0,
      focusTime: '0h 0m',
      meetings: 0,
      aiAssists: 0,
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Count completed tasks today
  const { count: completedTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .gte('completed_at', today.toISOString())
    .lt('completed_at', tomorrow.toISOString())

  // Count voice recordings today (AI assists)
  const { count: voiceRecordings } = await supabase
    .from('voice_recordings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString())

  return {
    tasksCompleted: completedTasks || 0,
    focusTime: '0h 0m', // Would need time tracking to be real
    meetings: 0, // Would need calendar integration
    aiAssists: voiceRecordings || 0,
  }
}

// Hooks
export function useWorkFiles() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'work-files'],
    queryFn: fetchWorkFiles,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useAIDocuments() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'ai-documents'],
    queryFn: fetchAIDocuments,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useEndOfDaySummary() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'end-of-day-summary'],
    queryFn: fetchEndOfDaySummary,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useProductivityStats() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'productivity-stats'],
    queryFn: fetchProductivityStats,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useInvalidateProData() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: QUERY_KEY })
}

