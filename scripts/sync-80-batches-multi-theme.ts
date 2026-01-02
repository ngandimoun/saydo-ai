/**
 * Sync all 80 batches across 8 themes
 * 
 * Manually syncs all completed generations from the batch generation
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { getMusicGenerationDetails } from '../lib/suno-api';
import { downloadAndStoreMusicFiles } from '../lib/suno-storage';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

// Task IDs from the batch generation (80 batches)
const TASK_IDS = [
  // Theme 1: WILD Habibi Arabic Afro House × Reggaeton (10 batches)
  '23dabf4a026ca9a7e72673aa17f9d9e3', // Batch 1
  '94048f7514d03c4725d88c99962e1d98', // Batch 2
  'ebd5174c02c251ca539ffabd9fcc90d2', // Batch 3
  'ff2821f1e1f59dc1a4ef8de4142e9377', // Batch 4
  'e44e0ced00bf8764a18d05d022231fe2', // Batch 5
  '2c296a5fa907b2cd9279fe01bdd061a4', // Batch 6
  'ceab3065a3a1c4ca97114a252fd6bf86', // Batch 7
  'a120848eabaef3c2a6b39f6a76cb538e', // Batch 8
  '8671094b91f711a332659dfd86b3db3b', // Batch 9
  '640a8a46fd74cfbeab7d8a23ec77f669', // Batch 10
  
  // Theme 2: Hip-Hop × Violin (10 batches)
  'fb7999f0d5404d1d1c30ffb66b88f7f9', // Batch 11
  '674046223b9bffc7aa5ac933f3153297', // Batch 12
  '5aecd20e57d5f46dac25b3efbca76523', // Batch 13
  '946ba7610c08ab80e6e571ce8965cab9', // Batch 14
  'a81166e7bc915395cfb821da89208405', // Batch 15
  'd44b0a655b80fd91ead4b6894adc5850', // Batch 16
  'ec455a5025a2dc84e526cc8d7c370720', // Batch 17
  '2e3c337d1cf8c302bccb21ec5571b495', // Batch 18
  'ee4c6956c5bee5e2afaa0ff50b5cb517', // Batch 19
  'cee1d7d4410ff9c20895761992f5a24b', // Batch 20
  
  // Theme 3: No Mercy 90s Boom Bap (10 batches)
  'ac9adf86a28b2ed1a8c4cc9cf8148ded', // Batch 21
  'bfe77849a563804e9b16e2e57b0dc060', // Batch 22
  'c54162dec9be68807ba0a806a157972c', // Batch 23
  '62fe5d9388e01ca0855d47990ac912fe', // Batch 24
  'c91be1460144d690015c4411cadfb77f', // Batch 25
  '937e2e2f736194ced96ecc93b538d2ca', // Batch 26
  '4e7fe13e44a736e94b7b7b671c4031ba', // Batch 27
  '73add2e8acbfcfc5bf387c8e48d1ec08', // Batch 28
  '360598dc820eac389800e6ae9a384932', // Batch 29
  '3b64b1d31227484b52fe5bef869fae75', // Batch 30
  
  // Theme 4: Relaxing Piano and Soft Rain (10 batches)
  'd2f5dd2abe1adaad57ea534e46449ed8', // Batch 31
  '3f199eb7d1a7ddad9eaee498d8bb28bc', // Batch 32
  '555edc08754d4431d0ede2008cbeb12d', // Batch 33
  '39abc1c5f0d6d004b1bbcc1222f8df29', // Batch 34
  '05be1451ffe450f299d75e45609f8c93', // Batch 35
  '2f4f6387cfc2c2fe3cda21501e568e1f', // Batch 36
  '19b1def95d829b02f252d70f9d156da0', // Batch 37
  '5df6c8a5286ec1876ed95df856ae533d', // Batch 38
  'd1e81cd43ede12720cd10ecc1a3a094b', // Batch 39
  '00ce2b1aa214cc2bd11175b24f4e71dc', // Batch 40
  
  // Theme 5: BUDŌ Japanese Zen Music (10 batches)
  '2e87df44179f002fea140a9acb7d696c', // Batch 41
  '2dbe5ca1abfd0cfe144fda3f654dde12', // Batch 42
  'ccde9895b736244eed043f5a5fb8d3a2', // Batch 43
  'f20ed127ef89a03da910580d2e730f23', // Batch 44
  '09ba4c52f4be8f88ee1ff02a33c4253e', // Batch 45
  '242f2d741223d862cfd7c0befc668945', // Batch 46
  '828b4a36f1a9987ee01afd3836d15a7f', // Batch 47
  '9087e84927c5db5125beb4e0a35f101d', // Batch 48
  '66826d1c69550f781c536921805af95d', // Batch 49
  'b61cf04ee3b3f1258ff01913265e9b76', // Batch 50
  
  // Theme 6: Fantasy Pharaonic Vibes - Deep House Arabic Violin (10 batches)
  '9f496c9ab784c0e6e16f03eb4c8789b3', // Batch 51
  '51cb314f301afe4615abc66899b2acc1', // Batch 52
  '53ba641ccd3a0c3b40ac06f70ce6531b', // Batch 53
  '62b9bfef2d5059fb18e7fdc247ef2930', // Batch 54
  '48563fd87dd958d6bbb029e596887380', // Batch 55
  '7da65de97e81248629ebb7135fc3cfbe', // Batch 56
  'f45eb50456c440367cfe76e6d1cce489', // Batch 57
  'b1f54529b6201bcfd1545c3cac9a4d36', // Batch 58
  '18d5fbb5a59bdb9b50dbfc18233f88c5', // Batch 59
  '0a55fe0f1415e19c26645096a401317b', // Batch 60
  
  // Theme 7: Lingala Love Rhumba - Congolese Rumba (10 batches)
  'b56ae6445c28aa9120d7790c0ca6d15f', // Batch 61
  '47f98d9362796628bddeda9e105280ab', // Batch 62
  '7a274d4b01c999e63ceee7a51458e4a9', // Batch 63
  '641502eee2f56f7c8e8a88dbe677c745', // Batch 64
  'f2bb9775056e53327ab13983eb8e8cf5', // Batch 65
  '501194fdfba93c8af990967828910690', // Batch 66
  '3993a86fda108ce734ba068e5fe4315f', // Batch 67
  '061676d214134308b0aec16744bf2ddc', // Batch 68
  'd3220975838e8f4a249d917d221103fa', // Batch 69
  'e04163ae9c7511f89805b29385657eb2', // Batch 70
  
  // Theme 8: Persian Ambient Journey (10 batches)
  '3fd837bf7657f09e55e370971691ee83', // Batch 71
  '49331b9c8b391501a77ea571f9595770', // Batch 72
  '3a2674d5e7bb50bc07b05b00a7b36368', // Batch 73
  '93250204b507cb17fca2147249c7ad2e', // Batch 74
  '29366fbe69c13b6301053e6bd5244f23', // Batch 75
  '4bcd9a9c44d16caceaf4bcd0ea178cc0', // Batch 76
  '791ea175d62d5116fb482ec31275e319', // Batch 77
  '589ac272e03d5d79533e01d3b7cbb47b', // Batch 78
  'f17e5d9519b91573d516ba77dad21050', // Batch 79
  '2a7e528fff59197cebe25a8fb8626153', // Batch 80
];

async function syncAllBatches() {
  console.log('🎵 Syncing all 80 batches across 8 themes...\n');
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

    // Show progress every 10 batches
    if (batchNumber % 10 === 1 || batchNumber === 1) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📋 Processing batches ${batchNumber}-${Math.min(batchNumber + 9, TASK_IDS.length)}`);
      console.log(`${'='.repeat(60)}\n`);
    }

    console.log(`🔄 Batch ${batchNumber}/${TASK_IDS.length}: Task ID ${taskId.substring(0, 8)}...`);

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
        category: 'music',
        generationMetadata: {
          prompt: details.response.sunoData[0]?.prompt,
          modelName: details.response.sunoData[0]?.modelName,
          customMode: false,
          instrumental: details.response.sunoData[0]?.prompt?.toLowerCase().includes('instrumental') || false,
          category: 'music',
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

