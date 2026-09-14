---
status: accepted
date: 2026-09-14
---

# CSP allows inline scripts instead of using nonces

The store ships a Content-Security-Policy with `script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com`. We chose `'unsafe-inline'` over a nonce-based CSP because nonces require a proxy on every request, which makes every page dynamic and destroys the static shell that Cache Components are meant to keep. A hash-based CSP was ruled out after inspecting the build output: Next inlines the React Server Components payload in seven `<script>` tags per page, and that payload changes with content, so hashes cannot be precomputed.

## Considered options

- Nonce-based CSP via `proxy.ts`: strictest, but forces dynamic rendering of every route.
- Hash-based CSP: infeasible with the App Router's inline RSC payload.
- `'unsafe-inline'` with a strict host list: chosen.

## Consequences

- The CSP does not block an inline script that reaches the HTML. That door is closed at the source: `react/no-danger` is an ESLint error, Portable Text renders through a serializer with allow-listed marks, and zod validates every trust boundary.
- The remaining directives still do real work: only `'self'` and Vercel's analytics host may serve scripts, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`.
- The README states this trade-off so reviewers see it was deliberate.
