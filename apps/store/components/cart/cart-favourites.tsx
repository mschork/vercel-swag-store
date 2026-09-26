import { FavouriteProducts } from '@/components/favourite-products'
import { CART_FALLBACK } from '@/lib/content/fallbacks'
import { getSiteSettings } from '@/lib/sanity/content'
import { QuickAddForm } from './quick-add-form'

/**
 * The favourites row under the cart, with its own heading from the site
 * settings. Each card is an add button: a tap adds one to the cart, and the
 * card does not lead to the product page. This is the one place in the store
 * that sells from a grid. It reads no session, so it is part of the cart
 * page's static shell; the browser shows only products the visitor can buy,
 * because a row that cross-sells something unbuyable wastes the one place on
 * the page where the visitor is ready to add one more thing.
 */
export async function CartFavourites() {
  const settings = await getSiteSettings()
  return (
    <FavouriteProducts
      heading={settings?.cartPage?.favouritesHeading || CART_FALLBACK.favouritesHeading}
      buyable
      addCard={({ id, slug, name, images, price }, card, className) => (
        <QuickAddForm
          productId={id}
          display={{ slug, name, image: images[0] ?? null, price }}
          className={className}
        >
          {card}
        </QuickAddForm>
      )}
    />
  )
}
