import { noteNavigation } from '@/lib/cart/adds-in-flight'

/**
 * Tells the cart's record of writes when a navigation starts, so a cart page
 * fetched by it is known to include every answer that arrived before, and one
 * that arrives while it loads is applied over it (`holdLines`).
 */
export function onRouterTransitionStart(
  _url: string,
  navigationType: 'push' | 'replace' | 'traverse',
): void {
  noteNavigation(navigationType !== 'traverse')
}
