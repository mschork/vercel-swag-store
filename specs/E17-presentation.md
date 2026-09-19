# E17 Live editing with the Presentation tool (stretch)

Branch: `epic/E17-presentation`. Depends on: E08, E09. Blocks: nothing. The epic is cut into four slices; each leaves `main` shippable.

## Goal

An editor opens the store inside the Studio, clicks a piece of text or a picture, and lands on the field that holds it. Edits show in the page as they type, before anything is published. Visitors notice nothing: the same pages, the same static shell, the same cache, not one extra byte.

## What changes, and what does not

Two settled choices move, and both move only for an editor in draft mode.

| | Visitors (unchanged) | An editor in draft mode |
|---|---|---|
| Sanity client | no token, `published` | `SANITY_API_READ_TOKEN` (Viewer), `drafts`, stega on |
| Cache | `"use cache"`, tags, the publish webhook | bypassed by Next: a `"use cache"` function re-executes on every request and saves nothing |
| Extra JavaScript | none | the visual-editing overlay |

Next 16 documents both halves (`node_modules/next/dist/docs/01-app/02-guides/draft-mode.md`): draft mode skips every cache layer including `"use cache"`, and `draftMode().isEnabled` may be read inside a `"use cache"` scope. So `sanityFetch` keeps its directive, its tags and its profile, and branches on `isEnabled` inside. `next-sanity`'s `defineLive` is not adopted: it brings its own cache policy and would replace the tags and the webhook E09 built.

The API stays the source of truth (AGENTS.md rule 1). Names, prices, stock, categories and the cart are not editable here, because they are not Sanity's.

## What is editable

Everything Sanity owns and the store renders: the home hero (headline, description, photo), the featured and favourites headings, a product's extended description, care text and questions, testimonials (quote, person, role, photo), the four product-page headings, the checkout page, and the footer text. Each gets a click-to-edit overlay through stega-encoded strings; nothing is annotated by hand unless a spike shows a value that stega cannot carry (images), which then takes a `data-sanity` attribute.

## Where it runs

Presentation frames the store in an iframe. A Vercel preview deployment answers with a login redirect (Deployment Protection) and cannot be framed, so the Studio always frames the **production** store, or `http://localhost:3000` when the Studio runs locally. The origin is `SANITY_STUDIO_PREVIEW_ORIGIN`, defaulting to the production store. It follows that slice 1 must be live in production before slice 2 can be tried outside a developer's machine.

## Security

- **The token never leaves the server.** `SANITY_API_READ_TOKEN` is server-only like `API_BYPASS_TOKEN`: never `NEXT_PUBLIC_`, never sent to a client component, never logged. It is a Viewer token: a write with it is refused. It can read the private demand documents of E13, and no query in the store asks for them, in or out of draft mode.
- **Draft mode cannot be switched on by a stranger.** `/api/draft-mode/enable` is `defineEnableDraftMode` from `next-sanity/draft-mode`: it accepts only a short-lived secret the Studio mints and Sanity verifies with the token. Without the token the route answers 404 and the feature is off, so previews, CI and forks are unaffected.
- **Framing is opened to the Studio and nobody else.** `frame-ancestors 'none'` becomes `frame-ancestors 'self' <studio origins>`, from `PRESENTATION_STUDIO_ORIGINS` (comma-separated, exact origins, no wildcards): the production Studio on Vercel, its `sanity.studio` host, and `http://localhost:3333` in development. A wildcard for preview Studios is refused on purpose: `https://*.vercel.app` would let any Vercel site frame the store. Unset, the header stays `'none'`.
- **Stega never reaches a machine reader.** Encoded strings are invisible characters appended to text. They are cleaned with `stegaClean` wherever text is compared, parsed or exported: `alt` text, `<title>` and meta descriptions, Open Graph images, JSON-LD, `aria-*` values. Visitors never receive stega at all.

## Slices

### Slice 0: spikes

Answer on a throwaway branch and record the answers in the PR description.

1. `sanityFetch` reading `draftMode().isEnabled` inside its `"use cache"` scope: the build passes, the route table is identical to `main`, a request with the draft cookie returns a draft, and a request without it still hits the cache. If the table changes, the branch moves out of the cached function into an uncached sibling chosen by the caller inside a Suspense boundary.
2. The production-built store loads inside an iframe from `http://localhost:3333` with the new `frame-ancestors`, and the draft cookie survives there (it is set with the CHIPS `Partitioned` attribute for cross-site iframes). If the CSP needs more than `frame-ancestors` (the overlay's `connect-src` to `*.api.sanity.io`, for instance), list exactly what, and scope it to draft mode if the header can be varied, or document why not.
3. Which rendered values stega breaks: run the home page and one product page in draft mode through the existing Playwright and axe checks and list every failure. These become slice 1's cleaning list.

### Slice 1: the store can render drafts

- `lib/env.ts`: `SANITY_API_READ_TOKEN` optional; `PRESENTATION_STUDIO_ORIGINS` optional, each entry validated as an origin.
- `lib/sanity/draft-client.ts`: `server-only`; the token client with `perspective: 'drafts'`, `useCdn: false`, `stega: { enabled: true, studioUrl }`. `null` without the token.
- `lib/sanity/fetch.ts`: inside the existing `"use cache"` function, `const { isEnabled } = await draftMode()`; enabled and a draft client present: fetch with it; otherwise exactly today's call. A `stega: false` option for callers that feed machines (metadata, Open Graph, JSON-LD, the sitemap).
- `app/api/draft-mode/enable/route.ts`: `defineEnableDraftMode`. `app/api/draft-mode/disable/route.ts`: disables and redirects to the path it was given, same-origin paths only.
- `components/draft-mode.tsx`: an async server component, rendered from the root layout inside `<Suspense fallback={null}>` so the shell stays static. Outside draft mode it renders nothing. Inside, it renders `VisualEditing` from `next-sanity/visual-editing` and, when the page is not framed, a small "Draft preview · Exit" bar.
- `lib/security-headers.ts`: `frame-ancestors` from the env as above, plus whatever spike 2 listed.
- The cleaning list from spike 3, applied with `stegaClean`.

### Slice 2: the Studio gets the tool

- `apps/studio/sanity.config.ts`: `presentationTool({ previewUrl: { origin: SANITY_STUDIO_PREVIEW_ORIGIN, previewMode: { enable: '/api/draft-mode/enable' } }, resolve })`.
- `apps/studio/presentation/resolve.ts`: `locations`, so every document says where it shows:
  - `product`: its page, `/products/<slug>` from the mirrored slug.
  - `testimonial`: the page of each product it names, and the home page (it counts towards People's favourites).
  - `faq`: the pages of the products it is attached to; for a category question, a message naming the category instead of a list.
  - `homePage` and `siteSettings`: `/`. `checkoutPage`: `/checkout`.
  - `category`, `searchGap`, `productIdea`: none. They are not editorial.
- `mainDocuments`: `/` opens `homePage`, `/checkout` opens `checkoutPage`, `/products/:slug` opens the product with that slug.
- The desk (E08) is untouched; Presentation is a second tool next to it.

### Slice 3: edits show as they are typed

- `VisualEditing` refreshes the route when a document the page uses changes; confirm it with a draft edit of the hero headline and of a testimonial quote, without publishing.
- Publishing still goes through the E09 webhook and the tags, so a visitor sees the change on their next request. Nothing about that path changes.

### Slice 4: docs

- README: "Live editing" under Sanity: how to open it, what is editable, the two env vars, how to run it locally against `localhost:3000`.
- `AGENTS.md`: the cache-policy row for Sanity documents gains "in draft mode, bypassed by Next and read with the read token"; non-negotiable 3 names `SANITY_API_READ_TOKEN` beside `API_BYPASS_TOKEN`.
- `docs/adr/0005-draft-mode-read-token.md`: why the store gains a token after deciding it needs none, why only draft mode uses it, why `defineLive` was not adopted, why previews are not framed.
- `specs/decisions.md` and `specs/callout.md` updated on `main`.

## Tests

- Vitest: `sanityFetch` uses the published client without draft mode, the draft client with it, and the published client when draft mode is on but the token is unset; `stega: false` is honoured. The enable route answers 404 without the token. The disable route refuses an absolute or protocol-relative redirect target. `securityHeaders` emits `'none'` with the env unset and the exact origins with it set, and rejects a wildcard entry.
- Playwright: with the draft cookie set, the home page shows the exit bar and the overlay script loads; without it, neither is present and the HTML contains no zero-width stega characters.
- The route table in the build output is identical to `main` apart from the two `/api/draft-mode/*` routes.
- Manual, in the PR description: open Presentation, click the hero headline, change it, watch the page update, discard the draft; do the same for a testimonial on a product page.

## Acceptance criteria

- [ ] Slice 0's three answers are in the PR description.
- [ ] Every route keeps its rendering mode; only `/api/draft-mode/enable` and `/api/draft-mode/disable` are new.
- [ ] A visitor's HTML, JavaScript and response headers are unchanged apart from `frame-ancestors` when the env is set: no stega characters, no overlay script, no token anywhere in the payload.
- [ ] With `SANITY_API_READ_TOKEN` unset the store builds and runs, the enable route answers 404, and nothing else differs.
- [ ] In Presentation, every editable item listed above opens its field on click, and a draft edit shows in the page without publishing.
- [ ] Lighthouse on the production home page is within noise of the run before this epic.
- [ ] README, `AGENTS.md`, ADR 0005, `decisions.md` and `callout.md` written.

## Set up by hand

- `SANITY_API_READ_TOKEN` (Sanity token, Viewer role) on the store's Vercel project for Production and Preview.
- `PRESENTATION_STUDIO_ORIGINS` on the store's Vercel project: the production Studio's origins.
- `SANITY_STUDIO_PREVIEW_ORIGIN` on the Studio's Vercel project, if the production store's address ever differs from the default.
- In Sanity's API settings, the production store's origin as a CORS origin with credentials allowed: the overlay runs in the editor's browser on that origin and talks to Sanity with the editor's session. Spike 2 confirms whether it is needed.

## Out of scope

Editing anything the API owns. Framing preview deployments. `defineLive` and live content for visitors. A preview of unpublished **catalogue** changes, which do not exist: the API has no drafts.
