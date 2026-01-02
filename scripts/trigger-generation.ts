/**
 * Trigger music generation via API
 * 
 * Usage: npx tsx scripts/trigger-generation.ts
 */

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function triggerGeneration() {
  try {
    console.log('🎵 Triggering African Healing Music generation...\n');
    
    const response = await fetch(`${API_URL}/api/suno/generate-first`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    
    console.log('✅ Generation started successfully!');
    console.log(`📋 Task ID: ${result.taskId}`);
    console.log(`\n💡 ${result.message}`);
    console.log('\n⏳ The music is being generated...');
    console.log('   - This typically takes 2-3 minutes');
    console.log('   - The callback will automatically download and store the files');
    console.log('   - Check your Supabase database and storage to see the results!');
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    console.error('\n💡 Make sure:');
    console.error('   1. The Next.js dev server is running (npm run dev)');
    console.error('   2. SUNO_API_KEY is set in .env.local');
    console.error('   3. NEXT_PUBLIC_APP_URL is set (or use localhost:3000)');
    process.exit(1);
  }
}

triggerGeneration();

