# E03 Shell, layout and metadata

Branch: `epic/E03-shell`. Depends on: E01, E02. Blocks: E04 to E07.

## Goal

The shared frame every page renders inside: header with logo, nav and cart badge; footer with copyright and social links; root metadata with Open Graph; per-page metadata hooks. The shell is fully prerendered in this epic; the cart badge becomes its only dynamic hole in E06.

## Scope

### Root layout `app/layout.tsx`

- `<html lang="en">` with the Geist font variables from the `geist` package (`geist/font/sans`, `geist/font/mono`, self-hosted through `next/font/local`). No theme script, no `suppressHydrationWarning`.
- Body: skip link to `#main`, `<Header />`, `<main id="main">{children}</main>`, `<Footer />`, `<SpeedInsights />`, `<Analytics />` (packages added here, see E11 for verification).
- `export async function generateMetadata()`: awaits the cached `getStoreConfig()` and maps `seo.defaultTitle` to `title.default`, `seo.titleTemplate` to `title.template`, `seo.defaultDescription` to `description` and `storeName` to `openGraph.siteName`. `metadataBase` from `NEXT_PUBLIC_SITE_URL`; `openGraph: { type: 'website', locale: 'en_US' }`; `twitter: { card: 'summary_large_image' }`; `robots` default. Because the only await is a `"use cache"` function, the root stays static and the metadata is prerendered. There is no constants fallback: a build that cannot reach the API fails, as `specs/callout.md` states.
- `export const viewport`: `themeColor` as an array with `media: '(prefers-color-scheme: light)'` `#ffffff` and dark `#000000`. Not `#hhhhhh`.
- Root `app/opengraph-image.tsx` via `next/og`: black canvas, the triangle, "Vercel Swag Store" in Geist. Font loaded with `readFile` from the `geist` package's `Geist-Regular.ttf`. Static.

### Theme

Light and dark follow `prefers-color-scheme`. Tailwind's default `dark:` variant applies; the colour tokens flip inside a `@media (prefers-color-scheme: dark)` block. No selector anywhere in the store (see `specs/callout.md`).

### Tokens `app/globals.css`

The E10 colour tokens are defined here, with E10's values, because the shell needs them: `--color-bg`, `--color-bg-secondary`, `--color-fg`, `--color-fg-secondary`, `--color-border`, `--color-border-strong`, `--color-accent`, `--color-accent-fg`, plus `--font-sans` and `--font-mono` mapped to the Geist variables. Radii, type scale, the status colours (`--color-success`, `--color-warning`, `--color-danger`) and components stay in E10.

### Header `components/header.tsx`

- Left: `<Logo />` linking to `/`: the Vercel triangle as an inline SVG in `currentColor`, 24px, plus "Vercel Swag Store" as text; the text collapses to the triangle below 640px.
- Nav: links to `/` ("Home") and `/search` ("Search"), `aria-current="page"` set by a small client `NavLink` using `usePathname`.
- Right: `<CartBadge />` wrapped in `<Suspense fallback={<CartIcon count={null} />}>`. In this epic `CartBadge` is a static server component rendering `<CartIcon count={null} />` linking to `/cart`; E06 replaces it with the cookie-reading version. `CartIcon` is an inline SVG cart glyph in `currentColor`.
- Not sticky, no border: the header separates from the page by spacing (`specs/design.md`). Height 56px mobile, 64px desktop.

### Footer `components/footer.tsx`

- Left: copyright with the current year computed on the server (`new Date().getFullYear()` inside a `"use cache"` component with `cacheLife('days')` so it does not make the layout dynamic; the year may flip up to a day late, which is acceptable).
- Right: social links from `getStoreConfig().socialLinks` (cached) as text links, not icons. The record key becomes the label through a small map (`twitter` → "X", `github` → "GitHub", `discord` → "Discord"); unknown keys are rendered with the first letter capitalised. Every key with a non-empty URL is rendered.
- If `getStoreConfig()` throws, the footer logs the error server-side and renders without the link row (see `specs/callout.md`).

### Stub routes

`app/search/page.tsx` and `app/cart/page.tsx` exist as headings with their final `metadata` titles ("Search"; "Cart" with `robots: { index: false }`) so `typedRoutes` accepts the header links. E06 and E07 replace the bodies.

### Per-page metadata

- Pattern for E04 to E07: `export const metadata` for static pages; `export async function generateMetadata({ params })` for the PDP and search. Each sets `title`, `description`, `openGraph.title`, `openGraph.description`, and for the PDP `openGraph.images`.
- Search metadata reads `searchParams` and therefore is dynamic; that is expected.

### Responsive

- Container: `max-w-6xl mx-auto px-4 sm:px-6`.
- Nav stays visible on mobile (two links fit); no hamburger.
- Test at 375, 768, 1280.

### Security headers `next.config.ts`

`headers()` returning for all routes, built by a pure function in `lib/security-headers.ts` so it can be unit-tested: `Content-Security-Policy` (default-src 'self'; img-src 'self' data: blob: https://i8qy5y6gxkdgdcv9.public.blob.vercel-storage.com https://cdn.sanity.io; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com; font-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests) (see `docs/adr/0001-csp-unsafe-inline-scripts.md` for why `'unsafe-inline'` rather than nonces), `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

The full set is sent in every environment so a blocked host shows up on `localhost` first. `'unsafe-eval'` is added to `script-src` in development only, because React's development build reconstructs server stack traces with `eval()`; production React never calls it. `upgrade-insecure-requests` is sent everywhere: Chrome does not upgrade `localhost` requests. Verify on the preview URL that Speed Insights and Analytics still report.

Hardening that goes with the `'unsafe-inline'` choice, all in the same epic:

- ESLint rule `react/no-danger` set to error in `@repo/config`, so `dangerouslySetInnerHTML` cannot reach the HTML. Portable Text (E09) renders through a serializer with allow-listed marks, never raw HTML.
- README (E12) explains the trade-off: nonce-based CSP requires a proxy on every request and makes every page dynamic, which defeats the static shell.

### Error and not-found

- `app/not-found.tsx` with a link home and to search.
- `app/error.tsx` client boundary with a retry button.
- `app/loading.tsx` is not used at the root (would blank the shell); per-route Suspense instead.
- No `global-error.tsx`: the only layout-level fetch is the footer's, which catches its own failure.

### Tests

Vitest: `lib/security-headers.test.ts` (required directives present, no nonce, hosts listed; the `hhhhhh` check is the grep criterion, not a test, so the string never enters `apps/`) and the social-link label map. Playwright arrives in E12.

## Acceptance criteria

- [x] Build output marks `/` as fully prerendered with no dynamic hole (the cart badge becomes the only one in E06).
- [ ] Root and per-page metadata visible in a social card debugger; OG image renders.
- [x] Light and dark follow the OS preference with no flash on reload.
- [x] Header and footer on all routes; keyboard navigation reaches every control; skip link works.
- [x] Lighthouse accessibility 100 on `/` at this stage.
- [x] `grep -r hhhhhh apps/` returns nothing.
- [x] `NEXT_PUBLIC_SITE_URL` set to the production URL for Production and Preview in the Vercel project.

## Out of scope

Page content (E04 to E07), Sanity-driven settings (E09), design tokens beyond colour and fonts (E10).
