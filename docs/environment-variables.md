# Environment Variables

This document describes all environment variables required for the Saydo application.

## Required Variables

### Supabase

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (e.g., `https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key for client-side access |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key for server-side operations (keep secret!) |

### OpenAI

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for AI agents and Whisper transcription |

## Optional Variables

### OpenRouter (Alternative to OpenAI)

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | OpenRouter API key for LLM access via multiple providers |

### Replicate (Image Generation)

| Variable | Description |
|----------|-------------|
| `REPLICATE_API_TOKEN` | Replicate API token for image generation with nano-banana-pro |

### Weather/Environment APIs

| Variable | Description |
|----------|-------------|
| `OPENWEATHER_API_KEY` | OpenWeatherMap API key for UV index, weather, and air quality data |

### Suno API (Music Generation)

| Variable | Description |
|----------|-------------|
| `SUNO_API_KEY` | Suno API key for AI music generation (get from https://sunoapi.org/api-key) |

## Setup Instructions

1. Copy your environment variables to `.env.local`:
   ```bash
   # Create .env.local file
   touch .env.local
   ```

2. Add the required variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # OpenAI
   OPENAI_API_KEY=sk-your-openai-key
   
   # Suno API (Music Generation)
   SUNO_API_KEY=your-suno-api-key
   ```

3. Restart your development server for changes to take effect.

## Mastra AI Features

The Mastra AI system uses these environment variables:

- **`OPENAI_API_KEY`**: Powers all AI agents (Saydo, Voice, Task, Health) and OpenAI Whisper transcription
- **`SUPABASE_SERVICE_ROLE_KEY`**: Required for server-side database operations (fetching user profiles, creating tasks, storing health insights)

## Suno API Features

The Suno API integration uses these environment variables:

- **`SUNO_API_KEY`**: Required for AI music generation, processing, and file management. Used by the calm session music automation workflow.
- **`SUPABASE_SERVICE_ROLE_KEY`**: Required for downloading and storing generated music files to Supabase Storage with auto-refresh URLs.

## Security Notes

- Never commit `.env.local` to version control
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret - it bypasses Row Level Security
- Rotate API keys if they are ever exposed

