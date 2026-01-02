/**
 * Sync all 10 African Healing Music batches
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
  '61122d705278f66b618178600eee02d8', // Batch 1: Savanna Rhythms
  '4169cf8039f5d614120476f979d2ea63', // Batch 2: Healing Chants
  '655985f42fb60a28b2ea25d784de939f', // Batch 3: Desert Winds
  '7f3e78af4a09e26746b0aeeb17702448', // Batch 4: Harmony Healing
  'efafff8b9330b35740b5e59110ab70e6', // Batch 5: Drum Circle
  '901a5afbe419ea5ea3920ff875b3f2bb', // Batch 6: Deep Healing Voice
  '9726faa5bc62f1f39edc37d1979182fc', // Batch 7: Wooden Tones
  '6e5943ec7b5a96137832363e3e2e5d75', // Batch 8: Call & Response
  '4f3df9c22415c92ba824ef121efd2a43', // Batch 9: Water Healing
  'c9da7dde5b03575eee95449464849339', // Batch 10: Healing Meditation
];

async function syncAllBatches() {
  console.log('🔄 Syncing all 10 African Healing Music batches...\n');
  console.log(`📊 Total task IDs: ${TASK_IDS.length}\n`);

  const results: Array<{
    taskId: string;
    batchNumber: number;
    success: boolean;
    songsStored: number;
    error?: string;
  }> = [];

  for (let i = 0; i < TASK_IDS.length; i++) {
    const taskId = TASK_IDS[i];
    const batchNumber = i + 1;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 Batch ${batchNumber}/10: Task ID ${taskId}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      // Get generation details
      const details = await getMusicGenerationDetails(taskId);

      console.log(`📊 Status: ${details.status}`);

      if (details.status !== 'SUCCESS') {
        console.log(`⚠️  Generation not complete. Status: ${details.status}`);
        if (details.errorMessage) {
          console.log(`   Error: ${details.errorMessage}`);
        }
        results.push({
          taskId,
          batchNumber,
          success: false,
          songsStored: 0,
          error: `Status: ${details.status}`,
        });
        continue;
      }

      if (!details.response?.sunoData || details.response.sunoData.length === 0) {
        console.log(`⚠️  No audio data found`);
        results.push({
          taskId,
          batchNumber,
          success: false,
          songsStored: 0,
          error: 'No audio data',
        });
        continue;
      }

      console.log(`✅ Generation complete! Found ${details.response.sunoData.length} songs`);
      console.log(`📥 Downloading and storing files...\n`);

      // Download and store files
      const storedFiles = await downloadAndStoreMusicFiles({
        taskId,
        audioData: details.response.sunoData,
        convertToWAV: true,
        downloadCovers: true,
        operationType: 'generate',
        generationMetadata: {
          prompt: details.response.sunoData[0]?.prompt,
          modelName: details.response.sunoData[0]?.modelName || details.response.sunoData[0]?.model_name,
          customMode: false,
          instrumental: details.response.sunoData[0]?.prompt?.toLowerCase().includes('instrumental') || false,
        },
      });

      console.log(`✅ Successfully stored ${storedFiles.length} songs!`);

      results.push({
        taskId,
        batchNumber,
        success: true,
        songsStored: storedFiles.length,
      });

      // Small delay between batches
      if (i < TASK_IDS.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error syncing batch ${batchNumber}:`, errorMessage);

      results.push({
        taskId,
        batchNumber,
        success: false,
        songsStored: 0,
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
  const totalSongs = results.reduce((sum, r) => sum + r.songsStored, 0);

  console.log(`✅ Successful: ${successful}/${TASK_IDS.length} batches`);
  console.log(`❌ Failed: ${failed}/${TASK_IDS.length} batches`);
  console.log(`🎵 Total songs stored: ${totalSongs} songs\n`);

  if (successful > 0) {
    console.log('📋 Successful batches:');
    results
      .filter(r => r.success)
      .forEach(r => {
        console.log(`   Batch ${r.batchNumber}: ${r.songsStored} songs stored`);
      });
    console.log('');
  }

  if (failed > 0) {
    console.log('❌ Failed batches:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`   Batch ${r.batchNumber} (${r.taskId}): ${r.error}`);
      });
    console.log('');
  }

  console.log('🎉 Sync complete! Songs should now be visible in Saydo.\n');
}

syncAllBatches()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

