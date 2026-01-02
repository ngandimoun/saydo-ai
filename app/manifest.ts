import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Saydo - Your Whole Life Intelligence',
    short_name: 'Saydo',
    description: 'The first AI that knows your mind and your body. Voice notes become tasks. Lab results become daily guides.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F7F5F0',
    theme_color: '#0D9488',
    orientation: 'portrait-primary',
    categories: ['productivity', 'health', 'lifestyle', 'music'],
    icons: [
      { 
        src: '/icon-192.png', 
        sizes: '192x192', 
        type: 'image/png' 
      },
      { 
        src: '/icon-512.png', 
        sizes: '512x512', 
        type: 'image/png' 
      },
      { 
        src: '/icon-maskable.png', 
        sizes: '512x512', 
        type: 'image/png', 
        purpose: 'maskable' 
      },
    ],
    shortcuts: [
      {
        name: 'Record Voice Note',
        short_name: 'Record',
        description: 'Start a new voice recording',
        url: '/?action=record',
      },
      {
        name: 'Scan Document',
        short_name: 'Scan',
        description: 'Scan a lab result or document',
        url: '/?action=scan',
      },
      {
        name: 'Calm Zone',
        short_name: 'Calm',
        description: 'Listen to music and meditations',
        url: '/dashboard/calm',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
  }
}
