# Suno API Infrastructure Summary

This document summarizes the database tables, storage bucket, and migrations created for Suno API music generation integration.

## Storage Bucket

### calm-audio
- **Status**: ✅ Already exists
- **Access**: Public read, authenticated write
- **Max file size**: 100MB
- **Allowed MIME types**: audio/mpeg, audio/ogg, audio/webm
- **Purpose**: Store all Suno-generated music files, cover images, and WAV files

## Database Tables

### 1. suno_music_generations

Tracks each music generation task from Suno API.

**Columns:**
- `id` (uuid, PK)
- `suno_task_id` (text, unique) - Suno API task ID
- `suno_operation_type` (text) - generate, extend, upload_cover, upload_extend, add_vocals, add_instrumental
- `prompt` (text) - Generation prompt
- `style` (text) - Music style
- `title` (text) - Song title
- `model_name` (text) - V4, V4_5, V4_5PLUS, V4_5ALL, V5
- `custom_mode` (boolean)
- `instrumental` (boolean)
- `status` (text) - pending, generating, completed, failed
- `error_message` (text)
- `created_at` (timestamptz)
- `completed_at` (timestamptz)
- `updated_at` (timestamptz)

**Indexes:**
- `idx_suno_music_generations_task_id` - Fast lookup by task ID
- `idx_suno_music_generations_status` - Filter by status
- `idx_suno_music_generations_created` - Sort by creation date

**RLS Policies:**
- Public read access (music available to all users)
- Authenticated insert (for automation)
- Service role update (for automation)

### 2. suno_music_files

Stores file metadata for each generated song (2 songs per generation).

**Columns:**
- `id` (uuid, PK)
- `generation_id` (uuid, FK → suno_music_generations)
- `audio_content_id` (uuid, FK → audio_content, nullable)
- `suno_audio_id` (text) - Suno API audio ID
- `song_index` (integer) - 1 or 2 (each generation has 2 songs)
- `audio_file_path` (text) - Path in calm-audio bucket
- `audio_signed_url` (text) - Auto-refresh signed URL
- `cover_image_path` (text) - Path to cover image
- `cover_image_url` (text) - Signed URL for cover
- `wav_file_path` (text) - Path to WAV file (if converted)
- `wav_signed_url` (text) - Signed URL for WAV
- `original_audio_url` (text) - Original Suno URL (expires in 15 days)
- `original_stream_url` (text) - Original stream URL
- `original_image_url` (text) - Original cover URL
- `suno_title` (text) - Title from Suno
- `suno_tags` (text) - Comma-separated tags
- `suno_prompt` (text) - Prompt/lyrics used
- `duration_seconds` (numeric) - Duration in seconds
- `model_name` (text) - Model used
- `signed_url_expires_at` (timestamptz) - URL expiration time
- `last_url_refresh_at` (timestamptz) - Last refresh time
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Constraints:**
- `UNIQUE(generation_id, song_index)` - Ensures one record per song per generation

**Indexes:**
- `idx_suno_music_files_generation_id` - Link to generation
- `idx_suno_music_files_audio_content_id` - Link to audio_content
- `idx_suno_music_files_suno_audio_id` - Lookup by Suno audio ID
- `idx_suno_music_files_url_refresh` - Find expiring URLs

**RLS Policies:**
- Public read access
- Authenticated insert
- Service role update

### 3. audio_content (Extended)

Extended with Suno-specific fields.

**New Columns:**
- `suno_generation_id` (uuid, FK → suno_music_generations)
- `suno_audio_id` (text) - Suno audio ID
- `suno_file_id` (uuid, FK → suno_music_files)
- `source` (text) - 'manual' or 'suno' (default: 'manual')
- `prompt` (text) - Generation prompt/lyrics
- `model_name` (text) - Suno model used

**New Indexes:**
- `idx_audio_content_suno_generation` - Filter Suno-generated content
- `idx_audio_content_suno_audio_id` - Lookup by Suno audio ID
- `idx_audio_content_source` - Filter by source
- `idx_audio_content_tags_gin` - GIN index for array tag searches

## Database Functions

### create_audio_content_from_suno()

Creates an `audio_content` record from a `suno_music_files` record.

**Parameters:**
- `p_suno_file_id` (uuid) - ID of suno_music_files record
- `p_category` (text) - Category for audio_content (default: 'music')

**Returns:** uuid (audio_content.id)

**Usage:**
```sql
SELECT create_audio_content_from_suno('file-uuid-here', 'music');
```

### refresh_suno_music_urls()

Placeholder function for URL refresh operations (implementation in application code).

## File Organization

Files are stored in the `calm-audio` bucket with the following structure:

```
calm-audio/
  {taskId}/
    song-1.mp3 (or .wav)
    song-1-cover.jpg
    song-2.mp3 (or .wav)
    song-2-cover.jpg
```

## URL Management

- **Signed URLs**: Generated with 1-year expiration (31,536,000 seconds)
- **Auto-refresh**: URLs are tracked in `suno_music_files.signed_url_expires_at`
- **Refresh function**: `refreshExpiringUrls()` finds and refreshes URLs expiring within 7 days
- **Manual refresh**: `refreshSignedUrl(filePath)` refreshes a specific file's URL

## Migration File

**Location**: `supabase/migrations/016_suno_music_tables.sql`

This migration:
1. Creates `suno_music_generations` table
2. Creates `suno_music_files` table
3. Extends `audio_content` table with Suno fields
4. Creates indexes for performance
5. Sets up RLS policies
6. Creates helper functions
7. Sets up triggers for `updated_at` timestamps

## Integration Points

### Storage Service (`lib/suno-storage.ts`)

The storage service automatically:
1. Stores generation records in `suno_music_generations`
2. Stores file records in `suno_music_files`
3. Downloads and stores files to Supabase Storage
4. Generates signed URLs with 1-year expiration
5. Updates database with file paths and URLs
6. Tracks URL expiration for auto-refresh

### Usage Example

```typescript
import { downloadAndStoreMusicFiles } from '@/lib/suno-storage';
import { waitForCompletion } from '@/lib/suno-api';

// After music generation completes
const details = await waitForCompletion(taskId);

// Download and store both songs
const storedFiles = await downloadAndStoreMusicFiles({
  taskId,
  audioData: details.response.sunoData,
  convertToWAV: true,
  downloadCovers: true,
  operationType: 'generate',
  generationMetadata: {
    prompt: 'A peaceful melody',
    modelName: 'V4_5ALL',
    customMode: false,
    instrumental: false,
  },
});

// Files are now:
// - Stored in Supabase Storage (calm-audio bucket)
// - Metadata stored in database tables
// - Signed URLs generated and tracked
// - Ready for use in Saydo calm sessions
```

## Search Capabilities

The metadata stored enables powerful search:

- **By tags**: Use GIN index on `audio_content.tags` array
- **By prompt**: Search `audio_content.prompt` or `suno_music_files.suno_prompt`
- **By model**: Filter by `model_name`
- **By category**: Use existing `audio_content.category`
- **By source**: Filter `source = 'suno'` for AI-generated content

## Next Steps

1. Implement automation workflow to generate music
2. Set up callback endpoint to handle Suno API callbacks
3. Create scheduled job to refresh expiring URLs
4. Integrate with calm session UI to display Suno-generated music

