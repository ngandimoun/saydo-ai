/**
 * Suno API Callback Route
 * 
 * Handles completion notifications from Suno API
 * Downloads and stores generated music files
 */

import { NextRequest, NextResponse } from 'next/server';
import { downloadAndStoreMusicFiles } from '@/lib/suno-storage';
import type { SunoAudioData } from '@/lib/suno-api/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/suno/callback
 * 
 * Handle Suno API callback when music generation completes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Suno callback format
    // {
    //   code: 200,
    //   msg: "success",
    //   data: {
    //     callbackType: "complete",
    //     task_id: "...",
    //     data: [SunoAudioData, SunoAudioData] // 2 songs
    //   }
    // }

    if (body.code !== 200) {
      console.warn('[suno/callback] Non-success code:', body.code, body.msg);
      return NextResponse.json({ status: 'received' });
    }

    const callbackData = body.data;
    if (!callbackData || callbackData.callbackType !== 'complete') {
      console.warn('[suno/callback] Unexpected callback type:', callbackData?.callbackType);
      return NextResponse.json({ status: 'received' });
    }

    const taskId = callbackData.task_id;
    const audioData: SunoAudioData[] = callbackData.data || [];

    if (!taskId || !audioData || audioData.length === 0) {
      console.error('[suno/callback] Missing taskId or audioData');
      return NextResponse.json({ status: 'received' });
    }

    console.log(`[suno/callback] Processing task ${taskId} with ${audioData.length} songs`);

    // Download and store both songs
    try {
      // Get generation metadata from the first audio item
      const firstAudio = audioData[0];
      
      // Handle both camelCase (from API) and snake_case (from types)
      const prompt = ((firstAudio as any).prompt || firstAudio?.prompt || '').toLowerCase();
      const modelName = (firstAudio as any).modelName || firstAudio?.model_name;
      
      // Infer instrumental from prompt (look for "instrumental" keyword)
      const isInstrumental = prompt.includes('instrumental') || 
                            prompt.includes('no vocals') ||
                            prompt.includes('without vocals');
      
      // Infer category from prompt
      let category = 'music';
      if (prompt.includes('sleep') || prompt.includes('insomnia') || prompt.includes('deep rest')) {
        category = 'sleep';
      } else if (prompt.includes('relax') || prompt.includes('stress relief') || prompt.includes('nervous system')) {
        category = 'relaxation';
      } else if (prompt.includes('meditat') || prompt.includes('mindful')) {
        category = 'meditation';
      }
      
      const storedFiles = await downloadAndStoreMusicFiles({
        taskId,
        audioData,
        convertToWAV: true, // High quality for Saydo
        downloadCovers: true,
        operationType: 'generate',
        category,
        generationMetadata: {
          prompt: (firstAudio as any).prompt || firstAudio?.prompt,
          modelName: modelName,
          customMode: false,
          instrumental: isInstrumental,
        },
      });

      console.log(`[suno/callback] Successfully stored ${storedFiles.length} songs for task ${taskId}`);
    } catch (error) {
      console.error(`[suno/callback] Failed to store files for task ${taskId}:`, error);
      // Still return success to Suno to avoid retries
    }

    return NextResponse.json({ status: 'received' });
  } catch (error) {
    console.error('[suno/callback] Error processing callback:', error);
    // Return success to Suno even on error to prevent retries
    return NextResponse.json({ status: 'received' });
  }
}

