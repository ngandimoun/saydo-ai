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

  /**
   * Update location from IP (no permission required)
   */
  async updateLocationFromIP(): Promise<void> {
    if (this.isUpdating) return
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

      // Call Edge Function to store location
      const { data: { session } } = await this.supabase.auth.getSession()
      if (!session) return

      let response: Response
      try {
        response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/update-user-location`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              location: {
                latitude: location.latitude,
                longitude: location.longitude,
                city: location.city,
                region: location.region,
                country: location.country,
                timezone: location.timezone,
                source: 'ip',
                accuracy: 10000, // ~10km for IP geolocation
              },
            }),
          }
        )
      } catch (networkError) {
        throw new Error(
          `Network error: failed to connect to location service. ${networkError instanceof Error ? networkError.message : 'Unknown network error'}`
        )
      }

      if (!response.ok) {
        // Try to parse error details from response body
        let errorMessage = response.statusText || 'Unknown error'
        try {
          const errorData = await response.json()
          if (errorData?.error) {
            errorMessage = errorData.error
          }
        } catch {
          // If parsing fails, use statusText or fallback message
          if (!response.statusText) {
            errorMessage = `HTTP ${response.status} error`
          }
        }

        throw new Error(
          `Failed to update location (${response.status}): ${errorMessage}`
        )
      }

      logger.info('Location updated from IP', { location })
    } catch (error) {
      logger.error('Failed to update location from IP', { error })
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
            const { data: { session } } = await this.supabase.auth.getSession()
            if (!session) {
              resolve(false)
              return
            }

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

            // Store location
            const updateResponse = await fetch(
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/update-user-location`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  location: {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    city,
                    region,
                    country,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    source: 'browser',
                    accuracy: position.coords.accuracy || 100,
                  },
                }),
              }
            )

            if (updateResponse.ok) {
              logger.info('Location updated from browser', {
                accuracy: position.coords.accuracy,
              })
              resolve(true)
            } else {
              resolve(false)
            }
          } catch (error) {
            logger.error('Failed to update location from browser', { error })
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

