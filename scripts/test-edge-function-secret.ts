/**
 * Test script to verify Edge Function can access OPENWEATHERMAP_API_KEY
 * 
 * This script tests the fetch-environment-data Edge Function
 * to ensure it can access the API key secret.
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testEdgeFunctionSecret() {
  console.log('🧪 Testing Edge Function Secret Access...\n')

  // Step 1: Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.log('⚠️  No authenticated user found')
    console.log('   The Edge Function requires authentication.')
    console.log('   Please log in to the app first, then run this test.\n')
    return
  }

  console.log(`✅ User authenticated: ${user.email || user.id}\n`)

  // Step 2: Check if user has a location
  const { data: location, error: locationError } = await supabase
    .from('user_locations')
    .select('latitude, longitude, city')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (locationError || !location) {
    console.log('⚠️  No location data found for user')
    console.log('   The Edge Function needs location data to fetch environment data.')
    console.log('   Location should be automatically updated when you use the app.\n')
    return
  }

  console.log(`✅ Location found: ${location.city || 'Unknown'} (${location.latitude}, ${location.longitude})\n`)

  // Step 3: Invoke the Edge Function
  console.log('📡 Invoking fetch-environment-data Edge Function...\n')

  const { data, error } = await supabase.functions.invoke('fetch-environment-data', {
    body: {},
  })

  if (error) {
    console.error('❌ Edge Function Error:', error.message)
    if (error.message.includes('OPENWEATHERMAP_API_KEY') || error.message.includes('API key')) {
      console.error('\n⚠️  The Edge Function cannot access OPENWEATHERMAP_API_KEY')
      console.error('   The secret may need to be set via Supabase Dashboard:')
      console.error('   https://supabase.com/dashboard/project/bjlzeoojhplgjbajfihu/settings/functions\n')
    }
    return
  }

  if (data?.error) {
    console.error('❌ Function returned error:', data.error)
    return
  }

  if (data?.success && data?.environment) {
    const env = data.environment
    console.log('✅ Edge Function executed successfully!\n')
    console.log('📊 Environment Data:')
    console.log(`   UV Index: ${env.uv_index || 'N/A'}`)
    console.log(`   Weather: ${env.weather_condition || 'N/A'}`)
    console.log(`   Temperature: ${env.temperature ? `${env.temperature}°C` : 'N/A'}`)
    console.log(`   Air Quality: ${env.air_quality_index || 'N/A'} (${env.air_quality_category || 'N/A'})`)
    console.log(`   City: ${env.location_city || 'N/A'}\n`)
    
    if (env.uv_index > 0 || env.temperature !== 0) {
      console.log('✅ OPENWEATHERMAP_API_KEY is working correctly!')
      console.log('   The Edge Function successfully accessed the API key and fetched data.\n')
    } else {
      console.log('⚠️  API key may not be working correctly')
      console.log('   The function executed but returned no weather data.\n')
    }
  } else {
    console.log('⚠️  Unexpected response from Edge Function:', data)
  }
}

testEdgeFunctionSecret().catch(console.error)

