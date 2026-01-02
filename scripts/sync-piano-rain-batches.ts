/**
 * Sync all 10 Piano and Rain batches
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
  '28ec307946ab2ce523dcc50635eeb5d7', // Batch 1: Pure Piano and Rain
  '79f204bda4d12dcda185139cda129bbb', // Batch 2: Ambient Strings
  '7dd5838b3e85429346e5cdfe25b45514', // Batch 3: Male Sleep Voice
  'b245f251addcb86bc38298573e0b4948', // Batch 4: Female Sleep Voice
  '588537268dcb13d3588f97c3d9da25f3', // Batch 5: Nature Sounds
  'afcec9059f82e9f406db502e2da0939f', // Batch 6: Male Voice & Strings
  '175898d649e818fa9305f07262f73ef5', // Batch 7: Female Voice & Strings
  '496e9c1e1277dc08b46262358092ac4f', // Batch 8: Binaural Beats
  'f5e04dd4d2f0f0bd0a89ff000107c0b0', // Batch 9: Ambient Pads & Drones
  '8bc78312ea3ae1af8765c8d4367c91cc', // Batch 10: Soft Percussion
];

async function syncAllBatches() {
  console.log('🎹 Syncing all 10 Piano and Rain batches...\n');
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
        category: 'sleep', // Piano and rain batches are for sleep
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

