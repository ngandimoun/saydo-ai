/**
 * Check if all required environment variables are set for image generation
 */

import { config } from "dotenv"
import { resolve } from "path"

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") })
config({ path: resolve(process.cwd(), ".env") })

console.log("🔍 Checking environment setup for image generation...\n")
console.log("=".repeat(60))

const required = {
  REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
}

let allGood = true

for (const [key, value] of Object.entries(required)) {
  if (value) {
    const masked = key.includes("KEY") || key.includes("TOKEN")
      ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
      : value
    console.log(`✅ ${key}: ${masked}`)
  } else {
    console.log(`❌ ${key}: MISSING`)
    allGood = false
  }
}

console.log("\n" + "=".repeat(60))

if (!allGood) {
  console.log("\n📝 Missing variables. Add them to .env.local:\n")
  
  if (!required.REPLICATE_API_TOKEN) {
    console.log("REPLICATE_API_TOKEN=your_replicate_token")
  }
  
  if (!required.NEXT_PUBLIC_SUPABASE_URL) {
    console.log("NEXT_PUBLIC_SUPABASE_URL=your_supabase_url")
  }
  
  if (!required.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key")
  }
  
  if (!required.SUPABASE_SERVICE_ROLE_KEY) {
    console.log("\n⚠️  SUPABASE_SERVICE_ROLE_KEY is required for image generation!")
    console.log("   Get it from: Supabase Dashboard > Settings > API > service_role key (secret)")
    console.log("   This key bypasses RLS policies for script uploads")
  }
  
  process.exit(1)
} else {
  console.log("\n✅ All environment variables are set!")
  console.log("   You can now run: npm run generate-images")
}








