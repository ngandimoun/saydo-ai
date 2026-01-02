# Suno API Setup Guide

Complete setup guide for integrating Suno API music generation into Saydo.

## Overview

Suno API provides AI-powered music generation capabilities for the Saydo calm session feature. This guide covers:

- API key setup
- Environment configuration
- Basic usage examples
- File storage and URL management
- Best practices

## Prerequisites

- Supabase project with `calm-audio` bucket configured
- Suno API account (sign up at https://sunoapi.org)
- Node.js environment with access to environment variables

## Step 1: Get Your Suno API Key

1. Visit [Suno API Key Management](https://sunoapi.org/api-key)
2. Sign up or log in to your account
3. Generate a new API key
4. Copy the API key (keep it secure - you won't be able to see it again)

## Step 2: Configure Environment Variables

Add the Suno API key to your `.env.local` file:

```env
# Suno API
SUNO_API_KEY=your-suno-api-key-here
```

**Important:** Never commit your API key to version control. The `.env.local` file is already in `.gitignore`.

## Step 3: Verify Setup

You can verify your setup by checking your remaining credits:

```typescript
import { getRemainingCredits } from '@/lib/suno-api';

const credits = await getRemainingCredits();
console.log(`Remaining credits: ${credits}`);
```

## Basic Usage

### Generate Music

```typescript
import { generateMusic, waitForCompletion, downloadAndStoreMusicFiles } from '@/lib/suno-api';
import { downloadAndStoreMusicFiles } from '@/lib/suno-storage';

// Generate music
const { taskId } = await generateMusic({
  prompt: 'A peaceful acoustic guitar melody with soft vocals, folk style',
  customMode: false,
  instrumental: false,
  model: 'V4_5ALL',
  callBackUrl: 'https://your-server.com/callback'
});

// Wait for completion
const details = await waitForCompletion(taskId);

// Download and store both songs to Supabase
const storedFiles = await downloadAndStoreMusicFiles({
  taskId,
  audioData: details.response.sunoData,
  convertToWAV: true, // High quality for Saydo
  downloadCovers: true
});

console.log(`Stored ${storedFiles.length} songs with signed URLs`);
```

### Convert to WAV Format

For high-quality playback in Saydo, always convert to WAV:

```typescript
import { convertToWAV, waitForWAVCompletion } from '@/lib/suno-api';

// Convert to WAV
const { taskId: wavTaskId } = await convertToWAV({
  taskId: originalTaskId,
  audioId: audioId,
  callBackUrl: 'https://your-server.com/callback'
});

// Wait for conversion
const wavDetails = await waitForWAVCompletion(wavTaskId);

console.log(`WAV file ready: ${wavDetails.response?.audioWavUrl}`);
```

### Generate Cover Images

```typescript
import { generateCover, waitForCoverCompletion } from '@/lib/suno-api';

// Generate cover
const { taskId: coverTaskId } = await generateCover({
  taskId: originalTaskId,
  callBackUrl: 'https://your-server.com/callback'
});

// Wait for completion
const coverDetails = await waitForCoverCompletion(coverTaskId);

console.log(`Cover images: ${coverDetails.response?.images}`);
```

## File Storage

### Automatic Download and Storage

The `downloadAndStoreMusicFiles` function automatically:

1. Downloads both songs from each generation (2 tracks per generation)
2. Downloads cover images for each song
3. Optionally converts to WAV format for high quality
4. Stores everything in Supabase `calm-audio` bucket
5. Generates auto-refresh signed URLs (valid for 1 year)

### File Organization

Files are organized by task ID:

```
calm-audio/
  {taskId}/
    song-1.mp3 (or .wav)
    song-1-cover.jpg
    song-2.mp3 (or .wav)
    song-2-cover.jpg
```

### URL Management

Signed URLs are generated with 1-year expiration. To refresh:

```typescript
import { refreshSignedUrl } from '@/lib/suno-storage';

const newUrl = await refreshSignedUrl(filePath);
```

## Important Notes for Saydo

### WAV Format

**Always convert to WAV format** for high-quality playback in Saydo:

```typescript
// After music generation
const wavTask = await convertToWAV({
  taskId,
  audioId: audioData[0].id,
  callBackUrl: callbackUrl
});
```

### Both Songs

Each generation creates **2 songs** - always download and store both:

```typescript
// downloadAndStoreMusicFiles handles this automatically
const storedFiles = await downloadAndStoreMusicFiles({
  taskId,
  audioData: details.response.sunoData, // Contains both songs
  convertToWAV: true,
  downloadCovers: true
});
```

### Cover Images

Download cover images for display in Saydo UI:

```typescript
// Automatically handled by downloadAndStoreMusicFiles
// Or manually:
const coverResult = await downloadAndStoreCover(taskId, imageUrl, index);
```

### Auto-Refresh URLs

Use signed URLs with refresh mechanism to prevent expiration:

```typescript
// URLs are automatically generated with 1-year expiration
// Refresh before expiration:
const refreshedUrl = await refreshSignedUrl(filePath);
```

## Callback Setup

Set up a callback endpoint to receive completion notifications:

```typescript
// app/api/suno/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { downloadAndStoreMusicFiles } from '@/lib/suno-storage';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  if (body.code === 200 && body.data?.callbackType === 'complete') {
    const { task_id, data: audioData } = body.data;
    
    // Download and store files
    const storedFiles = await downloadAndStoreMusicFiles({
      taskId: task_id,
      audioData,
      convertToWAV: true,
      downloadCovers: true
    });
    
    // Store metadata in database
    // ... your database logic here
  }
  
  return NextResponse.json({ status: 'received' });
}
```

## Model Selection

Choose the right model for your needs:

- **V4**: Best audio quality, up to 4 minutes
- **V4_5**: Advanced features, up to 8 minutes
- **V4_5PLUS**: Richer sound, up to 8 minutes
- **V4_5ALL**: Better song structure, max 8 min (recommended for calm sessions)
- **V5**: Latest model, faster generation, up to 8 minutes

## Rate Limits

- **Concurrency**: 20 requests every 10 seconds
- **Polling**: Check status every 30 seconds
- **Callbacks**: Preferred over polling

## File Retention

- **Generated audio**: 15 days (download promptly)
- **Cover images**: 14 days
- **WAV files**: 15 days
- **Supabase Storage**: Permanent (until manually deleted)

## Error Handling

```typescript
import { generateMusic } from '@/lib/suno-api';

try {
  const { taskId } = await generateMusic(options);
} catch (error) {
  if (error.message.includes('429')) {
    // Rate limit exceeded - wait and retry
  } else if (error.message.includes('429')) {
    // Insufficient credits
  } else {
    // Other error
  }
}
```

## Best Practices

1. **Use Callbacks**: Prefer callbacks over polling for efficiency
2. **Download Promptly**: Download files before Suno's 15-day expiration
3. **WAV Format**: Always convert to WAV for Saydo playback
4. **Both Songs**: Download and store both songs from each generation
5. **Cover Images**: Download covers for UI display
6. **Metadata**: Store all metadata (title, tags, duration, prompt) for searchability
7. **Error Handling**: Implement retry logic for transient failures
8. **URL Refresh**: Refresh signed URLs before expiration

## Troubleshooting

### API Key Not Working

- Verify the key is correct in `.env.local`
- Check that `SUNO_API_KEY` is set (not `SUNO_API_TOKEN`)
- Restart your development server after adding the key

### Files Not Uploading to Supabase

- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check that `calm-audio` bucket exists
- Ensure bucket policies allow authenticated uploads

### URLs Expiring

- Use signed URLs with long expiration (1 year)
- Implement refresh mechanism before expiration
- Store file paths in database for easy URL regeneration

## Support

- **Suno API Docs**: https://docs.sunoapi.org
- **Suno API Support**: support@sunoapi.org
- **API Key Management**: https://sunoapi.org/api-key

## Next Steps

Once setup is complete, you can:

1. Implement music generation automation workflow
2. Set up callback endpoints for async processing
3. Store metadata in database for searchability
4. Integrate with Saydo calm session UI

See the main [Suno API Documentation](./suno-api-documentation.md) for complete API reference.

