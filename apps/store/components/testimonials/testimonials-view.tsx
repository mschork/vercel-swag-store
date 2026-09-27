import Link from 'next/link'
import { Container } from '@/components/container'
import { EmptyState } from '@/components/empty-state'
import { buttonVariants } from '@/components/ui/button-variants'
import { getAllProducts } from '@/lib/api/products'
import { getSiteSettings, getTestimonialWall } from '@/lib/sanity/content'
import { chatOffered } from '@/lib/testimonials/chat'
import { testimonialsCopy } from '@/lib/testimonials/copy'
import { SHARE_HASH } from '@/lib/testimonials/share'
import { showMorePath, wallEnd } from '@/lib/testimonials/wall'
import { ShareChat } from './share-chat'
import { TestimonialWall } from './wall'

/**
 * `/testimonials` and each further page of its wall: the heading, the intro,
 * the link that opens the chat when the store offers it, and the wall up to
 * `page`. Every read is cached, so each page is prerendered whole.
 */
export async function TestimonialsView({ page, pageCount }: { page: number; pageCount: number }) {
  const [settings, entries, products] = await Promise.all([
    getSiteSettings(),
    getTestimonialWall(wallEnd(page)),
    getAllProducts(),
  ])
  const copy = testimonialsCopy(settings)
  return (
    <Container className="flex flex-col gap-8 py-8 md:gap-12 md:py-12">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-medium tracking-tight">{copy.heading}</h1>
          <p className="max-w-prose text-pretty text-fg-secondary">{copy.intro}</p>
        </div>
        {chatOffered ? (
          <div id={SHARE_HASH.slice(1)} className="flex flex-col scroll-mt-24">
            <ShareChat
              label={copy.submitLabel}
              products={products.map(({ id, name, images }) => ({ id, name, image: images[0] ?? null }))}
            />
          </div>
        ) : null}
      </div>
      {entries && entries.length > 0 ? (
        <TestimonialWall entries={entries} products={products} />
      ) : (
        <EmptyState title="No testimonials yet">
          <Link href="/products" className="underline underline-offset-4">
            See all products
          </Link>
        </EmptyState>
      )}
      {page < pageCount ? (
        <Link
          href={showMorePath(page)}
          className={buttonVariants({ variant: 'outline', size: 'lg', className: 'self-center px-4' })}
        >
          Show more
        </Link>
      ) : null}
    </Container>
  )
}
