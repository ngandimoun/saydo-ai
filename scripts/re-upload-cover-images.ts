/**
 * Re-upload cover images for existing Suno songs
 * 
 * Usage: npx tsx scripts/re-upload-cover-images.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { getMusicGenerationDetails } from '../lib/suno-api';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const BUCKET_NAME = 'calm-audio';
const SIGNED_URL_EXPIRY = 31536000; // 1 year

async function downloadFile(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file from ${url}: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadToSupabase(
  filePath: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<string> {
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

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload to Supabase: ${error.message}`);
  }

  // Generate signed URL
  const { data, error: urlError } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, SIGNED_URL_EXPIRY);

  if (urlError || !data?.signedUrl) {
    throw new Error(`Failed to generate signed URL: ${urlError?.message || 'Unknown error'}`);
  }

  return data.signedUrl;
}

async function reUploadCovers() {
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

  console.log('🔄 Fetching Suno music files that need cover images...\n');

  // Get all files with original_image_url but no cover_image_path
  // Need to join with generation to get task_id
  const { data: files, error } = await supabase
    .from('suno_music_files')
    .select(`
      id,
      original_image_url,
      cover_image_path,
      song_index,
      generation_id,
      suno_music_generations!suno_music_files_generation_id_fkey(suno_task_id)
    `)
    .not('original_image_url', 'is', null)
    .is('cover_image_path', null);

  if (error) {
    throw new Error(`Failed to fetch files: ${error.message}`);
  }

  if (!files || files.length === 0) {
    console.log('✅ No files found that need cover images');
    return;
  }

  console.log(`📋 Found ${files.length} files that need cover images\n`);

  let uploaded = 0;
  let errors = 0;

  for (const file of files) {
    try {
      if (!file.original_image_url) {
        console.log(`⏭️  Skipping file ${file.id} - no original_image_url`);
        continue;
      }

      console.log(`📥 Downloading cover for file ${file.id}...`);

      // Download cover image
      const imageBuffer = await downloadFile(file.original_image_url);

      // Determine file extension from URL
      const urlExtension = file.original_image_url.split('.').pop()?.toLowerCase() || 'jpg';
      const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
      const extension = validExtensions.includes(urlExtension) ? urlExtension : 'jpg';

      // Get task_id from generation
      const taskId = (file as any).suno_music_generations?.suno_task_id;
      if (!taskId) {
        console.error(`❌ No task_id found for file ${file.id}`);
        errors++;
        continue;
      }

      const coverFileName = `song-${file.song_index}-cover.${extension}`;
      const coverPath = `${taskId}/${coverFileName}`;
      const contentType = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';

      console.log(`📤 Uploading cover to ${coverPath}...`);

      // Upload and get signed URL
      const coverUrl = await uploadToSupabase(coverPath, imageBuffer, contentType);

      // Update the record
      const expiresAt = new Date(Date.now() + SIGNED_URL_EXPIRY * 1000);
      const { error: updateError } = await supabase
        .from('suno_music_files')
        .update({
          cover_image_path: coverPath,
          cover_image_url: coverUrl,
          signed_url_expires_at: expiresAt.toISOString(),
          last_url_refresh_at: new Date().toISOString(),
        })
        .eq('id', file.id);

      if (updateError) {
        console.error(`❌ Failed to update file ${file.id}: ${updateError.message}`);
        errors++;
      } else {
        uploaded++;
        console.log(`✅ Uploaded cover for file ${file.id}`);

        // Also update audio_content thumbnail_url if it exists
        const { data: audioContent } = await supabase
          .from('audio_content')
          .select('id')
          .eq('suno_file_id', file.id)
          .single();

        if (audioContent) {
          await supabase
            .from('audio_content')
            .update({ thumbnail_url: coverUrl })
            .eq('id', audioContent.id);
          console.log(`   ✅ Updated audio_content thumbnail`);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing file ${file.id}:`, error);
      errors++;
    }
  }

  console.log(`\n✅ Uploaded ${uploaded} cover images`);
  if (errors > 0) {
    console.log(`⚠️  ${errors} errors occurred`);
  }
}

reUploadCovers().catch(console.error);

