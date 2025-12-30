/**
 * Location Updater
 * 
 * Handles updating user location from IP or browser geolocation
 * Runs automatically on app load and periodically
 */

import { createClient } from './supabase'
import { getEnvironmentAPI } from './environment-api'
import { logger } from './logger'

export class LocationUpdater {
  private supabase = createClient()
  private updateInterval: NodeJS.Timeout | null = null
  private isUpdating = false
  private readonly INITIALIZATION_DELAY = 2000 // 2 seconds delay before first update
  private readonly INITIALIZATION_PERIOD = 3000 // 3 seconds
  private initializationTime: number = Date.now()
  private hasInitialized = false

  /**
   * Validate and refresh session if needed
   * Uses getUser() for server-side token validation (getSession() only reads from local storage)
   * Returns valid session or null if user is not authenticated
   */
  private async validateAndRefreshSession(): Promise<{ access_token: string; expires_at?: number } | null> {
    try {
      // First, get the session from local storage
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession()
      
      if (sessionError) {
        logger.debug('Session error when validating', { error: sessionError })
        return null
      }

      if (!session) {
        // No session - user is not authenticated (this is expected, not an error)
        logger.debug('No active session for location update')
        return null
      }

      // Validate token format (basic JWT check)
      if (!session.access_token || typeof session.access_token !== 'string' || session.access_token.split('.').length !== 3) {
        logger.debug('Invalid token format, attempting refresh...')
        const { data: { session: refreshedSession }, error: refreshError } = await this.supabase.auth.refreshSession()
        
        if (refreshError || !refreshedSession) {
          logger.debug('Failed to refresh invalid session', { error: refreshError })
          return null
        }
        
        return {
          access_token: refreshedSession.access_token,
          expires_at: refreshedSession.expires_at,
        }
      }

      // Use getUser() to validate the token server-side
      // This catches invalid/revoked tokens that getSession() would miss
      const { data: { user }, error: userError } = await this.supabase.auth.getUser()
      
      if (userError || !user) {
        // Token is invalid server-side, try to refresh
        logger.debug('Token validation failed, attempting refresh...', { error: userError })
        const { data: { session: refreshedSession }, error: refreshError } = await this.supabase.auth.refreshSession()
        
        if (refreshError || !refreshedSession) {
          logger.debug('Failed to refresh after token validation failure', { error: refreshError })
          return null
        }
        
        return {
          access_token: refreshedSession.access_token,
          expires_at: refreshedSession.expires_at,
        }
      }

      // Check if session is expired or about to expire (within 1 minute)
      const expiresAt = session.expires_at ? session.expires_at * 1000 : null
      const now = Date.now()
      
      if (expiresAt && expiresAt - now < 60000) {
        logger.debug('Session expiring soon, refreshing...')
        const { data: { session: refreshedSession }, error: refreshError } = await this.supabase.auth.refreshSession()
        
        if (refreshError || !refreshedSession) {
          logger.debug('Failed to refresh expiring session', { error: refreshError })
          // Return current session anyway, let the request fail if it's truly expired
          return {
            access_token: session.access_token,
            expires_at: session.expires_at,
          }
        }
        
        return {
          access_token: refreshedSession.access_token,
          expires_at: refreshedSession.expires_at,
        }
      }

      return {
        access_token: session.access_token,
        expires_at: session.expires_at,
      }
    } catch (error) {
      // Log as debug since this can happen during normal operation (user not logged in)
      logger.debug('Error validating session', { error })
      return null
    }
  }

  /**
   * Check if we're still in initialization period
   */
  private isInitializing(): boolean {
    return Date.now() - this.initializationTime < this.INITIALIZATION_PERIOD
  }

  /**
   * Check if network is available
   */
  private isNetworkAvailable(): boolean {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine
    }
    return true // Assume online if we can't check
  }

  /**
   * Update location from IP (no permission required)
   */
  async updateLocationFromIP(): Promise<void> {
    if (this.isUpdating) return
    
    // Wait for initialization period on first call
    if (!this.hasInitialized) {
      const timeSinceInit = Date.now() - this.initializationTime
      if (timeSinceInit < this.INITIALIZATION_DELAY) {
        const delay = this.INITIALIZATION_DELAY - timeSinceInit
        await new Promise(resolve => setTimeout(resolve, delay))
      }
      this.hasInitialized = true
    }

    // Check network availability
    if (!this.isNetworkAvailable()) {
      if (this.isInitializing()) {
        logger.debug('Network unavailable during initialization, skipping location update')
      } else {
        logger.warn('Network unavailable, cannot update location')
      }
      return
    }

    this.isUpdating = true

    try {
      const api = getEnvironmentAPI()
      const location = await api.getLocationFromIP()

      if (!location) {
        logger.warn('Failed to get location from IP')
        return
      }

      // Validate location data before sending to Edge Function
      if (
        typeof location.latitude !== 'number' ||
        typeof location.longitude !== 'number' ||
        isNaN(location.latitude) ||
        isNaN(location.longitude) ||
        location.latitude === 0 ||
        location.longitude === 0
      ) {
        logger.warn('Invalid location data received from IP geolocation', {
          latitude: location.latitude,
          longitude: location.longitude,
        })
        return
      }

      // Make request with retry logic for 401 errors
      const locationData = {
        latitude: location.latitude,
        longitude: location.longitude,
        city: location.city,
        region: location.region,
        country: location.country,
        timezone: location.timezone,
        source: 'ip' as const,
        accuracy: 10000, // ~10km for IP geolocation
      }

      let response: Response | undefined
      let retryCount = 0
      const maxRetries = 1
      let isUserNotAuthenticated = false

      while (retryCount <= maxRetries) {
        try {
          // Get fresh session right before each request to ensure token freshness
          const session = await this.validateAndRefreshSession()
          
          if (!session) {
            // User is not authenticated - this is expected for anonymous users
            isUserNotAuthenticated = true
            logger.debug('No valid session available, skipping location update (user may not be authenticated)')
            return
          }

          response = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/update-user-location`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ location: locationData }),
            }
          )

          // If successful, break out of retry loop
          if (response.ok) {
            logger.info('Location updated from IP', { location })
            return
          }

          // If 401, always attempt to refresh session and retry
          if (response.status === 401 && retryCount < maxRetries) {
            // Try to parse error to check if it's an invalid JWT
            let isInvalidJWT = false
            try {
              const errorData = await response.json()
              const errorMessage = errorData?.message || errorData?.error || ''
              isInvalidJWT = errorMessage.includes('JWT') || errorMessage.includes('Invalid') || errorData?.code === 'INVALID_TOKEN'
            } catch {
              // If parsing fails, assume it might be invalid token
              isInvalidJWT = true
            }

            if (isInvalidJWT) {
              logger.info('Invalid JWT detected, refreshing session and retrying...')
              
              // Force refresh by calling refreshSession directly
              const { data: { session: refreshedSession }, error: refreshError } = await this.supabase.auth.refreshSession()
              
              if (refreshError || !refreshedSession) {
                logger.warn('Failed to refresh session after 401 error', { error: refreshError })
                // Check if user is simply not authenticated
                const { data: { session: currentSession } } = await this.supabase.auth.getSession()
                if (!currentSession) {
                  isUserNotAuthenticated = true
                  logger.debug('User not authenticated, skipping location update')
                  return
                }
                break // Exit retry loop if refresh failed but session exists
              }
              
              // Small delay to ensure session is fully updated
              await new Promise(resolve => setTimeout(resolve, 100))
              
              // Validate the refreshed token before retry
              const validatedSession = await this.validateAndRefreshSession()
              if (!validatedSession) {
                logger.warn('Refreshed session validation failed')
                break
              }
              
              retryCount++
              continue // Retry with fresh session
            } else {
              // Not an invalid JWT error, don't retry
              break
            }
          } else {
            // Not a 401 or already retried, break out of loop
            break
          }
        } catch (networkError) {
          if (retryCount < maxRetries) {
            logger.warn('Network error, retrying...', { error: networkError })
            retryCount++
            continue
          }
          throw new Error(
            `Network error: failed to connect to location service. ${networkError instanceof Error ? networkError.message : 'Unknown network error'}`
          )
        }
      }

      // If user is not authenticated, skip gracefully without error
      if (isUserNotAuthenticated) {
        return
      }

      // If we get here, the request failed
      if (!response) {
        throw new Error('Failed to get response from location service')
      }

      const finalResponse = response

      // Parse error details from response
      let errorMessage = finalResponse.statusText || 'Unknown error'
      let errorDetails: any = null
      
      try {
        const errorData = await finalResponse.json()
        errorDetails = errorData
        
        // Extract error message from various possible formats
        if (errorData?.error) {
          errorMessage = typeof errorData.error === 'string' 
            ? errorData.error 
            : errorData.error.message || JSON.stringify(errorData.error)
        } else if (errorData?.message) {
          errorMessage = errorData.message
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        }
      } catch (parseError) {
        // If parsing fails, try to get text response
        try {
          const textResponse = await finalResponse.text()
          if (textResponse) {
            errorMessage = textResponse
          }
        } catch {
          // If all parsing fails, use statusText or fallback message
          if (!finalResponse.statusText) {
            errorMessage = `HTTP ${finalResponse.status} error`
          }
        }
      }

      // Provide more specific error messages based on status code
      if (finalResponse.status === 401) {
        errorMessage = `Authentication failed: ${errorMessage}. Session may be expired or invalid.`
      } else if (finalResponse.status === 403) {
        errorMessage = `Access forbidden: ${errorMessage}`
      } else if (finalResponse.status >= 500) {
        errorMessage = `Server error: ${errorMessage}`
      }

      const error = new Error(
        `Failed to update location (${finalResponse.status}): ${errorMessage}`
      )
      
      // Attach additional error details for debugging
      ;(error as any).status = finalResponse.status
      ;(error as any).details = errorDetails
      
      throw error
    } catch (error) {
      // Enhanced error logging with more context
      // Only log as error if it's a system error, not just user not authenticated
      const errorInfo: any = { error }
      
      if (error instanceof Error) {
        errorInfo.message = error.message
        errorInfo.status = (error as any).status
        errorInfo.details = (error as any).details
        
        // During initialization, suppress most errors
        if (this.isInitializing()) {
          // Check if it's a network error (expected during init)
          const isNetworkError = error.message.includes('Failed to fetch') || 
                                error.message.includes('Network error')
          if (isNetworkError) {
            logger.debug('Network error during initialization, skipping location update', errorInfo)
          } else if ((error as any).status === 401) {
            logger.debug('Authentication error during initialization (expected)', errorInfo)
          } else {
            logger.debug('Error during initialization, skipping location update', errorInfo)
          }
          return // Don't throw, just return gracefully
        }
        
        // If it's a 401 and we've exhausted retries, it might be user not authenticated
        // Log as warn instead of error to reduce noise
        if ((error as any).status === 401) {
          logger.warn('Failed to update location from IP - authentication issue', errorInfo)
          return // Don't throw, just return gracefully
        }
        
        // Check if it's a network error
        const isNetworkError = error.message.includes('Failed to fetch') || 
                              error.message.includes('Network error')
        if (isNetworkError) {
          logger.warn('Network error while updating location from IP', errorInfo)
          return // Don't throw, just return gracefully
        }
      }
      
      // For other errors (server errors, etc.), log as warning to reduce noise
      logger.warn('Failed to update location from IP', errorInfo)
    } finally {
      this.isUpdating = false
    }
  }

  /**
   * Update location from browser geolocation (requires permission)
   */
  async updateLocationFromBrowser(): Promise<boolean> {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return false
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Reverse geocode to get city/region
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
            )

            let city = ''
            let region = ''
            let country = ''

            if (response.ok) {
              const data = await response.json()
              city = data.city || data.locality || ''
              region = data.principalSubdivision || ''
              country = data.countryName || ''
            }

            // Store location with retry logic
            const locationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              city,
              region,
              country,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              source: 'browser' as const,
              accuracy: position.coords.accuracy || 100,
            }

            let updateResponse: Response | undefined
            let retryCount = 0
            const maxRetries = 1
            let isUserNotAuthenticated = false

            while (retryCount <= maxRetries) {
              try {
                // Get fresh session right before each request to ensure token freshness
                const session = await this.validateAndRefreshSession()
                
                if (!session) {
                  // User is not authenticated - this is expected for anonymous users
                  isUserNotAuthenticated = true
                  logger.debug('No valid session available, cannot update location from browser (user may not be authenticated)')
                  resolve(false)
                  return
                }

                updateResponse = await fetch(
                  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/update-user-location`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ location: locationData }),
                  }
                )

                // If successful, break out of retry loop
                if (updateResponse.ok) {
                  logger.info('Location updated from browser', {
                    accuracy: position.coords.accuracy,
                  })
                  resolve(true)
                  return
                }

                // If 401, always attempt to refresh session and retry
                if (updateResponse.status === 401 && retryCount < maxRetries) {
                  // Try to parse error to check if it's an invalid JWT
                  let isInvalidJWT = false
                  try {
                    const errorData = await updateResponse.json()
                    const errorMessage = errorData?.message || errorData?.error || ''
                    isInvalidJWT = errorMessage.includes('JWT') || errorMessage.includes('Invalid') || errorData?.code === 'INVALID_TOKEN'
                  } catch {
                    // If parsing fails, assume it might be invalid token
                    isInvalidJWT = true
                  }

                  if (isInvalidJWT) {
                    logger.info('Invalid JWT detected, refreshing session and retrying...')
                    
                    // Force refresh by calling refreshSession directly
                    const { data: { session: refreshedSession }, error: refreshError } = await this.supabase.auth.refreshSession()
                    
                    if (refreshError || !refreshedSession) {
                      logger.warn('Failed to refresh session after 401 error', { error: refreshError })
                      // Check if user is simply not authenticated
                      const { data: { session: currentSession } } = await this.supabase.auth.getSession()
                      if (!currentSession) {
                        isUserNotAuthenticated = true
                        logger.debug('User not authenticated, skipping location update')
                        resolve(false)
                        return
                      }
                      break // Exit retry loop if refresh failed but session exists
                    }
                    
                    // Small delay to ensure session is fully updated
                    await new Promise(resolve => setTimeout(resolve, 100))
                    
                    // Validate the refreshed token before retry
                    const validatedSession = await this.validateAndRefreshSession()
                    if (!validatedSession) {
                      logger.warn('Refreshed session validation failed')
                      break
                    }
                    
                    retryCount++
                    continue // Retry with fresh session
                  } else {
                    // Not an invalid JWT error, don't retry
                    break
                  }
                } else {
                  // Not a 401 or already retried, break out of loop
                  break
                }
              } catch (networkError) {
                if (retryCount < maxRetries) {
                  logger.warn('Network error, retrying...', { error: networkError })
                  retryCount++
                  continue
                }
                throw networkError
              }
            }

            // If user is not authenticated, skip gracefully without error
            if (isUserNotAuthenticated) {
              resolve(false)
              return
            }

            // If we get here, the request failed
            // updateResponse should be defined at this point (assigned in while loop)
            if (!updateResponse) {
              logger.warn('Failed to get response from location service')
              resolve(false)
              return
            }

            const finalResponse = updateResponse

            // Parse error details for better logging
            let errorMessage = finalResponse.statusText || 'Unknown error'
            try {
              const errorData = await finalResponse.json()
              if (errorData?.error) {
                errorMessage = typeof errorData.error === 'string' 
                  ? errorData.error 
                  : errorData.error.message || JSON.stringify(errorData.error)
              } else if (errorData?.message) {
                errorMessage = errorData.message
              }
            } catch {
              // If parsing fails, use statusText
            }

            if (finalResponse.status === 401) {
              errorMessage = `Authentication failed: ${errorMessage}. Session may be expired or invalid.`
              // Log as warn for 401 errors (user not authenticated)
              logger.warn('Failed to update location from browser - authentication issue', {
                status: finalResponse.status,
                error: errorMessage,
              })
              resolve(false)
              return
            }

            logger.warn('Failed to update location from browser', {
              status: finalResponse.status,
              error: errorMessage,
            })
            resolve(false)
          } catch (error) {
            // Only log as error if it's not a 401 (which we handle above)
            if (error instanceof Error && (error as any).status === 401) {
              logger.warn('Failed to update location from browser - authentication issue', { error })
            } else {
              logger.error('Failed to update location from browser', { error })
            }
            resolve(false)
          }
        },
        (error) => {
          logger.warn('Browser geolocation denied or failed', { error })
          resolve(false)
        },
        {
          enableHighAccuracy: false, // Use approximate location
          timeout: 5000,
          maximumAge: 300000, // Accept cached location up to 5 minutes old
        }
      )
    })
  }

  /**
   * Start automatic location updates (every 30 minutes)
   */
  startAutoUpdates(intervalMinutes: number = 30): void {
    if (this.updateInterval) {
      this.stopAutoUpdates()
    }

    // Update immediately
    this.updateLocationFromIP()

    // Then update periodically
    this.updateInterval = setInterval(() => {
      this.updateLocationFromIP()
    }, intervalMinutes * 60 * 1000)
  }

  /**
   * Stop automatic location updates
   */
  stopAutoUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }
}

// Singleton instance
let updaterInstance: LocationUpdater | null = null

export function getLocationUpdater(): LocationUpdater {
  if (!updaterInstance) {
    updaterInstance = new LocationUpdater()
  }
  return updaterInstance
}

