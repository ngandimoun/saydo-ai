/**
 * Audio URL Utilities
 * 
 * Handles signed URL management for audio playback:
 * - Extracts file paths from signed URLs
 * - Checks if URLs are expired
 * - Refreshes expired URLs
 * - Caches refreshed URLs
 */

import { getAudioStreamer } from './audio-streamer'

interface ParsedSignedUrl {
  bucket: string
  path: string
  isSigned: boolean
}

/**
 * Parse a Supabase signed URL to extract bucket and path
 * Format: https://{project}.supabase.co/storage/v1/object/sign/{bucket}/{path}?token={jwt}
 */
export function parseSignedUrl(url: string): ParsedSignedUrl | null {
  try {
    // Check if it's a signed URL
    const signMatch = url.match(/\/storage\/v1\/object\/sign\/([^/]+)\/(.+)\?token=/)
    if (signMatch) {
      return {
        bucket: signMatch[1],
        path: decodeURIComponent(signMatch[2]),
        isSigned: true,
      }
    }

    // Check if it's a direct public URL
    const publicMatch = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/)
    if (publicMatch) {
      return {
        bucket: publicMatch[1],
        path: decodeURIComponent(publicMatch[2]),
        isSigned: false,
      }
    }

    // If it's not a Supabase storage URL, return null
    return null
  } catch (error) {
    return null
  }
}

/**
 * Check if a JWT token is expired by decoding it
 * Returns true if expired or if we can't decode it (assume expired for safety)
 */
function isTokenExpired(token: string): boolean {
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.')
    if (parts.length !== 3) {
      return true // Invalid token format, assume expired
    }

    // Convert URL-safe base64 to standard base64
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    
    // Add padding if needed (base64 strings must be multiples of 4)
    while (base64.length % 4) {
      base64 += '='
    }

    // Decode the payload (second part)
    const payload = JSON.parse(atob(base64))
    
    // Check expiration (exp is in seconds, Date.now() is in milliseconds)
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return true
    }

    // Check if it expires within 5 minutes (refresh proactively)
    if (payload.exp && payload.exp * 1000 < Date.now() + 5 * 60 * 1000) {
      return true
    }

    return false
  } catch (error) {
    // If we can't decode, assume expired for safety
    return true
  }
}

/**
 * Check if a signed URL is expired or about to expire
 */
export function isSignedUrlExpired(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const token = urlObj.searchParams.get('token')
    
    if (!token) {
      // Not a signed URL, so it can't be expired
      return false
    }

    return isTokenExpired(token)
  } catch (error) {
    // If we can't parse the URL, assume expired for safety
    return true
  }
}

/**
 * Refresh a signed URL by generating a new one
 * Returns the original URL if it's not a signed URL or if refresh fails
 * @throws Error if refresh fails and URL is invalid
 */
export async function refreshSignedUrl(url: string): Promise<string> {
  try {
    const parsed = parseSignedUrl(url)
    
    if (!parsed) {
      // Not a Supabase storage URL, return as-is (but validate it)
      return validateAudioUrl(url)
    }

    if (!parsed.isSigned) {
      // Public URL, no need to refresh (but validate it)
      return validateAudioUrl(url)
    }

    // Generate a fresh signed URL
    const streamer = getAudioStreamer()
    const freshUrl = await streamer.getSignedAudioUrl(parsed.bucket, parsed.path, 3600)
    
    // Validate the fresh URL
    if (!freshUrl || freshUrl.trim() === '') {
      throw new Error('Failed to refresh signed URL: received empty URL')
    }

    return validateAudioUrl(freshUrl)
  } catch (error) {
    // If refresh fails, validate the original URL and throw if it's invalid
    const validatedOriginal = validateAudioUrl(url)
    
    // If the error is about validation, re-throw it
    if (error instanceof Error && error.message.includes('Audio URL')) {
      throw error
    }
    
    // Otherwise, log and return original (validated) URL
    // The playback will fail and show an error, which is better than breaking
    console.error('Failed to refresh signed URL:', error)
    return validatedOriginal
  }
}

/**
 * Validate that a URL is not empty and is a valid URL format
 */
export function validateAudioUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    throw new Error('Audio URL is empty or invalid')
  }

  // Check if it's a valid URL format
  try {
    new URL(url)
  } catch (error) {
    throw new Error('Audio URL is not a valid URL format')
  }

  return url.trim()
}

/**
 * Get a valid audio URL, refreshing if necessary
 * This is the main function to use before playing audio
 * @throws Error if URL is invalid or empty
 */
export async function getValidAudioUrl(url: string): Promise<string> {
  // Validate input URL
  const validatedUrl = validateAudioUrl(url)

  // Check if it's a signed URL and if it's expired
  if (isSignedUrlExpired(validatedUrl)) {
    // Refresh the URL
    const refreshedUrl = await refreshSignedUrl(validatedUrl)
    // Validate the refreshed URL
    return validateAudioUrl(refreshedUrl)
  }

  // URL is still valid, return as-is
  return validatedUrl
}

/**
 * Get user-friendly error message from audio playback error
 */
export function getAudioErrorMessage(error: unknown, audioUrl?: string): string {
  if (error instanceof Error) {
    // Check for validation errors first
    if (error.message.includes('Audio URL is empty') || error.message.includes('empty')) {
      return 'Invalid audio URL - please try again.'
    }

    if (error.message.includes('not a valid URL')) {
      return 'Invalid audio URL format - please try again.'
    }

    // Check error name/code
    if (error.name === 'NotSupportedError' || (error as any).code === 9 || (error as any).code === 4) {
      // Error code 4 is MEDIA_ERR_SRC_NOT_SUPPORTED (empty src attribute)
      if ((error as any).code === 4 || error.message.includes('Empty src')) {
        return 'Invalid audio URL - please try again.'
      }
      
      // Check if it might be an expired URL
      if (audioUrl && isSignedUrlExpired(audioUrl)) {
        return 'Unable to load audio - the link has expired. Please try again.'
      }
      return 'Audio format not supported by your browser.'
    }

    if (error.name === 'NetworkError' || error.message.includes('network')) {
      return 'Network error - please check your connection and try again.'
    }

    if (error.message.includes('404') || error.message.includes('not found')) {
      return 'Audio file not found.'
    }

    if (error.message.includes('403') || error.message.includes('forbidden')) {
      return 'Access denied - please try refreshing the page.'
    }
  }

  // Generic error message
  return 'Unable to play audio - please try again.'
}

