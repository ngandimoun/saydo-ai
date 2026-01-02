/**
 * Refresh signed URLs for existing Suno music files
 * 
 * Usage: npx tsx scripts/refresh-suno-urls.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const BUCKET_NAME = 'calm-audio';
const SIGNED_URL_EXPIRY = 31536000; // 1 year

async function refreshUrls() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('🔄 Fetching files that need URL refresh...\n');

  // Get all files with audio_file_path
  const { data: files, error } = await supabase
    .from('suno_music_files')
    .select('id, audio_file_path, wav_file_path')
    .not('audio_file_path', 'is', null);

  if (error) {
    throw new Error(`Failed to fetch files: ${error.message}`);
  }

  if (!files || files.length === 0) {
    console.log('✅ No files found to refresh');
    return;
  }

  console.log(`📋 Found ${files.length} files to refresh\n`);

  let refreshed = 0;
  let errors = 0;

  for (const file of files) {
    try {
      const updates: any = {};

      // Refresh audio URL
      if (file.audio_file_path) {
        const { data: audioUrlData, error: audioError } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(file.audio_file_path, SIGNED_URL_EXPIRY);

        if (audioError || !audioUrlData?.signedUrl) {
          console.error(`❌ Failed to generate signed URL for ${file.audio_file_path}: ${audioError?.message}`);
          errors++;
          continue;
        }

        updates.audio_signed_url = audioUrlData.signedUrl;
      }

      // Refresh WAV URL if exists
      if (file.wav_file_path) {
        const { data: wavUrlData, error: wavError } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(file.wav_file_path, SIGNED_URL_EXPIRY);

        if (!wavError && wavUrlData?.signedUrl) {
          updates.wav_signed_url = wavUrlData.signedUrl;
        }
      }

      // Update expires_at
      const expiresAt = new Date(Date.now() + SIGNED_URL_EXPIRY * 1000);
      updates.signed_url_expires_at = expiresAt.toISOString();
      updates.last_url_refresh_at = new Date().toISOString();

      // Update the record
      const { error: updateError } = await supabase
        .from('suno_music_files')
        .update(updates)
        .eq('id', file.id);

      if (updateError) {
        console.error(`❌ Failed to update file ${file.id}: ${updateError.message}`);
        errors++;
      } else {
        refreshed++;
        console.log(`✅ Refreshed URLs for file ${file.id}`);
      }
    } catch (error) {
      console.error(`❌ Error processing file ${file.id}:`, error);
      errors++;
    }
  }

  console.log(`\n✅ Refreshed ${refreshed} files`);
  if (errors > 0) {
    console.log(`⚠️  ${errors} errors occurred`);
  }

  // Also update audio_content records
  console.log('\n🔄 Updating audio_content records...\n');

  const { data: audioContentFiles } = await supabase
    .from('suno_music_files')
    .select('id, audio_signed_url, cover_image_url, audio_content_id')
    .not('audio_signed_url', 'is', null);

  if (audioContentFiles) {
    let updated = 0;
    for (const file of audioContentFiles) {
      if (file.audio_content_id) {
        const { error: updateError } = await supabase
          .from('audio_content')
          .update({
            audio_url: file.audio_signed_url,
            thumbnail_url: file.cover_image_url || null,
          })
          .eq('id', file.audio_content_id);

        if (!updateError) {
          updated++;
        }
      }
    }
    console.log(`✅ Updated ${updated} audio_content records`);
  }
}

refreshUrls().catch(console.error);

