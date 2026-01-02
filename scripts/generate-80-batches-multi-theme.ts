/**
 * Batch Generation Script for 80 Batches Across 8 Music Themes
 * 
 * Generates 80 batches (160 songs total) with 10 batches per theme
 * across 8 different music themes with creative variations
 * emphasizing deep background sounds and natural sounds
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
  // THEME 1: WILD Habibi Arabic Afro House × Reggaeton (10 batches)
  // ============================================
  {
    title: 'WILD Habibi | Arabic Afro House | Arabic Afro Reggaeton Mix',
    specificDescription: 'Pure instrumental Arabic Afro House, WILD Habibi style',
    additionalDetails: 'reggaeton mix, deep background sounds, Arabic Middle Eastern atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'WILD Habibi Arabic Afro House × Reggaeton',
  },
  {
    title: 'WILD Habibi | Pure Reggaeton | Arabic Afro Reggaeton Mix',
    specificDescription: 'Pure instrumental reggaeton, WILD Habibi style',
    additionalDetails: 'Arabic Afro House mix, deep background sounds, Latin atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'WILD Habibi Arabic Afro House × Reggaeton',
  },
  {
    title: 'WILD Habibi | Arabic Afro House & Male Voice | Reggaeton Mix',
    specificDescription: 'Arabic Afro House with male voice, WILD Habibi style',
    additionalDetails: 'reggaeton mix, deep background sounds, Arabic Middle Eastern atmosphere, intense connection, soulful, transformative',
    instrumental: false,
    model: 'V5',
    theme: 'WILD Habibi Arabic Afro House × Reggaeton',
  },
  {
    title: 'WILD Habibi | Reggaeton & Female Voice | Arabic Afro Mix',
    specificDescription: 'Reggaeton with female voice, WILD Habibi style',
    additionalDetails: 'Arabic Afro House mix, deep background sounds, Latin atmosphere, intense connection, healing, peaceful',
    instrumental: false,
    model: 'V5',
    theme: 'WILD Habibi Arabic Afro House × Reggaeton',
  },
  {
    title: 'WILD Habibi | Arabic Afro House × Reggaeton Fusion | Mix',
    specificDescription: 'Arabic Afro House and reggaeton fusion, WILD Habibi style',
    additionalDetails: 'deep background sounds, Arabic Middle Eastern and Latin atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'WILD Habibi Arabic Afro House × Reggaeton',
  },
  {
    title: 'WILD Habibi | Male Voice & Arabic Instruments | Reggaeton',
    specificDescription: 'Male voice with Arabic instruments and reggaeton, WILD Habibi style',
    additionalDetails: 'Arabic Afro House, deep background sounds, Arabic Middle Eastern atmosphere, intense connection, soulful',
    instrumental: false,
    model: 'V5',
    theme: 'WILD Habibi Arabic Afro House × Reggaeton',
  },
  {
    title: 'WILD Habibi | Female Voice & Latin Percussion | Arabic Afro',
    specificDescription: 'Female voice with Latin percussion and Arabic Afro House, WILD Habibi style',
    additionalDetails: 'reggaeton mix, deep background sounds, Latin atmosphere, intense connection, healing',
    instrumental: false,
    model: 'V5',
    theme: 'WILD Habibi Arabic Afro House × Reggaeton',
  },
  {
    title: 'WILD Habibi | Deep Background Sounds | Arabic Afro Reggaeton',
    specificDescription: 'Arabic Afro House and reggaeton with deep background sounds, WILD Habibi style',
    additionalDetails: 'Arabic Middle Eastern and Latin atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'WILD Habibi Arabic Afro House × Reggaeton',
  },
  {
    title: 'WILD Habibi | Layered Rhythms | Arabic Afro Reggaeton',
    specificDescription: 'Arabic Afro House and reggaeton, deep instrumental with layered rhythms, WILD Habibi style',
    additionalDetails: 'deep background sounds, Arabic Middle Eastern and Latin atmosphere, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'WILD Habibi Arabic Afro House × Reggaeton',
  },
  {
    title: 'WILD Habibi | Male & Female Voices | Arabic Afro Reggaeton',
    specificDescription: 'Combined male and female voices with Arabic Afro House and reggaeton, WILD Habibi style',
    additionalDetails: 'deep background sounds, Arabic Middle Eastern and Latin atmosphere, intense connection, soulful, healing',
    instrumental: false,
    model: 'V5',
    theme: 'WILD Habibi Arabic Afro House × Reggaeton',
  },

  // ============================================
  // THEME 2: Hip-Hop × Violin (10 batches)
  // ============================================
  {
    title: 'Hip-Hop × Violin | Pure Instrumental | Violin Meets Hip-Hop',
    specificDescription: 'Pure instrumental hip-hop with violin, violin meets the pulse of hip-hop',
    additionalDetails: 'deep background sounds, urban atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Hip-Hop × Violin',
  },
  {
    title: 'Hip-Hop × Violin | Male Voice | Violin Meets Hip-Hop',
    specificDescription: 'Hip-hop with violin and male voice, violin meets the pulse of hip-hop',
    additionalDetails: 'deep background sounds, urban atmosphere, intense connection, soulful, transformative',
    instrumental: false,
    model: 'V5',
    theme: 'Hip-Hop × Violin',
  },
  {
    title: 'Hip-Hop × Violin | Female Voice | Violin Meets Hip-Hop',
    specificDescription: 'Hip-hop with violin and female voice, violin meets the pulse of hip-hop',
    additionalDetails: 'deep background sounds, urban atmosphere, intense connection, healing, peaceful',
    instrumental: false,
    model: 'V5',
    theme: 'Hip-Hop × Violin',
  },
  {
    title: 'Hip-Hop × Violin | Violin Solo | Violin Meets Hip-Hop',
    specificDescription: 'Violin solo over hip-hop beats, violin meets the pulse of hip-hop',
    additionalDetails: 'deep background sounds, urban atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Hip-Hop × Violin',
  },
  {
    title: 'Hip-Hop × Violin | Violin & Piano | Violin Meets Hip-Hop',
    specificDescription: 'Hip-hop with violin and piano, violin meets the pulse of hip-hop',
    additionalDetails: 'deep background sounds, urban atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Hip-Hop × Violin',
  },
  {
    title: 'Hip-Hop × Violin | Male Voice & Violin | Violin Meets Hip-Hop',
    specificDescription: 'Male voice with violin and hip-hop, violin meets the pulse of hip-hop',
    additionalDetails: 'deep background sounds, urban atmosphere, intense connection, soulful',
    instrumental: false,
    model: 'V5',
    theme: 'Hip-Hop × Violin',
  },
  {
    title: 'Hip-Hop × Violin | Female Voice & Violin | Violin Meets Hip-Hop',
    specificDescription: 'Female voice with violin and hip-hop, violin meets the pulse of hip-hop',
    additionalDetails: 'deep background sounds, urban atmosphere, intense connection, healing',
    instrumental: false,
    model: 'V5',
    theme: 'Hip-Hop × Violin',
  },
  {
    title: 'Hip-Hop × Violin | Deep Urban Sounds | Violin Meets Hip-Hop',
    specificDescription: 'Hip-hop with violin and deep background urban sounds, violin meets the pulse of hip-hop',
    additionalDetails: 'urban atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Hip-Hop × Violin',
  },
  {
    title: 'Hip-Hop × Violin | Deep Instrumental Violin | Violin Meets Hip-Hop',
    specificDescription: 'Hip-hop with violin, deep instrumental violin focus, violin meets the pulse of hip-hop',
    additionalDetails: 'deep background sounds, urban atmosphere, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Hip-Hop × Violin',
  },
  {
    title: 'Hip-Hop × Violin | Layered Violin Arrangements | Violin Meets Hip-Hop',
    specificDescription: 'Hip-hop with layered violin arrangements, violin meets the pulse of hip-hop',
    additionalDetails: 'deep background sounds, urban atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Hip-Hop × Violin',
  },

  // ============================================
  // THEME 3: No Mercy 90s Boom Bap (10 batches)
  // ============================================
  {
    title: 'No Mercy 90s Boom Bap | Pure Instrumental | Old School Hip-Hop',
    specificDescription: 'Pure instrumental 90s boom bap, no mercy old school hip-hop',
    additionalDetails: 'freestyle beat, deep background sounds, 90s atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'No Mercy 90s Boom Bap',
  },
  {
    title: 'No Mercy 90s Boom Bap | Male Freestyle Voice | Old School Hip-Hop',
    specificDescription: '90s boom bap with male freestyle voice, no mercy old school hip-hop',
    additionalDetails: 'freestyle beat, deep background sounds, 90s atmosphere, intense connection, soulful, transformative',
    instrumental: false,
    model: 'V5',
    theme: 'No Mercy 90s Boom Bap',
  },
  {
    title: 'No Mercy 90s Boom Bap | Female Freestyle Voice | Old School Hip-Hop',
    specificDescription: '90s boom bap with female freestyle voice, no mercy old school hip-hop',
    additionalDetails: 'freestyle beat, deep background sounds, 90s atmosphere, intense connection, healing, peaceful',
    instrumental: false,
    model: 'V5',
    theme: 'No Mercy 90s Boom Bap',
  },
  {
    title: 'No Mercy 90s Boom Bap | Scratches | Old School Hip-Hop',
    specificDescription: '90s boom bap with scratches, no mercy old school hip-hop',
    additionalDetails: 'freestyle beat, deep background sounds, 90s atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'No Mercy 90s Boom Bap',
  },
  {
    title: 'No Mercy 90s Boom Bap | Samples | Old School Hip-Hop',
    specificDescription: '90s boom bap with samples, no mercy old school hip-hop',
    additionalDetails: 'freestyle beat, deep background sounds, 90s atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'No Mercy 90s Boom Bap',
  },
  {
    title: 'No Mercy 90s Boom Bap | Male Voice & Scratches | Old School Hip-Hop',
    specificDescription: 'Male freestyle voice with scratches and 90s boom bap, no mercy old school hip-hop',
    additionalDetails: 'freestyle beat, deep background sounds, 90s atmosphere, intense connection, soulful',
    instrumental: false,
    model: 'V5',
    theme: 'No Mercy 90s Boom Bap',
  },
  {
    title: 'No Mercy 90s Boom Bap | Female Voice & Samples | Old School Hip-Hop',
    specificDescription: 'Female freestyle voice with samples and 90s boom bap, no mercy old school hip-hop',
    additionalDetails: 'freestyle beat, deep background sounds, 90s atmosphere, intense connection, healing',
    instrumental: false,
    model: 'V5',
    theme: 'No Mercy 90s Boom Bap',
  },
  {
    title: 'No Mercy 90s Boom Bap | Deep 90s Atmosphere | Old School Hip-Hop',
    specificDescription: '90s boom bap with deep background 90s atmosphere, no mercy old school hip-hop',
    additionalDetails: 'freestyle beat, deep background sounds, 90s atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'No Mercy 90s Boom Bap',
  },
  {
    title: 'No Mercy 90s Boom Bap | Deep Instrumental Old School | Hip-Hop',
    specificDescription: '90s boom bap, deep instrumental old school, no mercy old school hip-hop',
    additionalDetails: 'freestyle beat, deep background sounds, 90s atmosphere, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'No Mercy 90s Boom Bap',
  },
  {
    title: 'No Mercy 90s Boom Bap | Layered Boom Bap Beats | Old School Hip-Hop',
    specificDescription: '90s boom bap with layered boom bap beats, no mercy old school hip-hop',
    additionalDetails: 'freestyle beat, deep background sounds, 90s atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'No Mercy 90s Boom Bap',
  },

  // ============================================
  // THEME 4: Relaxing Piano and Soft Rain (10 batches)
  // ============================================
  {
    title: 'Piano & Soft Rain | Pure Instrumental | Healing Sleep Music',
    specificDescription: 'Relaxing piano with soft rain, pure instrumental, healing sleep music',
    additionalDetails: 'insomnia relief, deep rest, stress relief, deep background rain, water sounds, nature sounds, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Relaxing Piano and Soft Rain',
  },
  {
    title: 'Piano & Deep Rain Thunder | Pure Instrumental | Healing Sleep Music',
    specificDescription: 'Relaxing piano with deep rain and thunder, healing sleep music',
    additionalDetails: 'insomnia relief, deep rest, stress relief, deep background rain, thunder, water sounds, nature sounds, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Relaxing Piano and Soft Rain',
  },
  {
    title: 'Piano & Water Sounds Rain | Pure Instrumental | Healing Sleep Music',
    specificDescription: 'Relaxing piano with water sounds and rain, healing sleep music',
    additionalDetails: 'insomnia relief, deep rest, stress relief, deep background rain, water sounds, nature sounds, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Relaxing Piano and Soft Rain',
  },
  {
    title: 'Piano & Rain Male Sleep Voice | Healing Sleep Music',
    specificDescription: 'Relaxing piano with soft rain and male sleep voice, healing sleep music',
    additionalDetails: 'insomnia relief, deep rest, stress relief, deep background rain, water sounds, nature sounds, intense connection, peaceful, transformative',
    instrumental: false,
    model: 'V5',
    theme: 'Relaxing Piano and Soft Rain',
  },
  {
    title: 'Piano & Rain Female Sleep Voice | Healing Sleep Music',
    specificDescription: 'Relaxing piano with soft rain and female sleep voice, healing sleep music',
    additionalDetails: 'insomnia relief, deep rest, stress relief, deep background rain, water sounds, nature sounds, intense connection, peaceful, healing',
    instrumental: false,
    model: 'V5',
    theme: 'Relaxing Piano and Soft Rain',
  },
  {
    title: 'Piano & Rain Nature Sounds | Healing Sleep Music',
    specificDescription: 'Relaxing piano with soft rain and nature sounds, healing sleep music',
    additionalDetails: 'insomnia relief, deep rest, stress relief, deep background rain, water sounds, birds, wind, nature sounds, thunder, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Relaxing Piano and Soft Rain',
  },
  {
    title: 'Piano & Deep Background Rain Thunder | Healing Sleep Music',
    specificDescription: 'Relaxing piano with deep background rain and thunder, healing sleep music',
    additionalDetails: 'insomnia relief, deep rest, stress relief, deep background rain, thunder, water sounds, nature sounds, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Relaxing Piano and Soft Rain',
  },
  {
    title: 'Piano & Deep Rain Male Voice | Healing Sleep Music',
    specificDescription: 'Male sleep voice with piano and deep rain, healing sleep music',
    additionalDetails: 'insomnia relief, deep rest, stress relief, deep background rain, thunder, water sounds, nature sounds, intense connection, peaceful, transformative',
    instrumental: false,
    model: 'V5',
    theme: 'Relaxing Piano and Soft Rain',
  },
  {
    title: 'Piano & Water Sounds Female Voice | Healing Sleep Music',
    specificDescription: 'Female sleep voice with piano and water sounds, healing sleep music',
    additionalDetails: 'insomnia relief, deep rest, stress relief, deep background rain, water sounds, nature sounds, thunder, intense connection, peaceful, healing',
    instrumental: false,
    model: 'V5',
    theme: 'Relaxing Piano and Soft Rain',
  },
  {
    title: 'Piano & Layered Rain Thunder Water Nature | Healing Sleep Music',
    specificDescription: 'Relaxing piano, deep instrumental with layered rain, thunder, water, and nature sounds, healing sleep music',
    additionalDetails: 'insomnia relief, deep rest, stress relief, deep background rain, thunder, water sounds, birds, wind, nature sounds, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Relaxing Piano and Soft Rain',
  },

  // ============================================
  // THEME 5: BUDŌ Japanese Zen Music (10 batches)
  // ============================================
  {
    title: 'BUDŌ | Pure Instrumental | Japanese Zen Music',
    specificDescription: 'Pure instrumental Japanese zen music, BUDŌ discipline meditation inner strength',
    additionalDetails: '武道, deep background sounds, Japanese temple atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'BUDŌ Japanese Zen Music',
  },
  {
    title: 'BUDŌ | Male Meditation Voice | Japanese Zen Music',
    specificDescription: 'Japanese zen music with male meditation voice, BUDŌ discipline meditation inner strength',
    additionalDetails: '武道, deep background sounds, Japanese temple atmosphere, intense connection, soulful, transformative',
    instrumental: false,
    model: 'V5',
    theme: 'BUDŌ Japanese Zen Music',
  },
  {
    title: 'BUDŌ | Female Meditation Voice | Japanese Zen Music',
    specificDescription: 'Japanese zen music with female meditation voice, BUDŌ discipline meditation inner strength',
    additionalDetails: '武道, deep background sounds, Japanese temple atmosphere, intense connection, healing, peaceful',
    instrumental: false,
    model: 'V5',
    theme: 'BUDŌ Japanese Zen Music',
  },
  {
    title: 'BUDŌ | Shakuhachi Flute | Japanese Zen Music',
    specificDescription: 'Japanese zen music with shakuhachi flute, BUDŌ discipline meditation inner strength',
    additionalDetails: '武道, deep background sounds, Japanese temple atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'BUDŌ Japanese Zen Music',
  },
  {
    title: 'BUDŌ | Koto | Japanese Zen Music',
    specificDescription: 'Japanese zen music with koto, BUDŌ discipline meditation inner strength',
    additionalDetails: '武道, deep background sounds, Japanese temple atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'BUDŌ Japanese Zen Music',
  },
  {
    title: 'BUDŌ | Taiko Drums | Japanese Zen Music',
    specificDescription: 'Japanese zen music with taiko drums, BUDŌ discipline meditation inner strength',
    additionalDetails: '武道, deep background sounds, Japanese temple atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'BUDŌ Japanese Zen Music',
  },
  {
    title: 'BUDŌ | Male Voice & Shakuhachi | Japanese Zen Music',
    specificDescription: 'Male meditation voice with shakuhachi flute and Japanese zen music, BUDŌ discipline meditation inner strength',
    additionalDetails: '武道, deep background sounds, Japanese temple atmosphere, intense connection, soulful',
    instrumental: false,
    model: 'V5',
    theme: 'BUDŌ Japanese Zen Music',
  },
  {
    title: 'BUDŌ | Female Voice & Koto | Japanese Zen Music',
    specificDescription: 'Female meditation voice with koto and Japanese zen music, BUDŌ discipline meditation inner strength',
    additionalDetails: '武道, deep background sounds, Japanese temple atmosphere, intense connection, healing',
    instrumental: false,
    model: 'V5',
    theme: 'BUDŌ Japanese Zen Music',
  },
  {
    title: 'BUDŌ | Deep Japanese Temple Sounds | Japanese Zen Music',
    specificDescription: 'Japanese zen music with deep background Japanese temple sounds, BUDŌ discipline meditation inner strength',
    additionalDetails: '武道, deep background sounds, Japanese temple atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'BUDŌ Japanese Zen Music',
  },
  {
    title: 'BUDŌ | Deep Instrumental Zen Meditation | Japanese Zen Music',
    specificDescription: 'Japanese zen music, deep instrumental zen meditation, BUDŌ discipline meditation inner strength',
    additionalDetails: '武道, deep background sounds, Japanese temple atmosphere, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'BUDŌ Japanese Zen Music',
  },

  // ============================================
  // THEME 6: Fantasy Pharaonic Vibes - Deep House Arabic Violin (10 batches)
  // ============================================
  {
    title: 'Fantasy Pharaonic Vibes | Deep House Arabic Violin | Pure Instrumental',
    specificDescription: 'Pure instrumental deep house with Arabic violin, fantasy Pharaonic vibes',
    additionalDetails: 'deep background sounds, Pharaonic Egyptian atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Fantasy Pharaonic Vibes',
  },
  {
    title: 'Fantasy Pharaonic Vibes | Deep House Arabic Violin & Male Voice',
    specificDescription: 'Deep house with Arabic violin and male voice, fantasy Pharaonic vibes',
    additionalDetails: 'deep background sounds, Pharaonic Egyptian atmosphere, intense connection, soulful, transformative',
    instrumental: false,
    model: 'V5',
    theme: 'Fantasy Pharaonic Vibes',
  },
  {
    title: 'Fantasy Pharaonic Vibes | Deep House Arabic Violin & Female Voice',
    specificDescription: 'Deep house with Arabic violin and female voice, fantasy Pharaonic vibes',
    additionalDetails: 'deep background sounds, Pharaonic Egyptian atmosphere, intense connection, healing, peaceful',
    instrumental: false,
    model: 'V5',
    theme: 'Fantasy Pharaonic Vibes',
  },
  {
    title: 'Fantasy Pharaonic Vibes | Arabic Violin Solo | Deep House',
    specificDescription: 'Arabic violin solo over deep house, fantasy Pharaonic vibes',
    additionalDetails: 'deep background sounds, Pharaonic Egyptian atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Fantasy Pharaonic Vibes',
  },
  {
    title: 'Fantasy Pharaonic Vibes | Arabic Violin & Oud | Deep House',
    specificDescription: 'Deep house with Arabic violin and oud, fantasy Pharaonic vibes',
    additionalDetails: 'deep background sounds, Pharaonic Egyptian atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Fantasy Pharaonic Vibes',
  },
  {
    title: 'Fantasy Pharaonic Vibes | Male Voice & Arabic Violin | Deep House',
    specificDescription: 'Male voice with Arabic violin and deep house, fantasy Pharaonic vibes',
    additionalDetails: 'deep background sounds, Pharaonic Egyptian atmosphere, intense connection, soulful',
    instrumental: false,
    model: 'V5',
    theme: 'Fantasy Pharaonic Vibes',
  },
  {
    title: 'Fantasy Pharaonic Vibes | Female Voice & Arabic Violin | Deep House',
    specificDescription: 'Female voice with Arabic violin and deep house, fantasy Pharaonic vibes',
    additionalDetails: 'deep background sounds, Pharaonic Egyptian atmosphere, intense connection, healing',
    instrumental: false,
    model: 'V5',
    theme: 'Fantasy Pharaonic Vibes',
  },
  {
    title: 'Fantasy Pharaonic Vibes | Deep Pharaonic Egyptian Sounds | Deep House',
    specificDescription: 'Deep house with Arabic violin and deep background Pharaonic Egyptian sounds, fantasy Pharaonic vibes',
    additionalDetails: 'Pharaonic Egyptian atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Fantasy Pharaonic Vibes',
  },
  {
    title: 'Fantasy Pharaonic Vibes | Deep Instrumental Arabic Violin | Deep House',
    specificDescription: 'Deep house with Arabic violin, deep instrumental Arabic violin focus, fantasy Pharaonic vibes',
    additionalDetails: 'deep background sounds, Pharaonic Egyptian atmosphere, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Fantasy Pharaonic Vibes',
  },
  {
    title: 'Fantasy Pharaonic Vibes | Layered Arabic Violin | Deep House',
    specificDescription: 'Deep house with layered Arabic violin arrangements, fantasy Pharaonic vibes',
    additionalDetails: 'deep background sounds, Pharaonic Egyptian atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Fantasy Pharaonic Vibes',
  },

  // ============================================
  // THEME 7: Lingala Love Rhumba - Congolese Rumba (10 batches)
  // ============================================
  {
    title: 'Lingala Love Rhumba | Pure Instrumental | Congolese Rumba',
    specificDescription: 'Pure instrumental Lingala love rhumba, chill and romantic Congolese rumba',
    additionalDetails: 'deep background sounds, Congolese atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Lingala Love Rhumba',
  },
  {
    title: 'Lingala Love Rhumba | Male Voice | Congolese Rumba',
    specificDescription: 'Lingala love rhumba with male voice, chill and romantic Congolese rumba',
    additionalDetails: 'deep background sounds, Congolese atmosphere, intense connection, soulful, transformative',
    instrumental: false,
    model: 'V5',
    theme: 'Lingala Love Rhumba',
  },
  {
    title: 'Lingala Love Rhumba | Female Voice | Congolese Rumba',
    specificDescription: 'Lingala love rhumba with female voice, chill and romantic Congolese rumba',
    additionalDetails: 'deep background sounds, Congolese atmosphere, intense connection, healing, peaceful',
    instrumental: false,
    model: 'V5',
    theme: 'Lingala Love Rhumba',
  },
  {
    title: 'Lingala Love Rhumba | Guitar | Congolese Rumba',
    specificDescription: 'Lingala love rhumba with guitar, chill and romantic Congolese rumba',
    additionalDetails: 'deep background sounds, Congolese atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Lingala Love Rhumba',
  },
  {
    title: 'Lingala Love Rhumba | Percussion | Congolese Rumba',
    specificDescription: 'Lingala love rhumba with percussion, chill and romantic Congolese rumba',
    additionalDetails: 'deep background sounds, Congolese atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Lingala Love Rhumba',
  },
  {
    title: 'Lingala Love Rhumba | Male Voice & Guitar | Congolese Rumba',
    specificDescription: 'Male voice with guitar and Lingala love rhumba, chill and romantic Congolese rumba',
    additionalDetails: 'deep background sounds, Congolese atmosphere, intense connection, soulful',
    instrumental: false,
    model: 'V5',
    theme: 'Lingala Love Rhumba',
  },
  {
    title: 'Lingala Love Rhumba | Female Voice & Percussion | Congolese Rumba',
    specificDescription: 'Female voice with percussion and Lingala love rhumba, chill and romantic Congolese rumba',
    additionalDetails: 'deep background sounds, Congolese atmosphere, intense connection, healing',
    instrumental: false,
    model: 'V5',
    theme: 'Lingala Love Rhumba',
  },
  {
    title: 'Lingala Love Rhumba | Deep Congolese Sounds | Congolese Rumba',
    specificDescription: 'Lingala love rhumba with deep background Congolese sounds, chill and romantic Congolese rumba',
    additionalDetails: 'Congolese atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Lingala Love Rhumba',
  },
  {
    title: 'Lingala Love Rhumba | Deep Instrumental Rumba | Congolese Rumba',
    specificDescription: 'Lingala love rhumba, deep instrumental rumba, chill and romantic Congolese rumba',
    additionalDetails: 'deep background sounds, Congolese atmosphere, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Lingala Love Rhumba',
  },
  {
    title: 'Lingala Love Rhumba | Layered Rumba Arrangements | Congolese Rumba',
    specificDescription: 'Lingala love rhumba with layered rumba arrangements, chill and romantic Congolese rumba',
    additionalDetails: 'deep background sounds, Congolese atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Lingala Love Rhumba',
  },

  // ============================================
  // THEME 8: Persian Ambient Journey (10 batches)
  // ============================================
  {
    title: 'Persian Ambient Journey | Pure Instrumental | Calm Work Study Creative Flow',
    specificDescription: 'Pure instrumental Persian ambient journey, music for calm work study and creative flow',
    additionalDetails: 'deep background sounds, Persian atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Persian Ambient Journey',
  },
  {
    title: 'Persian Ambient Journey | Male Voice | Calm Work Study Creative Flow',
    specificDescription: 'Persian ambient journey with male voice, music for calm work study and creative flow',
    additionalDetails: 'deep background sounds, Persian atmosphere, intense connection, soulful, transformative',
    instrumental: false,
    model: 'V5',
    theme: 'Persian Ambient Journey',
  },
  {
    title: 'Persian Ambient Journey | Female Voice | Calm Work Study Creative Flow',
    specificDescription: 'Persian ambient journey with female voice, music for calm work study and creative flow',
    additionalDetails: 'deep background sounds, Persian atmosphere, intense connection, healing, peaceful',
    instrumental: false,
    model: 'V5',
    theme: 'Persian Ambient Journey',
  },
  {
    title: 'Persian Ambient Journey | Santur | Calm Work Study Creative Flow',
    specificDescription: 'Persian ambient journey with santur, music for calm work study and creative flow',
    additionalDetails: 'deep background sounds, Persian atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Persian Ambient Journey',
  },
  {
    title: 'Persian Ambient Journey | Tar | Calm Work Study Creative Flow',
    specificDescription: 'Persian ambient journey with tar, music for calm work study and creative flow',
    additionalDetails: 'deep background sounds, Persian atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Persian Ambient Journey',
  },
  {
    title: 'Persian Ambient Journey | Ney Flute | Calm Work Study Creative Flow',
    specificDescription: 'Persian ambient journey with ney flute, music for calm work study and creative flow',
    additionalDetails: 'deep background sounds, Persian atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Persian Ambient Journey',
  },
  {
    title: 'Persian Ambient Journey | Male Voice & Santur | Calm Work Study',
    specificDescription: 'Male voice with santur and Persian ambient journey, music for calm work study and creative flow',
    additionalDetails: 'deep background sounds, Persian atmosphere, intense connection, soulful',
    instrumental: false,
    model: 'V5',
    theme: 'Persian Ambient Journey',
  },
  {
    title: 'Persian Ambient Journey | Female Voice & Tar | Calm Work Study',
    specificDescription: 'Female voice with tar and Persian ambient journey, music for calm work study and creative flow',
    additionalDetails: 'deep background sounds, Persian atmosphere, intense connection, healing',
    instrumental: false,
    model: 'V5',
    theme: 'Persian Ambient Journey',
  },
  {
    title: 'Persian Ambient Journey | Deep Persian Sounds | Calm Work Study',
    specificDescription: 'Persian ambient journey with deep background Persian sounds, music for calm work study and creative flow',
    additionalDetails: 'Persian atmosphere, deep instrumental, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Persian Ambient Journey',
  },
  {
    title: 'Persian Ambient Journey | Deep Instrumental Ambient | Calm Work Study',
    specificDescription: 'Persian ambient journey, deep instrumental ambient journey, music for calm work study and creative flow',
    additionalDetails: 'deep background sounds, Persian atmosphere, intense connection, peaceful, meditative',
    instrumental: true,
    model: 'V5',
    theme: 'Persian Ambient Journey',
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
  console.log('🎵 Starting batch generation for 80 batches across 8 themes\n');
  console.log(`📊 Total batches: ${BATCHES.length} (${BATCHES.length * 2} songs)\n`);
  console.log(`📋 Themes: 8 themes × 10 batches each\n`);

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
  console.log('💡 To sync manually later, use: npx tsx scripts/sync-80-batches-multi-theme.ts\n');
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

