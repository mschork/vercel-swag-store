import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { TRIANGLE_PATH, TRIANGLE_VIEWBOX } from '@/components/logo'
import { getStoreConfig } from '@/lib/api/store'
import { HERO_IMAGE } from '@/lib/content/fallbacks'
import { loadOgFonts, OG_FONT_FAMILY } from '@/lib/og-font'
import { getHomePageForMetadata, getSiteSettingsForMetadata } from '@/lib/sanity/content'
import { sanityCoverUrl } from '@/lib/sanity/image'
import { sharingCard } from '@/lib/sharing-card'

export const alt = 'Vercel Swag Store'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** The bundled hero photo as a data URI; the renderer cannot read `public/`. */
async function bundledHero() {
  const file = await readFile(join(process.cwd(), 'public', HERO_IMAGE.src))
  return `data:image/jpeg;base64,${file.toString('base64')}`
}

/**
 * The store's sharing card, and the card of every page without its own
 * (`sharingCard` in `lib/sharing-card.ts`). This file outranks
 * `openGraph.images` in metadata, so the editor's sharing image is drawn here.
 * Every read is cached, so the image is prerendered. Colours are literal
 * because the image renderer cannot read the CSS tokens.
 */
export default async function Image() {
  const [settings, home, { storeName }] = await Promise.all([
    getSiteSettingsForMetadata(),
    getHomePageForMetadata(),
    getStoreConfig(),
  ])
  const card = sharingCard(settings, home)
  const photo = card.photo ? sanityCoverUrl(card.photo, size) : await bundledHero()
  const cover = (
    <img
      src={photo}
      alt=""
      width={size.width}
      height={size.height}
      style={{ position: 'absolute', top: 0, left: 0, objectFit: 'cover' }}
    />
  )
  return new ImageResponse(
    card.kind === 'upload' ? (
      <div style={{ width: '100%', height: '100%', display: 'flex' }}>{cover}</div>
    ) : (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#fff',
          color: '#000',
          fontFamily: OG_FONT_FAMILY,
        }}
      >
        {cover}
        {/* A light wash behind the words, so they read on a photo with no sky. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage:
              'linear-gradient(215deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 45%)',
          }}
        />
        {/* Top right: the hero photo keeps its subject on the left. */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 28,
            width: '100%',
            height: '100%',
            padding: 64,
            textAlign: 'right',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 30 }}>
            <svg viewBox={TRIANGLE_VIEWBOX} width="36" height="31" fill="#000">
              <path d={TRIANGLE_PATH} />
            </svg>
            {settings?.storeName || storeName}
          </div>
          <div style={{ fontSize: 88, lineHeight: 1.05, letterSpacing: -3, maxWidth: 600 }}>
            {card.headline}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: await loadOgFonts() },
  )
}
