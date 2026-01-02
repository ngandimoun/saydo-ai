/**
 * Sync all 100 batches across 10 themes
 * 
 * Manually syncs all completed generations from the batch generation
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { getMusicGenerationDetails } from '../lib/suno-api';
import { downloadAndStoreMusicFiles } from '../lib/suno-storage';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

// Task IDs from the batch generation (100 batches)
const TASK_IDS = [
  // Theme 1: Meadow Breeze Country Guitar (10 batches)
  '96b465931fe79d012c457a6bc9c6f98e', // Batch 1
  'd0e711420d98f359f41973b43a4a77f5', // Batch 2
  '71290a0bea786e446a2f0cb5ce890e1c', // Batch 3
  'c7f95b6e773c39108f1e7087165aec64', // Batch 4
  'b7c3daa4f038c4ed81ea625f20da0f1d', // Batch 5
  '5776724398777d1422ae21f06f36205d', // Batch 6
  '8ef2d1af98baa443ba0cad92163bc87a', // Batch 7
  'bdc5db88828ede1eeca43697030b426f', // Batch 8
  '0e9c048f56f6f4ff884c8336f0f8566a', // Batch 9
  'e891a6bfc14acc518fe6855eaceee5ea', // Batch 10
  
  // Theme 2: Cafe Bossa (10 batches)
  '3b37c77a3f229bef1d43bbd5162333e7', // Batch 11
  '8da673dcc560dcf0837b5234b1e6a5f3', // Batch 12
  '94706b56716b7a63b84e5fc36b2a858c', // Batch 13
  'b0ee5e5d237eeafe717e5298992f367d', // Batch 14
  '7a261775a6850eda9e9e4b94f672010c', // Batch 15
  '67795f3ce6103b26d2a09e383e0a4701', // Batch 16
  'bd92c6aed1040d1e89529888ffa29b6c', // Batch 17
  '9c73f754ff36dd2a64a8c12a34274007', // Batch 18
  '36ae362b4b608296275227af615690f0', // Batch 19
  'b66fbc82cccaf34979d836a6cf7fa46d', // Batch 20
  
  // Theme 3: Spanish & French Relaxing (10 batches)
  '2e04ea839a2eeb7213120c57a8c5f6ed', // Batch 21
  'a5fba46042df899cad8b04fdbfbb7efb', // Batch 22
  '07195b724589caee3c7ecdf03eceebcb', // Batch 23
  '7ed71f7ac23f87310705a2ab876cf9ff', // Batch 24
  '68aed564a7d4bb3440618d2b7585f43c', // Batch 25
  '13ee15d6413b2c986c6d6b026984309a', // Batch 26
  '620ddbe8c836f5b6518f3054fa2af478', // Batch 27
  '3ffa59d146f7dda47932b4ea02e6ff53', // Batch 28
  '0416c2c183b030d4a4b26bb097294783', // Batch 29
  '9e47470292ffe0b772a4f495262d164d', // Batch 30
  
  // Theme 4: 1940s Retro Jazz (10 batches)
  '6d4b225bb3311c63faf4c8a12950dc83', // Batch 31
  '580fdb3e3ab09ed94ff897efbceba27e', // Batch 32
  'dac1b84ab714c9104b7aa4355bf74980', // Batch 33
  'ab242ab17a0f717e102476c26d6e0b4b', // Batch 34
  '52d16b332e1981c72be2a6eb05076b5e', // Batch 35
  'c55a80dd0b11ac6f79121134b702fcab', // Batch 36
  '2337260bdd9807f9b1dc3c6595c03e42', // Batch 37
  '78785a000cc9537c3ae5640669c5250b', // Batch 38
  '7288f9a0afffac6e31ee801492e3e3a5', // Batch 39
  '2bfad4c6743564fd2407e3eae0c8fb97', // Batch 40
  
  // Theme 5: Smoke & Silence Saxophone Jazz (10 batches)
  '1ae33a22cfb1dfa38b42a4882943542b', // Batch 41
  '2e616585727c6a5325940cc781e01810', // Batch 42
  'ca938fd47ebfcbac16a746089fe3165e', // Batch 43
  '3f2349bf688184406497181b5fc06f26', // Batch 44
  '7733ff79b8b267d2c47cf5c72b4ef4b4', // Batch 45
  'd30fb229133d92826aa40ae49302ec79', // Batch 46
  'f40d5420c2cac029d324095aee4f3508', // Batch 47
  'b21590293ee43fc7c4f8ed868fde718e', // Batch 48
  '381427855f065c7013545e03e6e7ceed', // Batch 49
  '9291cde69ff758c441c6c8d1ea0df36e', // Batch 50
  
  // Theme 6: Cuban Music Mix (10 batches)
  '4a634be78f78797d150bea3343b4f342', // Batch 51
  'b341acfdf817feee5a69e317086afa0a', // Batch 52
  '448b53c2bcc1c4042b820af60f1223c4', // Batch 53
  'e478a07d741fbd50bce12dc504b941a4', // Batch 54
  'babfa797721929007a995a9cd5442e3c', // Batch 55
  'e18fedabc2ce0646751947097ae999c3', // Batch 56
  'ae7b9c8b470d06864bab4a4d392382a7', // Batch 57
  '85765d2051a833222519f7a8fd1fb185', // Batch 58
  'ecf81e195ed5a445f5105891424c05fd', // Batch 59
  '2538a3b7562c62393094823a127c799a', // Batch 60
  
  // Theme 7: Spanish Guitar & Arabic Oud (10 batches)
  '38fc5c3c42fdaee87f3290a012ed9011', // Batch 61
  '76a8d7786274e95f72304752fa9cf299', // Batch 62
  '09386905b821c7e0f6dc8d90e0b3fe8d', // Batch 63
  'c0555383a7bfa7d665a28dbbcc08d1f3', // Batch 64
  'fca76ceda561b70dafd9353746a0cc58', // Batch 65
  '341e8cefd6255fa5d6b7be2a3769b1ea', // Batch 66
  '4c1c6e2902a6a072d4afe286a248494d', // Batch 67
  'f666b3e2fdc762cfbdc96fea989b6041', // Batch 68
  '019bf13cf0b7589acd1b25c1de10d710', // Batch 69
  'c3c8a4a2b2cae8ab2f10519776eb48ec', // Batch 70
  
  // Theme 8: Rich Vibes Money & Positive Energy (10 batches)
  '4e8cdd6ddaaf0c6e27ce906b4e3fb14b', // Batch 71
  'd1fd3bfebfde531b1478b31d87dde4af', // Batch 72
  '4f7cb6a1764cdfd71186357814f026da', // Batch 73
  'a74e3e03a32f3ee4e8edff85e207d56b', // Batch 74
  '0fc0827932eaf23f811737c65fbccaf5', // Batch 75
  '17543eec0f3aa195f8c28128fc7c1485', // Batch 76
  'f425f17529ae46d2f04c2d18e4764585', // Batch 77
  'c193c55ae82c7e4a5f3e3ffa3d953fd0', // Batch 78
  'b7dbacf42c79f9cf846c200a94d550a7', // Batch 79
  '5e029c92cc621f562250552b949c88dc', // Batch 80
  
  // Theme 9: Café Ritmo Cubano (10 batches)
  'ac65f6bed2755c79b0657edcace350b8', // Batch 81
  '3e7af78ade5881c7f1fcedf271f5bc3b', // Batch 82
  'c9baf066aca6e2c9d542ef0b4ab808e8', // Batch 83
  'ee72e426a7be33a373bf36c642b6c5e0', // Batch 84
  'ee0705a0e8ee059d9ee751429ef32028', // Batch 85
  '0d409804f157f5aea93b1cdc4f5b0c23', // Batch 86
  'bddeb970d9f0008a035719c78bbdb7bb', // Batch 87
  '3b5a7a8e5fff239336d83c77f81f40a7', // Batch 88
  'f39e891ddbaa715e6ba1a299589ae465', // Batch 89
  '7c3d192cfe6a35524cbe0e93aa90323a', // Batch 90
  
  // Theme 10: NOIRÉ Havana Night (10 batches)
  '5bd6e1069ab5eececeae0fb1a53bfbaf', // Batch 91
  '75fff990d1aa72266c580acf4b40e1b3', // Batch 92
  '98127bd4a1fd79e00162aba0e98a45ca', // Batch 93
  'febd1feb8383bd123189f6f1977ae378', // Batch 94
  'fe14dfd819a310b53b3b0635f586dc64', // Batch 95
  '8c39e4abafad99e70451bdacfa4443f8', // Batch 96
  'b8dabf05c8572757727bf73b41136b9d', // Batch 97
  '82e39a69dc47647f004db5e20cbb62a0', // Batch 98
  '88894d31c834e27be20b602efc6f053c', // Batch 99
  '805b2f476811fd2ff6bd798b2bc94dc5', // Batch 100
];

async function syncAllBatches() {
  console.log('🎵 Syncing all 100 batches across 10 themes...\n');
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

