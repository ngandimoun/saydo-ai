# Suno API Documentation

> Complete Suno API documentation - Your gateway to affordable and stable AI music API services

This document contains the complete Suno API documentation for integrating AI music generation capabilities into Saydo.

## Table of Contents

1. [Welcome & Overview](#welcome--overview)
2. [Quick Start Guide](#quick-start-guide)
3. [Music Generation APIs](#music-generation-apis)
4. [Music Processing APIs](#music-processing-apis)
5. [Cover & Persona APIs](#cover--persona-apis)
6. [File Upload APIs](#file-upload-apis)
7. [Account Management](#account-management)

## Welcome & Overview

Suno API delivers advanced AI music capabilities through easy-to-integrate APIs, including music generation, lyrics creation, audio processing, and video production.

### Key Features

- **99.9% Uptime** - Reliable and stable API performance
- **Affordable Pricing** - Transparent, usage-based pricing system
- **20-Second Streaming Output** - Fast delivery with streaming response
- **High Concurrency** - Scalable solutions that grow with your needs
- **24/7 Support** - Professional technical assistance
- **Watermark-Free** - Commercial-ready music generation

### API Base URL

```
https://api.sunoapi.org
```

### File Upload Base URL

```
https://sunoapiorg.redpandaai.co
```

### Authentication

All API requests require authentication using a Bearer token:

```http
Authorization: Bearer YOUR_API_KEY
```

Obtain your API key from the [API Key Management Page](https://sunoapi.org/api-key).

## Quick Start Guide

### Step 1: Generate Your First Song

Each music generation request returns exactly 2 songs.

```typescript
const response = await fetch('https://api.sunoapi.org/api/v1/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'A peaceful acoustic guitar melody with soft vocals, folk style',
    customMode: false,
    instrumental: false,
    model: 'V4_5ALL',
    callBackUrl: 'https://your-server.com/callback'
  })
});
```

### Step 2: Check Task Status

Use the returned task ID to check generation status:

```typescript
const response = await fetch(
  `https://api.sunoapi.org/api/v1/generate/record-info?taskId=${taskId}`,
  {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  }
);
```

## Music Generation APIs

### 1. Generate Music

**Endpoint:** `POST /api/v1/generate`

Generate high-quality music from text descriptions. Each request returns exactly 2 songs.

**Key Points:**
- Stream URL available in 30-40 seconds
- Downloadable song URL ready in 2-3 minutes
- Concurrency limit: 20 requests every 10 seconds
- Each generation returns 2 songs

**Required Parameters:**
- `customMode`: boolean
- `instrumental`: boolean
- `callBackUrl`: string (URI)
- `model`: string (V4, V4_5, V4_5PLUS, V4_5ALL, V5)

**Optional Parameters:**
- `prompt`: string (required in certain modes)
- `style`: string (required in custom mode)
- `title`: string (required in custom mode)
- `personaId`: string
- `negativeTags`: string
- `vocalGender`: 'm' | 'f'
- `styleWeight`: number (0.00-1.00)
- `weirdnessConstraint`: number (0.00-1.00)
- `audioWeight`: number (0.00-1.00)

### 2. Extend Music

**Endpoint:** `POST /api/v1/generate/extend`

Extend or modify existing music tracks.

**Required Parameters:**
- `defaultParamFlag`: boolean
- `audioId`: string
- `callBackUrl`: string
- `model`: string

### 3. Upload and Cover Audio

**Endpoint:** `POST /api/v1/generate/upload-cover`

Transform existing audio with new styles while retaining core melody.

**Required Parameters:**
- `uploadUrl`: string (URI)
- `customMode`: boolean
- `instrumental`: boolean
- `callBackUrl`: string
- `model`: string

### 4. Add Vocals

**Endpoint:** `POST /api/v1/generate/add-vocals`

Add AI-generated vocals to an existing instrumental track.

**Required Parameters:**
- `uploadUrl`: string (URI)
- `prompt`: string
- `title`: string (max 100 characters)
- `style`: string
- `negativeTags`: string
- `callBackUrl`: string

**Optional Parameters:**
- `vocalGender`: 'm' | 'f'
- `styleWeight`: number (0.00-1.00)
- `weirdnessConstraint`: number (0.00-1.00)
- `audioWeight`: number (0.00-1.00)
- `model`: 'V4_5PLUS' | 'V5' (default: V4_5PLUS)

### 5. Add Instrumental

**Endpoint:** `POST /api/v1/generate/add-instrumental`

Generate musical accompaniment for an uploaded audio file (typically vocals).

**Required Parameters:**
- `uploadUrl`: string (URI)
- `title`: string (max 100 characters)
- `tags`: string
- `negativeTags`: string
- `callBackUrl`: string

**Optional Parameters:**
- `vocalGender`: 'm' | 'f'
- `styleWeight`: number (0.00-1.00)
- `weirdnessConstraint`: number (0.00-1.00)
- `audioWeight`: number (0.00-1.00)
- `model`: 'V4_5PLUS' | 'V5' (default: V4_5PLUS)

## Music Processing APIs

### 6. Get Music Generation Details

**Endpoint:** `GET /api/v1/generate/record-info`

Retrieve detailed information about a music generation task.

**Query Parameters:**
- `taskId`: string (required)

**Status Values:**
- `PENDING`: Task waiting to be processed
- `TEXT_SUCCESS`: Lyrics/text generation completed
- `FIRST_SUCCESS`: First track generation completed
- `SUCCESS`: All tracks generated successfully
- `CREATE_TASK_FAILED`: Failed to create task
- `GENERATE_AUDIO_FAILED`: Failed to generate music
- `CALLBACK_EXCEPTION`: Error during callback
- `SENSITIVE_WORD_ERROR`: Content contains prohibited words

### 7. Get Timestamped Lyrics

**Endpoint:** `POST /api/v1/generate/get-timestamped-lyrics`

Retrieve timestamped lyrics for synchronized display during playback.

**Required Parameters:**
- `taskId`: string
- `audioId`: string

**Response Includes:**
- `alignedWords`: Array of word timings
- `waveformData`: Array for audio visualization
- `hootCer`: Lyrics alignment accuracy score

### 8. Convert to WAV Format

**Endpoint:** `POST /api/v1/wav/generate`

**IMPORTANT: High quality format for Saydo playback**

Convert existing music tracks to high-quality WAV format.

**Required Parameters:**
- `taskId`: string
- `audioId`: string
- `callBackUrl`: string

**Notes:**
- WAV files are significantly larger than MP3
- Ideal for professional audio editing and production
- Preserves full audio quality
- Files retained for 15 days

### 9. Get WAV Conversion Details

**Endpoint:** `GET /api/v1/wav/record-info`

Check WAV conversion task status and get download URL.

**Query Parameters:**
- `taskId`: string (required)

**Status Values:**
- `PENDING`: Task waiting
- `SUCCESS`: Conversion completed
- `CREATE_TASK_FAILED`: Failed to create task
- `GENERATE_WAV_FAILED`: Failed to convert
- `CALLBACK_EXCEPTION`: Error during callback

## Cover & Persona APIs

### 10. Generate Music Cover

**Endpoint:** `POST /api/v1/suno/cover/generate`

Create personalized cover images for generated music.

**Required Parameters:**
- `taskId`: string (original music task ID)
- `callBackUrl`: string

**Notes:**
- Each music task can only generate a Cover once
- Usually generates 2 different style images
- Cover images retained for 14 days

### 11. Get Music Cover Details

**Endpoint:** `GET /api/v1/suno/cover/record-info`

Get detailed information about cover generation tasks.

**Query Parameters:**
- `taskId`: string (required)

**Status Values:**
- `0`: Pending
- `1`: Success
- `2`: Generating
- `3`: Generation failed

### 12. Generate Persona

**Endpoint:** `POST /api/v1/generate/generate-persona`

Create a personalized music Persona based on generated music.

**Required Parameters:**
- `taskId`: string
- `audioId`: string
- `name`: string
- `description`: string

**Notes:**
- Ensure music generation task is fully completed before calling
- Supports models V4 and above
- Each audio ID can only generate one Persona
- PersonaId can be used in subsequent music generation

## File Upload APIs

### 13. Base64 File Upload

**Endpoint:** `POST /api/file-base64-upload`

Upload temporary files via Base64 encoded data.

**Base URL:** `https://sunoapiorg.redpandaai.co`

**Required Parameters:**
- `base64Data`: string (Base64 or data URL format)
- `uploadPath`: string

**Optional Parameters:**
- `fileName`: string

**Notes:**
- Files automatically deleted after 3 days
- Recommended for small files like images
- Base64 encoding increases data by ~33%

### 14. File Stream Upload

**Endpoint:** `POST /api/file-stream-upload`

Upload temporary files via multipart/form-data.

**Base URL:** `https://sunoapiorg.redpandaai.co`

**Required Parameters:**
- `file`: binary (file data)
- `uploadPath`: string

**Optional Parameters:**
- `fileName`: string

**Notes:**
- Files automatically deleted after 3 days
- Recommended for large files (>10MB)
- More efficient than Base64 (~33% better)

### 15. URL File Upload

**Endpoint:** `POST /api/file-url-upload`

Download files from URLs and upload as temporary files.

**Base URL:** `https://sunoapiorg.redpandaai.co`

**Required Parameters:**
- `fileUrl`: string (HTTP/HTTPS URI)
- `uploadPath`: string

**Optional Parameters:**
- `fileName`: string

**Notes:**
- Files automatically deleted after 3 days
- Download timeout: 30 seconds
- Recommended file size limit: 100MB

## Account Management

### 16. Get Remaining Credits

**Endpoint:** `GET /api/v1/get-credits`

Check your account credit balance and usage statistics.

**Response:**
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "credits": 1000
  }
}
```

## Model Versions

### V4
- Best audio quality with refined song structure
- Up to 4 minutes
- Improved vocals

### V4_5
- Superior genre blending with smarter prompts
- Faster generation
- Up to 8 minutes

### V4_5PLUS
- Richer sound with new creative approaches
- Most advanced model
- Up to 8 minutes

### V4_5ALL
- Better song structure
- Max 8 minutes
- Excellent for well-structured pieces

### V5
- Latest model
- Superior musical expression
- Faster generation
- Up to 8 minutes

## Callback Mechanism

All major endpoints support webhook callbacks for real-time notifications.

**Callback Stages:**
- `text`: Text generation completed
- `first`: First track completed
- `complete`: All tracks completed
- `error`: Task failed

**Callback Requirements:**
- Must be publicly accessible HTTPS URL
- Must respond within 15 seconds
- Returns HTTP 200 to confirm receipt
- System retries up to 3 times on failure

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Request successful |
| 400 | Invalid parameters |
| 401 | Unauthorized access |
| 402 | Insufficient credits |
| 404 | Invalid request method or path |
| 405 | Rate limit exceeded |
| 409 | Conflict (e.g., Cover already exists) |
| 413 | Theme or prompt too long |
| 429 | Insufficient credits |
| 430 | Call frequency too high |
| 451 | Download failed |
| 455 | System maintenance |
| 500 | Server error |

## File Retention

- **Generated audio files**: 15 days
- **Cover images**: 14 days
- **WAV files**: 15 days
- **Uploaded temporary files**: 3 days

## Best Practices

1. **Use Callbacks**: Prefer callbacks over polling for better efficiency
2. **Download Promptly**: Download important files before expiration
3. **Handle Errors**: Implement retry logic for transient failures
4. **Rate Limits**: Respect concurrency limits (20 requests per 10 seconds)
5. **WAV Format**: Use WAV conversion for high-quality playback in Saydo
6. **Both Songs**: Always download both songs from each generation
7. **Cover Images**: Download cover images for UI display
8. **Metadata**: Store all metadata (title, tags, duration, prompt) for searchability

## Support

- **Email**: support@sunoapi.org
- **Documentation**: https://docs.sunoapi.org
- **API Key Management**: https://sunoapi.org/api-key

---

> For navigation and other pages, fetch: https://docs.sunoapi.org/llms.txt

