# Saydo Infrastructure Setup Guide

This guide covers setting up the infrastructure foundation for Saydo.

## Prerequisites

1. Supabase project (Saydo-Core) is active
2. Environment variables configured in `.env.local`
3. Node.js and npm installed

## Step 1: Database Migrations

Run the migrations in order:

```bash
# Apply migrations via Supabase CLI or Dashboard
supabase migration up
```

Or apply manually via Supabase Dashboard SQL Editor:

1. `002_infrastructure_tables.sql` - Creates logging, location, and environment tables
2. `003_enable_realtime.sql` - Enables Realtime for critical tables
3. `004_storage_buckets.sql` - Creates storage policies (buckets created separately)

## Step 2: Create Storage Buckets

### Option A: Via Supabase Dashboard

1. Go to Storage > New Bucket
2. Create `calm-audio` bucket:
   - Public: Yes
   - File size limit: 100MB
   - Allowed MIME types: `audio/mpeg`, `audio/ogg`, `audio/webm`
3. Create `voice-recordings` bucket:
   - Public: No (private)
   - File size limit: 50MB
   - Allowed MIME types: `audio/webm`, `audio/mpeg`

### Option B: Via Script

```bash
# Set SUPABASE_SERVICE_ROLE_KEY in .env.local
tsx scripts/setup-storage-buckets.ts
```

## Step 3: Deploy Edge Functions

Deploy the Edge Functions to Supabase:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref bjlzeoojhplgjbajfihu

# Deploy functions
supabase functions deploy update-user-location
supabase functions deploy fetch-environment-data
supabase functions deploy log-client-event
```

Or deploy via Supabase Dashboard:
1. Go to Edge Functions
2. Create new function for each
3. Copy the code from `supabase/functions/[function-name]/index.ts`

## Step 4: Environment Variables

Add to `.env.local`:

```env
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Environment APIs (optional but recommended)
NEXT_PUBLIC_OPENWEATHERMAP_API_KEY=your_key
NEXT_PUBLIC_OPENAQ_API_KEY=your_key
NEXT_PUBLIC_IPAPI_API_KEY=your_key

# Logging (optional)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_LOGROCKET_APP_ID=your_logrocket_id
```

### Getting API Keys

1. **OpenWeatherMap**: https://openweathermap.org/api
   - Free tier: 1,000 calls/day
   - Sign up and get API key

2. **OpenAQ**: https://openaq.org/
   - Free, no key required
   - Unlimited requests

3. **ipapi.co**: https://ipapi.co/
   - Free tier: 1,000 requests/day
   - Sign up for API key

## Step 5: Enable Realtime

Realtime is enabled via migration `003_enable_realtime.sql`. Verify in Supabase Dashboard:

1. Go to Database > Replication
2. Ensure these tables are enabled:
   - `urgent_alerts`
   - `proactive_interventions`
   - `tasks`
   - `voice_recordings`
   - `health_status`

## Step 6: Test Infrastructure

### Test Voice Recording

1. Open Saydo app
2. Click voice FAB
3. Start recording
4. Check Supabase Storage `voice-recordings` bucket for uploaded file
5. Check `voice_recordings` table for metadata

### Test Audio Playback

1. Upload a test audio file to `calm-audio` bucket
2. Add entry to `audio_content` table
3. Open Calm Zone
4. Play audio - should stream from Supabase Storage

### Test Location Updates

1. Open Saydo app
2. Location should update automatically (check `user_locations` table)
3. Environment data should fetch (check `environment_data` table)

### Test Realtime

1. Open two browser windows
2. Create a task in one window
3. Should appear in real-time in the other window

## Troubleshooting

### Voice Recording Not Working

- Check browser permissions for microphone
- Verify `voice-recordings` bucket exists
- Check browser console for errors
- Ensure user is authenticated

### Audio Not Playing

- Verify `calm-audio` bucket is public
- Check audio file format (MP3 recommended)
- Verify CORS settings in Supabase Storage
- Check browser console for errors

### Location Not Updating

- Check Edge Function logs in Supabase Dashboard
- Verify API keys are set
- Check `user_locations` table for entries
- IP geolocation may be inaccurate (this is expected)

### Realtime Not Working

- Verify Realtime is enabled in Supabase Dashboard
- Check WebSocket connection in browser DevTools
- Ensure user is authenticated
- Check Supabase Realtime status page

## Next Steps

After infrastructure is set up:

1. **AI Integration** (Phase 2):
   - Voice transcription (OpenAI Whisper)
   - Task extraction (GPT-4o)
   - Health document analysis (GPT-4 Vision)
   - Chat responses (Claude 3.5)

2. **Wearable Integration**:
   - Oura Ring API
   - Apple HealthKit
   - Google Fit

3. **Notifications**:
   - Web Push setup
   - FCM for Android
   - APNs for iOS

## Support

For issues or questions:
- Check Supabase Dashboard logs
- Review browser console errors
- Check Edge Function logs
- Verify database migrations applied correctly





