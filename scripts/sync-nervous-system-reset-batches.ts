/**
 * Sync all 10 Nervous System Reset batches
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
  '55bf114d97dceb423f616e7eb6dd85b6', // Batch 1: Pure White Noise
  '4e00b3b7ffcc9f0dddf29b41ef4aff4a', // Batch 2: Ambient Piano
  '688f7023f65c153e5c58e87f7ad4f7af', // Batch 3: Male Meditation Voice
  '501ab6abef33e3b8c6cbf7afaee273ec', // Batch 4: Female Meditation Voice
  '063d1f594d6ec4bc5077b44dd5ff72c0', // Batch 5: Ambient Strings
  'e1a31a9989c3a9df18de18f56eae3826', // Batch 6: Male Voice & Music
  '2c5b62d149afeb4d0fe9fe2bf70de0c8', // Batch 7: Female Voice & Music
  '5cdbcad4f513a7a59d3a9ed2caeab450', // Batch 8: Binaural Beats
  '886cdb13da37849cccf367302b1bfcd8', // Batch 9: Nature Sounds Blend
  'ba4ad9d97f3bd2c52e60f654332f0ead', // Batch 10: Ambient Pads & Drones
];

async function syncAllBatches() {
  console.log('🌧️ Syncing all 10 Nervous System Reset batches...\n');
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
          modelName: details.response.sunoData[0]?.modelName || details.response.sunoData[0]?.model_name || 'V5',
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

