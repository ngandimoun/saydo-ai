/**
 * Script to generate the first healing music song
 * 
 * Run with: npx tsx scripts/generate-first-song.ts
 */

import { generateAfricanHealingMusic } from '../lib/suno-generation-service';

async function main() {
  try {
    console.log('🎵 Starting generation of African Healing Music...\n');
    
    const result = await generateAfricanHealingMusic();
    
    console.log('\n✅ Generation started successfully!');
    console.log(`📋 Task ID: ${result.taskId}`);
    console.log('\n⏳ The music is being generated...');
    console.log('   - This typically takes 2-3 minutes');
    console.log('   - You will receive a callback when complete');
    console.log('   - The callback will automatically download and store the files');
    console.log('\n💡 Check your Supabase database and storage to see the results!');
  } catch (error) {
    console.error('\n❌ Error generating music:', error);
    process.exit(1);
  }
}

main();

