"use client"

import { useEffect } from "react"
import { getLocationUpdater } from "@/lib/location-updater"
import { logger } from "@/lib/logger"

/**
 * Location Updater Provider
 * 
 * Automatically starts location updates when the app loads
 * Updates location every 30 minutes via IP geolocation
 */
export function LocationUpdaterProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const updater = getLocationUpdater()
    
    // Start automatic location updates (every 30 minutes)
    updater.startAutoUpdates(30)
    
    logger.info('Location updater started')

    return () => {
      updater.stopAutoUpdates()
      logger.info('Location updater stopped')
    }
  }, [])

  return <>{children}</>
}


