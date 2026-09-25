/**
 * The grid variants. Each owns its column classes and the `sizes` that follows
 * from them, so a breakpoint can never change in one place and leave
 * `next/image` asking for the wrong width in the other. `listing` is the one
 * variant that is card-shaped below md, and tells the card so through `shape`.
 */
export const VARIANTS = {
  home: {
    grid: 'grid gap-4 md:grid-cols-3',
    sizes: '(min-width: 1152px) 358px, (min-width: 768px) 33vw, 42vw',
  },
  favourites: {
    grid: 'grid gap-4 md:grid-cols-4',
    sizes: '(min-width: 1152px) 264px, (min-width: 768px) 25vw, 42vw',
  },
  search: {
    grid: 'grid gap-4 md:grid-cols-3 lg:grid-cols-5',
    sizes:
      '(min-width: 1152px) 208px, (min-width: 1024px) 20vw, (min-width: 768px) 33vw, 42vw',
  },
  listing: {
    grid: 'grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-4 lg:grid-cols-4',
    sizes:
      '(min-width: 1152px) 264px, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw',
    shape: 'card',
  },
} as const

export type GridVariant = keyof typeof VARIANTS

/** A variant's column classes and `sizes`, for a grid a client component lays out. */
export const gridVariant = (variant: GridVariant) => VARIANTS[variant]
