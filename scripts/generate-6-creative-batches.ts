/**
 * Batch Generation Script for 6 Creative Music Batches Across 6 Themes
 * 
 * Generates 6 unique batches (12 songs total) - 1 batch per theme
 * with creative variations emphasizing uniqueness, deep instrumental sounds,
 * background ambience, natural sounds, and voice variations
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
  theme: string;
  category: 'music' | 'relaxation' | 'meditation' | 'sleep';
}

const BATCHES: BatchConfig[] = [
  // ============================================
  // THEME 1: Asia Rhythms for Stress Relief & Calm
  // ============================================
  {
    title: 'Asia Rhythms | Deep Instrumental Meditation | Stress Relief & Calm',
    specificDescription: 'Deep instrumental Asian rhythms with gongs, bamboo flutes, and traditional Asian instruments, deep meditation music',
    additionalDetails: 'stress relief, calm, deep background sounds, temple bells, wind chimes, water sounds, natural sounds, bamboo forest atmosphere, mountain streams, deep instrumental, intense connection, peaceful, meditative, healing',
    instrumental: true,
    model: 'V5',
    theme: 'Asia Rhythms for Stress Relief & Calm',
    category: 'relaxation',
  },

  // ============================================
  // THEME 2: Country-Love
  // ============================================
  {
    title: 'Country-Love | Acoustic Guitar & Female Voice | Romantic Country Ballad',
    specificDescription: 'Romantic country love song with deep acoustic guitar, banjo, and fiddle, soulful female country voice',
    additionalDetails: 'country-love, romantic ballad, deep background sounds, countryside atmosphere, meadow breeze, natural sounds, birds, rural ambience, deep instrumental, intense connection, soulful, healing, peaceful',
    instrumental: false,
    model: 'V5',
    theme: 'Country-Love',
    category: 'music',
  },

  // ============================================
  // THEME 3: African Melodies | Uplifting Swahili Melodies
  // ============================================
  {
    title: 'African Melodies | Uplifting Swahili Melodies | Joy, Energy & Inspiration',
    specificDescription: 'Uplifting African melodies with djembe drums, kalimba, and traditional African instruments, joyful male Swahili vocals',
    additionalDetails: 'uplifting Swahili melodies, relaxing, chill, joy, energy, inspiration, deep background sounds, African village atmosphere, savanna ambience, natural sounds, African wildlife, nature sounds, tribal ambience, deep instrumental, intense connection, transformative, healing',
    instrumental: false,
    model: 'V5',
    theme: 'African Melodies | Uplifting Swahili Melodies',
    category: 'music',
  },

  // ============================================
  // THEME 4: GO TO SENEGAL // dakar breeze // ethno groove chill
  // ============================================
  {
    title: 'GO TO SENEGAL | Dakar Breeze | Ethno Groove Chill World Fusion',
    specificDescription: 'Ethno groove chill music with Senegalese instruments, world fusion mix, deep instrumental with traditional Senegalese rhythms',
    additionalDetails: 'dakar breeze, ethno groove chill, world fusion mix, deep background sounds, Dakar city atmosphere, coastal breeze, natural sounds, ocean waves, Senegalese street sounds, market ambience, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'GO TO SENEGAL // dakar breeze // ethno groove chill',
    category: 'music',
  },

  // ============================================
  // THEME 5: Afro-Japanese
  // ============================================
  {
    title: 'Afro-Japanese | Cultural Fusion | Deep Instrumental Blend',
    specificDescription: 'Afro-Japanese fusion music, deep instrumental blend of African rhythms and Japanese instruments, shakuhachi meets djembe',
    additionalDetails: 'cultural fusion, African rhythms, Japanese instruments, deep background sounds, fusion atmosphere, cultural blend, natural sounds, blended natural ambience, deep instrumental, intense connection, peaceful, meditative, transformative',
    instrumental: true,
    model: 'V5',
    theme: 'Afro-Japanese',
    category: 'music',
  },

  // ============================================
  // THEME 6: Japan Blues
  // ============================================
  {
    title: 'Japan Blues | Blues Guitar & Japanese Elements | Deep Soulful Blues',
    specificDescription: 'Japan blues music, deep instrumental blues guitar with Japanese elements, koto and shakuhachi, soulful male blues voice',
    additionalDetails: 'Japan blues, blues guitar, Japanese elements, deep background sounds, Japanese atmosphere, blues club ambience, natural sounds, Japanese nature, urban ambience, deep instrumental, intense connection, soulful, transformative',
    instrumental: false,
    model: 'V5',
    theme: 'Japan Blues',
    category: 'music',
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
  console.log('🎵 Starting batch generation for 6 creative batches across 6 themes\n');
  console.log(`📊 Total batches: ${BATCHES.length} (${BATCHES.length * 2} songs)\n`);

  const results: Array<{
    batchNumber: number;
    title: string;
    theme: string;
    taskId: string | null;
    success: boolean;
    error?: string;
  }> = [];

  const DELAY_BETWEEN_REQUESTS = 1000; // 1 second between requests

  for (let i = 0; i < BATCHES.length; i++) {
    const batch = BATCHES[i];
    const batchNumber = i + 1;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎵 Batch ${batchNumber}/${BATCHES.length}: ${batch.title}`);
    console.log(`   Theme: ${batch.theme}`);
    console.log(`   Type: ${batch.instrumental ? 'Instrumental' : 'Vocal'}`);
    console.log(`   Model: ${batch.model}`);
    console.log(`   Category: ${batch.category}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      const result = await generateHealingMusic({
        title: batch.title,
        specificDescription: batch.specificDescription,
        additionalDetails: batch.additionalDetails,
        instrumental: batch.instrumental,
        model: batch.model,
        category: batch.category,
        waitForCompletion: false, // Use callbacks for automatic storage
      });

      console.log(`✅ Batch ${batchNumber} started successfully`);
      console.log(`   Task ID: ${result.taskId}`);
      console.log(`   Status: Generation in progress (will be stored via callback)`);

      results.push({
        batchNumber,
        title: batch.title,
        theme: batch.theme,
        taskId: result.taskId,
        success: true,
      });

      // Rate limiting: wait 1 second between requests (except for last batch)
      if (i < BATCHES.length - 1) {
        await delay(DELAY_BETWEEN_REQUESTS);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Batch ${batchNumber} failed: ${errorMessage}\n`);

      results.push({
        batchNumber,
        title: batch.title,
        theme: batch.theme,
        taskId: null,
        success: false,
        error: errorMessage,
      });

      // Continue with next batch even if this one failed
      if (i < BATCHES.length - 1) {
        await delay(DELAY_BETWEEN_REQUESTS);
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

  // Summary by theme
  console.log('📋 Summary by Theme:');
  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    console.log(`   ${status} [${r.theme}] ${r.title}`);
    if (r.success) {
      console.log(`      Task ID: ${r.taskId}`);
    } else {
      console.log(`      Error: ${r.error}`);
    }
  });
  console.log('');

  console.log('💡 Note: Songs will be automatically stored in Supabase via callbacks');
  console.log('   when generation completes (typically 2-3 minutes per batch).\n');
  console.log('💡 To sync manually later, use: npx tsx scripts/sync-6-creative-batches.ts\n');
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

