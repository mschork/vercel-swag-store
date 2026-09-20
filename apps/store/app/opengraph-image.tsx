import { ImageResponse } from 'next/og'
import { TRIANGLE_PATH, TRIANGLE_VIEWBOX } from '@/components/logo'
import { loadOgFonts, OG_FONT_FAMILY } from '@/lib/og-font'

export const alt = 'Vercel Swag Store'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * Black canvas, the triangle and the store name. The font is read inside the
 * handler (`loadOgFonts` in `lib/og-font.ts`).
 */
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
          fontFamily: OG_FONT_FAMILY,
        }}
      >
        <svg viewBox={TRIANGLE_VIEWBOX} width="120" height="103" fill="#fff">
          <path d={TRIANGLE_PATH} />
        </svg>
        <div style={{ fontSize: 64, letterSpacing: -1 }}>Vercel Swag Store</div>
      </div>
    ),
    { ...size, fonts: await loadOgFonts() },
  )
}
