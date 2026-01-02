/**
 * Suno Storage Service
 * 
 * Downloads and stores Suno-generated music files to Supabase Storage
 * with auto-refresh signed URLs for long-term access
 * Also stores metadata in database tables
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type {
  SunoAudioData,
  StoredMusicFile,
  DownloadAndStoreOptions,
} from './suno-api/types';

const BUCKET_NAME = 'calm-audio';
const SIGNED_URL_EXPIRY = 31536000; // 1 year in seconds

/**
 * Interface for database operations
 */
interface SunoGenerationRecord {
  id: string;
  suno_task_id: string;
  suno_operation_type: string;
  prompt?: string;
  style?: string;
  title?: string;
  model_name: string;
  custom_mode: boolean;
  instrumental: boolean;
  status: string;
}

interface SunoFileRecord {
  id: string;
  generation_id: string;
  suno_audio_id: string;
  song_index: number;
  audio_file_path: string;
  audio_signed_url: string;
  cover_image_path?: string;
  cover_image_url?: string;
  wav_file_path?: string;
  wav_signed_url?: string;
  original_audio_url?: string;
  original_stream_url?: string;
  original_image_url?: string;
  suno_title: string;
  suno_tags?: string;
  suno_prompt?: string;
  duration_seconds: number;
  model_name: string;
  signed_url_expires_at?: string;
}

/**
 * Get Supabase client with service role key for server-side operations
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase configuration: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required'
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Download file from URL and return as Buffer
 */
async function downloadFile(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file from ${url}: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Upload file to Supabase Storage
 */
async function uploadToSupabase(
  filePath: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<string> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, fileBuffer, {
      contentType,
      upsert: true, // Allow overwriting existing files
    });

  if (error) {
    throw new Error(`Failed to upload to Supabase: ${error.message}`);
  }

  return filePath;
}

/**
 * Generate signed URL with long expiration
 */
async function generateSignedUrl(filePath: string): Promise<string> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, SIGNED_URL_EXPIRY);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to generate signed URL: ${error?.message || 'Unknown error'}`);
  }

  return data.signedUrl;
}

/**
 * Refresh signed URL (regenerate if needed)
 */
export async function refreshSignedUrl(filePath: string): Promise<string> {
  const newUrl = await generateSignedUrl(filePath);
  
  // Update last_url_refresh_at in database if this file is tracked
  const supabase = getSupabaseClient();
  const expiresAt = new Date(Date.now() + SIGNED_URL_EXPIRY * 1000).toISOString();
  
  // Update if this path matches audio_file_path
  await supabase
    .from('suno_music_files')
    .update({
      audio_signed_url: newUrl,
      last_url_refresh_at: new Date().toISOString(),
      signed_url_expires_at: expiresAt,
    })
    .eq('audio_file_path', filePath);
  
  // Also update if it matches wav_file_path
  await supabase
    .from('suno_music_files')
    .update({
      wav_signed_url: newUrl,
      last_url_refresh_at: new Date().toISOString(),
      signed_url_expires_at: expiresAt,
    })
    .eq('wav_file_path', filePath);
  
  return newUrl;
}

/**
 * Refresh URLs for files expiring soon (within 7 days)
 */
export async function refreshExpiringUrls(): Promise<number> {
  const supabase = getSupabaseClient();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  // Find files expiring soon
  const { data: expiringFiles, error } = await supabase
    .from('suno_music_files')
    .select('id, audio_file_path, wav_file_path, audio_signed_url, wav_signed_url')
    .lte('signed_url_expires_at', sevenDaysFromNow.toISOString())
    .not('signed_url_expires_at', 'is', null);

  if (error) {
    throw new Error(`Failed to find expiring URLs: ${error.message}`);
  }

  if (!expiringFiles || expiringFiles.length === 0) {
    return 0;
  }

  let refreshed = 0;
  const expiresAt = new Date(Date.now() + SIGNED_URL_EXPIRY * 1000).toISOString();

  for (const file of expiringFiles) {
    try {
      const updateData: any = {
        last_url_refresh_at: new Date().toISOString(),
        signed_url_expires_at: expiresAt,
      };

      // Refresh audio URL
      if (file.audio_file_path) {
        const newAudioUrl = await generateSignedUrl(file.audio_file_path);
        updateData.audio_signed_url = newAudioUrl;
      }

      // Refresh WAV URL if exists
      if (file.wav_file_path) {
        const newWavUrl = await generateSignedUrl(file.wav_file_path);
        updateData.wav_signed_url = newWavUrl;
      }

      // Update the record
      await supabase
        .from('suno_music_files')
        .update(updateData)
        .eq('id', file.id);

      refreshed++;
    } catch (error) {
      console.error(`Failed to refresh URLs for file ${file.id}:`, error);
    }
  }

  return refreshed;
}

/**
 * Normalize model name to match database constraint
 */
function normalizeModelName(model?: string): string {
  if (!model) return 'V4_5ALL';
  const upperModel = model.toUpperCase();
  // Map common variations to valid values
  if (upperModel === 'V4' || upperModel === 'V4.0') return 'V4';
  if (upperModel === 'V4_5' || upperModel === 'V4.5') return 'V4_5';
  if (upperModel === 'V4_5PLUS' || upperModel === 'V4.5PLUS' || upperModel === 'V4_5_PLUS') return 'V4_5PLUS';
  if (upperModel === 'V4_5ALL' || upperModel === 'V4.5ALL' || upperModel === 'V4_5_ALL') return 'V4_5ALL';
  if (upperModel === 'V5' || upperModel === 'V5.0') return 'V5';
  // Default to V4_5ALL if unknown
  return 'V4_5ALL';
}

/**
 * Download and store a single audio file
 */
async function downloadAndStoreAudio(
  taskId: string,
  audioData: SunoAudioData,
  index: number,
  convertToWAV: boolean = false
): Promise<{
  audioPath: string;
  audioUrl: string;
  wavPath?: string;
  wavUrl?: string;
}> {
  // Handle both camelCase (from API) and snake_case (from types)
  const audioUrl = (audioData as any).audioUrl || audioData.audio_url;
  if (!audioUrl) {
    throw new Error(`No audio URL found for song ${index + 1}. Available fields: ${Object.keys(audioData).join(', ')}`);
  }
  
  // Download audio file
  const audioBuffer = await downloadFile(audioUrl);
  
  // Determine file extension - use MP3 for now (WAV conversion can be done later if needed)
  // Supabase Storage may not support WAV MIME type, so we'll store as MP3
  const audioExtension = 'mp3';
  const audioFileName = `song-${index + 1}.${audioExtension}`;
  const audioPath = `${taskId}/${audioFileName}`;
  const audioContentType = 'audio/mpeg';

  // Upload audio to Supabase
  await uploadToSupabase(audioPath, audioBuffer, audioContentType);

  // Generate signed URL
  const signedAudioUrl = await generateSignedUrl(audioPath);

  const result: {
    audioPath: string;
    audioUrl: string;
    wavPath?: string;
    wavUrl?: string;
  } = {
    audioPath,
    audioUrl: signedAudioUrl, // Use the Supabase signed URL, not the original Suno URL
  };

  // If WAV conversion is requested and file is not already WAV
  if (convertToWAV && audioExtension !== 'wav') {
    // Note: In a real implementation, you would call convertToWAV API here
    // For now, we'll just store the MP3 and note that WAV conversion should be done separately
    // This is a placeholder - actual WAV conversion should be done via Suno API
  }

  return result;
}

/**
 * Download and store cover image
 */
async function downloadAndStoreCover(
  taskId: string,
  imageUrl: string,
  index: number
): Promise<{
  coverPath: string;
  coverUrl: string;
}> {
  // Download cover image
  const imageBuffer = await downloadFile(imageUrl);

  // Determine file extension from URL or default to jpg
  const urlExtension = imageUrl.split('.').pop()?.toLowerCase() || 'jpg';
  const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
  const extension = validExtensions.includes(urlExtension) ? urlExtension : 'jpg';
  
  const coverFileName = `song-${index + 1}-cover.${extension}`;
  const coverPath = `${taskId}/${coverFileName}`;
  const coverContentType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;

  // Upload cover to Supabase
  await uploadToSupabase(coverPath, imageBuffer, coverContentType);

  // Generate signed URL
  const coverUrl = await generateSignedUrl(coverPath);

  return {
    coverPath,
    coverUrl,
  };
}

/**
 * Store generation record in database
 */
async function storeGenerationRecord(
  taskId: string,
  operationType: string = 'generate',
  metadata?: {
    prompt?: string;
    style?: string;
    title?: string;
    modelName?: string;
    customMode?: boolean;
    instrumental?: boolean;
  }
): Promise<string> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('suno_music_generations')
    .insert({
      suno_task_id: taskId,
      suno_operation_type: operationType,
      prompt: metadata?.prompt,
      style: metadata?.style,
      title: metadata?.title,
      model_name: normalizeModelName(metadata?.modelName),
      custom_mode: metadata?.customMode || false,
      instrumental: metadata?.instrumental || false,
      status: 'generating',
    })
    .select('id')
    .single();

  if (error) {
    // If record already exists, get it
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('suno_music_generations')
        .select('id')
        .eq('suno_task_id', taskId)
        .single();
      
      if (existing) {
        return existing.id;
      }
    }
    throw new Error(`Failed to store generation record: ${error.message}`);
  }

  return data.id;
}

/**
 * Update generation status
 */
async function updateGenerationStatus(
  generationId: string,
  status: 'generating' | 'completed' | 'failed',
  errorMessage?: string
): Promise<void> {
  const supabase = getSupabaseClient();

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  const { error } = await supabase
    .from('suno_music_generations')
    .update(updateData)
    .eq('id', generationId);

  if (error) {
    throw new Error(`Failed to update generation status: ${error.message}`);
  }
}

/**
 * Store file record in database
 */
async function storeFileRecord(
  generationId: string,
  audioData: SunoAudioData,
  index: number,
  filePaths: {
    audioPath: string;
    audioUrl: string;
    coverPath?: string;
    coverUrl?: string;
    wavPath?: string;
    wavUrl?: string;
  }
): Promise<string> {
  const supabase = getSupabaseClient();

  // Calculate expiration time (1 year from now)
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const { data, error } = await supabase
    .from('suno_music_files')
    .insert({
      generation_id: generationId,
      suno_audio_id: audioData.id,
      song_index: index + 1,
      audio_file_path: filePaths.audioPath,
      audio_signed_url: filePaths.audioUrl,
      cover_image_path: filePaths.coverPath,
      cover_image_url: filePaths.coverUrl,
      wav_file_path: filePaths.wavPath,
      wav_signed_url: filePaths.wavUrl,
      original_audio_url: (audioData as any).audioUrl || audioData.audio_url,
      original_stream_url: (audioData as any).streamAudioUrl || audioData.stream_audio_url,
      original_image_url: (audioData as any).imageUrl || audioData.image_url,
      suno_title: (audioData as any).title || audioData.title || 'Untitled',
      suno_tags: (audioData as any).tags || audioData.tags || '',
      suno_prompt: (audioData as any).prompt || audioData.prompt || '',
      duration_seconds: (audioData as any).duration || audioData.duration || 0,
      model_name: normalizeModelName((audioData as any).modelName || audioData.model_name),
      signed_url_expires_at: expiresAt.toISOString(),
      last_url_refresh_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to store file record: ${error.message}`);
  }

  return data.id;
}

/**
 * Create audio_content record from suno_music_files
 */
async function createAudioContentFromSunoFile(
  sunoFileId: string,
  category: string = 'music'
): Promise<string> {
  const supabase = getSupabaseClient();

  // First, get the suno_music_files record
  const { data: sunoFile, error: fetchError } = await supabase
    .from('suno_music_files')
    .select('*')
    .eq('id', sunoFileId)
    .single();

  if (fetchError || !sunoFile) {
    throw new Error(`Failed to fetch suno file: ${fetchError?.message || 'Not found'}`);
  }

  // Check if audio_content already exists for this file
  if (sunoFile.audio_content_id) {
    return sunoFile.audio_content_id;
  }

  // Get generation data for additional metadata
  const { data: generation } = await supabase
    .from('suno_music_generations')
    .select('*')
    .eq('id', sunoFile.generation_id)
    .single();

  // Convert tags from comma-separated string to array
  const tagsArray = sunoFile.suno_tags
    ? sunoFile.suno_tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    : [];

  // Create audio_content record
  const { data: audioContent, error: insertError } = await supabase
    .from('audio_content')
    .insert({
      title: sunoFile.suno_title,
      description: sunoFile.suno_prompt || 'AI-generated music',
      category: category as any,
      duration_seconds: Math.floor(sunoFile.duration_seconds),
      audio_url: sunoFile.audio_signed_url, // Use signed URL
      thumbnail_url: sunoFile.cover_image_url || null, // Cover image URL
      narrator: null, // Suno doesn't provide narrator info
      tags: tagsArray,
      is_featured: false,
      play_count: 0,
      source: 'suno',
      suno_generation_id: sunoFile.generation_id,
      suno_audio_id: sunoFile.suno_audio_id,
      suno_file_id: sunoFile.id,
      prompt: sunoFile.suno_prompt,
      model_name: sunoFile.model_name,
    })
    .select('id')
    .single();

  if (insertError || !audioContent) {
    throw new Error(`Failed to create audio_content: ${insertError?.message || 'Unknown error'}`);
  }

  // Update suno_music_files with audio_content_id
  await supabase
    .from('suno_music_files')
    .update({ audio_content_id: audioContent.id })
    .eq('id', sunoFileId);

  return audioContent.id;
}

/**
 * Download and store all files from music generation
 * 
 * This function:
 * 1. Downloads both songs from the generation (each generation returns 2 tracks)
 * 2. Downloads cover images for each song
 * 3. Optionally converts to WAV format for high quality
 * 4. Stores everything in Supabase Storage
 * 5. Stores metadata in database tables
 * 6. Returns signed URLs that auto-refresh
 */
export async function downloadAndStoreMusicFiles(
  options: DownloadAndStoreOptions & {
    operationType?: string;
    category?: string;
    generationMetadata?: {
      prompt?: string;
      style?: string;
      title?: string;
      modelName?: string;
      customMode?: boolean;
      instrumental?: boolean;
    };
  }
): Promise<StoredMusicFile[]> {
  const { 
    taskId, 
    audioData, 
    convertToWAV = true, 
    downloadCovers = true,
    operationType = 'generate',
    category = 'music',
    generationMetadata,
  } = options;

  if (!audioData || audioData.length === 0) {
    throw new Error('No audio data provided');
  }

  // Store generation record in database
  const generationId = await storeGenerationRecord(taskId, operationType, generationMetadata);

  const storedFiles: StoredMusicFile[] = [];

  // Process each audio track (typically 2 songs per generation)
  for (let i = 0; i < audioData.length; i++) {
    const audio = audioData[i];

    try {
      // Download and store audio file
      const { audioPath, audioUrl, wavPath, wavUrl } = await downloadAndStoreAudio(
        taskId,
        audio,
        i,
        convertToWAV
      );

      // Download and store cover image if requested
      let coverPath: string | undefined;
      let coverUrl: string | undefined;

      // Handle both camelCase (from API) and snake_case (from types)
      const imageUrl = (audio as any).imageUrl || audio.image_url;
      
      if (downloadCovers && imageUrl) {
        try {
          const coverResult = await downloadAndStoreCover(taskId, imageUrl, i);
          coverPath = coverResult.coverPath;
          coverUrl = coverResult.coverUrl;
        } catch (error) {
          console.error(`Failed to download cover for song ${i + 1}:`, error);
          // Continue without cover image
        }
      }

      // Store file record in database
      const fileId = await storeFileRecord(
        generationId,
        audio,
        i,
        {
          audioPath,
          audioUrl,
          coverPath,
          coverUrl,
          wavPath,
          wavUrl,
        }
      );

      // Create audio_content record automatically
      let audioContentId: string | undefined;
      try {
        audioContentId = await createAudioContentFromSunoFile(fileId, category);
      } catch (error) {
        console.error(`Failed to create audio_content for song ${i + 1}:`, error);
        // Continue even if audio_content creation fails - file is still stored
      }

      // Create stored file record
      const storedFile: StoredMusicFile = {
        taskId,
        audioId: audio.id,
        filePath: audioPath,
        signedUrl: audioUrl,
        coverImagePath: coverPath,
        coverImageUrl: coverUrl,
        wavFilePath: wavPath,
        wavFileUrl: wavUrl,
        metadata: {
          title: audio.title,
          tags: audio.tags,
          duration: audio.duration,
          prompt: audio.prompt,
          modelName: audio.model_name,
          createTime: audio.createTime,
        },
      };

      storedFiles.push(storedFile);
    } catch (error) {
      console.error(`Failed to process song ${i + 1}:`, error);
      // Update generation status to failed
      await updateGenerationStatus(generationId, 'failed', 
        `Failed to process song ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw new Error(
        `Failed to download and store song ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Update generation status to completed
  await updateGenerationStatus(generationId, 'completed');

  return storedFiles;
}

/**
 * Get public URL for a file (if bucket is public)
 * Otherwise returns signed URL
 */
export async function getFileUrl(filePath: string, useSignedUrl: boolean = true): Promise<string> {
  if (useSignedUrl) {
    return generateSignedUrl(filePath);
  }

  const supabase = getSupabaseClient();
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Delete files for a task
 */
export async function deleteTaskFiles(taskId: string): Promise<void> {
  const supabase = getSupabaseClient();

  // List all files in the task folder
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(taskId);

  if (listError) {
    throw new Error(`Failed to list files: ${listError.message}`);
  }

  if (!files || files.length === 0) {
    return; // No files to delete
  }

  // Delete all files
  const filePaths = files.map((file) => `${taskId}/${file.name}`);
  const { error: deleteError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove(filePaths);

  if (deleteError) {
    throw new Error(`Failed to delete files: ${deleteError.message}`);
  }
}

/**
 * Check if file exists in storage
 */
export async function fileExists(filePath: string): Promise<boolean> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(filePath.split('/')[0], {
      search: filePath.split('/').pop(),
    });

  return !error && data !== null && data.length > 0;
}

