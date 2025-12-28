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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
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
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, location: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

