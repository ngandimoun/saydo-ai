/**
 * Log Client Event Edge Function
 * 
 * Receives client-side logs and stores them in the database
 * Used for error tracking and analytics
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

    // Get authenticated user (optional - allow anonymous logs)
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    const body = await req.json()
    const { log_level, message, metadata, metric_type, metric_name, value, unit } = body

    // Handle performance metrics
    if (metric_type && metric_name && value !== undefined) {
      const { error: metricError } = await supabaseClient
        .from('performance_metrics')
        .insert({
          user_id: user?.id || null,
          metric_type,
          metric_name,
          value,
          unit: unit || 'ms',
          metadata: metadata || {},
        })

      if (metricError) {
        console.error('Failed to insert performance metric:', metricError)
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle app logs
    if (log_level && message) {
      const { error: logError } = await supabaseClient
        .from('app_logs')
        .insert({
          user_id: user?.id || null,
          log_level,
          message,
          metadata: metadata || {},
        })

      if (logError) {
        console.error('Failed to insert log:', logError)
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})





