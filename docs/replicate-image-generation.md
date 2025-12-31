# Replicate Image Generation with nano-banana-pro

This document explains how to use Replicate API with nano-banana-pro to generate high-quality images for the Saydo application.

## Overview

The image generation system uses:
- **Replicate API** with `google/nano-banana-pro` model for image generation
- **Supabase Storage** for storing generated images
- **Automated workflow** that generates, downloads, and stores images in one step

## Setup

### 1. Environment Variables

Add your Replicate API token to `.env.local`:

```env
REPLICATE_API_TOKEN=r8_your_token_here
```

Get your token from [Replicate Account Settings](https://replicate.com/account/api-tokens).

### 2. Supabase Storage

The `generated-images` bucket is already configured with:
- Public read access
- 50MB file size limit
- Supports PNG, JPEG, JPG, WebP formats

## Usage

### Basic Image Generation

```typescript
import { generateAndStoreImage } from "@/lib/image-service";

// Generate and store an image
const image = await generateAndStoreImage({
  prompt: "A modern workspace with clean lines and natural lighting",
  useCase: "background",
  aspectRatio: "16:9",
  outputFormat: "png",
});

console.log(image.url); // Supabase public URL
```

### Use Case Helpers

The service provides helper functions for common use cases:

#### Background Images

```typescript
import { generateBackgroundImage } from "@/lib/image-service";

const background = await generateBackgroundImage(
  "Abstract gradient background in blue and purple tones",
  "16:9" // or "21:9"
);
```

#### Profile Images

```typescript
import { generateProfileImage } from "@/lib/image-service";

const profile = await generateProfileImage(
  "Professional headshot of a business person, neutral background"
);
```

#### Card UI Graphics

```typescript
import { generateCardImage } from "@/lib/image-service";

const cardImage = await generateCardImage(
  "Minimalist icon design for productivity app",
  "4:3" // or "16:9" or "1:1"
);
```

#### Hero Images

```typescript
import { generateHeroImage } from "@/lib/image-service";

const hero = await generateHeroImage(
  "Futuristic technology interface with holographic elements",
  "16:9" // or "21:9"
);
```

## Configuration Options

### Aspect Ratios

- `"1:1"` - Square (profiles, avatars)
- `"4:3"` - Standard (cards, thumbnails)
- `"16:9"` - Wide (backgrounds, heroes)
- `"21:9"` - Ultra-wide (hero banners)
- `"9:16"` - Portrait (mobile)

### Output Formats

- `"png"` - Best for graphics with transparency
- `"jpg"` - Best for photos, smaller file size

### Resolution

- `"2K"` - Default, good balance of quality and speed
- `"4K"` - Higher quality, slower generation (recommended for heroes)

### Use Cases

The service automatically enhances prompts based on use case:

- **background**: Adds "subtle background, non-distracting, elegant"
- **profile**: Adds "portrait style, centered composition, professional"
- **card**: Adds "card design element, compact composition, visually appealing"
- **hero**: Adds "hero image, impactful, wide format, engaging"

## Prompt Engineering Tips

### For UI Design Images

1. **Be specific about style**: "modern", "clean", "minimalist", "professional"
2. **Specify color schemes**: "blue and purple gradient", "warm earth tones"
3. **Add context**: "for mobile app", "dashboard background", "card header"
4. **Quality terms**: Already added automatically, but you can emphasize: "ultra sharp", "crisp details"

### Example Prompts

**Background:**
```
"Subtle abstract pattern with soft gradients in slate and charcoal, perfect for app background"
```

**Profile:**
```
"Professional business portrait, neutral gray background, corporate headshot style"
```

**Card:**
```
"Minimalist productivity icon, flat design, blue accent color, clean lines"
```

**Hero:**
```
"Futuristic AI interface visualization, holographic elements, dark theme with neon accents"
```

## Error Handling

All functions throw errors that should be caught:

```typescript
try {
  const image = await generateAndStoreImage({
    prompt: "Your prompt here",
    useCase: "background",
  });
} catch (error) {
  console.error("Failed to generate image:", error);
  // Handle error (show user message, retry, etc.)
}
```

Common errors:
- Missing `REPLICATE_API_TOKEN` environment variable
- Invalid API token
- Network errors during generation or upload
- Supabase Storage upload failures

## Storage Structure

Images are organized in folders by use case:
- `backgrounds/` - Background images
- `profiles/` - Profile pictures
- `cards/` - Card UI graphics
- `heroes/` - Hero images

File naming: `{useCase}-{timestamp}.{format}`

## Best Practices

1. **Always use use case helpers** when possible for optimized prompts
2. **Use PNG for graphics** that need transparency
3. **Use JPG for photos** to reduce file size
4. **Use 4K resolution** only for hero images that need maximum quality
5. **Cache generated images** - Don't regenerate the same image multiple times
6. **Handle errors gracefully** - Show user-friendly messages
7. **Consider costs** - Replicate charges per generation, so cache results

## API Reference

### `generateAndStoreImage(options)`

Main function for generating and storing images.

**Options:**
- `prompt` (string, required) - Image description
- `useCase` (ImageUseCase, optional) - "background" | "profile" | "card" | "hero"
- `aspectRatio` (AspectRatio, optional) - Default: "16:9"
- `outputFormat` (OutputFormat, optional) - Default: "png"
- `resolution` ("2K" | "4K", optional) - Default: "2K"
- `folder` (string, optional) - Storage folder (auto-set by use case)
- `fileName` (string, optional) - Custom filename (auto-generated if not provided)

**Returns:** `Promise<StoredImage>` with `url`, `path`, `useCase`, `originalPrompt`

## Troubleshooting

### Images not generating

1. Check `REPLICATE_API_TOKEN` is set correctly
2. Verify token has sufficient credits
3. Check network connectivity
4. Review Replicate API status

### Upload failures

1. Verify Supabase Storage bucket exists
2. Check bucket permissions
3. Ensure file size is under 50MB
4. Verify file format is supported

### Poor image quality

1. Use more descriptive prompts
2. Try 4K resolution for important images
3. Specify style and quality in prompt
4. Use appropriate aspect ratio for use case








