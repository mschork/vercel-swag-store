import { WALL_PAGE_SIZE } from '@repo/testimonials/constants'

/**
 * The wall's pages (specs/E25-testimonial-agent.md). Page `n` shows the first
 * `n` pages' entries, so "Show more" adds entries below the ones already
 * read. Page 1 is `/testimonials`; `next.config.ts` rewrites
 * `/testimonials?page=<n>` to `/testimonials/page/<n>`.
 */

/** How many pages `count` entries fill; an empty wall still has its first page. */
export function wallPageCount(count: number, pageSize = WALL_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(count / pageSize))
}

/** The page a path segment names, or `null` for anything but a page that exists. */
export function parseWallPage(segment: string, pageCount: number): number | null {
  if (!/^[1-9][0-9]*$/.test(segment)) return null
  const page = Number(segment)
  return page <= pageCount ? page : null
}

/** How many entries page `page` shows. */
export function wallEnd(page: number, pageSize = WALL_PAGE_SIZE): number {
  return page * pageSize
}

/** The address of a page as a visitor sees it. */
export function wallPath(page: number): '/testimonials' | `/testimonials?page=${number}` {
  return page === 1 ? '/testimonials' : `/testimonials?page=${page}`
}

/** The id of the first entry a page adds, which "Show more" scrolls to. */
export function wallAnchor(page: number): `page-${number}` {
  return `page-${page}`
}

/**
 * Where "Show more" leads: the next page, scrolled to its first new entry,
 * with or without JavaScript.
 */
export function showMorePath(page: number): `/testimonials?page=${number}#page-${number}` {
  return `/testimonials?page=${page + 1}#${wallAnchor(page + 1)}`
}
