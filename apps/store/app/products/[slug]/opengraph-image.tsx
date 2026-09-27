import { cacheLife, cacheTag } from 'next/cache'
import { notFound } from 'next/navigation'
import { ImageResponse } from 'next/og'
import { CATALOG_PROFILE, TAGS } from '@/lib/api/cache'
import { findProduct, getAllProductSlugs } from '@/lib/api/products'
import { formatPrice } from '@/lib/format'
import { loadOgFonts, OG_FONT_FAMILY } from '@/lib/og-font'

export const alt = 'Product photo with its name and price'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Every product's card is prerendered, as its page is. */
export async function generateStaticParams() {
  const slugs = await getAllProductSlugs()
  return slugs.map((slug) => ({ slug }))
}

/** What `renderCard` draws; plain values, so they can key its cache entry. */
type CardInput = {
  name: string
  /** Formatted with `formatPrice`. */
  price: string
  /** The API's first photo, or `null` when the product has none. */
  photoUrl: string | null
}

/**
 * The card as a base64 PNG. Cached whole: during a prerender any pending work
 * outside a cache (the font read, the photo download, the PNG encoding) makes
 * the route dynamic, and whether it is still pending depends on the machine's
 * load.
 */
async function renderCard({ name, price, photoUrl }: CardInput): Promise<string> {
  'use cache'
  cacheTag(TAGS.products)
  cacheLife(CATALOG_PROFILE)
  const photo = photoUrl ? await imageDataUri(photoUrl) : null
  const image = new ImageResponse(<Card name={name} price={price} photo={photo} />, {
    ...size,
    fonts: await loadOgFonts(),
  })
  return Buffer.from(await image.arrayBuffer()).toString('base64')
}

/** Most attempts at one photo download. */
const PHOTO_ATTEMPTS = 3
/** One attempt's limit; a whole photo arrives in well under a second. */
const PHOTO_TIMEOUT_MS = 5000

/**
 * A product photo as a data URI, so the renderer does not download it. The
 * image host now and then stops sending a body part way through, so each
 * attempt has a time limit; a stalled download would otherwise hang the
 * prerender until the cache fill times out.
 */
async function imageDataUri(url: string): Promise<string> {
  'use cache'
  cacheTag(TAGS.products)
  cacheLife(CATALOG_PROFILE)
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(PHOTO_TIMEOUT_MS) })
      if (!response.ok) throw new Error(`Product image ${response.status}: ${url}`)
      const type = response.headers.get('content-type') ?? 'image/jpeg'
      const bytes = Buffer.from(await response.arrayBuffer())
      return `data:${type};base64,${bytes.toString('base64')}`
    } catch (error) {
      if (attempt >= PHOTO_ATTEMPTS) throw error
    }
  }
}

/**
 * The product's social card: its photo on black, with name and price. The
 * product comes from `findProduct`, the same cache entry the page reads; an
 * unknown slug gets a 404.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await findProduct(slug)
  if (!product) notFound()
  const png = await renderCard({
    name: product.name,
    price: formatPrice(product.price, product.currency),
    photoUrl: product.images[0] ?? null,
  })
  return new Response(Buffer.from(png, 'base64'), { headers: { 'Content-Type': contentType } })
}

/**
 * Colours are literal because the image renderer cannot read the CSS tokens;
 * they match the dark theme's.
 */
function Card({ name, price, photo }: { name: string; price: string; photo: string | null }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 64,
        padding: 64,
        background: '#000',
        color: '#fff',
        fontFamily: OG_FONT_FAMILY,
      }}
    >
      {photo ? (
        <img
          src={photo}
          alt=""
          width={502}
          height={502}
          style={{ borderRadius: 16, objectFit: 'cover' }}
        />
      ) : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
        <div style={{ fontSize: 56, lineHeight: 1.1, letterSpacing: -1 }}>{name}</div>
        <div style={{ fontSize: 40, color: '#a1a1a1' }}>{price}</div>
      </div>
    </div>
  )
}
