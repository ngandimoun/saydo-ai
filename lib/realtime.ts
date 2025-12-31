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
  | 'health_notes'
  | 'reminders'

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
  private readonly INITIALIZATION_PERIOD = 5000 // 5 seconds (matches Supabase connection stabilization)
  private firstSubscriptionTime: number | null = null // Track when first subscription is made
  private connectionState: 'initializing' | 'connected' | 'disconnected' = 'initializing'
  private hasConnectedSuccessfully = false // Track if we've ever connected successfully

  /**
   * Check if Supabase client is ready (past initialization period from first subscription)
   */
  isReady(): boolean {
    if (!this.firstSubscriptionTime) {
      return false // Not ready until first subscription is attempted
    }
    const timeSinceFirstSubscription = Date.now() - this.firstSubscriptionTime
    return timeSinceFirstSubscription > this.INITIALIZATION_PERIOD
  }

  /**
   * Check if we're still in initialization period
   */
  private isInitializing(): boolean {
    return !this.isReady()
  }

  /**
   * Check if an error is a transient connection error that should be logged as warning
   */
  private isTransientError(err: Error | undefined): boolean {
    if (!err) return true // Empty errors are typically transient
    
    const message = err.message?.toLowerCase() || ''
    const transientPatterns = [
      'close',
      'disconnect',
      'connection',
      'timeout',
      'network',
      'socket',
      'websocket',
      'econnreset',
      'econnrefused',
      'etimedout',
      'abort',
    ]
    
    return transientPatterns.some(pattern => message.includes(pattern))
  }

  /**
   * Subscribe to real-time updates for a table
   */
  subscribe(options: RealtimeSubscriptionOptions): () => void {
    const { table, userId, onInsert, onUpdate, onDelete, filter } = options
    
    // Track first subscription time for initialization period
    if (!this.firstSubscriptionTime) {
      this.firstSubscriptionTime = Date.now()
      logger.debug('Realtime first subscription initiated', { table, userId })
    }
    
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
          this.connectionState = 'connected'
          this.hasConnectedSuccessfully = true
          logger.info('Realtime subscription active', { channelName, table })
          // Reset retry counter on successful subscription
          this.retryAttempts.delete(channelName)
        } else if (status === 'CHANNEL_ERROR') {
          const isInitializing = this.isInitializing()
          const isTransient = this.isTransientError(err)
          const retryCount = this.retryAttempts.get(channelName) || 0
          
          const errorDetails = {
            channelName,
            table,
            isInitializing,
            isTransient,
            hasConnectedBefore: this.hasConnectedSuccessfully,
            retryCount,
            errorMessage: err?.message || 'No error message',
            errorName: err?.name,
            errorCode: (err as Record<string, unknown>)?.code,
          }
          
          // Determine log level based on context
          if (isInitializing) {
            // During initialization, always use debug level - these are expected
            logger.debug('Realtime subscription initializing', errorDetails)
          } else if (isTransient) {
            // Transient errors after initialization are warnings (will retry)
            logger.warn('Realtime subscription transient error', errorDetails)
          } else if (!this.hasConnectedSuccessfully && retryCount < this.MAX_RETRIES) {
            // First connection attempts that fail are warnings until max retries
            logger.warn('Realtime subscription connecting', errorDetails)
          } else {
            // Real errors that aren't transient and we've exhausted retries
            logger.error('Realtime subscription error', {
              ...errorDetails,
              errorStack: err?.stack,
              errorDetails: err ? JSON.stringify(err, Object.getOwnPropertyNames(err)) : undefined,
            })
          }
          
          // Attempt retry with exponential backoff
          this.attemptRetry(channelName, options)
        } else {
          // Handle other status changes (CLOSED, TIMED_OUT, etc.)
          const isInitializing = this.isInitializing()
          
          if (isInitializing) {
            logger.debug('Realtime subscription status during initialization', { 
              channelName, 
              table, 
              status,
            })
          } else if (status === 'CLOSED' || status === 'TIMED_OUT') {
            // These are typically transient and will reconnect
            logger.debug('Realtime subscription status change', { 
              channelName, 
              table, 
              status,
            })
          } else {
            logger.info('Realtime subscription status', { 
              channelName, 
              table, 
              status,
            })
          }
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
      // Only log as error if we never successfully connected
      if (!this.hasConnectedSuccessfully) {
        logger.error('Realtime subscription max retries exceeded', {
          channelName,
          table: options.table,
          maxRetries: this.MAX_RETRIES,
        })
      } else {
        // If we connected before, this is likely a temporary network issue
        logger.warn('Realtime subscription reconnection max retries exceeded', {
          channelName,
          table: options.table,
          maxRetries: this.MAX_RETRIES,
        })
      }
      return
    }

    const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, currentAttempts)
    this.retryAttempts.set(channelName, currentAttempts + 1)

    // Use debug level during initialization, info otherwise
    const logLevel = this.isInitializing() ? 'debug' : 'info'
    logger[logLevel]('Retrying Realtime subscription', {
      channelName,
      table: options.table,
      attempt: currentAttempts + 1,
      maxRetries: this.MAX_RETRIES,
      delayMs: delay,
      isInitializing: this.isInitializing(),
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

