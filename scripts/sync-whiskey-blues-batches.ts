/**
 * Sync all 10 Whiskey Blues batches
 * 
 * Manually syncs all completed generations from the batch generation
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { getMusicGenerationDetails } from '../lib/suno-api';
import { downloadAndStoreMusicFiles } from '../lib/suno-storage';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

// Task IDs from the batch generation
const TASK_IDS = [
  'b4925bb72888e5795228720b53d1222f', // Batch 1: Pure Instrumental Blues
  '3a3770657b43fc54022d37684adf6746', // Batch 2: Male Whiskey Voice
  '51650a0e93de2b83bbf230e3593802fd', // Batch 3: Female Whiskey Voice
  'f296c23ae514a5c49341ad538d1fd1ae', // Batch 4: Harmonica
  '02eafaa913985395bc1b149490a176f2', // Batch 5: Piano & Guitar
  'c52c599d77c552cded3c6dc6f9f63b87', // Batch 6: Male Voice & Harmonica
  'c7d75d2a67c790a26fc367a3b04e7625', // Batch 7: Female Voice & Piano
  'ed14cc36d6bff123c99d3457b91cb9c6', // Batch 8: Bar Atmosphere
  '785273e51e1510bd56e34d1b5f31001d', // Batch 9: Slide Guitar
  '223507dcf14df8dedbbef4b2a30d3856', // Batch 10: Saxophone
];

async function syncAllBatches() {
  console.log('🎸 Syncing all 10 Whiskey Blues batches...\n');
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

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 Batch ${batchNumber}/${TASK_IDS.length}: Task ID ${taskId}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      const details = await getMusicGenerationDetails(taskId);

      console.log(`📊 Status: ${details.status}`);
      if (details.status !== 'SUCCESS') {
        throw new Error(`Generation not complete. Status: ${details.status}`);
      }

      if (!details.response?.sunoData || details.response.sunoData.length === 0) {
        throw new Error('No audio data found in response');
      }

      console.log(`✅ Generation complete! Found ${details.response.sunoData.length} songs`);
      console.log('📥 Downloading and storing files...\n');

      const storedFiles = await downloadAndStoreMusicFiles({
        taskId,
        audioData: details.response.sunoData,
        convertToWAV: true,
        downloadCovers: true,
        operationType: 'generate',
        category: 'music', // Whiskey blues is categorized as 'music'
        generationMetadata: {
          prompt: details.response.sunoData[0]?.prompt,
          modelName: details.response.sunoData[0]?.modelName,
          customMode: false,
          instrumental: details.response.sunoData[0]?.prompt?.toLowerCase().includes('instrumental') || false,
          category: 'music',
        },
      });

      console.log(`✅ Successfully stored ${storedFiles.length} songs!`);

      results.push({
        batchNumber,
        taskId,
        success: true,
        songsStored: storedFiles.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error syncing batch ${batchNumber}: ${errorMessage}`);
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

  if (successful > 0) {
    console.log('📋 Successfully synced batches:');
    results
      .filter(r => r.success)
      .forEach(r => {
        console.log(`   ${r.batchNumber}. Task ID: ${r.taskId}`);
        console.log(`      Songs: ${r.songsStored}`);
      });
    console.log('');
  }

  if (failed > 0) {
    console.log('❌ Failed batches:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`   ${r.batchNumber}. Task ID: ${r.taskId}`);
        console.log(`      Error: ${r.error}`);
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

