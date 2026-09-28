import { getPromotion } from '@/lib/api/promotions'
import { PromoMarquee } from './promo-marquee'

/**
 * The accent strip under the header, on every route: the promotion every
 * visitor sees. Its read is cached, so the strip is part of the static shell
 * and paints with the header. Without an active promotion there is no strip.
 */
export async function PromoBanner() {
  const promotion = await getPromotion()
  if (!promotion) return null
  return (
    <aside aria-label="Current promotion" className="bg-accent text-accent-fg">
      <PromoMarquee>
        <p className="py-2 text-sm leading-5">
          <strong className="font-medium">{promotion.title}.</strong>{' '}
          {promotion.description} {promotion.discountPercent}% off with code{' '}
          <code translate="no" className="ml-0.5 border-x-4 border-y border-accent-fg/70 px-1.5 py-px font-mono text-sm">
            {promotion.code}
          </code>
        </p>
      </PromoMarquee>
    </aside>
  )
}
