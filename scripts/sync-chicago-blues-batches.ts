/**
 * Sync all 10 Chicago Blues batches
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
  '902339c80a632f0808869964636e424c', // Batch 1: Pure Instrumental Chicago Blues
  '60a761f151d83de41e4d72fe28afe7d1', // Batch 2: Male Soulful Voice
  'e944bbe7cdc0c40fbcb50dc36d21c568', // Batch 3: Female Soulful Voice
  'e932a71f6ec1fa3f0b9668e54ed089f1', // Batch 4: Harmonica
  'e491d74eb487cfa95370d9b79010a53e', // Batch 5: Piano & Guitar
  'fe2760edceea7820c8e2592aa108628e', // Batch 6: Male Voice & Harmonica
  'd9642187b448e312ba8c9a431e8143eb', // Batch 7: Female Voice & Piano
  '15b834d8643be992a7f906e08f8969c1', // Batch 8: City Atmosphere
  'd43c2f2d06c7d40894a0b4f52b3bc440', // Batch 9: Slide Guitar
  'bc3d404267cf93096f951f16b88228a9', // Batch 10: Saxophone
];

async function syncAllBatches() {
  console.log('🎸 Syncing all 10 Chicago Blues batches...\n');
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
        category: 'music', // Chicago blues is categorized as 'music'
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

