/**
 * Script to generate PWA icons from SVG
 * Run with: npm run generate-icons
 */

import sharp from "sharp"
import { readFileSync, writeFileSync } from "fs"
import { resolve } from "path"

const publicDir = resolve(process.cwd(), "public")
const svgPath = resolve(publicDir, "icon.svg")

interface IconConfig {
  name: string
  size: number
  maskable?: boolean
}

const iconConfigs: IconConfig[] = [
  { name: "icon-192", size: 192 },
  { name: "icon-512", size: 512 },
  { name: "icon-maskable", size: 512, maskable: true },
  { name: "apple-touch-icon", size: 180 },
  { name: "favicon-16x16", size: 16 },
  { name: "favicon-32x32", size: 32 },
]

async function generateIcons() {
  console.log("🎨 Generating PWA icons from SVG...\n")

  // Read SVG file
  let svgContent: string
  try {
    svgContent = readFileSync(svgPath, "utf-8")
    console.log(`✅ Read SVG from: ${svgPath}\n`)
  } catch (error) {
    console.error(`❌ Error reading SVG file: ${svgPath}`)
    console.error("   Make sure public/icon.svg exists")
    process.exit(1)
  }

  // Generate each icon
  for (const config of iconConfigs) {
    try {
      let image = sharp(Buffer.from(svgContent))
        .resize(config.size, config.size, {
          fit: "contain",
          background: { r: 247, g: 245, b: 240, alpha: 1 }, // #F7F5F0
        })

      // For maskable icon, add safe zone padding (80% of size)
      if (config.maskable) {
        const safeZoneSize = Math.floor(config.size * 0.8)
        const padding = (config.size - safeZoneSize) / 2

        // Create a new SVG with padding
        const paddedSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${config.size} ${config.size}">
            <rect width="${config.size}" height="${config.size}" fill="#F7F5F0"/>
            <g transform="translate(${padding}, ${padding}) scale(${safeZoneSize / 512})">
              ${svgContent.replace(/<svg[^>]*>/, "").replace("</svg>", "")}
            </g>
          </svg>
        `
        image = sharp(Buffer.from(paddedSvg))
          .resize(config.size, config.size, {
            fit: "contain",
            background: { r: 247, g: 245, b: 240, alpha: 1 },
          })
      }

      const outputPath = resolve(publicDir, `${config.name}.png`)
      await image.png().toFile(outputPath)

      console.log(`✅ Generated: ${config.name}.png (${config.size}x${config.size})`)
    } catch (error) {
      console.error(`❌ Error generating ${config.name}:`, error)
      if (error instanceof Error) {
        console.error(`   Message: ${error.message}`)
      }
    }
  }

  // Generate favicon.ico (multi-size ICO file)
  try {
    console.log("\n📦 Generating favicon.ico...")
    
    // Create ICO with multiple sizes (16, 32, 48)
    const sizes = [16, 32, 48]
    const icoBuffers = await Promise.all(
      sizes.map(async (size) => {
        const buffer = await sharp(Buffer.from(svgContent))
          .resize(size, size, {
            fit: "contain",
            background: { r: 247, g: 245, b: 240, alpha: 1 },
          })
          .png()
          .toBuffer()
        return { size, buffer }
      })
    )

    // For now, use the 32x32 as favicon.ico (sharp doesn't create true ICO format easily)
    // Most browsers accept PNG as favicon.ico
    const faviconPath = resolve(publicDir, "favicon.ico")
    writeFileSync(faviconPath, icoBuffers.find((b) => b.size === 32)!.buffer)
    console.log(`✅ Generated: favicon.ico (using 32x32 PNG)\n`)

    console.log("🎉 All icons generated successfully!")
    console.log("\nGenerated files:")
    iconConfigs.forEach((config) => {
      console.log(`   - ${config.name}.png`)
    })
    console.log(`   - favicon.ico`)
  } catch (error) {
    console.error(`❌ Error generating favicon.ico:`, error)
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`)
    }
  }
}

// Run the script
generateIcons().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})

