# PWA Icons Guide for Saydo

This document describes the required PWA icons and how to generate them.

## Required Icons

| File Name | Size | Purpose |
|-----------|------|---------|
| `favicon.ico` | 16x16, 32x32, 48x48 | Browser tab icon |
| `favicon-16x16.png` | 16x16 | Small favicon |
| `favicon-32x32.png` | 32x32 | Standard favicon |
| `icon-192.png` | 192x192 | PWA install icon (Android) |
| `icon-512.png` | 512x512 | PWA splash/large icon |
| `icon-maskable.png` | 512x512 | Android adaptive icon (with safe zone) |
| `apple-touch-icon.png` | 180x180 | iOS home screen icon |

## Icon Design Guidelines

### Brand Colors
- **Primary (Teal):** `#0D9488`
- **Background (Cream):** `#F7F5F0`
- **Dark Mode Background:** `#0F172A`

### Icon Design
The Saydo icon should feature:
1. The letter "S" in a clean, bold style
2. Teal gradient background (`#0D9488` to `#0F766E`)
3. White "S" letter
4. Rounded corners for the container

### Maskable Icon Safe Zone
For `icon-maskable.png`, the important content (the "S") should be within the center 80% of the image. This ensures it displays correctly on Android devices with different icon shapes.

```
+------------------+
|                  |
|   +----------+   |
|   |          |   |
|   |    S     |   |  <- Content here
|   |          |   |
|   +----------+   |
|                  |
+------------------+
     Safe Zone
```

## Generating Icons

### Option 1: Use an Online Tool
1. Go to [realfavicongenerator.net](https://realfavicongenerator.net/)
2. Upload a 512x512 PNG of the Saydo logo
3. Configure settings for each platform
4. Download and extract to `/public/`

### Option 2: Use the Replicate Image Service
You can use the project's image generation service to create icons:

```typescript
import { generateAndStoreImage } from '@/lib/image-service'

// Generate a 512x512 icon
const iconUrl = await generateAndStoreImage({
  prompt: 'Modern app icon, letter S, teal gradient background #0D9488 to #0F766E, white letter, rounded corners, minimal, professional, centered',
  aspectRatio: '1:1',
  outputFormat: 'png',
})
```

### Option 3: Manual Creation
Create the icons in Figma, Sketch, or similar tools:

1. Create a 512x512 canvas
2. Add a rounded rectangle with the teal gradient
3. Add a white "S" letter centered
4. Export as PNG
5. Resize for other sizes

## File Placement

All icons should be placed in the `/public/` directory:

```
public/
├── favicon.ico
├── favicon-16x16.png
├── favicon-32x32.png
├── icon-192.png
├── icon-512.png
├── icon-maskable.png
└── apple-touch-icon.png
```

## Verification

After adding icons, verify PWA setup:

1. Open Chrome DevTools
2. Go to Application > Manifest
3. Check that all icons are loading correctly
4. Test "Add to Home Screen" on mobile

## Dark Mode Considerations

For future enhancement, you can add dark mode icons:
- `icon-192-dark.png`
- `icon-512-dark.png`

And reference them in the manifest with media queries when browser support improves.

