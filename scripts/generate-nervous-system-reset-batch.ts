/**
 * Batch Generation Script for Nervous System Reset Music
 * 
 * Generates 10 batches (20 songs total) with creative variations
 * of the "Nervous System Reset | Heavy Rain and Thunder" theme
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
  // Batch 1: Pure Rain/Thunder White Noise
  {
    title: 'Heavy Rain & Thunder | Pure White Noise | Nervous System Reset',
    specificDescription: 'Heavy rain and thunder on tin roof at night, pure white noise',
    additionalDetails: 'no music, natural rain sounds, stress relief, nervous system reset, deep sleep, anxiety relief, instant calm, goodbye stress',
    instrumental: true,
    model: 'V5',
  },
  // Batch 2: Rain/Thunder with Ambient Piano
  {
    title: 'Rain & Thunder | Ambient Piano | Nervous System Reset',
    specificDescription: 'Heavy rain and thunder on tin roof at night, soft ambient piano melodies',
    additionalDetails: 'gentle instrumental background, white noise, stress relief, nervous system reset, peaceful, meditative, sleep music, anxiety relief',
    instrumental: true,
    model: 'V5',
  },
  // Batch 3: Rain/Thunder with Male Meditation Voice
  {
    title: 'Rain & Thunder | Male Meditation Voice | Nervous System Reset',
    specificDescription: 'Heavy rain and thunder on tin roof at night, deep calming male meditation voice',
    additionalDetails: 'guided relaxation, white noise background, stress relief, nervous system reset, anxiety relief, peaceful, transformative, goodbye stress',
    instrumental: false,
    model: 'V5',
  },
  // Batch 4: Rain/Thunder with Female Meditation Voice
  {
    title: 'Rain & Thunder | Female Meditation Voice | Nervous System Reset',
    specificDescription: 'Heavy rain and thunder on tin roof at night, gentle soothing female meditation voice',
    additionalDetails: 'guided relaxation, white noise background, stress relief, nervous system reset, anxiety relief, peaceful, healing, goodbye stress',
    instrumental: false,
    model: 'V5',
  },
  // Batch 5: Rain/Thunder with Ambient Strings
  {
    title: 'Rain & Thunder | Ambient Strings | Nervous System Reset',
    specificDescription: 'Heavy rain and thunder on tin roof at night, soft ambient string instruments',
    additionalDetails: 'orchestral textures, white noise, stress relief, nervous system reset, peaceful, cinematic, sleep music, anxiety relief',
    instrumental: true,
    model: 'V5',
  },
  // Batch 6: Rain/Thunder with Male Voice + Soft Music
  {
    title: 'Rain & Thunder | Male Voice & Music | Nervous System Reset',
    specificDescription: 'Heavy rain and thunder on tin roof at night, deep male meditation voice with soft ambient music',
    additionalDetails: 'gentle instrumental background, white noise, stress relief, nervous system reset, peaceful, transformative, goodbye stress, anxiety relief',
    instrumental: false,
    model: 'V5',
  },
  // Batch 7: Rain/Thunder with Female Voice + Soft Music
  {
    title: 'Rain & Thunder | Female Voice & Music | Nervous System Reset',
    specificDescription: 'Heavy rain and thunder on tin roof at night, gentle female meditation voice with soft ambient music',
    additionalDetails: 'gentle instrumental background, white noise, stress relief, nervous system reset, peaceful, healing, goodbye stress, anxiety relief',
    instrumental: false,
    model: 'V5',
  },
  // Batch 8: Rain/Thunder with Binaural Beats
  {
    title: 'Rain & Thunder | Binaural Beats | Nervous System Reset',
    specificDescription: 'Heavy rain and thunder on tin roof at night, binaural beats for deep relaxation',
    additionalDetails: 'frequency-based healing, white noise, stress relief, nervous system reset, delta waves, theta waves, sleep music, anxiety relief',
    instrumental: true,
    model: 'V5',
  },
  // Batch 9: Rain/Thunder with Nature Sounds Blend
  {
    title: 'Rain & Thunder | Nature Sounds Blend | Nervous System Reset',
    specificDescription: 'Heavy rain and thunder on tin roof at night, layered nature sounds',
    additionalDetails: 'birds, wind, flowing water, white noise, stress relief, nervous system reset, natural ambience, peaceful, sleep music, anxiety relief',
    instrumental: true,
    model: 'V5',
  },
  // Batch 10: Rain/Thunder with Ambient Pads and Drones
  {
    title: 'Rain & Thunder | Ambient Pads & Drones | Nervous System Reset',
    specificDescription: 'Heavy rain and thunder on tin roof at night, atmospheric ambient pads and drones',
    additionalDetails: 'layered soundscape, white noise, stress relief, nervous system reset, deep meditation, peaceful, sleep music, anxiety relief, goodbye stress',
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
  console.log('🌧️ Starting batch generation for Nervous System Reset Music\n');
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
    console.log(`🌧️ Batch ${batchNumber}/${BATCHES.length}: ${batch.title}`);
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
        category: 'relaxation',
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

