/**
 * Update User Location Edge Function
 * 
 * Updates user location from IP geolocation or browser geolocation
 * Runs periodically via pg_cron or can be called from client
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LocationData {
  latitude?: number
  longitude?: number
  city?: string
  region?: string
  country?: string
  timezone?: string
  source: 'ip' | 'browser' | 'manual'
  accuracy?: number
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check for Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Missing Authorization header')
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized',
          message: 'Missing Authorization header. Please ensure you are logged in.',
          code: 'MISSING_AUTH_HEADER'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate Authorization header format
    if (!authHeader.startsWith('Bearer ')) {
      console.error('Invalid Authorization header format')
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized',
          message: 'Invalid Authorization header format. Expected "Bearer <token>".',
          code: 'INVALID_AUTH_FORMAT'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      // Provide detailed error information
      let errorMessage = 'Authentication failed'
      let errorCode = 'AUTH_FAILED'

      if (userError) {
        console.error('Authentication error:', userError.message)
        
        // Distinguish between different error types
        if (userError.message?.includes('JWT') || userError.message?.includes('token')) {
          errorMessage = 'Invalid or expired authentication token. Please log in again.'
          errorCode = 'INVALID_TOKEN'
        } else if (userError.message?.includes('expired')) {
          errorMessage = 'Authentication token has expired. Please refresh your session.'
          errorCode = 'TOKEN_EXPIRED'
        } else {
          errorMessage = userError.message || 'Authentication failed'
        }
      } else if (!user) {
        errorMessage = 'User not found. Please ensure you are logged in.'
        errorCode = 'USER_NOT_FOUND'
      }

      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized',
          message: errorMessage,
          code: errorCode,
          details: userError ? { 
            message: userError.message,
            status: userError.status 
          } : undefined
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get location data from request body or IP
    const body = await req.json().catch(() => ({}))
    const locationData: LocationData = body.location || {}

    // If no location provided, try IP geolocation
    if (!locationData.latitude || !locationData.longitude) {
      const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''
      
      // Use ip-api.com (free, no key required)
      try {
        const ipResponse = await fetch(`http://ip-api.com/json/${clientIP}`)
        if (ipResponse.ok) {
          const ipData = await ipResponse.json()
          if (ipData.status === 'success') {
            locationData.latitude = ipData.lat
            locationData.longitude = ipData.lon
            locationData.city = ipData.city
            locationData.region = ipData.regionName
            locationData.country = ipData.country
            locationData.timezone = ipData.timezone
            locationData.source = 'ip'
            locationData.accuracy = 10000 // IP geolocation is approximate (~10km)
          }
        }
      } catch (error) {
        console.error('IP geolocation failed:', error)
      }
    }

    // Insert location into database
    const { data, error } = await supabaseClient
      .from('user_locations')
      .insert({
        user_id: user.id,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        city: locationData.city,
        region: locationData.region,
        country: locationData.country,
        timezone: locationData.timezone,
        source: locationData.source || 'ip',
        accuracy: locationData.accuracy,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      
      // Provide more specific error messages for database errors
      let errorMessage = 'Failed to save location'
      if (error.code === '23505') { // Unique constraint violation
        errorMessage = 'Location already exists for this user'
      } else if (error.code === '23503') { // Foreign key violation
        errorMessage = 'Invalid user reference'
      } else if (error.message) {
        errorMessage = error.message
      }

      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          code: error.code || 'DATABASE_ERROR',
          details: error.details || undefined
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, location: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred'
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while updating location'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})


