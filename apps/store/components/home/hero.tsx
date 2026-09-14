import Link from 'next/link'
import { ProductImage } from '@/components/product-image'
import { Button } from '@/components/ui/button'
import { getProduct } from '@/lib/api/products'
import { HERO_FALLBACK } from '@/lib/content/fallbacks'

/**
 * Static hero. The product is resolved through the cached `getProduct`, so the
 * photo stays an API fact; a slug missing from the API fails the build
 * (specs/callout.md). The photo is the LCP element and the only image with
 * `priority` on the page. E09 reads the same fields from Sanity.
 */
export async function Hero() {
  const { headline, description, ctaLabel, ctaHref, productSlug } =
    HERO_FALLBACK
  const product = await getProduct(productSlug)
  return (
    <section className="grid gap-8 py-8 md:grid-cols-2 md:items-center md:gap-12 md:py-16">
      <div className="flex flex-col gap-6">
        <h1 className="text-4xl font-medium tracking-tight text-balance md:text-5xl">
          {headline}
        </h1>
        <p className="max-w-prose text-lg text-fg-secondary">{description}</p>
        <p>
          <Button size="lg" render={<Link href={ctaHref} />}>
            {ctaLabel}
          </Button>
        </p>
      </div>
      {/* Square on mobile; at md and up a fixed height fills most of the first viewport and the photo's white margins absorb the crop. */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-lg border border-border bg-bg-secondary md:aspect-auto md:h-[480px] lg:h-[560px]"
      >
        <ProductImage
          product={product}
          alt={product.name}
          priority
          sizes="(min-width: 1152px) 576px, (min-width: 768px) 50vw, 100vw"
        />
      </Link>
    </section>
  )
}
