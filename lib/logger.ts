/**
 * Centralized Logging Infrastructure
 * 
 * Provides structured logging with levels (debug, info, warn, error)
 * Integrates with error tracking services (Sentry, LogRocket)
 * Sends critical logs to Supabase for server-side aggregation
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogMetadata {
  [key: string]: unknown
  userId?: string
  page?: string
  userAgent?: string
  timestamp?: string
}

class Logger {
  private isDevelopment: boolean
  private sentryDsn: string | undefined
  private logRocketId: string | undefined

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN
    this.logRocketId = process.env.NEXT_PUBLIC_LOGROCKET_APP_ID
  }

  /**
   * Normalize Error objects to extract their properties
   * Error properties (message, stack, name) are not enumerable, so JSON.stringify doesn't capture them
   */
  private normalizeError(error: unknown): Record<string, unknown> {
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: (error as any).code,
        cause: error.cause ? this.normalizeError(error.cause) : undefined,
      }
    }
    return { value: error }
  }

  /**
   * Recursively normalize metadata to extract Error objects
   */
  private normalizeMetadata(metadata: LogMetadata): Record<string, unknown> {
    const normalized: Record<string, unknown> = {}
    
    for (const [key, value] of Object.entries(metadata)) {
      if (value instanceof Error) {
        normalized[key] = this.normalizeError(value)
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively normalize nested objects
        normalized[key] = this.normalizeMetadata(value as LogMetadata)
      } else {
        normalized[key] = value
      }
    }
    
    return normalized
  }

  private formatMessage(level: LogLevel, message: string, metadata?: LogMetadata): string {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`
    
    if (metadata) {
      // Normalize Error objects in metadata before stringifying
      const normalized = this.normalizeMetadata(metadata)
      return `${prefix} ${message} ${JSON.stringify(normalized)}`
    }
    
    return `${prefix} ${message}`
  }

  private async sendToSupabase(level: LogLevel, message: string, metadata?: LogMetadata) {
    try {
      // Only send error and warn logs to Supabase to avoid spam
      if (level === 'error' || level === 'warn') {
        const { createClient } = await import('./supabase')
        const supabase = createClient()
        
        const { data: { user } } = await supabase.auth.getUser()
        
        // Normalize metadata to ensure Error objects are properly serialized
        const normalizedMetadata = metadata ? this.normalizeMetadata(metadata) : {}
        
        await supabase.from('app_logs').insert({
          user_id: user?.id || null,
          log_level: level,
          message,
          metadata: normalizedMetadata,
        })
      }
    } catch (error) {
      // Silently fail - don't break the app if logging fails
      if (this.isDevelopment) {
        console.error('Failed to send log to Supabase:', error)
      }
    }
  }

  private sendToSentry(level: LogLevel, message: string, metadata?: LogMetadata) {
    if (!this.sentryDsn || typeof window === 'undefined') return

    try {
      // Dynamic import to avoid bundling Sentry in production if not needed
      if (window.Sentry) {
        if (level === 'error') {
          window.Sentry.captureException(new Error(message), {
            extra: metadata,
            level: 'error',
          })
        } else {
          window.Sentry.captureMessage(message, {
            level: level === 'warn' ? 'warning' : level,
            extra: metadata,
          })
        }
      }
    } catch (error) {
      // Silently fail
      if (this.isDevelopment) {
        console.error('Failed to send log to Sentry:', error)
      }
    }
  }

  private sendToLogRocket(level: LogLevel, message: string, metadata?: LogMetadata) {
    if (!this.logRocketId || typeof window === 'undefined') return

    try {
      if (window.LogRocket) {
        if (level === 'error') {
          window.LogRocket.captureException(new Error(message), {
            extra: metadata,
          })
        } else {
          window.LogRocket.log(message, metadata)
        }
      }
    } catch (error) {
      // Silently fail
      if (this.isDevelopment) {
        console.error('Failed to send log to LogRocket:', error)
      }
    }
  }

  private log(level: LogLevel, message: string, metadata?: LogMetadata) {
    const formattedMessage = this.formatMessage(level, message, metadata)

    // Always log to console in development
    if (this.isDevelopment) {
      switch (level) {
        case 'debug':
          console.debug(formattedMessage)
          break
        case 'info':
          console.info(formattedMessage)
          break
        case 'warn':
          console.warn(formattedMessage)
          break
        case 'error':
          console.error(formattedMessage)
          break
      }
    } else {
      // In production, only log errors and warnings to console
      if (level === 'error' || level === 'warn') {
        console.error(formattedMessage)
      }
    }

    // Send to external services
    this.sendToSupabase(level, message, metadata)
    this.sendToSentry(level, message, metadata)
    this.sendToLogRocket(level, message, metadata)
  }

  debug(message: string, metadata?: LogMetadata) {
    this.log('debug', message, metadata)
  }

  info(message: string, metadata?: LogMetadata) {
    this.log('info', message, metadata)
  }

  warn(message: string, metadata?: LogMetadata) {
    this.log('warn', message, metadata)
  }

  error(message: string, metadata?: LogMetadata) {
    this.log('error', message, metadata)
  }

  // Performance logging helper
  async trackPerformance(
    metricName: string,
    value: number,
    unit: string = 'ms',
    metadata?: LogMetadata
  ) {
    try {
      const { createClient } = await import('./supabase')
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      
      await supabase.from('performance_metrics').insert({
        user_id: user?.id || null,
        metric_type: 'performance',
        metric_name: metricName,
        value,
        unit,
        metadata: metadata || {},
      })
    } catch (error) {
      // Silently fail
      if (this.isDevelopment) {
        console.error('Failed to track performance metric:', error)
      }
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Type declarations for window extensions
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, options?: { extra?: LogMetadata; level?: string }) => void
      captureMessage: (message: string, options?: { level?: string; extra?: LogMetadata }) => void
    }
    LogRocket?: {
      captureException: (error: Error, options?: { extra?: LogMetadata }) => void
      log: (message: string, metadata?: LogMetadata) => void
    }
  }
}

