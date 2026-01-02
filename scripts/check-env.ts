import { config } from "dotenv"
import { resolve } from "path"

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") })
config({ path: resolve(process.cwd(), ".env") })

console.log("Environment Check:")
console.log("=".repeat(50))
console.log("REPLICATE_API_TOKEN:", process.env.REPLICATE_API_TOKEN ? "✅ Found" : "❌ Not found")
console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Found" : "❌ Not found")
console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Found" : "❌ Not found")
console.log("\nCurrent directory:", process.cwd())









