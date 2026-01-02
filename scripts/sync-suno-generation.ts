/**
 * Sync a completed Suno generation manually
 * 
 * Usage: npx tsx scripts/sync-suno-generation.ts <taskId>
 * 
 * This script fetches the generation details from Suno API
 * and downloads/stores the files in Supabase
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { getMusicGenerationDetails } from '../lib/suno-api';
import { downloadAndStoreMusicFiles } from '../lib/suno-storage';

const taskId = process.argv[2];

if (!taskId) {
  console.error('❌ Please provide a task ID');
  console.error('Usage: npx tsx scripts/sync-suno-generation.ts <taskId>');
  process.exit(1);
}

async function syncGeneration() {
  try {
    console.log(`🔄 Fetching generation details for task: ${taskId}\n`);

    // Get generation details from Suno
    const details = await getMusicGenerationDetails(taskId);

    console.log(`📊 Status: ${details.status}`);
    console.log(`📋 Task ID: ${details.taskId}`);
    console.log(`🎵 Songs: ${details.response?.sunoData?.length || 0}\n`);

    if (details.status !== 'SUCCESS') {
      console.error(`❌ Generation not complete. Status: ${details.status}`);
      if (details.errorMessage) {
        console.error(`   Error: ${details.errorMessage}`);
      }
      process.exit(1);
    }

    if (!details.response?.sunoData || details.response.sunoData.length === 0) {
      console.error('❌ No audio data found in response');
      process.exit(1);
    }

    console.log(`✅ Generation complete! Found ${details.response.sunoData.length} songs\n`);
    
    // Debug: Log the first song's structure
    if (details.response.sunoData[0]) {
      console.log('🔍 First song data structure:');
      console.log(JSON.stringify(details.response.sunoData[0], null, 2));
      console.log('\n');
    }
    
    console.log('📥 Downloading and storing files...\n');

    // Download and store files
    const storedFiles = await downloadAndStoreMusicFiles({
      taskId,
      audioData: details.response.sunoData,
      convertToWAV: true,
      downloadCovers: true,
      operationType: 'generate',
      generationMetadata: {
        prompt: details.response.sunoData[0]?.prompt,
        modelName: details.response.sunoData[0]?.model_name,
        customMode: false,
        instrumental: details.response.sunoData[0]?.prompt?.toLowerCase().includes('instrumental') || false,
      },
    });

    console.log(`\n✅ Successfully stored ${storedFiles.length} songs!`);
    console.log('\n📋 Stored files:');
    storedFiles.forEach((file, index) => {
      console.log(`\n   Song ${index + 1}:`);
      console.log(`   - Title: ${file.metadata.title}`);
      console.log(`   - Audio ID: ${file.audioId}`);
      console.log(`   - File Path: ${file.filePath}`);
      console.log(`   - Cover: ${file.coverImageUrl ? 'Yes' : 'No'}`);
      console.log(`   - Duration: ${Math.floor(file.metadata.duration / 60)}:${String(Math.floor(file.metadata.duration % 60)).padStart(2, '0')}`);
    });

    console.log('\n🎉 Songs are now available in Saydo!');
  } catch (error) {
    console.error('\n❌ Error syncing generation:', error);
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

syncGeneration();

