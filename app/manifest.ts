import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Saydo AI',
    short_name: 'Saydo',
    description: 'Voice-to-Action Professional Assistant',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#FF5722',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}

