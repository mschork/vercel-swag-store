import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { TRIANGLE_PATH, TRIANGLE_VIEWBOX } from '@/components/logo'

export const alt = 'Vercel Swag Store'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Read once at module scope; the image is generated at build time.
const geist = await readFile(join(process.cwd(), 'node_modules/geist/dist/fonts/geist-sans/Geist-Regular.ttf'))

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
          background: '#000',
          color: '#fff',
          fontFamily: 'Geist',
        }}
      >
        <svg viewBox={TRIANGLE_VIEWBOX} width="120" height="103" fill="#fff">
          <path d={TRIANGLE_PATH} />
        </svg>
        <div style={{ fontSize: 64, letterSpacing: -1 }}>Vercel Swag Store</div>
      </div>
    ),
    { ...size, fonts: [{ name: 'Geist', data: geist, style: 'normal', weight: 400 }] },
  )
}
