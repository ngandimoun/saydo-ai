/**
 * Query hook for tasks
 * 
 * Caches tasks list with 5 minute stale time.
 * Invalidates on task create/update/delete.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import type { Task } from '@/lib/dashboard/types'

const QUERY_KEY = ['tasks']

interface UseTasksOptions {
  includeCompleted?: boolean
  limit?: number
}

async function fetchTasks(options: UseTasksOptions = {}): Promise<Task[]> {
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

export function useTasks(options: UseTasksOptions = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY, options],
    queryFn: () => fetchTasks(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

export function useInvalidateTasks() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: QUERY_KEY })
}




