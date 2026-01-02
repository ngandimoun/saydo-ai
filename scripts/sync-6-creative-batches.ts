/**
 * Sync all 6 creative batches across 6 themes
 * 
 * Manually syncs all completed generations from the batch generation
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { getMusicGenerationDetails } from '../lib/suno-api';
import { downloadAndStoreMusicFiles } from '../lib/suno-storage';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

// Task IDs from the batch generation (6 batches)
const TASK_IDS = [
  '45fdeabe7eef3652d97bb497cf40f4be', // Batch 1: Asia Rhythms for Stress Relief & Calm
  'd4e596230d3c82853dc16fe8a8fcb2ae', // Batch 2: Country-Love
  'b862c82d384830f198557dda5acec9f7', // Batch 3: African Melodies | Uplifting Swahili Melodies
  'db089558de2bb572d218eed7b8967638', // Batch 4: GO TO SENEGAL // dakar breeze
  '196723e058a6b2f61c7bcc1d7401c725', // Batch 5: Afro-Japanese
  '7596dc087a510c8aee177f99ca3af3d8', // Batch 6: Japan Blues
];

// Category mapping for each batch
const BATCH_CATEGORIES: Array<'music' | 'relaxation' | 'meditation' | 'sleep'> = [
  'relaxation', // Batch 1: Asia Rhythms
  'music',      // Batch 2: Country-Love
  'music',      // Batch 3: African Melodies
  'music',      // Batch 4: GO TO SENEGAL
  'music',      // Batch 5: Afro-Japanese
  'music',      // Batch 6: Japan Blues
];

async function syncAllBatches() {
  console.log('🎵 Syncing all 6 creative batches across 6 themes...\n');
  console.log(`📊 Total task IDs: ${TASK_IDS.length}\n`);

  const results: Array<{
    batchNumber: number;
    taskId: string;
    success: boolean;
    error?: string;
    songsStored?: number;
  }> = [];

  for (let i = 0; i < TASK_IDS.length; i++) {
    const taskId = TASK_IDS[i];
    const batchNumber = i + 1;
    const category = BATCH_CATEGORIES[i];

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 Batch ${batchNumber}/${TASK_IDS.length}: Task ID ${taskId.substring(0, 8)}...`);
    console.log(`   Category: ${category}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      const details = await getMusicGenerationDetails(taskId);

      if (details.status !== 'SUCCESS') {
        throw new Error(`Generation not complete. Status: ${details.status}`);
      }

      if (!details.response?.sunoData || details.response.sunoData.length === 0) {
        throw new Error('No audio data found in response');
      }

      const storedFiles = await downloadAndStoreMusicFiles({
        taskId,
        audioData: details.response.sunoData,
        convertToWAV: true,
        downloadCovers: true,
        operationType: 'generate',
        category: category,
        generationMetadata: {
          prompt: details.response.sunoData[0]?.prompt,
          modelName: details.response.sunoData[0]?.modelName,
          customMode: false,
          instrumental: details.response.sunoData[0]?.prompt?.toLowerCase().includes('instrumental') || false,
          category: category,
        },
      });

      console.log(`   ✅ Stored ${storedFiles.length} songs`);

      results.push({
        batchNumber,
        taskId,
        success: true,
        songsStored: storedFiles.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`   ❌ Error: ${errorMessage}`);
      results.push({
        batchNumber,
        taskId,
        success: false,
        error: errorMessage,
      });
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 SYNC SUMMARY');
  console.log(`${'='.repeat(60)}\n`);

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalSongs = results.filter(r => r.success).reduce((sum, r) => sum + (r.songsStored || 0), 0);

  console.log(`✅ Successful: ${successful}/${TASK_IDS.length} batches`);
  console.log(`❌ Failed: ${failed}/${TASK_IDS.length} batches`);
  console.log(`🎵 Total songs stored: ${totalSongs} songs\n`);

  if (failed > 0) {
    console.log('❌ Failed batches:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`   Batch ${r.batchNumber}: ${r.error}`);
      });
    console.log('');
  }
}

syncAllBatches()
  .then(() => {
    console.log('✨ Sync process completed!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

