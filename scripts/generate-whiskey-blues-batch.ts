/**
 * Batch Generation Script for Relaxing Whiskey Blues Music
 * 
 * Generates 10 batches (20 songs total) with creative variations
 * of the "Relaxing Whiskey Blues Music" theme
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
  // Batch 1: Pure Instrumental Blues
  {
    title: 'Whiskey Blues | Broken Strings | Lonely Roads',
    specificDescription: 'Relaxing whiskey blues music, deep instrumental, broken strings guitar',
    additionalDetails: 'lonely roads atmosphere, smoky nights, background sounds, intense connection, best blues ever, peaceful, meditative',
    instrumental: true,
    model: 'V5',
  },
  // Batch 2: Blues with Male Whiskey Voice
  {
    title: 'Whiskey Blues | Male Voice | Smoky Nights',
    specificDescription: 'Relaxing whiskey blues music, deep smoky male whiskey voice',
    additionalDetails: 'broken strings, lonely roads, smoky nights atmosphere, background sounds, intense connection, best blues ever, soulful, transformative',
    instrumental: false,
    model: 'V5',
  },
  // Batch 3: Blues with Female Whiskey Voice
  {
    title: 'Whiskey Blues | Female Voice | Smoky Nights',
    specificDescription: 'Relaxing whiskey blues music, soulful smoky female whiskey voice',
    additionalDetails: 'broken strings, lonely roads, smoky nights atmosphere, background sounds, intense connection, best blues ever, healing, peaceful',
    instrumental: false,
    model: 'V5',
  },
  // Batch 4: Blues with Harmonica
  {
    title: 'Whiskey Blues | Harmonica | Lonely Roads',
    specificDescription: 'Relaxing whiskey blues music, traditional blues harmonica',
    additionalDetails: 'broken strings guitar, lonely roads, smoky nights, deep instrumental, background sounds, intense connection, best blues ever, peaceful',
    instrumental: true,
    model: 'V5',
  },
  // Batch 5: Blues with Piano
  {
    title: 'Whiskey Blues | Piano & Guitar | Smoky Nights',
    specificDescription: 'Relaxing whiskey blues music, blues piano and broken strings guitar',
    additionalDetails: 'lonely roads, smoky nights atmosphere, deep instrumental, background sounds, intense connection, best blues ever, cinematic',
    instrumental: true,
    model: 'V5',
  },
  // Batch 6: Blues with Male Voice + Harmonica
  {
    title: 'Whiskey Blues | Male Voice & Harmonica | Best Blues',
    specificDescription: 'Relaxing whiskey blues music, deep smoky male whiskey voice with blues harmonica',
    additionalDetails: 'broken strings, lonely roads, smoky nights, background sounds, intense connection, best blues ever, soulful',
    instrumental: false,
    model: 'V5',
  },
  // Batch 7: Blues with Female Voice + Piano
  {
    title: 'Whiskey Blues | Female Voice & Piano | Best Blues',
    specificDescription: 'Relaxing whiskey blues music, soulful female whiskey voice with blues piano',
    additionalDetails: 'broken strings guitar, lonely roads, smoky nights, background sounds, intense connection, best blues ever, healing',
    instrumental: false,
    model: 'V5',
  },
  // Batch 8: Blues with Background Bar Sounds
  {
    title: 'Whiskey Blues | Bar Atmosphere | Smoky Nights',
    specificDescription: 'Relaxing whiskey blues music, background bar sounds',
    additionalDetails: 'ambient bar atmosphere, broken strings, lonely roads, smoky nights, deep instrumental, background sounds, intense connection, best blues ever',
    instrumental: true,
    model: 'V5',
  },
  // Batch 9: Blues with Slide Guitar
  {
    title: 'Whiskey Blues | Slide Guitar | Lonely Roads',
    specificDescription: 'Relaxing whiskey blues music, deep slide guitar',
    additionalDetails: 'broken strings, lonely roads, smoky nights atmosphere, deep instrumental, background sounds, intense connection, best blues ever, peaceful',
    instrumental: true,
    model: 'V5',
  },
  // Batch 10: Blues with Saxophone
  {
    title: 'Whiskey Blues | Saxophone | Jazz-Blues Fusion',
    specificDescription: 'Relaxing whiskey blues music, soulful saxophone with broken strings guitar',
    additionalDetails: 'lonely roads, smoky nights, jazz-blues fusion, deep instrumental, background sounds, intense connection, best blues ever',
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
  console.log('🎸 Starting batch generation for Relaxing Whiskey Blues Music\n');
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
    console.log(`🎸 Batch ${batchNumber}/${BATCHES.length}: ${batch.title}`);
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

