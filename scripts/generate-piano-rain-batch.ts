/**
 * Batch Generation Script for Relaxing Piano and Soft Rain Music
 * 
 * Generates 10 batches (20 songs total) with creative variations
 * of the "Relaxing Piano and Soft Rain" theme
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
  // Batch 1: Pure Piano and Rain
  {
    title: 'Relaxing Piano & Soft Rain | Deep Sleep Music | Insomnia Relief',
    specificDescription: 'Relaxing piano melodies with soft rain sounds',
    additionalDetails: 'deep instrumental, minimal arrangement, healing sleep music, insomnia relief, deep rest, stress relief, peaceful, meditative, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
  },
  // Batch 2: Piano with Ambient Strings
  {
    title: 'Piano & Rain | Ambient Strings | Healing Sleep Music',
    specificDescription: 'Relaxing piano with soft rain, ambient string orchestra',
    additionalDetails: 'rich orchestral textures, deep instrumental, healing sleep music, insomnia relief, deep rest, stress relief, cinematic, peaceful, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
  },
  // Batch 3: Piano with Male Sleep Voice
  {
    title: 'Piano & Rain | Male Sleep Voice | Deep Rest Music',
    specificDescription: 'Relaxing piano with soft rain, deep calming male sleep voice',
    additionalDetails: 'guided sleep meditation, healing sleep music, insomnia relief, deep rest, stress relief, peaceful, transformative, intense connection, background sounds',
    instrumental: false,
    model: 'V5',
  },
  // Batch 4: Piano with Female Sleep Voice
  {
    title: 'Piano & Rain | Female Sleep Voice | Deep Rest Music',
    specificDescription: 'Relaxing piano with soft rain, gentle soothing female sleep voice',
    additionalDetails: 'guided sleep meditation, healing sleep music, insomnia relief, deep rest, stress relief, peaceful, healing, intense connection, background sounds',
    instrumental: false,
    model: 'V5',
  },
  // Batch 5: Piano with Nature Sounds
  {
    title: 'Piano & Rain | Nature Sounds | Healing Sleep Music',
    specificDescription: 'Relaxing piano with soft rain, layered nature sounds',
    additionalDetails: 'birds, wind, flowing water, deep instrumental, background sounds, healing sleep music, insomnia relief, deep rest, stress relief, natural ambience, intense connection',
    instrumental: true,
    model: 'V5',
  },
  // Batch 6: Piano with Male Voice + Strings
  {
    title: 'Piano & Rain | Male Voice & Strings | Deep Sleep Music',
    specificDescription: 'Relaxing piano with soft rain, deep male sleep voice with ambient string orchestra',
    additionalDetails: 'orchestral textures, healing sleep music, insomnia relief, deep rest, stress relief, peaceful, transformative, intense connection, background sounds',
    instrumental: false,
    model: 'V5',
  },
  // Batch 7: Piano with Female Voice + Strings
  {
    title: 'Piano & Rain | Female Voice & Strings | Deep Sleep Music',
    specificDescription: 'Relaxing piano with soft rain, gentle female sleep voice with ambient string orchestra',
    additionalDetails: 'orchestral textures, healing sleep music, insomnia relief, deep rest, stress relief, peaceful, healing, intense connection, background sounds',
    instrumental: false,
    model: 'V5',
  },
  // Batch 8: Piano with Binaural Beats
  {
    title: 'Piano & Rain | Binaural Beats | Deep Sleep Music',
    specificDescription: 'Relaxing piano with soft rain, binaural beats for deep sleep',
    additionalDetails: 'frequency-based healing, delta waves, theta waves, deep instrumental, background sounds, insomnia relief, deep rest, stress relief, intense connection',
    instrumental: true,
    model: 'V5',
  },
  // Batch 9: Piano with Ambient Pads and Drones
  {
    title: 'Piano & Rain | Ambient Pads & Drones | Healing Sleep Music',
    specificDescription: 'Relaxing piano with soft rain, atmospheric ambient pads and drones',
    additionalDetails: 'layered soundscape, deep instrumental, background sounds, healing sleep music, insomnia relief, deep rest, stress relief, intense connection, peaceful',
    instrumental: true,
    model: 'V5',
  },
  // Batch 10: Piano with Soft Percussion
  {
    title: 'Piano & Rain | Soft Percussion | Deep Sleep Music',
    specificDescription: 'Relaxing piano with soft rain, gentle rhythmic percussion',
    additionalDetails: 'soft drums, subtle shakers, deep instrumental, background sounds, healing sleep music, insomnia relief, deep rest, stress relief, peaceful, intense connection',
    instrumental: true,
    model: 'V5',
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
  console.log('🎹 Starting batch generation for Relaxing Piano and Soft Rain Music\n');
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
    console.log(`🎹 Batch ${batchNumber}/${BATCHES.length}: ${batch.title}`);
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
        category: 'sleep',
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

