/**
 * Setup Storage Buckets Script
 * 
 * Creates the required Supabase Storage buckets for Saydo infrastructure
 * Run this script after deploying migrations
 * 
 * Usage: tsx scripts/setup-storage-buckets.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createBucket(name: string, public: boolean) {
  console.log(`Creating bucket: ${name}...`)

  const { data, error } = await supabase.storage.createBucket(name, {
    public,
    fileSizeLimit: name === 'calm-audio' ? 104857600 : 52428800, // 100MB or 50MB
    allowedMimeTypes: name === 'calm-audio' 
      ? ['audio/mpeg', 'audio/ogg', 'audio/webm']
      : ['audio/webm', 'audio/mpeg'],
  })

  if (error) {
    if (error.message.includes('already exists')) {
      console.log(`  ✓ Bucket "${name}" already exists`)
      return true
    }
    console.error(`  ✗ Failed to create bucket "${name}":`, error.message)
    return false
  }

  console.log(`  ✓ Bucket "${name}" created successfully`)
  return true
}

async function main() {
  console.log('Setting up Supabase Storage buckets...\n')

  const buckets = [
    { name: 'calm-audio', public: true },
    { name: 'voice-recordings', public: false },
  ]

  let success = true
  for (const bucket of buckets) {
    const result = await createBucket(bucket.name, bucket.public)
    if (!result) success = false
  }

  console.log('\n' + '='.repeat(50))
  if (success) {
    console.log('✓ All buckets set up successfully!')
    console.log('\nNote: Storage policies are created via migration 004_storage_buckets.sql')
  } else {
    console.log('✗ Some buckets failed to create. Check errors above.')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

