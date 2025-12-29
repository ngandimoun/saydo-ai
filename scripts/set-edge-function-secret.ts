/**
 * Set Edge Function Secret Programmatically
 * 
 * This script sets the OPENWEATHERMAP_API_KEY secret for Edge Functions
 * using either:
 * 1. Supabase Management API (if SUPABASE_ACCESS_TOKEN is set)
 * 2. Supabase CLI (requires login)
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { execSync } from 'child_process'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

const projectRef = 'bjlzeoojhplgjbajfihu'
const secretName = 'OPENWEATHERMAP_API_KEY'
const secretValue = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY

if (!secretValue) {
  console.error('❌ OPENWEATHERMAP_API_KEY not found in .env.local')
  console.error('   Please ensure NEXT_PUBLIC_OPENWEATHERMAP_API_KEY is set')
  console.error('   Add it to your .env.local file:')
  console.error('   NEXT_PUBLIC_OPENWEATHERMAP_API_KEY=your_api_key_here')
  process.exit(1)
}

console.log('🔐 Setting Edge Function Secret...\n')
console.log(`   Project: ${projectRef}`)
console.log(`   Secret: ${secretName}`)
console.log(`   Value: ${secretValue.substring(0, 10)}...\n`)

async function setSecret() {
  // Try Management API first if access token is available
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN

  if (accessToken) {
    console.log('📡 Using Management API...\n')
    
    try {
      // Management API endpoint for setting secrets
      // Note: This endpoint may not exist in the public API
      // We'll try the CLI method as fallback
      const response = await fetch(
        `https://api.supabase.com/v1/projects/${projectRef}/secrets`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: secretName,
            value: secretValue,
          }),
        }
      )

      if (response.ok) {
        console.log('✅ Secret set successfully via Management API!\n')
        process.exit(0)
      } else {
        console.log('⚠️  Management API endpoint not available, trying CLI...\n')
      }
    } catch (error) {
      console.log('⚠️  Management API failed, trying CLI...\n')
    }
  }

  // Fallback to CLI
  console.log('🔧 Using Supabase CLI...\n')

  try {
    // Check if already authenticated
    try {
      execSync('npx supabase projects list', { 
        stdio: 'pipe',
        env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken }
      })
      console.log('✅ CLI authenticated\n')
    } catch (error) {
      console.log('⚠️  CLI not authenticated')
      console.log('\n📝 To authenticate, run one of these:\n')
      console.log('   Option 1: Login interactively')
      console.log('   npx supabase login\n')
      console.log('   Option 2: Use access token')
      console.log('   Set SUPABASE_ACCESS_TOKEN in .env.local\n')
      console.log('   Get your access token from:')
      console.log('   https://supabase.com/dashboard/account/tokens\n')
      throw new Error('Authentication required')
    }

    // Set the secret
    const command = `npx supabase secrets set ${secretName}=${secretValue} --project-ref ${projectRef}`
    
    execSync(command, { 
      stdio: 'inherit',
      env: {
        ...process.env,
        SUPABASE_ACCESS_TOKEN: accessToken,
      }
    })
    
    console.log('\n✅ Secret set successfully!')
    console.log(`   The Edge Function can now access ${secretName}\n`)
    
  } catch (error: any) {
    console.error('\n❌ Failed to set secret:', error.message)
    console.error('\n💡 Manual Setup Required:')
    console.error('   1. Go to: https://supabase.com/dashboard/project/bjlzeoojhplgjbajfihu/settings/functions')
    console.error('   2. Scroll to "Secrets" section')
    console.error('   3. Click "Add new secret"')
    console.error(`   4. Name: ${secretName}`)
    console.error(`   5. Value: ${secretValue}`)
    console.error('   6. Click "Save"\n')
    console.error('💡 Or authenticate CLI first:')
    console.error('   npx supabase login\n')
    process.exit(1)
  }
}

setSecret().catch(console.error)
