# E10 Design system and polish

Branch: `epic/E10-design`. Depends on: E03 to E07 (touches all of them). Blocks: E11 measurements should run after this.

## Goal

A restrained monochrome interface with Geist typography that is recognisably ours, mobile-first, accessible, and free of generated-design reflexes. The card, the chrome and the hero were settled against a prototype (`https://claude.ai/artifact/8bA4weso73kKWzPGoeYe4L`); this spec is the written form of that prototype and wins if they differ.

## Principles (from decisions.md)

Monochrome with one accent; hierarchy through type and spacing before borders; no gradients, glows, blobs, glass, decorative shadows; sentence case everywhere, including the category line on cards; no icon tiles; motion only to confirm an action or a pending state; light and dark with equal contrast. `specs/design.md` is Vercel's brand skill for report websites: its tone (restraint, Geist, both themes) is reference; its report primitives and `vbg-*` stylesheet are not used.

Every product photo is white-backed. In the dark theme each frame is therefore a light tile on black; that is the photography and it is accepted, not disguised.

## Scope

### Tokens `app/globals.css`

Tailwind v4 `@theme` block defining:

- Colours as CSS variables that flip on `prefers-color-scheme: dark` (defined in E03): `--color-bg`, `--color-bg-secondary`, `--color-fg`, `--color-fg-secondary`, `--color-border`, `--color-border-strong`, `--color-accent`, `--color-accent-fg`, `--color-success`, `--color-warning`, `--color-danger`. Light: `#fff`, `#fafafa`, `#171717`, `#666`, `#eaeaea`, `#999`. Dark: `#000`, `#0a0a0a`, `#ededed`, `#a1a1a1`, `#2a2a2a`, `#444`. Accent `#0070f3` light and `#3291ff` dark.
- `--color-on-photo: #171717` in both themes: the only text colour that does not flip, used for the hero copy over the photo, which does not flip either.
- Radii: `--radius-sm: 4px`, `--radius: 8px`, pills `rounded-full`. Spacing uses Tailwind's scale.
- Fonts: `--font-sans: var(--font-geist-sans)`, `--font-mono: var(--font-geist-mono)`.
- Type scale: 14 / 16 body, 20 / 24 / 32 / 48 headings with matching line heights. Prices, quantities, counts and promo codes are Geist Mono with `font-variant-numeric: tabular-nums`; the `Price` component owns that.
- Transitions: 250 ms `ease-in-out` for colour and border changes, 400 ms for the card photo; every transition under `motion-safe:`.

Tailwind's default `dark:` variant follows the media query; no custom variant.

### Components `components/ui/` (shadcn, Base UI primitives)

Installed: `button`, `input`, `native-select`, `skeleton` (E03 to E07), plus `badge` and `separator` from this epic. Nothing else. Re-theme through the token variables; focus rings are `--color-accent`, 2px, offset 2px. The generated files may be edited (`native-select` already carries an inline chevron and an `lg` size).

### Chrome

- Header: full width like vercel.com, 56px, content inside aligned to the `max-w-6xl` column. `position: sticky; top: 0` at every width. No rule at rest; a 1px `border` hairline appears once the page has scrolled and fades out again at the top. The hairline is the only client code added to the header: a leaf that watches a sentinel above the header with `IntersectionObserver` and toggles a data attribute.
- Nav pending cue: `NavLink` renders a child that reads `useLinkStatus()`; while pending the link fades to `fg-secondary` (250 ms), back to `fg` when the route commits. No progress bar.
- Promo banner: in the root layout, directly below the header, on every route. Accent strip: `bg-accent text-accent-fg`, one centred line at 13px, code in mono; wraps to two or three lines on phones. Contrast of `#0070f3` on white is 4.5:1, AA at this size; verify it in axe. It scrolls away with the page (not sticky). The box reserves the same height per breakpoint as today so nothing below moves when it streams in, and renders empty when there is no active promotion or the call fails. Cost, accepted: one uncached `/promotions` call per page view on every route, not only the home page. The `PromoBanner` component moves from `components/home/` to `components/`.
- Footer: full width with a 1px hairline above, content aligned to the column; otherwise as E03.
- Skip link, `aria-current` on nav and the header Suspense boundary are unchanged.

### Home hero `components/home/hero.tsx`

- Full-bleed band, edge to edge, directly under the banner. Image `/hero.jpg` from `public/` (converted from the supplied 1774 x 887 PNG; the source stays out of the repo), `next/image` with `priority`, `fill`, `object-cover`, `sizes="100vw"`; the only image with `priority` on the page and the LCP element.
- Height: `min(60svh, 640px)` at md and up, positioned so the figure on the left stays in frame. Below md the band is `aspect-[4/3]` with `object-position: left center`.
- Copy: headline at 48 (32 on phones) and the paragraph, nothing else: no button, no link, no product. At md and up the copy sits over the sky on the right half of the column, in `--color-on-photo`, with no scrim; below md the copy sits under the band in the column in normal `fg`.
- Content: `HeroContent` becomes `{ headline, description }`; `HERO_FALLBACK` drops `ctaLabel`, `ctaHref` and `productSlug`, and `getProduct` leaves the component. The Sanity `homePage.hero` (E08) carries the same two fields plus an image; E09 falls back to `/hero.jpg` when the image is unset.

### Product card `components/product-card.tsx`

Two shapes, chosen by the grid's breakpoint, one anatomy: photo in a frame (`bg-secondary`, 1px `border`, `rounded-lg`), name at 14 medium, category in `fg-secondary`, price in mono.

- Grid card, md and up: the price sits top-right on the photo as a pill (`bg-bg`, 1px `border`, `rounded-full`, mono 12px). Name then category under the frame. Hover, under `@media (hover: hover)` only: the pill inverts to `bg-accent text-accent-fg border-accent`, the frame's border goes to `border-strong`, the photo scales 1.035, all fading in and out (250 ms; photo 400 ms; `motion-safe:`). The same inversion is the pending cue while the card's navigation is in flight (`useLinkStatus()`).
- Row card, below md: a horizontal card, photo at 42% of the width (about 150px on a 390px phone), text top-aligned beside it: price first in mono 13px, then name at 15 medium, then category. No pill, no arrow, no hover state; the whole row is the link.
- The name never sits over the photo and is never truncated; it wraps.

### Product grid `components/product-grid.tsx`

- `home`: one column of row cards below md, three grid cards from md. `search`: one column of row cards below md, three from md, five from lg. The five-column search grid stays: with the name under the frame nothing clips at 1024.
- `sizes` per variant follow: rows `42vw`; home `(min-width: 768px) 33vw, 42vw`; search `(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 42vw`.
- `ProductGridSkeleton` mirrors both shapes.

### Product page `app/products/[slug]`

- The photo frame is the card frame (`bg-secondary`, 1px `border`, `rounded-lg`).
- Title at 32, price at 20 in mono directly under it, description at 16 `fg-secondary`, breadcrumb at 14 `fg-secondary` with the current crumb in `fg`.
- Buy row: stepper and Add to Cart on one row from md; below md the button fills the row. Stepper and button are 44px tall. Stock line unchanged (text, never colour alone).
- The column under the buy row stays empty on desktop; a "More in <category>" strip is in `improvements.md`.

### Cart `app/cart`

- Line item: photo in the card frame at 96px; name; unit price in mono; stepper and Remove on one row under the name; line total in mono top-right, on the same column as the summary's figures. Below md the "Quantity" label is dropped.
- Summary: `sticky top-20` at lg; rows separated by `Separator`; Subtotal at 16 medium with mono figures; Checkout full width. Below md the summary follows the lines.
- Empty and failed states use the shared `EmptyState`; "Search products" is a `Button`, not an underlined link.

### Our components `components/`

- `logo.tsx` (E03): the Vercel triangle, 24px, `currentColor`.
- `price.tsx`: `formatPrice` in mono with tabular numerals; sizes `sm | md | lg`.
- `quantity-stepper.tsx`: 44px hit targets, keyboard arrows, `aria-label`s.
- `promo-banner.tsx`: as under Chrome.
- `skeletons.tsx`: card (both shapes), banner, stock, cart row.
- `empty-state.tsx`: heading, one line of text, actions row; used by search (E07) and the cart.

### Layout rhythm

Section gaps 48px mobile, 64px desktop; within-section 16 to 24px; container `max-w-6xl`. The hero and the chrome are the only full-bleed elements.

### Accessibility

- Focus visible on everything; skip link; `aria-current` on nav; `aria-live="polite"` on cart badge and search status; labels on every input; colour never the only cue (stock uses text).
- Contrast AA in both themes, including the accent strip and the hero copy over the sky; verify with axe on all routes.
- `prefers-reduced-motion` respected for every transition; hover effects only under `(hover: hover)`.

### States

`loading.tsx` per route is not used; Suspense skeletons are. `error.tsx` per route group with a retry. Empty states on cart and search.

### Review checklist (run in the PR)

Squint test on each page in both themes; text-mask test; 390 and 1440 screenshots of `/`, a PDP, `/search?q=bag`, `/cart` attached to the PR in both themes; no horizontal scroll at 390; no CLS on promo, stock, badge, hero.

## Acceptance criteria

- [ ] All routes consistent in both themes; screenshots in the PR.
- [ ] axe: zero serious or critical issues on `/`, a PDP, `/search`, `/cart`.
- [ ] No hard-coded colour values outside `globals.css`.
- [ ] Only the listed shadcn components exist under `components/ui`.
- [ ] Lighthouse accessibility 100 and best practices 100 on all routes.
- [ ] The hero image is the LCP element on `/` at 390 and 1440, and `/` is still a partial prerender with the banner as its only dynamic hole.

## Out of scope

Illustrations, custom icons beyond the logo and a cart glyph, animation beyond hover, focus and pending cues, the `useOptimistic` fix for the search category select (`improvements.md`).
