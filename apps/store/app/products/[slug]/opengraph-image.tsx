import { notFound } from 'next/navigation'
import { ImageResponse } from 'next/og'
import { findProduct } from '@/lib/api/products'
import { formatPrice } from '@/lib/format'
import { loadGeist } from '@/lib/og-font'

export const alt = 'Product photo with its name and price'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * The product's social card: its photo on black, with name and price. The
 * product comes from the cached `getProduct`; an unknown slug gets a 404.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await findProduct(slug)
  if (!product) notFound()
  const photo = product.images[0]
  return new ImageResponse(
    (
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
          fontFamily: 'Geist',
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
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}
        >
          <div style={{ fontSize: 56, lineHeight: 1.1, letterSpacing: -1 }}>
            {product.name}
          </div>
          <div style={{ fontSize: 40, color: '#a1a1a1' }}>
            {formatPrice(product.price, product.currency)}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Geist',
          data: await loadGeist(),
          style: 'normal',
          weight: 400,
        },
      ],
    },
  )
}
