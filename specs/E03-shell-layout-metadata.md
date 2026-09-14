# E03 Shell, layout and metadata

Branch: `epic/E03-shell`. Depends on: E01, E02. Blocks: E04 to E07.

## Goal

The shared frame every page renders inside: header with logo, nav and cart badge; footer with copyright, social links and theme selector; root metadata with Open Graph; per-page metadata hooks. The shell must be static; only the cart badge is dynamic.

## Scope

### Root layout `app/layout.tsx`

- `<html lang="en" suppressHydrationWarning>` with Geist font variables and `className` toggled by `next-themes` (`attribute="class"`, `defaultTheme="system"`, `enableSystem`).
- Body: `<Header />`, `<main id="main">{children}</main>`, `<Footer />`, `<SpeedInsights />`, `<Analytics />` (packages added here, see E11 for verification).
- Skip link to `#main`.
- `export const metadata`: `metadataBase` from `NEXT_PUBLIC_SITE_URL`; `title: { default: 'Vercel Swag Store', template: '%s | Vercel Swag Store' }`; `description: 'Official Vercel merchandise. Premium developer apparel, accessories, and gear.'`; `openGraph: { type: 'website', siteName: 'Vercel Swag Store', locale: 'en_US' }`; `twitter: { card: 'summary_large_image' }`; `robots` default.
- `export const viewport`: `themeColor` as an array with `media: '(prefers-color-scheme: light)'` `#ffffff` and dark `#000000`. Not `#hhhhhh`.
- Root `app/opengraph-image.tsx` via `next/og`: black canvas, triangle glyph, "Vercel Swag Store" in Geist. Static.

### Header `components/header.tsx`

- Left: `<Logo />` (original triangle glyph as inline SVG plus "Vercel Swag Store" text; the text collapses to the glyph below 640px).
- Nav: links to `/` ("Home") and `/search` ("Search"), `aria-current="page"` set by a small client `NavLink` using `usePathname`.
- Right: `<CartBadge />` wrapped in `<Suspense fallback={<CartIcon count={null} />}>`. `CartBadge` is a server component that reads the cookie and calls `getCart` (E06 provides `getCartFromCookie()`; until then it renders the icon with no count).
- Sticky top, backdrop blur off (no glass effects), 1px bottom border in the border token.

### Footer `components/footer.tsx`

- Left: copyright with the current year computed on the server (`new Date().getFullYear()` inside a `"use cache"` component with `cacheLife('days')` so it does not make the layout dynamic; the year may flip up to a day late, which is acceptable).
- Middle: social links from `getStoreConfig()` (cached) as text links, not icons.
- Right: `<ThemeSelect />`, a client component using `useTheme` from `next-themes` rendering a native `<select>` with Light, Dark, System. Hidden until mounted to avoid a hydration mismatch.

### Per-page metadata

- Pattern for E04 to E07: `export const metadata` for static pages; `export async function generateMetadata({ params })` for the PDP and search. Each sets `title`, `description`, `openGraph.title`, `openGraph.description`, and for the PDP `openGraph.images`.
- Search metadata reads `searchParams` and therefore is dynamic; that is expected.

### Responsive

- Container: `max-w-6xl mx-auto px-4 sm:px-6`.
- Header height 56px mobile, 64px desktop. Nav stays visible on mobile (two links fit); no hamburger.
- Test at 375, 768, 1280.

### Security headers `next.config.ts`

`headers()` returning for all routes: `Content-Security-Policy` (default-src 'self'; img-src 'self' data: blob: https://i8qy5y6gxkdgdcv9.public.blob.vercel-storage.com https://cdn.sanity.io; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com; font-src 'self'; frame-ancestors 'none') (see `docs/adr/0001-csp-unsafe-inline-scripts.md` for why `'unsafe-inline'` rather than nonces), `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. Verify on the preview URL that Speed Insights and Analytics still report.

Hardening that goes with the `'unsafe-inline'` choice, all in the same epic:

- Add `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` and `upgrade-insecure-requests` to the CSP.
- ESLint rule `react/no-danger` set to error in `@repo/config`, so `dangerouslySetInnerHTML` cannot reach the HTML. Portable Text (E09) renders through a serializer with allow-listed marks, never raw HTML.
- README (E12) explains the trade-off: nonce-based CSP requires a proxy on every request and makes every page dynamic, which defeats the static shell.

### Error and not-found

- `app/not-found.tsx` with a link home and to search.
- `app/error.tsx` client boundary with a retry button.
- `app/loading.tsx` is not used at the root (would blank the shell); per-route Suspense instead.

## Acceptance criteria

- [ ] Build output marks `/` shell as static (prerendered) with the cart badge as the only dynamic hole once E06 lands.
- [ ] Root and per-page metadata visible in a social card debugger; OG image renders.
- [ ] Theme selector switches light, dark, system with no flash of wrong theme on reload.
- [ ] Header and footer on all routes; keyboard navigation reaches every control; skip link works.
- [ ] Lighthouse accessibility 100 on `/` at this stage.
- [ ] `grep -r hhhhhh apps/` returns nothing.

## Out of scope

Page content (E04 to E07), Sanity-driven settings (E09), design tokens beyond what is needed to see the shell (E10).
