/**
 * Script to generate all landing page images using Replicate
 * Run with: npx tsx scripts/generate-landing-images.ts
 */

import { config } from "dotenv"
import { resolve } from "path"
import { generateImage } from "../lib/replicate"
import { uploadImageFromUrlScript } from "./storage-script"

// Load environment variables from .env.local (if exists)
config({ path: resolve(process.cwd(), ".env.local") })

// Also try loading from .env (if exists)
config({ path: resolve(process.cwd(), ".env") })

// Verify token is loaded
if (!process.env.REPLICATE_API_TOKEN) {
  console.error("❌ REPLICATE_API_TOKEN not found in environment!")
  console.error("   The token should be available in:")
  console.error("   - .env.local file as REPLICATE_API_TOKEN=your_token")
  console.error("   - .env file as REPLICATE_API_TOKEN=your_token")
  console.error("   - System environment variables")
  console.error(`   Current working directory: ${process.cwd()}`)
  console.error(`   Available env vars: ${Object.keys(process.env).filter(k => k.includes('REPLICATE')).join(', ')}`)
  process.exit(1)
}

console.log("✅ REPLICATE_API_TOKEN found in environment\n")

interface ImageConfig {
  name: string
  prompt: string
  useCase: "card" | "hero" | "background"
  aspectRatio: "16:9" | "4:3" | "1:1"
  folder: string
}

const imagesToGenerate: ImageConfig[] = [
  // Before/After Comparison - Emphasizing AI Agent Workflow
  {
    name: "before-after-comparison",
    prompt: "Side-by-side comparison: Left side shows messy voice transcript with rambling text, ums and ahs, incomplete thoughts scattered everywhere. Right side shows Saydo AI agent workflow output with organized summary, extracted action items with checkboxes, follow-up reminders, smart categorization, and structured tasks. Modern UI design, minimalist, professional, showing the difference between basic transcription and intelligent AI agent processing that creates actionable work",
    useCase: "card",
    aspectRatio: "16:9",
    folder: "landing",
  },
  // How It Works Visual - AI Agent Workflow
  {
    name: "how-it-works-visual",
    prompt: "Modern infographic showing voice waves transforming through AI agent processing: voice input → AI understanding context and intent → extracting key information → creating structured output with summaries, tasks, reminders, and actionable items. Show workflow arrows, AI agent brain icons, and the transformation from chaos to order. Clean UI design, minimalist, professional, dark theme with orange accents",
    useCase: "card",
    aspectRatio: "16:9",
    folder: "landing",
  },
  // AI Agent Workflow Visualization - The Key Differentiator
  {
    name: "ai-agent-workflow",
    prompt: "Visual representation of Saydo AI agent workflow: voice input being processed by intelligent AI agent that analyzes, understands context, identifies action items, creates tasks automatically, sets reminders, generates summaries, and organizes information. Show the agent actively working with brain/neural network visuals, not just a microphone transcribing. Emphasize the intelligence and automation. Modern tech illustration, clean design, professional, dark theme with orange highlights",
    useCase: "card",
    aspectRatio: "16:9",
    folder: "landing",
  },
  // Agent vs Transcription Comparison - Core Message
  {
    name: "agent-vs-transcription",
    prompt: "Split screen comparison: Top shows basic transcription tool output (raw text dump, no structure, just words on page). Bottom shows Saydo AI agent output (organized summary with key points, extracted tasks with priorities and due dates, follow-up reminders, smart categorization by topic, actionable items ready to execute). Highlight the intelligence gap - transcription vs intelligent agent workflow. Modern UI mockup, professional, clean design, dark theme",
    useCase: "card",
    aspectRatio: "16:9",
    folder: "landing",
  },
  // Use Case: Healthcare Worker - AI Agent in Action
  {
    name: "use-case-healthcare",
    prompt: "Healthcare worker speaking into device, with Saydo AI agent workflow visible on screen: voice notes automatically transformed by AI agent into organized patient care plans with action items, medication reminders with schedules, and follow-up tasks prioritized. Show the agent actively processing, organizing, and creating actionable workflows, not just transcribing. Professional medical setting, modern, clean, showing intelligence at work",
    useCase: "card",
    aspectRatio: "4:3",
    folder: "landing/use-cases",
  },
  // Use Case: Founder/Manager - AI Agent Workflow
  {
    name: "use-case-founder",
    prompt: "Business professional using voice notes, with Saydo AI agent workflow displayed on multiple screens: rambling strategy thoughts automatically organized by AI agent into clear action items with priorities, meeting summaries with extracted next steps, and prioritized task lists ready to execute. Show the agent understanding business context and creating structured workflows. Modern office, professional, sleek, emphasizing intelligence",
    useCase: "card",
    aspectRatio: "4:3",
    folder: "landing/use-cases",
  },
  // Use Case: Caregiver - AI Agent Organization
  {
    name: "use-case-caregiver",
    prompt: "Warm illustration of a caregiver documenting care activities using voice notes, with Saydo AI agent workflow visible: voice notes automatically organized into structured care logs, medication schedules with reminders, and care task lists. Show the agent creating order from spoken notes. Compassionate, professional, modern, showing AI intelligence helping caregivers",
    useCase: "card",
    aspectRatio: "4:3",
    folder: "landing/use-cases",
  },
  // Use Case: Writer - AI Agent Creativity
  {
    name: "use-case-writer",
    prompt: "Writer speaking ideas into device, with Saydo AI agent workflow showing on screen: stream of consciousness voice notes automatically organized by AI agent into structured plot outlines, character development notes, writing prompts, and story structure. Show the agent understanding creative context and organizing chaos into usable creative material. Artistic workspace, modern, inspiring, emphasizing intelligent organization",
    useCase: "card",
    aspectRatio: "4:3",
    folder: "landing/use-cases",
  },
  // Use Case: Technician - AI Agent Documentation
  {
    name: "use-case-technician",
    prompt: "Field technician using voice notes, with Saydo AI agent workflow visible: technical observations automatically transformed by AI agent into organized service reports with checklists, repair procedures with steps, and maintenance schedules with priorities. Show the agent creating professional documentation from spoken notes. Technical setting, professional, modern, showing intelligent documentation",
    useCase: "card",
    aspectRatio: "4:3",
    folder: "landing/use-cases",
  },
]

async function generateAllImages() {
  console.log("🎨 Starting image generation for landing page...\n")
  console.log("⚠️  Make sure REPLICATE_API_TOKEN is set in your environment")
  console.log("⚠️  Make sure SUPABASE_SERVICE_ROLE_KEY is set in your environment\n")
  
  // Check for service role key
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY not found!")
    console.error("   Get it from: Supabase Dashboard > Settings > API > service_role key")
    console.error("   Add to .env.local as: SUPABASE_SERVICE_ROLE_KEY=your_key\n")
    process.exit(1)
  }
  
  console.log("✅ Environment variables checked\n")

  const results: Record<string, { url: string; path: string }> = {}

  for (const imageConfig of imagesToGenerate) {
    try {
      console.log(`Generating: ${imageConfig.name}...`)
      
      // Step 1: Generate image with Replicate
      const generatedImage = await generateImage({
        prompt: imageConfig.prompt,
        useCase: imageConfig.useCase,
        aspectRatio: imageConfig.aspectRatio,
        outputFormat: "png",
      })

      console.log(`   Generated by Replicate: ${generatedImage.url}`)

      // Step 2: Upload to Supabase Storage
      const uploadedImage = await uploadImageFromUrlScript(
        generatedImage.url,
        `${imageConfig.name}.png`,
        imageConfig.folder
      )

      results[imageConfig.name] = {
        url: uploadedImage.url,
        path: uploadedImage.path,
      }
      console.log(`✅ Generated and uploaded: ${imageConfig.name}`)
      console.log(`   URL: ${uploadedImage.url}`)
      console.log(`   Path: ${uploadedImage.path}\n`)

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000))
    } catch (error) {
      console.error(`❌ Error generating ${imageConfig.name}:`, error)
      if (error instanceof Error) {
        console.error(`   Message: ${error.message}\n`)
      }
    }
  }

  // Save results to a JSON file for easy import
  const fs = await import("fs/promises")
  const resultsPath = "lib/landing-images.json"
  await fs.writeFile(
    resultsPath,
    JSON.stringify(results, null, 2),
    "utf-8"
  )

  console.log("\n📋 Image Generation Summary:")
  console.log("=".repeat(50))
  console.log(JSON.stringify(results, null, 2))
  console.log("\n✅ Image generation complete!")
  console.log(`\n💾 Results saved to: ${resultsPath}`)
  console.log("💡 Import this file in your components to use the images.")
  console.log("💡 You can also use the paths to reference images from Supabase Storage.")
}

// Run the script
generateAllImages().catch(console.error)

