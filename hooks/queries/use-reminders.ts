/**
 * Query hooks for reminders
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import type { Reminder } from '@/lib/dashboard/types'

interface UseRemindersOptions {
  includeCompleted?: boolean
  limit?: number
  priority?: 'urgent' | 'high' | 'medium' | 'low'
  type?: 'task' | 'todo' | 'reminder'
}

async function fetchReminders(options: UseRemindersOptions = {}): Promise<Reminder[]> {
  const { includeCompleted = false, limit = 50, priority, type } = options
  
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

  if (priority) {
    query = query.eq('priority', priority)
  }

  if (type) {
    query = query.eq('type', type)
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

export function useReminders(options: UseRemindersOptions = {}) {
  return useQuery({
    queryKey: ['reminders', options],
    queryFn: () => fetchReminders(options),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useInvalidateReminders() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['reminders'] })
}

