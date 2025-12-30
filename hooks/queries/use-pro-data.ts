/**
 * Query hooks for pro/work data
 * 
 * Caches work files, AI documents, end of day summary, productivity stats.
 * Includes realtime subscriptions for AI documents and notifications.
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { useEffect, useCallback, useState } from 'react'
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
    customName: f.custom_name,
    description: f.description,
    uploadedAt: new Date(f.uploaded_at),
  }))
}

// AI Documents - Enhanced with all new fields
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

// Fetch a single AI document by ID
async function fetchAIDocumentById(documentId: string): Promise<AIDocument | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('ai_documents')
    .select('*')
    .eq('id', documentId)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return null
  }

  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    documentType: data.document_type,
    status: data.status,
    content: data.content,
    previewText: data.preview_text,
    sourceVoiceNoteIds: data.source_voice_note_ids || [],
    sourceFileIds: data.source_file_ids || [],
    language: data.language || 'en',
    tags: data.tags || [],
    professionContext: data.profession_context,
    confidenceScore: data.confidence_score,
    generationType: data.generation_type || 'explicit',
    version: data.version || 1,
    parentDocumentId: data.parent_document_id,
    generatedAt: new Date(data.generated_at),
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
  }
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

// Productivity Stats (enhanced with AI document count)
async function fetchProductivityStats(): Promise<{
  tasksCompleted: number
  focusTime: string
  meetings: number
  aiAssists: number
  aiDocumentsGenerated: number
}> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return {
      tasksCompleted: 0,
      focusTime: '0h 0m',
      meetings: 0,
      aiAssists: 0,
      aiDocumentsGenerated: 0,
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Parallel fetch for performance
  const [tasksResult, voiceResult, aiDocsResult] = await Promise.all([
    // Count completed tasks today
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('completed_at', today.toISOString())
      .lt('completed_at', tomorrow.toISOString()),
    
    // Count voice recordings today (AI assists)
    supabase
      .from('voice_recordings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString()),
    
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
    tasksCompleted: tasksResult.count || 0,
    focusTime: '0h 0m', // Would need time tracking to be real
    meetings: 0, // Would need calendar integration
    aiAssists: voiceResult.count || 0,
    aiDocumentsGenerated: aiDocsResult.count || 0,
  }
}

// Notifications
export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'ai_generated'
  relatedDocumentId?: string
  deepLink?: string
  isRead: boolean
  createdAt: Date
}

async function fetchNotifications(options?: {
  unreadOnly?: boolean
  limit?: number
}): Promise<Notification[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false })
    .limit(options?.limit || 20)

  if (options?.unreadOnly) {
    query = query.eq('is_read', false)
  }

  const { data, error } = await query

  if (error || !data) {
    return []
  }

  return data.map(n => ({
    id: n.id,
    userId: n.user_id,
    title: n.title,
    message: n.message,
    type: n.type,
    relatedDocumentId: n.related_document_id,
    deepLink: n.deep_link,
    isRead: n.is_read,
    createdAt: new Date(n.created_at),
  }))
}

// ============================================
// HOOKS
// ============================================

export function useWorkFiles() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'work-files'],
    queryFn: fetchWorkFiles,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useAIDocuments(options?: {
  limit?: number
  status?: 'generating' | 'ready' | 'failed' | 'archived'
  generationType?: 'explicit' | 'proactive' | 'suggestion'
  documentType?: string
}) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'ai-documents', options],
    queryFn: () => fetchAIDocuments(options),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 30 * 60 * 1000,
  })
}

export function useAIDocument(documentId: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'ai-document', documentId],
    queryFn: () => documentId ? fetchAIDocumentById(documentId) : null,
    enabled: !!documentId,
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

export function useNotifications(options?: {
  unreadOnly?: boolean
  limit?: number
}) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'notifications', options],
    queryFn: () => fetchNotifications(options),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 30 * 60 * 1000,
  })
}

export function useUnreadNotificationCount() {
  const { data: notifications } = useNotifications({ unreadOnly: true })
  return notifications?.length || 0
}

// ============================================
// MUTATIONS
// ============================================

export function useArchiveAIDocument() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (documentId: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('ai_documents')
        .update({ status: 'archived' })
        .eq('id', documentId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'ai-documents'] })
    },
  })
}

export function useDeleteAIDocument() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (documentId: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('ai_documents')
        .delete()
        .eq('id', documentId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'ai-documents'] })
    },
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'notifications'] })
    },
  })
}

export function useDismissNotification() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('notifications')
        .update({ is_dismissed: true })
        .eq('id', notificationId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'notifications'] })
    },
  })
}

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

/**
 * Hook for realtime AI document updates
 * Automatically invalidates queries when documents change
 */
export function useAIDocumentsRealtime() {
  const queryClient = useQueryClient()
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      channel = supabase
        .channel('ai-documents-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ai_documents',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('[useAIDocumentsRealtime] Change received:', payload.eventType)
            // Invalidate queries to refetch
            queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'ai-documents'] })
            queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'productivity-stats'] })
          }
        )
        .subscribe((status) => {
          setIsSubscribed(status === 'SUBSCRIBED')
        })
    }

    setupSubscription()

    return () => {
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [queryClient])

  return isSubscribed
}

/**
 * Hook for realtime notification updates
 */
export function useNotificationsRealtime() {
  const queryClient = useQueryClient()
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('[useNotificationsRealtime] New notification:', payload)
            // Invalidate queries to refetch
            queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'notifications'] })
          }
        )
        .subscribe((status) => {
          setIsSubscribed(status === 'SUBSCRIBED')
        })
    }

    setupSubscription()

    return () => {
      if (channel) {
        channel.unsubscribe()
      }
    }
  }, [queryClient])

  return isSubscribed
}

// ============================================
// INVALIDATION HELPERS
// ============================================

export function useInvalidateProData() {
  const queryClient = useQueryClient()
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY })
  }, [queryClient])
}

export function useInvalidateAIDocuments() {
  const queryClient = useQueryClient()
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'ai-documents'] })
  }, [queryClient])
}

export function useInvalidateNotifications() {
  const queryClient = useQueryClient()
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'notifications'] })
  }, [queryClient])
}
