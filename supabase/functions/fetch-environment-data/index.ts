/**
 * Fetch Environment Data Edge Function
 * 
 * Fetches UV index, weather, and air quality data for a user's location
 * Can be called periodically via pg_cron or on-demand
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get user's latest location
    const { data: location, error: locationError } = await supabaseClient
      .from('user_locations')
      .select('latitude, longitude, city')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (locationError || !location) {
      return new Response(
        JSON.stringify({ error: 'No location data found. Please update location first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { latitude, longitude, city } = location
    const openWeatherMapKey = Deno.env.get('OPENWEATHERMAP_API_KEY')

    // Fetch UV index and weather
    let uvIndex = 0
    let weatherCondition = 'Unknown'
    let temperature = 0

    if (openWeatherMapKey) {
      try {
        const [weatherResponse, uvResponse] = await Promise.all([
          fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${openWeatherMapKey}&units=metric`
          ),
          fetch(
            `https://api.openweathermap.org/data/2.5/uvi?lat=${latitude}&lon=${longitude}&appid=${openWeatherMapKey}`
          ),
        ])

        if (weatherResponse.ok) {
          const weatherData = await weatherResponse.json()
          weatherCondition = weatherData.weather[0]?.main || 'Unknown'
          temperature = Math.round(weatherData.main?.temp || 0)
        }

        if (uvResponse.ok) {
          const uvData = await uvResponse.json()
          uvIndex = Math.round(uvData.value || 0)
        }
      } catch (error) {
        console.error('OpenWeatherMap API error:', error)
      }
    }

    // Fetch air quality from OpenAQ (free, no key required)
    let airQualityIndex = 0
    let airQualityCategory: 'good' | 'moderate' | 'unhealthy' | 'hazardous' = 'good'

    try {
      const aqResponse = await fetch(
        `https://api.openaq.org/v2/latest?coordinates=${latitude},${longitude}&radius=10000&limit=1`
      )

      if (aqResponse.ok) {
        const aqData = await aqResponse.json()
        if (aqData.results && aqData.results.length > 0) {
          const location = aqData.results[0]
          const pm25 = location.measurements?.find((m: any) => m.parameter === 'pm25')
          airQualityIndex = Math.round(pm25?.value || 0)

          // Convert PM2.5 to category
          if (airQualityIndex > 150) airQualityCategory = 'hazardous'
          else if (airQualityIndex > 100) airQualityCategory = 'unhealthy'
          else if (airQualityIndex > 50) airQualityCategory = 'moderate'
          else airQualityCategory = 'good'
        }
      }
    } catch (error) {
      console.error('OpenAQ API error:', error)
    }

    // Store environment data
    const { data, error: insertError } = await supabaseClient
      .from('environment_data')
      .insert({
        user_id: user.id,
        location_city: city,
        uv_index: uvIndex,
        weather_condition: weatherCondition,
        temperature,
        air_quality_index: airQualityIndex,
        air_quality_category: airQualityCategory,
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    return new Response(
      JSON.stringify({
        success: true,
        environment: data,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})


