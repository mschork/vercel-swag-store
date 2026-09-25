import { FavouriteProducts } from '@/components/favourite-products'
import { FAVOURITES_FALLBACK } from '@/lib/content/fallbacks'
import { getHomePage } from '@/lib/sanity/content'
import { QuickAddForm } from './quick-add-form'

/**
 * The favourites row under the cart, with the heading the home page document
 * owns and an Add to Cart under each card. This is the one place in the store
 * that sells from a grid. It reads no session, so it is part of the cart
 * page's static shell; the browser shows only products the visitor can buy,
 * because a row that cross-sells something unbuyable wastes the one place on
 * the page where the visitor is ready to add one more thing.
 */
export async function CartFavourites() {
  const content = await getHomePage()
  return (
    <FavouriteProducts
      heading={content?.favourites?.heading || FAVOURITES_FALLBACK.heading}
      buyable
      slot={({ id, slug, name, images, price }) => (
        <QuickAddForm
          productId={id}
          display={{ slug, name, image: images[0] ?? null, price }}
        />
      )}
    />
  )
}
