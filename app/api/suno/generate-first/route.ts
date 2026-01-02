/**
 * Generate First Song: African Healing Music
 * 
 * One-time endpoint to generate the first healing music track
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateAfricanHealingMusic } from '@/lib/suno-generation-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/suno/generate-first
 * 
 * Generate the first healing music song
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[suno/generate-first] Starting generation of African Healing Music...');

    const result = await generateAfricanHealingMusic();

    return NextResponse.json({
      success: true,
      taskId: result.taskId,
      message: 'Music generation started. The callback will handle downloading and storing the files.',
    });
  } catch (error) {
    console.error('[suno/generate-first] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate music',
      },
      { status: 500 }
    );
  }
}

