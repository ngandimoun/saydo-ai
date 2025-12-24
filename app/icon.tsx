import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 512,
  height: 512,
}

export const contentType = 'image/png'

// Image generation - creates the Saydo icon dynamically
export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
          borderRadius: '96px',
        }}
      >
        <div
          style={{
            fontSize: 320,
            fontWeight: 600,
            color: 'white',
            fontFamily: 'Georgia, serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          S
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

