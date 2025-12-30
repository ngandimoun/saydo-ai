/**
 * Environment API Clients
 * 
 * Integrates with external APIs for:
 * - UV Index (OpenWeatherMap)
 * - Weather data (OpenWeatherMap)
 * - Air Quality (OpenAQ)
 * - IP Geolocation (ipapi.co)
 */

import { logger } from './logger'

export interface LocationData {
  city: string
  region: string
  country: string
  latitude: number
  longitude: number
  timezone: string
}

export interface EnvironmentData {
  location: LocationData
  uvIndex: number
  weather: {
    condition: string
    temperature: number
  }
  airQuality: {
    index: number
    category: 'good' | 'moderate' | 'unhealthy' | 'hazardous'
  }
}

class EnvironmentAPI {
  private openWeatherMapKey: string | undefined
  private openAQKey: string | undefined
  private ipApiKey: string | undefined
  private readonly INITIALIZATION_PERIOD = 3000 // 3 seconds
  private initializationTime: number = Date.now()

  constructor() {
    this.openWeatherMapKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY
    this.openAQKey = process.env.NEXT_PUBLIC_OPENAQ_API_KEY
    this.ipApiKey = process.env.NEXT_PUBLIC_IPAPI_API_KEY
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
   * Get location from IP address (no permission required)
   */
  async getLocationFromIP(): Promise<LocationData | null> {
    // Check network availability
    if (!this.isNetworkAvailable()) {
      if (this.isInitializing()) {
        logger.debug('Network unavailable during initialization, skipping location fetch')
      } else {
        logger.warn('Network unavailable, cannot fetch location from IP')
      }
      return null
    }

    try {
      // Try ipapi.co first (better free tier)
      if (this.ipApiKey) {
        const response = await fetch(`https://ipapi.co/json/?key=${this.ipApiKey}`)
        if (response.ok) {
          const data = await response.json()
          return {
            city: data.city || '',
            region: data.region || '',
            country: data.country_name || '',
            latitude: data.latitude || 0,
            longitude: data.longitude || 0,
            timezone: data.timezone || 'UTC',
          }
        }
      }

      // Fallback to free ip-api.com (no key required)
      const response = await fetch('https://ip-api.com/json/')
      if (response.ok) {
        const data = await response.json()
        if (data.status === 'success') {
          return {
            city: data.city || '',
            region: data.regionName || '',
            country: data.country || '',
            latitude: data.lat || 0,
            longitude: data.lon || 0,
            timezone: data.timezone || 'UTC',
          }
        }
      }

      return null
    } catch (error) {
      // During initialization, log as warn/debug instead of error
      if (this.isInitializing()) {
        logger.debug('Failed to get location from IP during initialization', { error })
      } else {
        // Check if it's a network error
        const isNetworkError = error instanceof TypeError && error.message === 'Failed to fetch'
        if (isNetworkError) {
          logger.warn('Network error while fetching location from IP', { error })
        } else {
          logger.error('Failed to get location from IP', { error })
        }
      }
      return null
    }
  }

  /**
   * Get UV Index and weather from OpenWeatherMap
   */
  async getUVIndexAndWeather(latitude: number, longitude: number): Promise<{
    uvIndex: number
    weather: { condition: string; temperature: number }
  } | null> {
    if (!this.openWeatherMapKey) {
      logger.warn('OpenWeatherMap API key not configured')
      return null
    }

    try {
      // Get current weather and UV index
      const [weatherResponse, uvResponse] = await Promise.all([
        fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${this.openWeatherMapKey}&units=metric`
        ),
        fetch(
          `https://api.openweathermap.org/data/2.5/uvi?lat=${latitude}&lon=${longitude}&appid=${this.openWeatherMapKey}`
        ),
      ])

      if (!weatherResponse.ok || !uvResponse.ok) {
        throw new Error('OpenWeatherMap API error')
      }

      const weatherData = await weatherResponse.json()
      const uvData = await uvResponse.json()

      return {
        uvIndex: Math.round(uvData.value || 0),
        weather: {
          condition: weatherData.weather[0]?.main || 'Unknown',
          temperature: Math.round(weatherData.main?.temp || 0),
        },
      }
    } catch (error) {
      // During initialization, log as warn instead of error
      if (this.isInitializing()) {
        logger.debug('Failed to get UV index and weather during initialization', { error })
      } else {
        const isNetworkError = error instanceof TypeError && error.message === 'Failed to fetch'
        if (isNetworkError) {
          logger.warn('Network error while fetching UV index and weather', { error })
        } else {
          logger.error('Failed to get UV index and weather', { error })
        }
      }
      return null
    }
  }

  /**
   * Get air quality from OpenAQ
   */
  async getAirQuality(latitude: number, longitude: number): Promise<{
    index: number
    category: 'good' | 'moderate' | 'unhealthy' | 'hazardous'
  } | null> {
    try {
      // OpenAQ free API (no key required)
      const response = await fetch(
        `https://api.openaq.org/v2/latest?coordinates=${latitude},${longitude}&radius=10000&limit=1`
      )

      if (!response.ok) {
        throw new Error('OpenAQ API error')
      }

      const data = await response.json()
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0]
        const pm25 = location.measurements?.find((m: any) => m.parameter === 'pm25')
        const aqi = pm25?.value || 0

        // Convert PM2.5 to AQI category
        let category: 'good' | 'moderate' | 'unhealthy' | 'hazardous' = 'good'
        if (aqi > 150) category = 'hazardous'
        else if (aqi > 100) category = 'unhealthy'
        else if (aqi > 50) category = 'moderate'

        return {
          index: Math.round(aqi),
          category,
        }
      }

      // Fallback: assume good if no data
      return {
        index: 0,
        category: 'good' as const,
      }
    } catch (error) {
      // During initialization, log as warn instead of error
      if (this.isInitializing()) {
        logger.debug('Failed to get air quality during initialization', { error })
      } else {
        const isNetworkError = error instanceof TypeError && error.message === 'Failed to fetch'
        if (isNetworkError) {
          logger.warn('Network error while fetching air quality', { error })
        } else {
          logger.error('Failed to get air quality', { error })
        }
      }
      // Fallback: assume good
      return {
        index: 0,
        category: 'good' as const,
      }
    }
  }

  /**
   * Get complete environment data for a location
   */
  async getEnvironmentData(location?: LocationData): Promise<EnvironmentData | null> {
    // Get location if not provided
    let loc = location
    if (!loc) {
      loc = await this.getLocationFromIP()
      if (!loc) {
        return null
      }
    }

    // Fetch all data in parallel
    const [weatherData, airQualityData] = await Promise.all([
      this.getUVIndexAndWeather(loc.latitude, loc.longitude),
      this.getAirQuality(loc.latitude, loc.longitude),
    ])

    if (!weatherData) {
      return null
    }

    return {
      location: loc,
      uvIndex: weatherData.uvIndex,
      weather: weatherData.weather,
      airQuality: airQualityData || { index: 0, category: 'good' },
    }
  }
}

// Singleton instance
let apiInstance: EnvironmentAPI | null = null

export function getEnvironmentAPI(): EnvironmentAPI {
  if (!apiInstance) {
    apiInstance = new EnvironmentAPI()
  }
  return apiInstance
}


