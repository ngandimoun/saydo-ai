/**
 * Batch Generation Script for African Healing Music
 * 
 * Generates 10 batches (20 songs total) with creative variations
 * of the African Healing Music theme
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { generateHealingMusic } from '@/lib/suno-generation-service';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

interface BatchConfig {
  title: string;
  specificDescription: string;
  additionalDetails: string;
  instrumental: boolean;
  model: 'V4' | 'V4_5' | 'V4_5PLUS' | 'V4_5ALL' | 'V5';
}

const BATCHES: BatchConfig[] = [
  // Batch 1: Pure Instrumental - Djembe Focus
  {
    title: 'Savanna Rhythms | Djembe & Kalimba Healing | 432 Hz • 528 Hz',
    specificDescription: 'African healing music with deep djembe drums and kalimba melodies',
    additionalDetails: 'calming tribal rhythms, 432 Hz and 528 Hz Solfeggio frequencies, peaceful savanna atmosphere, stress relief, anxiety relief, detox negative emotions, instant calm',
    instrumental: true,
    model: 'V4_5ALL',
  },
  // Batch 2: Soft Vocal Chants
  {
    title: 'Healing Chants | African Tribal Vocals | 432 Hz • 528 Hz',
    specificDescription: 'African healing music with soft traditional healing chants',
    additionalDetails: 'gentle tribal vocals, djembe accompaniment, 432 Hz and 528 Hz frequencies, meditative, peaceful, stress relief, detox negative emotions, instant calm',
    instrumental: false,
    model: 'V4_5ALL',
  },
  // Batch 3: Flute & Strings
  {
    title: 'Desert Winds | African Flute Healing | 432 Hz • 528 Hz',
    specificDescription: 'African healing music with traditional flutes and string instruments',
    additionalDetails: 'calming desert winds, tribal sounds, 432 Hz and 528 Hz Solfeggio frequencies, peaceful, meditative, nature sounds, instant calm, stress relief, anxiety relief',
    instrumental: true,
    model: 'V4_5ALL',
  },
  // Batch 4: Vocal Harmonies
  {
    title: 'Harmony Healing | African Group Vocals | 432 Hz • 528 Hz',
    specificDescription: 'African healing music with beautiful group vocal harmonies',
    additionalDetails: 'traditional African healing songs, gentle percussion, 432 Hz and 528 Hz frequencies, peaceful, uplifting, stress relief, anxiety relief, detox negative emotions',
    instrumental: false,
    model: 'V4_5ALL',
  },
  // Batch 5: Percussion Ensemble
  {
    title: 'Drum Circle Healing | African Percussion | 432 Hz • 528 Hz',
    specificDescription: 'African healing music with ensemble percussion',
    additionalDetails: 'multiple drums and shakers, nature sounds of savanna, 432 Hz and 528 Hz Solfeggio frequencies, rhythmic, meditative, stress relief, instant calm, anxiety relief',
    instrumental: true,
    model: 'V4_5ALL',
  },
  // Batch 6: Solo Deep Voice
  {
    title: 'Deep Healing Voice | African Solo Meditation | 432 Hz • 528 Hz',
    specificDescription: 'African healing music with deep resonant healing voice',
    additionalDetails: 'minimal instrumental accompaniment, traditional African meditation style, 432 Hz and 528 Hz frequencies, peaceful, grounding, anxiety relief, stress relief, instant calm',
    instrumental: false,
    model: 'V4_5ALL',
  },
  // Batch 7: Marimba & Thumb Piano
  {
    title: 'Wooden Tones | Marimba Healing Music | 432 Hz • 528 Hz',
    specificDescription: 'African healing music with marimba and thumb piano',
    additionalDetails: 'wooden instrument melodies, calming tribal sounds, 432 Hz and 528 Hz Solfeggio frequencies, peaceful, meditative, nature sounds, stress relief, anxiety relief',
    instrumental: true,
    model: 'V4_5ALL',
  },
  // Batch 8: Call & Response
  {
    title: 'Call & Response Healing | African Dialogue | 432 Hz • 528 Hz',
    specificDescription: 'African healing music with call and response vocal style',
    additionalDetails: 'traditional African dialogue music, instrumental interlude, 432 Hz and 528 Hz frequencies, interactive, peaceful, healing, stress relief, anxiety relief, instant calm',
    instrumental: false,
    model: 'V4_5ALL',
  },
  // Batch 9: Water & Instruments
  {
    title: 'Water Healing | African Rivers & Instruments | 432 Hz • 528 Hz',
    specificDescription: 'African healing music with flowing water sounds',
    additionalDetails: 'traditional African instruments, river and waterfall ambience, 432 Hz and 528 Hz Solfeggio frequencies, peaceful, meditative, nature healing, instant calm, stress relief',
    instrumental: true,
    model: 'V4_5ALL',
  },
  // Batch 10: Guided Meditation
  {
    title: 'Healing Meditation | African Guided Journey | 432 Hz • 528 Hz',
    specificDescription: 'African healing music with gentle guided meditation voice',
    additionalDetails: 'soft instrumental background, traditional African healing journey, 432 Hz and 528 Hz frequencies, peaceful, transformative, stress relief, anxiety relief, instant calm',
    instrumental: false,
    model: 'V4_5ALL',
  },
];

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate all batches
 */
async function generateAllBatches() {
  console.log('🎵 Starting batch generation for African Healing Music\n');
  console.log(`📊 Total batches: ${BATCHES.length} (${BATCHES.length * 2} songs)\n`);

  const results: Array<{
    batchNumber: number;
    title: string;
    taskId: string | null;
    success: boolean;
    error?: string;
  }> = [];

  for (let i = 0; i < BATCHES.length; i++) {
    const batch = BATCHES[i];
    const batchNumber = i + 1;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎼 Batch ${batchNumber}/${BATCHES.length}: ${batch.title}`);
    console.log(`   Type: ${batch.instrumental ? 'Instrumental' : 'Vocal'}`);
    console.log(`   Model: ${batch.model}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      const result = await generateHealingMusic({
        title: batch.title,
        specificDescription: batch.specificDescription,
        additionalDetails: batch.additionalDetails,
        instrumental: batch.instrumental,
        model: batch.model,
        category: 'music',
        waitForCompletion: false, // Use callbacks for automatic storage
      });

      console.log(`✅ Batch ${batchNumber} started successfully`);
      console.log(`   Task ID: ${result.taskId}`);
      console.log(`   Status: Generation in progress (will be stored via callback)`);

      results.push({
        batchNumber,
        title: batch.title,
        taskId: result.taskId,
        success: true,
      });

      // Rate limiting: wait 500ms between requests (well under 20/10s limit)
      if (i < BATCHES.length - 1) {
        console.log(`   ⏳ Waiting 500ms before next batch...\n`);
        await delay(500);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Batch ${batchNumber} failed: ${errorMessage}\n`);

      results.push({
        batchNumber,
        title: batch.title,
        taskId: null,
        success: false,
        error: errorMessage,
      });

      // Continue with next batch even if this one failed
      if (i < BATCHES.length - 1) {
        console.log(`   ⏳ Waiting 500ms before next batch...\n`);
        await delay(500);
      }
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 GENERATION SUMMARY');
  console.log(`${'='.repeat(60)}\n`);

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Successful: ${successful}/${BATCHES.length} batches`);
  console.log(`❌ Failed: ${failed}/${BATCHES.length} batches`);
  console.log(`🎵 Total songs to be generated: ${successful * 2} songs\n`);

  if (successful > 0) {
    console.log('📋 Successful batches:');
    results
      .filter(r => r.success)
      .forEach(r => {
        console.log(`   ${r.batchNumber}. ${r.title}`);
        console.log(`      Task ID: ${r.taskId}`);
      });
    console.log('');
  }

  if (failed > 0) {
    console.log('❌ Failed batches:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`   ${r.batchNumber}. ${r.title}`);
        console.log(`      Error: ${r.error}`);
      });
    console.log('');
  }

  console.log('💡 Note: Songs will be automatically stored in Supabase via callbacks');
  console.log('   when generation completes (typically 2-3 minutes per batch).\n');
}

// Run the generation
generateAllBatches()
  .then(() => {
    console.log('✨ Batch generation process completed!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

