/**
 * Batch Generation Script for 100 Batches Across 10 Music Themes
 * 
 * Generates 100 batches (200 songs total) with 10 batches per theme
 * across 10 different music themes with creative variations
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { generateHealingMusic } from '@/lib/suno-generation-service';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

interface BatchConfig {
  title: string;
  specificDescription: string;
  additionalDetails: string;
  instrumental: boolean;
  model: 'V4' | 'V4_5' | 'V4_5PLUS' | 'V4_5ALL' | 'V5';
  theme: string;
}

const BATCHES: BatchConfig[] = [
  // ============================================
  // THEME 1: Meadow Breeze Gentle Country Guitar (10 batches)
  // ============================================
  {
    title: 'Meadow Breeze | Pure Country Guitar | Serene Moments',
    specificDescription: 'Gentle country guitar, pure instrumental, meadow breeze atmosphere',
    additionalDetails: 'serene moments, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Meadow Breeze Country Guitar',
  },
  {
    title: 'Meadow Breeze | Country Guitar & Male Voice | Serene Moments',
    specificDescription: 'Gentle country guitar with warm male voice',
    additionalDetails: 'meadow breeze, serene moments, peaceful, meditative, background sounds, intense connection, soulful',
    instrumental: false,
    model: 'V5',
    theme: 'Meadow Breeze Country Guitar',
  },
  {
    title: 'Meadow Breeze | Country Guitar & Female Voice | Serene Moments',
    specificDescription: 'Gentle country guitar with soft female voice',
    additionalDetails: 'meadow breeze, serene moments, peaceful, meditative, background sounds, intense connection, healing',
    instrumental: false,
    model: 'V5',
    theme: 'Meadow Breeze Country Guitar',
  },
  {
    title: 'Meadow Breeze | Country Guitar & Harmonica | Serene Moments',
    specificDescription: 'Gentle country guitar with harmonica',
    additionalDetails: 'meadow breeze, serene moments, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Meadow Breeze Country Guitar',
  },
  {
    title: 'Meadow Breeze | Country Guitar & Banjo | Serene Moments',
    specificDescription: 'Gentle country guitar with banjo',
    additionalDetails: 'meadow breeze, serene moments, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Meadow Breeze Country Guitar',
  },
  {
    title: 'Meadow Breeze | Country Guitar & Fiddle | Serene Moments',
    specificDescription: 'Gentle country guitar with fiddle',
    additionalDetails: 'meadow breeze, serene moments, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Meadow Breeze Country Guitar',
  },
  {
    title: 'Meadow Breeze | Male Voice & Harmonica | Serene Moments',
    specificDescription: 'Warm male voice with harmonica and country guitar',
    additionalDetails: 'meadow breeze, serene moments, peaceful, meditative, background sounds, intense connection, soulful',
    instrumental: false,
    model: 'V5',
    theme: 'Meadow Breeze Country Guitar',
  },
  {
    title: 'Meadow Breeze | Female Voice & Banjo | Serene Moments',
    specificDescription: 'Soft female voice with banjo and country guitar',
    additionalDetails: 'meadow breeze, serene moments, peaceful, meditative, background sounds, intense connection, healing',
    instrumental: false,
    model: 'V5',
    theme: 'Meadow Breeze Country Guitar',
  },
  {
    title: 'Meadow Breeze | Nature Sounds | Serene Moments',
    specificDescription: 'Gentle country guitar with background nature sounds',
    additionalDetails: 'meadow breeze, birds, nature ambience, serene moments, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Meadow Breeze Country Guitar',
  },
  {
    title: 'Meadow Breeze | Layered Guitars | Serene Moments',
    specificDescription: 'Gentle country guitar, deep instrumental with layered guitars',
    additionalDetails: 'meadow breeze, serene moments, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Meadow Breeze Country Guitar',
  },

  // ============================================
  // THEME 2: Gentle Everyday Ease in Cafe Bossa (10 batches)
  // ============================================
  {
    title: 'Cafe Bossa | Pure Instrumental | Work Study Relax',
    specificDescription: 'Gentle bossa nova, pure instrumental, cafe atmosphere',
    additionalDetails: 'everyday ease, work, study, relax, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Cafe Bossa',
  },
  {
    title: 'Cafe Bossa | Male Voice | Work Study Relax',
    specificDescription: 'Gentle bossa nova with smooth male voice',
    additionalDetails: 'everyday ease, work, study, relax, peaceful, meditative, background sounds, intense connection, soulful',
    instrumental: false,
    model: 'V5',
    theme: 'Cafe Bossa',
  },
  {
    title: 'Cafe Bossa | Female Voice | Work Study Relax',
    specificDescription: 'Gentle bossa nova with soft female voice',
    additionalDetails: 'everyday ease, work, study, relax, peaceful, meditative, background sounds, intense connection, healing',
    instrumental: false,
    model: 'V5',
    theme: 'Cafe Bossa',
  },
  {
    title: 'Cafe Bossa | Piano | Work Study Relax',
    specificDescription: 'Gentle bossa nova with piano',
    additionalDetails: 'everyday ease, work, study, relax, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Cafe Bossa',
  },
  {
    title: 'Cafe Bossa | Saxophone | Work Study Relax',
    specificDescription: 'Gentle bossa nova with saxophone',
    additionalDetails: 'everyday ease, work, study, relax, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Cafe Bossa',
  },
  {
    title: 'Cafe Bossa | Acoustic Guitar | Work Study Relax',
    specificDescription: 'Gentle bossa nova with acoustic guitar',
    additionalDetails: 'everyday ease, work, study, relax, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Cafe Bossa',
  },
  {
    title: 'Cafe Bossa | Male Voice & Piano | Work Study Relax',
    specificDescription: 'Smooth male voice with piano and bossa nova',
    additionalDetails: 'everyday ease, work, study, relax, peaceful, meditative, background sounds, intense connection, soulful',
    instrumental: false,
    model: 'V5',
    theme: 'Cafe Bossa',
  },
  {
    title: 'Cafe Bossa | Female Voice & Saxophone | Work Study Relax',
    specificDescription: 'Soft female voice with saxophone and bossa nova',
    additionalDetails: 'everyday ease, work, study, relax, peaceful, meditative, background sounds, intense connection, healing',
    instrumental: false,
    model: 'V5',
    theme: 'Cafe Bossa',
  },
  {
    title: 'Cafe Bossa | Cafe Sounds | Work Study Relax',
    specificDescription: 'Gentle bossa nova with background cafe sounds',
    additionalDetails: 'everyday ease, work, study, relax, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Cafe Bossa',
  },
  {
    title: 'Cafe Bossa | Layered Instruments | Work Study Relax',
    specificDescription: 'Gentle bossa nova, deep instrumental with layered instruments',
    additionalDetails: 'everyday ease, work, study, relax, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Cafe Bossa',
  },

  // ============================================
  // THEME 3: Chill Mood Music – Spanish & French Relaxing (10 batches)
  // ============================================
  {
    title: 'Chill Mood | Spanish Guitar | Spanish & French Relaxing',
    specificDescription: 'Pure instrumental Spanish guitar, chill mood music',
    additionalDetails: 'Spanish and French relaxing, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Spanish & French Relaxing',
  },
  {
    title: 'Chill Mood | French Accordion | Spanish & French Relaxing',
    specificDescription: 'Pure instrumental French accordion, chill mood music',
    additionalDetails: 'Spanish and French relaxing, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Spanish & French Relaxing',
  },
  {
    title: 'Chill Mood | Spanish Guitar & Male Voice | Relaxing',
    specificDescription: 'Spanish guitar with male voice, chill mood music',
    additionalDetails: 'Spanish and French relaxing, peaceful, meditative, background sounds, intense connection, soulful',
    instrumental: false,
    model: 'V5',
    theme: 'Spanish & French Relaxing',
  },
  {
    title: 'Chill Mood | French Accordion & Female Voice | Relaxing',
    specificDescription: 'French accordion with female voice, chill mood music',
    additionalDetails: 'Spanish and French relaxing, peaceful, meditative, background sounds, intense connection, healing',
    instrumental: false,
    model: 'V5',
    theme: 'Spanish & French Relaxing',
  },
  {
    title: 'Chill Mood | Spanish Guitar & French Accordion | Fusion',
    specificDescription: 'Spanish guitar and French accordion fusion, chill mood music',
    additionalDetails: 'Spanish and French relaxing, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Spanish & French Relaxing',
  },
  {
    title: 'Chill Mood | Spanish Guitar & Castanets | Relaxing',
    specificDescription: 'Spanish guitar with castanets, chill mood music',
    additionalDetails: 'Spanish and French relaxing, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Spanish & French Relaxing',
  },
  {
    title: 'Chill Mood | French Accordion & Violin | Relaxing',
    specificDescription: 'French accordion with violin, chill mood music',
    additionalDetails: 'Spanish and French relaxing, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Spanish & French Relaxing',
  },
  {
    title: 'Chill Mood | Male Voice & Spanish Guitar | Relaxing',
    specificDescription: 'Male voice with Spanish guitar, chill mood music',
    additionalDetails: 'Spanish and French relaxing, peaceful, meditative, background sounds, intense connection, soulful',
    instrumental: false,
    model: 'V5',
    theme: 'Spanish & French Relaxing',
  },
  {
    title: 'Chill Mood | Female Voice & French Accordion | Relaxing',
    specificDescription: 'Female voice with French accordion, chill mood music',
    additionalDetails: 'Spanish and French relaxing, peaceful, meditative, background sounds, intense connection, healing',
    instrumental: false,
    model: 'V5',
    theme: 'Spanish & French Relaxing',
  },
  {
    title: 'Chill Mood | Mediterranean Sounds | Relaxing',
    specificDescription: 'Spanish and French music with background Mediterranean sounds',
    additionalDetails: 'chill mood music, Spanish and French relaxing, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Spanish & French Relaxing',
  },

  // ============================================
  // THEME 4: 1940's Retro Jazz - Vintage Jazz Vibes (10 batches)
  // ============================================
  {
    title: '1940s Retro Jazz | Big Band | Vintage Jazz Vibes',
    specificDescription: 'Pure instrumental big band, 1940s retro jazz',
    additionalDetails: 'vintage jazz vibes, swing, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: '1940s Retro Jazz',
  },
  {
    title: '1940s Retro Jazz | Male Crooner | Vintage Jazz Vibes',
    specificDescription: 'Big band with male crooner voice, 1940s retro jazz',
    additionalDetails: 'vintage jazz vibes, swing, peaceful, meditative, background sounds, intense connection, soulful',
    instrumental: false,
    model: 'V5',
    theme: '1940s Retro Jazz',
  },
  {
    title: '1940s Retro Jazz | Female Jazz Singer | Vintage Jazz Vibes',
    specificDescription: 'Big band with female jazz singer, 1940s retro jazz',
    additionalDetails: 'vintage jazz vibes, swing, peaceful, meditative, background sounds, intense connection, healing',
    instrumental: false,
    model: 'V5',
    theme: '1940s Retro Jazz',
  },
  {
    title: '1940s Retro Jazz | Trumpet Solo | Vintage Jazz Vibes',
    specificDescription: 'Big band with trumpet solo, 1940s retro jazz',
    additionalDetails: 'vintage jazz vibes, swing, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: '1940s Retro Jazz',
  },
  {
    title: '1940s Retro Jazz | Saxophone Solo | Vintage Jazz Vibes',
    specificDescription: 'Big band with saxophone solo, 1940s retro jazz',
    additionalDetails: 'vintage jazz vibes, swing, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: '1940s Retro Jazz',
  },
  {
    title: '1940s Retro Jazz | Piano | Vintage Jazz Vibes',
    specificDescription: 'Big band with piano, 1940s retro jazz',
    additionalDetails: 'vintage jazz vibes, swing, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: '1940s Retro Jazz',
  },
  {
    title: '1940s Retro Jazz | Male Crooner & Trumpet | Vintage Jazz',
    specificDescription: 'Male crooner with trumpet and big band, 1940s retro jazz',
    additionalDetails: 'vintage jazz vibes, swing, peaceful, meditative, background sounds, intense connection, soulful',
    instrumental: false,
    model: 'V5',
    theme: '1940s Retro Jazz',
  },
  {
    title: '1940s Retro Jazz | Female Jazz Singer & Saxophone | Vintage Jazz',
    specificDescription: 'Female jazz singer with saxophone and big band, 1940s retro jazz',
    additionalDetails: 'vintage jazz vibes, swing, peaceful, meditative, background sounds, intense connection, healing',
    instrumental: false,
    model: 'V5',
    theme: '1940s Retro Jazz',
  },
  {
    title: '1940s Retro Jazz | 1940s Atmosphere | Vintage Jazz Vibes',
    specificDescription: 'Big band with background 1940s atmosphere, 1940s retro jazz',
    additionalDetails: 'vintage jazz vibes, swing, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: '1940s Retro Jazz',
  },
  {
    title: '1940s Retro Jazz | Deep Instrumental Swing | Vintage Jazz',
    specificDescription: 'Big band, deep instrumental swing, 1940s retro jazz',
    additionalDetails: 'vintage jazz vibes, swing, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: '1940s Retro Jazz',
  },

  // ============================================
  // THEME 5: Smoke & Silence | 1940's saxophone jazz (10 batches)
  // ============================================
  {
    title: 'Smoke & Silence | Pure Saxophone Jazz | 1940s Style',
    specificDescription: 'Pure instrumental saxophone jazz, 1940s style',
    additionalDetails: 'smoke and silence, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Smoke & Silence Saxophone Jazz',
  },
  {
    title: 'Smoke & Silence | Saxophone Jazz & Male Voice | 1940s Style',
    specificDescription: 'Saxophone jazz with male voice, 1940s style',
    additionalDetails: 'smoke and silence, peaceful, meditative, background sounds, intense connection, soulful',
    instrumental: false,
    model: 'V5',
    theme: 'Smoke & Silence Saxophone Jazz',
  },
  {
    title: 'Smoke & Silence | Saxophone Jazz & Female Voice | 1940s Style',
    specificDescription: 'Saxophone jazz with female voice, 1940s style',
    additionalDetails: 'smoke and silence, peaceful, meditative, background sounds, intense connection, healing',
    instrumental: false,
    model: 'V5',
    theme: 'Smoke & Silence Saxophone Jazz',
  },
  {
    title: 'Smoke & Silence | Saxophone & Piano | 1940s Style',
    specificDescription: 'Saxophone jazz with piano, 1940s style',
    additionalDetails: 'smoke and silence, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Smoke & Silence Saxophone Jazz',
  },
  {
    title: 'Smoke & Silence | Saxophone & Double Bass | 1940s Style',
    specificDescription: 'Saxophone jazz with double bass, 1940s style',
    additionalDetails: 'smoke and silence, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Smoke & Silence Saxophone Jazz',
  },
  {
    title: 'Smoke & Silence | Saxophone & Drums | 1940s Style',
    specificDescription: 'Saxophone jazz with drums, 1940s style',
    additionalDetails: 'smoke and silence, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Smoke & Silence Saxophone Jazz',
  },
  {
    title: 'Smoke & Silence | Male Voice & Saxophone | 1940s Style',
    specificDescription: 'Male voice with saxophone, 1940s style',
    additionalDetails: 'smoke and silence, peaceful, meditative, background sounds, intense connection, soulful',
    instrumental: false,
    model: 'V5',
    theme: 'Smoke & Silence Saxophone Jazz',
  },
  {
    title: 'Smoke & Silence | Female Voice & Piano | 1940s Style',
    specificDescription: 'Female voice with piano and saxophone, 1940s style',
    additionalDetails: 'smoke and silence, peaceful, meditative, background sounds, intense connection, healing',
    instrumental: false,
    model: 'V5',
    theme: 'Smoke & Silence Saxophone Jazz',
  },
  {
    title: 'Smoke & Silence | Smoky Club Atmosphere | 1940s Style',
    specificDescription: 'Saxophone jazz with background smoky club atmosphere, 1940s style',
    additionalDetails: 'smoke and silence, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Smoke & Silence Saxophone Jazz',
  },
  {
    title: 'Smoke & Silence | Deep Instrumental Saxophone | 1940s Style',
    specificDescription: 'Saxophone jazz, deep instrumental saxophone focus, 1940s style',
    additionalDetails: 'smoke and silence, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Smoke & Silence Saxophone Jazz',
  },

  // ============================================
  // THEME 6: Cuban Music Mix - Son Cubano, Cha Cha & Latin Jazz (10 batches)
  // ============================================
  {
    title: 'Cuban Music Mix | Son Cubano | Havana Love Songs',
    specificDescription: 'Pure instrumental son cubano, Cuban music mix',
    additionalDetails: 'Havana love songs, cafe cubano, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Cuban Music Mix',
  },
  {
    title: 'Cuban Music Mix | Cha Cha | Havana Love Songs',
    specificDescription: 'Pure instrumental cha cha, Cuban music mix',
    additionalDetails: 'Havana love songs, cafe cubano, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Cuban Music Mix',
  },
  {
    title: 'Cuban Music Mix | Latin Jazz | Havana Love Songs',
    specificDescription: 'Pure instrumental Latin jazz, Cuban music mix',
    additionalDetails: 'Havana love songs, cafe cubano, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Cuban Music Mix',
  },
  {
    title: 'Cuban Music Mix | Son Cubano & Male Voice | Havana Love Songs',
    specificDescription: 'Son cubano with male voice, Cuban music mix',
    additionalDetails: 'Havana love songs, cafe cubano, peaceful, meditative, background sounds, intense connection, soulful',
    instrumental: false,
    model: 'V5',
    theme: 'Cuban Music Mix',
  },
  {
    title: 'Cuban Music Mix | Cha Cha & Female Voice | Havana Love Songs',
    specificDescription: 'Cha cha with female voice, Cuban music mix',
    additionalDetails: 'Havana love songs, cafe cubano, peaceful, meditative, background sounds, intense connection, healing',
    instrumental: false,
    model: 'V5',
    theme: 'Cuban Music Mix',
  },
  {
    title: 'Cuban Music Mix | Latin Jazz & Trumpet | Havana Love Songs',
    specificDescription: 'Latin jazz with trumpet, Cuban music mix',
    additionalDetails: 'Havana love songs, cafe cubano, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Cuban Music Mix',
  },
  {
    title: 'Cuban Music Mix | Male Voice & Bongos | Havana Love Songs',
    specificDescription: 'Male voice with bongos and Cuban music, Cuban music mix',
    additionalDetails: 'Havana love songs, cafe cubano, peaceful, meditative, background sounds, intense connection, soulful',
    instrumental: false,
    model: 'V5',
    theme: 'Cuban Music Mix',
  },
  {
    title: 'Cuban Music Mix | Female Voice & Piano | Havana Love Songs',
    specificDescription: 'Female voice with piano and Cuban music, Cuban music mix',
    additionalDetails: 'Havana love songs, cafe cubano, peaceful, meditative, background sounds, intense connection, healing',
    instrumental: false,
    model: 'V5',
    theme: 'Cuban Music Mix',
  },
  {
    title: 'Cuban Music Mix | Havana Street Sounds | Havana Love Songs',
    specificDescription: 'Cuban music with background Havana street sounds',
    additionalDetails: 'Havana love songs, cafe cubano, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Cuban Music Mix',
  },
  {
    title: 'Cuban Music Mix | Deep Instrumental Fusion | Havana Love Songs',
    specificDescription: 'Cuban music, deep instrumental fusion, Cuban music mix',
    additionalDetails: 'Havana love songs, cafe cubano, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Cuban Music Mix',
  },

  // ============================================
  // THEME 7: Spanish Guitar & Arabic Oud - Flamenco Fusion (10 batches)
  // ============================================
  {
    title: 'Flamenco Fusion | Spanish Guitar | Relaxation & Meditation',
    specificDescription: 'Pure instrumental Spanish guitar, flamenco fusion',
    additionalDetails: 'Arabic oud, relaxation, meditation, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Spanish Guitar & Arabic Oud',
  },
  {
    title: 'Flamenco Fusion | Arabic Oud | Relaxation & Meditation',
    specificDescription: 'Pure instrumental Arabic oud, flamenco fusion',
    additionalDetails: 'Spanish guitar, relaxation, meditation, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Spanish Guitar & Arabic Oud',
  },
  {
    title: 'Flamenco Fusion | Spanish Guitar & Arabic Oud | Fusion',
    specificDescription: 'Spanish guitar and Arabic oud fusion, flamenco fusion',
    additionalDetails: 'relaxation, meditation, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Spanish Guitar & Arabic Oud',
  },
  {
    title: 'Flamenco Fusion | Flamenco & Male Voice | Relaxation & Meditation',
    specificDescription: 'Flamenco with male voice, flamenco fusion',
    additionalDetails: 'Spanish guitar, Arabic oud, relaxation, meditation, peaceful, meditative, background sounds, intense connection, soulful',
    instrumental: false,
    model: 'V5',
    theme: 'Spanish Guitar & Arabic Oud',
  },
  {
    title: 'Flamenco Fusion | Arabic & Female Voice | Relaxation & Meditation',
    specificDescription: 'Arabic music with female voice, flamenco fusion',
    additionalDetails: 'Spanish guitar, Arabic oud, relaxation, meditation, peaceful, meditative, background sounds, intense connection, healing',
    instrumental: false,
    model: 'V5',
    theme: 'Spanish Guitar & Arabic Oud',
  },
  {
    title: 'Flamenco Fusion | Spanish Guitar & Castanets | Relaxation',
    specificDescription: 'Spanish guitar with castanets, flamenco fusion',
    additionalDetails: 'Arabic oud, relaxation, meditation, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Spanish Guitar & Arabic Oud',
  },
  {
    title: 'Flamenco Fusion | Arabic Oud & Darbuka | Relaxation',
    specificDescription: 'Arabic oud with darbuka, flamenco fusion',
    additionalDetails: 'Spanish guitar, relaxation, meditation, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Spanish Guitar & Arabic Oud',
  },
  {
    title: 'Flamenco Fusion | Male Voice & Spanish Guitar | Relaxation',
    specificDescription: 'Male voice with Spanish guitar, flamenco fusion',
    additionalDetails: 'Arabic oud, relaxation, meditation, peaceful, meditative, background sounds, intense connection, soulful',
    instrumental: false,
    model: 'V5',
    theme: 'Spanish Guitar & Arabic Oud',
  },
  {
    title: 'Flamenco Fusion | Female Voice & Arabic Oud | Relaxation',
    specificDescription: 'Female voice with Arabic oud, flamenco fusion',
    additionalDetails: 'Spanish guitar, relaxation, meditation, peaceful, meditative, background sounds, intense connection, healing',
    instrumental: false,
    model: 'V5',
    theme: 'Spanish Guitar & Arabic Oud',
  },
  {
    title: 'Flamenco Fusion | Mediterranean Middle Eastern Sounds | Relaxation',
    specificDescription: 'Spanish guitar and Arabic oud with background Mediterranean and Middle Eastern sounds',
    additionalDetails: 'flamenco fusion, relaxation, meditation, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Spanish Guitar & Arabic Oud',
  },

  // ============================================
  // THEME 8: Rich Vibes Music to Attract Money & Positive Energy (10 batches)
  // ============================================
  {
    title: 'Rich Vibes | Pure Instrumental | Money & Positive Energy',
    specificDescription: 'Pure instrumental prosperity music, rich vibes',
    additionalDetails: 'attract money, positive energy, instantly, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Rich Vibes Money & Positive Energy',
  },
  {
    title: 'Rich Vibes | Male Voice | Money & Positive Energy',
    specificDescription: 'Prosperity music with male voice, rich vibes',
    additionalDetails: 'attract money, positive energy, instantly, peaceful, meditative, background sounds, intense connection, soulful',
    instrumental: false,
    model: 'V5',
    theme: 'Rich Vibes Money & Positive Energy',
  },
  {
    title: 'Rich Vibes | Female Voice | Money & Positive Energy',
    specificDescription: 'Prosperity music with female voice, rich vibes',
    additionalDetails: 'attract money, positive energy, instantly, peaceful, meditative, background sounds, intense connection, healing',
    instrumental: false,
    model: 'V5',
    theme: 'Rich Vibes Money & Positive Energy',
  },
  {
    title: 'Rich Vibes | Piano | Money & Positive Energy',
    specificDescription: 'Prosperity music with piano, rich vibes',
    additionalDetails: 'attract money, positive energy, instantly, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Rich Vibes Money & Positive Energy',
  },
  {
    title: 'Rich Vibes | Strings | Money & Positive Energy',
    specificDescription: 'Prosperity music with strings, rich vibes',
    additionalDetails: 'attract money, positive energy, instantly, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Rich Vibes Money & Positive Energy',
  },
  {
    title: 'Rich Vibes | Chimes | Money & Positive Energy',
    specificDescription: 'Prosperity music with chimes, rich vibes',
    additionalDetails: 'attract money, positive energy, instantly, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Rich Vibes Money & Positive Energy',
  },
  {
    title: 'Rich Vibes | Male Voice & Piano | Money & Positive Energy',
    specificDescription: 'Male voice with piano and prosperity music, rich vibes',
    additionalDetails: 'attract money, positive energy, instantly, peaceful, meditative, background sounds, intense connection, soulful',
    instrumental: false,
    model: 'V5',
    theme: 'Rich Vibes Money & Positive Energy',
  },
  {
    title: 'Rich Vibes | Female Voice & Strings | Money & Positive Energy',
    specificDescription: 'Female voice with strings and prosperity music, rich vibes',
    additionalDetails: 'attract money, positive energy, instantly, peaceful, meditative, background sounds, intense connection, healing',
    instrumental: false,
    model: 'V5',
    theme: 'Rich Vibes Money & Positive Energy',
  },
  {
    title: 'Rich Vibes | Positive Energy Sounds | Money & Positive Energy',
    specificDescription: 'Prosperity music with background positive energy sounds, rich vibes',
    additionalDetails: 'attract money, positive energy, instantly, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Rich Vibes Money & Positive Energy',
  },
  {
    title: 'Rich Vibes | Deep Instrumental Abundance | Money & Positive Energy',
    specificDescription: 'Prosperity music, deep instrumental abundance music, rich vibes',
    additionalDetails: 'attract money, positive energy, instantly, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Rich Vibes Money & Positive Energy',
  },

  // ============================================
  // THEME 9: Café Ritmo Cubano - Vintage Son & Timba (10 batches)
  // ============================================
  {
    title: 'Café Ritmo Cubano | Vintage Son | Buena Vista Classic Rhythms',
    specificDescription: 'Pure instrumental vintage son, cafe ritmo cubano',
    additionalDetails: 'timba, buena vista classic rhythms, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Café Ritmo Cubano',
  },
  {
    title: 'Café Ritmo Cubano | Timba | Buena Vista Classic Rhythms',
    specificDescription: 'Pure instrumental timba, cafe ritmo cubano',
    additionalDetails: 'vintage son, buena vista classic rhythms, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Café Ritmo Cubano',
  },
  {
    title: 'Café Ritmo Cubano | Vintage Son & Male Voice | Classic Rhythms',
    specificDescription: 'Vintage son with male voice, cafe ritmo cubano',
    additionalDetails: 'timba, buena vista classic rhythms, peaceful, meditative, background sounds, intense connection, soulful',
    instrumental: false,
    model: 'V5',
    theme: 'Café Ritmo Cubano',
  },
  {
    title: 'Café Ritmo Cubano | Timba & Female Voice | Classic Rhythms',
    specificDescription: 'Timba with female voice, cafe ritmo cubano',
    additionalDetails: 'vintage son, buena vista classic rhythms, peaceful, meditative, background sounds, intense connection, healing',
    instrumental: false,
    model: 'V5',
    theme: 'Café Ritmo Cubano',
  },
  {
    title: 'Café Ritmo Cubano | Vintage Son & Tres Guitar | Classic Rhythms',
    specificDescription: 'Vintage son with tres guitar, cafe ritmo cubano',
    additionalDetails: 'timba, buena vista classic rhythms, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Café Ritmo Cubano',
  },
  {
    title: 'Café Ritmo Cubano | Timba & Congas | Classic Rhythms',
    specificDescription: 'Timba with congas, cafe ritmo cubano',
    additionalDetails: 'vintage son, buena vista classic rhythms, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Café Ritmo Cubano',
  },
  {
    title: 'Café Ritmo Cubano | Male Voice & Tres Guitar | Classic Rhythms',
    specificDescription: 'Male voice with tres guitar and Cuban music, cafe ritmo cubano',
    additionalDetails: 'vintage son, timba, buena vista classic rhythms, peaceful, meditative, background sounds, intense connection, soulful',
    instrumental: false,
    model: 'V5',
    theme: 'Café Ritmo Cubano',
  },
  {
    title: 'Café Ritmo Cubano | Female Voice & Congas | Classic Rhythms',
    specificDescription: 'Female voice with congas and Cuban music, cafe ritmo cubano',
    additionalDetails: 'vintage son, timba, buena vista classic rhythms, peaceful, meditative, background sounds, intense connection, healing',
    instrumental: false,
    model: 'V5',
    theme: 'Café Ritmo Cubano',
  },
  {
    title: 'Café Ritmo Cubano | Cuban Cafe Sounds | Classic Rhythms',
    specificDescription: 'Cuban music with background Cuban cafe sounds, cafe ritmo cubano',
    additionalDetails: 'vintage son, timba, buena vista classic rhythms, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Café Ritmo Cubano',
  },
  {
    title: 'Café Ritmo Cubano | Deep Instrumental Cuban Rhythms | Classic',
    specificDescription: 'Cuban music, deep instrumental Cuban rhythms, cafe ritmo cubano',
    additionalDetails: 'vintage son, timba, buena vista classic rhythms, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'Café Ritmo Cubano',
  },

  // ============================================
  // THEME 10: NOIRÉ - Havana Night Seduction | Cubano Deep House (10 batches)
  // ============================================
  {
    title: 'NOIRÉ | Pure Deep House | Havana Night Seduction',
    specificDescription: 'Pure instrumental deep house, NOIRÉ Havana night seduction',
    additionalDetails: 'cubano deep house duet, dark Latin groove, elegant tropical jazz, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'NOIRÉ Havana Night',
  },
  {
    title: 'NOIRÉ | Deep House & Male Voice | Havana Night Seduction',
    specificDescription: 'Deep house with male voice, NOIRÉ Havana night seduction',
    additionalDetails: 'cubano deep house duet, dark Latin groove, elegant tropical jazz, peaceful, meditative, background sounds, intense connection, soulful',
    instrumental: false,
    model: 'V5',
    theme: 'NOIRÉ Havana Night',
  },
  {
    title: 'NOIRÉ | Deep House & Female Voice | Havana Night Seduction',
    specificDescription: 'Deep house with female voice, NOIRÉ Havana night seduction',
    additionalDetails: 'cubano deep house duet, dark Latin groove, elegant tropical jazz, peaceful, meditative, background sounds, intense connection, healing',
    instrumental: false,
    model: 'V5',
    theme: 'NOIRÉ Havana Night',
  },
  {
    title: 'NOIRÉ | Deep House & Saxophone | Havana Night Seduction',
    specificDescription: 'Deep house with saxophone, NOIRÉ Havana night seduction',
    additionalDetails: 'cubano deep house duet, dark Latin groove, elegant tropical jazz, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'NOIRÉ Havana Night',
  },
  {
    title: 'NOIRÉ | Deep House & Piano | Havana Night Seduction',
    specificDescription: 'Deep house with piano, NOIRÉ Havana night seduction',
    additionalDetails: 'cubano deep house duet, dark Latin groove, elegant tropical jazz, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'NOIRÉ Havana Night',
  },
  {
    title: 'NOIRÉ | Deep House & Latin Percussion | Havana Night',
    specificDescription: 'Deep house with Latin percussion, NOIRÉ Havana night seduction',
    additionalDetails: 'cubano deep house duet, dark Latin groove, elegant tropical jazz, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'NOIRÉ Havana Night',
  },
  {
    title: 'NOIRÉ | Male Voice & Saxophone | Havana Night Seduction',
    specificDescription: 'Male voice with saxophone and deep house, NOIRÉ Havana night seduction',
    additionalDetails: 'cubano deep house duet, dark Latin groove, elegant tropical jazz, peaceful, meditative, background sounds, intense connection, soulful',
    instrumental: false,
    model: 'V5',
    theme: 'NOIRÉ Havana Night',
  },
  {
    title: 'NOIRÉ | Female Voice & Piano | Havana Night Seduction',
    specificDescription: 'Female voice with piano and deep house, NOIRÉ Havana night seduction',
    additionalDetails: 'cubano deep house duet, dark Latin groove, elegant tropical jazz, peaceful, meditative, background sounds, intense connection, healing',
    instrumental: false,
    model: 'V5',
    theme: 'NOIRÉ Havana Night',
  },
  {
    title: 'NOIRÉ | Havana Nightclub Sounds | Havana Night Seduction',
    specificDescription: 'Deep house with background Havana nightclub sounds, NOIRÉ Havana night seduction',
    additionalDetails: 'cubano deep house duet, dark Latin groove, elegant tropical jazz, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'NOIRÉ Havana Night',
  },
  {
    title: 'NOIRÉ | Deep Instrumental Dark Groove | Havana Night',
    specificDescription: 'Deep house, deep instrumental dark groove, NOIRÉ Havana night seduction',
    additionalDetails: 'cubano deep house duet, dark Latin groove, elegant tropical jazz, peaceful, meditative, deep instrumental, background sounds, intense connection',
    instrumental: true,
    model: 'V5',
    theme: 'NOIRÉ Havana Night',
  },
];

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate all batches with smart rate limiting
 */
async function generateAllBatches() {
  console.log('🎵 Starting batch generation for 100 batches across 10 themes\n');
  console.log(`📊 Total batches: ${BATCHES.length} (${BATCHES.length * 2} songs)\n`);
  console.log(`📋 Themes: 10 themes × 10 batches each\n`);

  const results: Array<{
    batchNumber: number;
    title: string;
    theme: string;
    taskId: string | null;
    success: boolean;
    error?: string;
  }> = [];

  const RATE_LIMIT_GROUP_SIZE = 20;
  const DELAY_BETWEEN_REQUESTS = 500; // 500ms
  const DELAY_BETWEEN_GROUPS = 1000; // 1 second

  for (let i = 0; i < BATCHES.length; i++) {
    const batch = BATCHES[i];
    const batchNumber = i + 1;
    const groupNumber = Math.floor((i) / RATE_LIMIT_GROUP_SIZE) + 1;
    const isGroupStart = (i % RATE_LIMIT_GROUP_SIZE) === 0;

    // Add pause between groups (except for first group)
    if (isGroupStart && i > 0) {
      console.log(`\n⏸️  Rate limit pause: Waiting ${DELAY_BETWEEN_GROUPS}ms before group ${groupNumber}...\n`);
      await delay(DELAY_BETWEEN_GROUPS);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎵 Batch ${batchNumber}/${BATCHES.length} (Group ${groupNumber}): ${batch.title}`);
    console.log(`   Theme: ${batch.theme}`);
    console.log(`   Type: ${batch.instrumental ? 'Instrumental' : 'Vocal'}`);
    console.log(`   Model: ${batch.model}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      const result = await generateHealingMusic({
        title: batch.title,
        specificDescription: batch.specificDescription,
        additionalDetails: batch.additionalDetails,
        instrumental: batch.instrumental,
        model: batch.model,
        category: 'music',
        waitForCompletion: false, // Use callbacks for automatic storage
      });

      console.log(`✅ Batch ${batchNumber} started successfully`);
      console.log(`   Task ID: ${result.taskId}`);
      console.log(`   Status: Generation in progress (will be stored via callback)`);

      results.push({
        batchNumber,
        title: batch.title,
        theme: batch.theme,
        taskId: result.taskId,
        success: true,
      });

      // Rate limiting: wait 500ms between requests (except for last batch)
      if (i < BATCHES.length - 1) {
        await delay(DELAY_BETWEEN_REQUESTS);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Batch ${batchNumber} failed: ${errorMessage}\n`);

      results.push({
        batchNumber,
        title: batch.title,
        theme: batch.theme,
        taskId: null,
        success: false,
        error: errorMessage,
      });

      // Continue with next batch even if this one failed
      if (i < BATCHES.length - 1) {
        await delay(DELAY_BETWEEN_REQUESTS);
      }
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 GENERATION SUMMARY');
  console.log(`${'='.repeat(60)}\n`);

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Successful: ${successful}/${BATCHES.length} batches`);
  console.log(`❌ Failed: ${failed}/${BATCHES.length} batches`);
  console.log(`🎵 Total songs to be generated: ${successful * 2} songs\n`);

  // Summary by theme
  const themeSummary = new Map<string, { total: number; successful: number; failed: number }>();
  results.forEach(r => {
    const theme = r.theme;
    if (!themeSummary.has(theme)) {
      themeSummary.set(theme, { total: 0, successful: 0, failed: 0 });
    }
    const summary = themeSummary.get(theme)!;
    summary.total++;
    if (r.success) summary.successful++;
    else summary.failed++;
  });

  console.log('📋 Summary by Theme:');
  themeSummary.forEach((summary, theme) => {
    console.log(`   ${theme}: ${summary.successful}/${summary.total} successful`);
  });
  console.log('');

  if (successful > 0) {
    console.log('📋 Successful batches (first 20):');
    results
      .filter(r => r.success)
      .slice(0, 20)
      .forEach(r => {
        console.log(`   ${r.batchNumber}. [${r.theme}] ${r.title}`);
        console.log(`      Task ID: ${r.taskId}`);
      });
    if (successful > 20) {
      console.log(`   ... and ${successful - 20} more successful batches`);
    }
    console.log('');
  }

  if (failed > 0) {
    console.log('❌ Failed batches:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`   ${r.batchNumber}. [${r.theme}] ${r.title}`);
        console.log(`      Error: ${r.error}`);
      });
    console.log('');
  }

  console.log('💡 Note: Songs will be automatically stored in Supabase via callbacks');
  console.log('   when generation completes (typically 2-3 minutes per batch).\n');
  console.log('💡 To sync manually later, use: npx tsx scripts/sync-100-batches-multi-theme.ts\n');
}

// Run the generation
generateAllBatches()
  .then(() => {
    console.log('✨ Batch generation process completed!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

