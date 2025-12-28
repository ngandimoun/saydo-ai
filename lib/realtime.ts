/**
 * Supabase Realtime Subscriptions
 * 
 * Provides utilities for subscribing to real-time updates
 * for critical tables: urgent_alerts, proactive_interventions,
 * tasks, voice_recordings, health_status
 */

import { createClient } from './supabase'
import { logger } from './logger'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type RealtimeTable = 
  | 'urgent_alerts'
  | 'proactive_interventions'
  | 'tasks'
  | 'voice_recordings'
  | 'health_status'

export interface RealtimeSubscriptionOptions {
  table: RealtimeTable
  userId: string
  onInsert?: (payload: unknown) => void
  onUpdate?: (payload: unknown) => void
  onDelete?: (payload: unknown) => void
  filter?: string // e.g., "user_id=eq.123"
}

export class RealtimeManager {
  private supabase = createClient()
  private channels: Map<string, RealtimeChannel> = new Map()
  private retryAttempts: Map<string, number> = new Map()
  private readonly MAX_RETRIES = 3
  private readonly INITIAL_RETRY_DELAY = 1000 // 1 second

  /**
   * Subscribe to real-time updates for a table
   */
  subscribe(options: RealtimeSubscriptionOptions): () => void {
    const { table, userId, onInsert, onUpdate, onDelete, filter } = options
    
    // Create channel name
    const channelName = `${table}:${userId}`
    
    // Remove existing subscription if any
    this.unsubscribe(channelName)

    // Create channel
    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: filter || `user_id=eq.${userId}`,
        },
        (payload) => {
          logger.debug('Realtime event received', {
            table,
            event: payload.eventType,
            payload,
          })

          switch (payload.eventType) {
            case 'INSERT':
              onInsert?.(payload.new)
              break
            case 'UPDATE':
              onUpdate?.(payload.new)
              break
            case 'DELETE':
              onDelete?.(payload.old)
              break
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          logger.info('Realtime subscription active', { channelName, table })
          // Reset retry counter on successful subscription
          this.retryAttempts.delete(channelName)
        } else if (status === 'CHANNEL_ERROR') {
          const errorDetails = {
            channelName,
            table,
            error: err,
            errorMessage: err?.message,
            errorStack: err?.stack,
            errorName: err?.name,
            errorCode: (err as any)?.code,
            errorDetails: err ? JSON.stringify(err, Object.getOwnPropertyNames(err)) : undefined,
          }
          logger.error('Realtime subscription error', errorDetails)
          
          // Attempt retry with exponential backoff
          this.attemptRetry(channelName, options)
        } else {
          logger.warn('Realtime subscription status change', { 
            channelName, 
            table, 
            status, 
            error: err,
            errorMessage: err?.message 
          })
        }
      })

    this.channels.set(channelName, channel)

    // Return unsubscribe function
    return () => this.unsubscribe(channelName)
  }

  /**
   * Attempt to retry subscription with exponential backoff
   */
  private attemptRetry(channelName: string, options: RealtimeSubscriptionOptions): void {
    const currentAttempts = this.retryAttempts.get(channelName) || 0
    
    if (currentAttempts >= this.MAX_RETRIES) {
      logger.error('Realtime subscription max retries exceeded', {
        channelName,
        table: options.table,
        maxRetries: this.MAX_RETRIES,
      })
      return
    }

    const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, currentAttempts)
    this.retryAttempts.set(channelName, currentAttempts + 1)

    logger.warn('Retrying Realtime subscription', {
      channelName,
      table: options.table,
      attempt: currentAttempts + 1,
      maxRetries: this.MAX_RETRIES,
      delayMs: delay,
    })

    setTimeout(() => {
      // Only retry if channel still exists (hasn't been unsubscribed)
      if (this.channels.has(channelName)) {
        this.unsubscribe(channelName)
        this.subscribe(options)
      }
    }, delay)
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName)
    if (channel) {
      this.supabase.removeChannel(channel)
      this.channels.delete(channelName)
      // Clear retry attempts when unsubscribing
      this.retryAttempts.delete(channelName)
      logger.info('Realtime subscription removed', { channelName })
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    for (const [channelName, channel] of this.channels.entries()) {
      this.supabase.removeChannel(channel)
    }
    this.channels.clear()
    this.retryAttempts.clear()
    logger.info('All realtime subscriptions removed')
  }

  /**
   * Subscribe to urgent alerts
   * Filters out dismissed alerts in the callback since Realtime doesn't support
   * multiple filter conditions with & separator
   */
  subscribeToUrgentAlerts(
    userId: string,
    onNewAlert: (alert: unknown) => void
  ): () => void {
    return this.subscribe({
      table: 'urgent_alerts',
      userId,
      onInsert: (alert) => {
        // Filter out dismissed alerts in callback
        const alertData = alert as { is_dismissed?: boolean }
        if (!alertData.is_dismissed) {
          onNewAlert(alert)
        }
      },
      filter: `user_id=eq.${userId}`,
    })
  }

  /**
   * Subscribe to proactive interventions
   * Filters out dismissed interventions in the callback since Realtime doesn't support
   * multiple filter conditions with & separator
   */
  subscribeToInterventions(
    userId: string,
    onNewIntervention: (intervention: unknown) => void
  ): () => void {
    return this.subscribe({
      table: 'proactive_interventions',
      userId,
      onInsert: (intervention) => {
        // Filter out dismissed interventions in callback
        const interventionData = intervention as { is_dismissed?: boolean }
        if (!interventionData.is_dismissed) {
          onNewIntervention(intervention)
        }
      },
      filter: `user_id=eq.${userId}`,
    })
  }

  /**
   * Subscribe to tasks
   */
  subscribeToTasks(
    userId: string,
    onTaskChange: (task: unknown) => void
  ): () => void {
    return this.subscribe({
      table: 'tasks',
      userId,
      onInsert: onTaskChange,
      onUpdate: onTaskChange,
      filter: `user_id=eq.${userId}`,
    })
  }

  /**
   * Subscribe to voice recordings
   */
  subscribeToVoiceRecordings(
    userId: string,
    onRecordingChange: (recording: unknown) => void
  ): () => void {
    return this.subscribe({
      table: 'voice_recordings',
      userId,
      onUpdate: onRecordingChange,
      filter: `user_id=eq.${userId}`,
    })
  }

  /**
   * Subscribe to health status
   */
  subscribeToHealthStatus(
    userId: string,
    onStatusChange: (status: unknown) => void
  ): () => void {
    return this.subscribe({
      table: 'health_status',
      userId,
      onUpdate: onStatusChange,
      filter: `user_id=eq.${userId}`,
    })
  }
}

// Singleton instance
let realtimeInstance: RealtimeManager | null = null

export function getRealtimeManager(): RealtimeManager {
  if (!realtimeInstance) {
    realtimeInstance = new RealtimeManager()
  }
  return realtimeInstance
}

