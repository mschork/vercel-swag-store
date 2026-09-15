import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { TRIANGLE_PATH, TRIANGLE_VIEWBOX } from '@/components/logo'

export const alt = 'Vercel Swag Store'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * Read lazily, inside the handler, never at module scope: this module sits in
 * every route's graph through the root metadata, and a route that resumes at
 * request time (the home page's promo hole) loads it on the server, where a
 * module-scope read of a file outside the function bundle threw ENOENT and
 * replaced the page with the error boundary. The image itself is prerendered.
 */
const FONT_PATH = join(process.cwd(), 'node_modules/geist/dist/fonts/geist-sans/Geist-Regular.ttf')
let geist: Promise<Buffer> | undefined

export default async function Image() {
  geist ??= readFile(FONT_PATH)
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
    { ...size, fonts: [{ name: 'Geist', data: await geist, style: 'normal', weight: 400 }] },
  )
}
