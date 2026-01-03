/**
 * Color Extraction Utility
 * 
 * Extracts vibrant colors from album cover images to create
 * dynamic gradient backgrounds for the music player.
 */

export interface ColorPalette {
  primary: string // Top gradient color (hex)
  secondary: string // Middle gradient color (hex)
  tertiary: string // Bottom gradient color (hex)
  accent: string // Accent color for UI elements (hex)
}

// Cache for extracted colors by image URL
const colorCache = new Map<string, ColorPalette>()

/**
 * Converts RGB values to hex color string
 */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(x => {
    const hex = Math.round(x).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')}`
}

/**
 * Calculates the brightness of a color (0-255)
 * Higher values = brighter colors
 */
function getColorBrightness(r: number, g: number, b: number): number {
  return (r * 299 + g * 587 + b * 114) / 1000
}

/**
 * Calculates the saturation of a color (0-1)
 * Higher values = more vibrant colors
 */
function getColorSaturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b) / 255
  const min = Math.min(r, g, b) / 255
  const delta = max - min
  
  if (max === 0) return 0
  return delta / max
}

/**
 * Darkens a color by a factor (0-1)
 * 0 = no change, 1 = black
 */
function darkenColor(r: number, g: number, b: number, factor: number): { r: number; g: number; b: number } {
  return {
    r: Math.max(0, r * (1 - factor)),
    g: Math.max(0, g * (1 - factor)),
    b: Math.max(0, b * (1 - factor))
  }
}

/**
 * Loads an image and returns its ImageData
 */
function loadImageData(imageUrl: string): Promise<ImageData | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      try {
        // Create canvas and downscale for performance
        const canvas = document.createElement('canvas')
        const maxSize = 100 // Process at 100x100 for performance
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
        
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(null)
          return
        }
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        resolve(imageData)
      } catch (error) {
        console.warn('Error processing image:', error)
        resolve(null)
      }
    }
    
    img.onerror = () => {
      console.warn('Error loading image:', imageUrl)
      resolve(null)
    }
    
    img.src = imageUrl
  })
}

/**
 * Extracts dominant colors from image using a simple k-means approach
 * Returns the most vibrant colors
 */
function extractDominantColors(imageData: ImageData, k: number = 5): Array<{ r: number; g: number; b: number; count: number }> {
  const pixels = imageData.data
  const colorMap = new Map<string, { r: number; g: number; b: number; count: number }>()
  
  // Sample pixels (every 4th pixel for performance)
  for (let i = 0; i < pixels.length; i += 16) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const a = pixels[i + 3]
    
    // Skip transparent pixels
    if (a < 128) continue
    
    // Quantize colors to reduce similar colors
    const qr = Math.floor(r / 10) * 10
    const qg = Math.floor(g / 10) * 10
    const qb = Math.floor(b / 10) * 10
    const key = `${qr},${qg},${qb}`
    
    if (colorMap.has(key)) {
      const existing = colorMap.get(key)!
      existing.count++
      existing.r = (existing.r * (existing.count - 1) + r) / existing.count
      existing.g = (existing.g * (existing.count - 1) + g) / existing.count
      existing.b = (existing.b * (existing.count - 1) + b) / existing.count
    } else {
      colorMap.set(key, { r, g, b, count: 1 })
    }
  }
  
  // Convert to array and sort by count (most frequent first)
  const colors = Array.from(colorMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, k)
  
  return colors
}

/**
 * Selects vibrant colors suitable for gradient backgrounds
 * Filters for colors with good saturation and appropriate brightness
 */
function selectVibrantColors(
  colors: Array<{ r: number; g: number; b: number; count: number }>
): ColorPalette | null {
  if (colors.length === 0) return null
  
  // Score colors by saturation and brightness
  const scoredColors = colors.map(color => ({
    ...color,
    saturation: getColorSaturation(color.r, color.g, color.b),
    brightness: getColorBrightness(color.r, color.g, color.b),
    score: getColorSaturation(color.r, color.g, color.b) * 0.7 + 
           (1 - Math.abs(getColorBrightness(color.r, color.g, color.b) - 100) / 255) * 0.3
  }))
  
  // Sort by score (most vibrant first)
  scoredColors.sort((a, b) => b.score - a.score)
  
  // Select top colors
  const vibrantColors = scoredColors.slice(0, 3)
  
  if (vibrantColors.length === 0) return null
  
  // Create gradient colors (darker for better text readability)
  const primary = vibrantColors[0]
  const secondary = vibrantColors[1] || vibrantColors[0]
  const tertiary = vibrantColors[2] || vibrantColors[0]
  
  // Darken colors for gradient (darker at bottom)
  const primaryDark = darkenColor(primary.r, primary.g, primary.b, 0.3)
  const secondaryDark = darkenColor(secondary.r, secondary.g, secondary.b, 0.5)
  const tertiaryDark = darkenColor(tertiary.r, tertiary.g, tertiary.b, 0.7)
  
  // Use the most vibrant color for accent
  const accentColor = vibrantColors[0]
  
  return {
    primary: rgbToHex(primaryDark.r, primaryDark.g, primaryDark.b),
    secondary: rgbToHex(secondaryDark.r, secondaryDark.g, secondaryDark.b),
    tertiary: rgbToHex(tertiaryDark.r, tertiaryDark.g, tertiaryDark.b),
    accent: rgbToHex(accentColor.r, accentColor.g, accentColor.b)
  }
}

/**
 * Extracts vibrant colors from an album cover image
 * Returns a color palette suitable for gradient backgrounds
 * 
 * @param imageUrl - URL of the album cover image
 * @returns ColorPalette with gradient colors, or null if extraction fails
 */
export async function extractVibrantColors(imageUrl: string): Promise<ColorPalette | null> {
  // Check cache first
  if (colorCache.has(imageUrl)) {
    return colorCache.get(imageUrl)!
  }
  
  // Validate URL
  if (!imageUrl || typeof imageUrl !== 'string') {
    return null
  }
  
  try {
    // Load image data
    const imageData = await loadImageData(imageUrl)
    if (!imageData) {
      return null
    }
    
    // Extract dominant colors
    const dominantColors = extractDominantColors(imageData, 8)
    if (dominantColors.length === 0) {
      return null
    }
    
    // Select vibrant colors for palette
    const palette = selectVibrantColors(dominantColors)
    
    // Cache result
    if (palette) {
      colorCache.set(imageUrl, palette)
      
      // Limit cache size to prevent memory issues
      if (colorCache.size > 100) {
        const firstKey = colorCache.keys().next().value
        colorCache.delete(firstKey)
      }
    }
    
    return palette
  } catch (error) {
    console.warn('Error extracting colors from image:', error)
    return null
  }
}

/**
 * Clears the color cache
 * Useful for memory management or testing
 */
export function clearColorCache(): void {
  colorCache.clear()
}

/**
 * Gets the cache size (for debugging)
 */
export function getColorCacheSize(): number {
  return colorCache.size
}

