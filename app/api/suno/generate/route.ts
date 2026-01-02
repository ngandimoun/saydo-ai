/**
 * Suno Music Generation API Route
 * 
 * Generates music using Suno API and returns task ID
 * The actual completion is handled via callback
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateMusic } from '@/lib/suno-api';
import type { GenerateMusicOptions } from '@/lib/suno-api/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/suno/generate
 * 
 * Generate music with Suno API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      title,
      instrumental = false,
      model = 'V4_5ALL',
      category = 'music',
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Get callback URL (use the current host)
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const callbackUrl = `${protocol}://${host}/api/suno/callback`;

    // Prepare generation options
    const options: GenerateMusicOptions = {
      prompt,
      title,
      customMode: false,
      instrumental,
      model: model as any,
      callBackUrl: callbackUrl,
    };

    // Generate music
    const result = await generateMusic(options);

    return NextResponse.json({
      success: true,
      taskId: result.taskId,
      message: 'Music generation started. You will be notified via callback when complete.',
    });
  } catch (error) {
    console.error('[suno/generate] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate music',
      },
      { status: 500 }
    );
  }
}

