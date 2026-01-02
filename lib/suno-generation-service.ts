/**
 * Suno Music Generation Service
 * 
 * High-level service for generating healing/calming music
 * with consistent theme and automatic storage
 */

import { generateMusic, waitForCompletion } from '@/lib/suno-api';
import { downloadAndStoreMusicFiles } from '@/lib/suno-storage';
import type { GenerateMusicOptions, SunoAudioData } from '@/lib/suno-api/types';

/**
 * Base theme for all generated songs
 */
const BASE_THEME = 'Instant Relief from Stress and Anxiety | Detox Negative Emotions | Calm Nature Healing Sleep Music';

/**
 * Get callback URL for current environment
 */
function getCallbackUrl(): string {
  // Check for explicit app URL first
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return `${process.env.NEXT_PUBLIC_APP_URL}/api/suno/callback`;
  }
  
  // Check for Vercel URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/suno/callback`;
  }
  
  // Default to localhost (for development - requires ngrok or similar for callbacks)
  return 'http://localhost:3000/api/suno/callback';
}

/**
 * Build prompt with base theme
 */
function buildPrompt(specificDescription: string, additionalDetails?: string): string {
  let prompt = `${specificDescription} | ${BASE_THEME}`;
  if (additionalDetails) {
    prompt += ` | ${additionalDetails}`;
  }
  return prompt;
}

/**
 * Generate healing music with consistent theme
 */
export interface GenerateHealingMusicOptions {
  title: string;
  specificDescription: string;
  additionalDetails?: string;
  instrumental?: boolean;
  model?: 'V4' | 'V4_5' | 'V4_5PLUS' | 'V4_5ALL' | 'V5';
  category?: 'music' | 'relaxation' | 'meditation' | 'sleep';
  waitForCompletion?: boolean; // If true, waits for completion and returns stored files
}

export interface GenerationResult {
  taskId: string;
  storedFiles?: Array<{
    audioId: string;
    filePath: string;
    signedUrl: string;
    coverImageUrl?: string;
    metadata: {
      title: string;
      tags: string;
      duration: number;
    };
  }>;
}

/**
 * Generate healing music
 */
export async function generateHealingMusic(
  options: GenerateHealingMusicOptions
): Promise<GenerationResult> {
  const {
    title,
    specificDescription,
    additionalDetails,
    instrumental = false,
    model = 'V4_5ALL',
    waitForCompletion: shouldWait = false,
  } = options;

  // Build prompt with theme
  const prompt = buildPrompt(specificDescription, additionalDetails);

  // Generate music
  const { taskId } = await generateMusic({
    prompt,
    title,
    customMode: false,
    instrumental,
    model,
    callBackUrl: getCallbackUrl(),
  });

  console.log(`[suno-generation] Started generation for "${title}" - Task ID: ${taskId}`);

  // If waiting for completion, poll and download
  if (shouldWait) {
    console.log(`[suno-generation] Waiting for completion of task ${taskId}...`);
    
    // Wait for completion (polls every 30 seconds, max 10 minutes)
    const details = await waitForCompletion(taskId, {
      maxWaitTime: 10 * 60 * 1000, // 10 minutes
      pollInterval: 30000, // 30 seconds
    });

    if (details.response?.sunoData && details.response.sunoData.length > 0) {
      console.log(`[suno-generation] Generation complete, downloading ${details.response.sunoData.length} songs...`);

      // Download and store files
      const storedFiles = await downloadAndStoreMusicFiles({
        taskId,
        audioData: details.response.sunoData,
        convertToWAV: true,
        downloadCovers: true,
        operationType: 'generate',
        category: options.category || 'music',
        generationMetadata: {
          prompt,
          modelName: model,
          customMode: false,
          instrumental,
        },
      });

      console.log(`[suno-generation] Successfully stored ${storedFiles.length} songs`);

      return {
        taskId,
        storedFiles: storedFiles.map(file => ({
          audioId: file.audioId,
          filePath: file.filePath,
          signedUrl: file.signedUrl,
          coverImageUrl: file.coverImageUrl,
          metadata: file.metadata,
        })),
      };
    }
  }

  return { taskId };
}

/**
 * Generate the first song: African Healing Music
 */
export async function generateAfricanHealingMusic(): Promise<GenerationResult> {
  return generateHealingMusic({
    title: 'African Healing Music | Calming Tribal Sounds | 432 Hz • 528 Hz',
    specificDescription: 'African healing music with calming tribal sounds',
    additionalDetails: '432 Hz and 528 Hz Solfeggio frequencies, peaceful, meditative, nature sounds, stress relief, anxiety relief, detox negative emotions, instant calm',
    instrumental: true,
    model: 'V4_5ALL',
    category: 'music',
    waitForCompletion: false, // Use callback instead
  });
}

