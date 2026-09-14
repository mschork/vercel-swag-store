# E10 Design system and polish

Branch: `epic/E10-design`. Depends on: E03 to E07 (touches all of them). Blocks: E11 measurements should run after this.

## Goal

A restrained monochrome interface with Geist typography that is recognisably ours, mobile-first, accessible, and free of generated-design reflexes.

## Principles (from decisions.md and Vercel's brand guidance)

Monochrome with one accent; hierarchy through type and spacing before borders; no gradients, glows, blobs, glass, decorative shadows; sentence case; no all-caps eyebrows; no icon tiles; motion only to confirm an action; light and dark with equal contrast.

## Scope

### Tokens `app/globals.css`

Tailwind v4 `@theme` block defining:

- Colours as CSS variables that flip by theme class: `--color-bg`, `--color-bg-secondary`, `--color-fg`, `--color-fg-secondary`, `--color-border`, `--color-border-strong`, `--color-accent`, `--color-accent-fg`, `--color-success`, `--color-warning`, `--color-danger`. Light: `#fff`, `#fafafa`, `#171717`, `#666`, `#eaeaea`, `#999`. Dark: `#000`, `#0a0a0a`, `#ededed`, `#a1a1a1`, `#2a2a2a`, `#444`. Accent `#0070f3` light and `#3291ff` dark.
- Radii: `--radius-sm: 4px`, `--radius: 8px`. Spacing uses Tailwind's scale.
- Fonts: `--font-sans: var(--font-geist-sans)`, `--font-mono: var(--font-geist-mono)`.
- Type scale: 14 / 16 body, 20 / 24 / 32 / 48 headings with matching line heights; tabular numerals on prices via `font-variant-numeric: tabular-nums`.

`next-themes` toggles `class="dark"`; use `@custom-variant dark (&:where(.dark, .dark *))` so `dark:` utilities follow the class not the media query.

### Components `components/ui/` (shadcn, Base UI primitives)

Install only: `button`, `input`, `select`, `badge`, `skeleton`, `separator`. Add `sonner` only if a toast is needed by E06. Re-theme through the token variables; remove the default ring colour in favour of `--color-accent` focus rings 2px offset 2px.

### Our components `components/`

- `logo.tsx`: original triangle glyph, 24px, `currentColor`; not Vercel's logo SVG.
- `product-card.tsx` (E04) polish: image on `bg-secondary`, 1px border, radius, name and price pill bottom-left, hover raises border to `border-strong` and scales image 1.02 with `motion-safe`.
- `price.tsx`: tabular numerals; optional `compareAt` unused for now.
- `quantity-stepper.tsx`: 40px hit targets, keyboard arrows, `aria-label`s.
- `banner.tsx` (promo): full-width strip, `bg-fg text-bg` inversion for contrast, code in mono.
- `skeletons.tsx`: card, banner, stock, cart row.
- `empty-state.tsx`: heading, text, actions row.

### Navigation feedback

Product cards and nav links render a `LinkStatus` child using `useLinkStatus()` that shows a subtle progress cue (a 2px top bar or reduced opacity) while the navigation is pending, so moving between static pages with dynamic holes never feels unresponsive. Respect `prefers-reduced-motion`.

### Layout rhythm

Section gaps 48px mobile, 64px desktop; within-section 16 to 24px; container `max-w-6xl`. Product grids 2 / 3 / 4 (5 on search at lg).

### Accessibility

- Focus visible on everything; skip link; `aria-current` on nav; `aria-live="polite"` on cart badge and search status; labels on every input; colour never the only cue (stock uses text).
- Contrast AA in both themes; verify with axe on all routes.
- `prefers-reduced-motion` respected for the card hover and any transition.

### States

`loading.tsx` per route is not used; Suspense skeletons are. `error.tsx` per route group with a retry. Empty states on cart and search.

### Review checklist (run in the PR)

Squint test on each page in both themes; text-mask test; 375 and 1280 screenshots attached to the PR; no horizontal scroll at 375; no CLS on promo, stock, badge.

## Acceptance criteria

- [ ] All routes consistent in both themes; screenshots in the PR.
- [ ] axe: zero serious or critical issues on `/`, a PDP, `/search`, `/cart`.
- [ ] No hard-coded colour values outside `globals.css`.
- [ ] Only the listed shadcn components exist under `components/ui`.
- [ ] Lighthouse accessibility 100 and best practices 100 on all routes.

## Out of scope

Illustrations, custom icons beyond the logo and a cart glyph, animation beyond hover and focus.
