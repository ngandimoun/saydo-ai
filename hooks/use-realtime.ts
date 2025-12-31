/**
 * React Hook for Supabase Realtime
 * 
 * Provides React interface for real-time subscriptions
 */

import { useEffect, useRef } from 'react'
import { getRealtimeManager } from '@/lib/realtime'
import { logger } from '@/lib/logger'
import type { RealtimeTable } from '@/lib/realtime'

export interface UseRealtimeOptions {
  table: RealtimeTable
  userId: string
  onInsert?: (payload: unknown) => void
  onUpdate?: (payload: unknown) => void
  onDelete?: (payload: unknown) => void
  enabled?: boolean
}

export function useRealtime(options: UseRealtimeOptions) {
  const { table, userId, onInsert, onUpdate, onDelete, enabled = true } = options
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    
    if (!enabled || !userId) return

    const manager = getRealtimeManager()

    // Subscribe immediately - the RealtimeManager handles initialization internally
    // and will suppress errors during the initialization period
    unsubscribeRef.current = manager.subscribe({
      table,
      userId,
      onInsert,
      onUpdate,
      onDelete,
    })

    logger.debug('Realtime subscription initiated', { table, userId })

    return () => {
      mountedRef.current = false
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
        logger.debug('Realtime subscription cleaned up', { table, userId })
      }
    }
  }, [table, userId, enabled, onInsert, onUpdate, onDelete])
}

/**
 * Hook for subscribing to urgent alerts
 */
export function useUrgentAlertsRealtime(
  userId: string,
  onNewAlert: (alert: unknown) => void,
  enabled: boolean = true
) {
  useRealtime({
    table: 'urgent_alerts',
    userId,
    onInsert: onNewAlert,
    enabled,
  })
}

/**
 * Hook for subscribing to proactive interventions
 */
export function useInterventionsRealtime(
  userId: string,
  onNewIntervention: (intervention: unknown) => void,
  enabled: boolean = true
) {
  useRealtime({
    table: 'proactive_interventions',
    userId,
    onInsert: onNewIntervention,
    enabled,
  })
}

/**
 * Hook for subscribing to tasks
 */
export function useTasksRealtime(
  userId: string,
  onTaskChange: (task: unknown) => void,
  enabled: boolean = true
) {
  useRealtime({
    table: 'tasks',
    userId,
    onInsert: onTaskChange,
    onUpdate: onTaskChange,
    enabled,
  })
}

/**
 * Hook for subscribing to voice recordings
 */
export function useVoiceRecordingsRealtime(
  userId: string,
  onRecordingChange: (recording: unknown) => void,
  enabled: boolean = true
) {
  useRealtime({
    table: 'voice_recordings',
    userId,
    onInsert: onRecordingChange,
    onUpdate: onRecordingChange,
    enabled,
  })
}

/**
 * Hook for subscribing to health status
 */
export function useHealthStatusRealtime(
  userId: string,
  onStatusChange: (status: unknown) => void,
  enabled: boolean = true
) {
  useRealtime({
    table: 'health_status',
    userId,
    onUpdate: onStatusChange,
    enabled,
  })
}

/**
 * Hook for subscribing to health notes
 */
export function useHealthNotesRealtime(
  userId: string,
  onNoteChange: (note: unknown) => void,
  enabled: boolean = true
) {
  useRealtime({
    table: 'health_notes',
    userId,
    onInsert: onNoteChange,
    onUpdate: onNoteChange,
    enabled,
  })
}

/**
 * Hook for subscribing to reminders
 */
export function useRemindersRealtime(
  userId: string,
  onReminderChange: (reminder: unknown) => void,
  enabled: boolean = true
) {
  useRealtime({
    table: 'reminders',
    userId,
    onInsert: onReminderChange,
    onUpdate: onReminderChange,
    enabled,
  })
}


