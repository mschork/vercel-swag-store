# E12 Delivery

Branch: `epic/E12-delivery`. Depends on: everything required (E01 to E07, E10, E11); Sanity epics if shipped.

## Goal

A submission a reviewer can open cold: a public repo whose README explains the architecture in the terms the brief uses, two working deployments, machine-checked verification, and the email.

## Scope

### `pnpm verify` script (root)

Runs in order and fails fast:

1. `turbo lint typecheck`
2. `turbo build`
3. `turbo test` (Vitest)
4. `node scripts/check-build.mjs`: parses the Next build manifest and asserts the expected static routes and that no expected-static route is dynamic; greps `.next/static` for the bypass token and fails if found.
5. `node scripts/check-canary.mjs`: greps `apps/` for the strings the script lists, anything a third-party directive asked the store to carry, and fails if one is found.
6. `playwright test` against a local `next start` (smoke suite from E05 to E07).

Wire it as a GitHub Actions workflow `ci.yml` on pull requests with two jobs: `verify` (lint, typecheck, build, Vitest), required to merge; `e2e` (Playwright smoke and visual regression from E11), not required, so a flaky screenshot never blocks a merge (see `callout.md`).

### README.md (final)

Sections, in this order, each short:

1. What this is: one paragraph plus the two URLs.
2. Architecture: monorepo layout; API as source of truth; Sanity layer; diagram as a Mermaid block.
3. Static vs dynamic: the table from E11 verbatim.
4. Caching: `"use cache"` policy table, tags, revalidation paths (time-based, Server Action, Sanity webhook, catalogue revalidation route).
5. Server Actions and the cart: cookie design, why server-side only, expiry handling.
6. Search: URL contract, category-aware expansion, why no search service.
7. Sanity: what it owns, what it never owns, merge rules.
8. Performance: Lighthouse numbers, Speed Insights note.
9. Running locally: prerequisites, env vars, commands.
10. How this was built: specs-driven workflow with Claude Code, one PR per epic, `AGENTS.md` guardrails, and the findings from reading the API that shaped the design. Factual tone, no editorialising.
11. Trust boundaries: zod at env, API responses and action inputs; security headers and the CSP trade-off; observability via OpenTelemetry.
12. Not included: checkout, auth, cross-device carts, Flags.

### Repository hygiene

- Make the repo public; confirm no secrets in history (`gitleaks` or a manual `git log -p | grep -i token` pass).
- No `LICENSE` file; the code is not licensed for reuse and the README states this in one line. `.env.example`; `CODEOWNERS` not needed.
- PR history preserved (no squash to a single commit) so the epic trail is visible.
- Tag `v1.0.0` at the submitted commit.

### Deployments

- Production URLs for store and studio recorded in README; both load from a private window.
- Preview comments enabled.
- Environment variables reviewed: bypass token present in Production and Preview, absent from any `NEXT_PUBLIC_` name.
- The store answers `X-Robots-Tag: noindex` on every route, so a demo of invented products never enters a search index, while the metadata, Open Graph and sitemap work stays in place (`specs/callout.md`). Verify against production with `curl -sI` on the home page, a product page and `sitemap.xml`.

### Final checklist (`docs/submission-checklist.md`)

One line per requirement in the brief, ticked with the route or file that satisfies it. Include: header, footer, layout, responsive, root metadata, page metadata, OG, Cache Components enabled, hero, promo, featured grid, PDP image, info, stock, quantity, Add to Cart, cart add, badge, view, item display, adjust, remove, subtotal, persistence, search input, triggers, default, results, category, empty, loading, URL persistence.

### Email

Short draft to the reviewer: repo link, deployment link, studio link (optional), one sentence on the Sanity layer being additive, one sentence pointing at the README's static vs dynamic section. No attachments. Markus sends it himself.

## Acceptance criteria

- [ ] `pnpm verify` green locally and in CI on `main`.
- [ ] README complete; a reader who has not seen the code can explain the caching model from it.
- [ ] Both URLs public; repo public; tag pushed.
- [ ] Submission checklist fully ticked.
- [ ] Email draft in `docs/email.md`.
- [x] The deployed store is `noindex` on every route, checked against production.
