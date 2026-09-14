# E12 Delivery

Branch: `epic/E12-delivery`. Depends on: everything required (E01 to E07, E10, E11); Sanity epics if shipped.

## Goal

A release someone can open cold: a public repo whose README explains the architecture in the terms the requirements use, two working deployments, machine-checked verification, and the email.

## Scope

### `pnpm verify` script (root)

Runs in order and fails fast:

1. `turbo lint typecheck`
2. `turbo build`
3. `turbo test` (Vitest)
4. `node scripts/check-build.mjs`: parses the Next build manifest and asserts the expected static routes and that no expected-static route is dynamic; greps `.next/static` for the bypass token and fails if found.
5. `node scripts/check-canary.mjs`: greps `apps/` for `redacted` and `hhhhhh` and fails if found.
6. `playwright test` against a local `next start` (smoke suite from E05 to E07).

Wire it as a GitHub Actions workflow `ci.yml` on pull requests (steps 1 to 5; Playwright too if runtime allows) [assumption: CI included since it is cheap and shows discipline].

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
10. How this was built: specs-driven workflow with Claude Code, one PR per epic, `AGENTS.md` guardrails, the `x-redacted` directive found in the API spec and deliberately not followed, the 31 vs 28 and search-vs-category findings. Factual tone, no editorialising.
11. Trust boundaries: zod at env, API responses and action inputs; security headers and the CSP trade-off; observability via OpenTelemetry.
12. Not included: checkout, auth, cross-device carts, Flags.

### Repository hygiene

- Make the repo public; confirm no secrets in history (`gitleaks` or a manual `git log -p | grep -i token` pass).
- No `LICENSE` file (settled 2026-09-14: the code is not licensed for reuse; README states this in one line). `.env.example`; `CODEOWNERS` not needed.
- PR history preserved (no squash to a single commit) so the epic trail is visible.
- Tag `v1.0.0` at the released commit.

### Deployments

- Production URLs for store and studio recorded in README; both load from a private window.
- Preview comments enabled; leave one resolved comment thread as an example of the review loop [assumption: optional].
- Environment variables reviewed: bypass token present in Production and Preview, absent from any `NEXT_PUBLIC_` name.

### Final checklist (`docs/release-checklist.md`)

One line per requirement in `the requirements`, ticked with the route or file that satisfies it. Include: header, footer, layout, responsive, root metadata, page metadata, OG, Cache Components enabled, hero, promo, featured grid, PDP image, info, stock, quantity, Add to Cart, cart add, badge, view, item display, adjust, remove, subtotal, persistence, search input, triggers, default, results, category, empty, loading, URL persistence.

### Email



## Acceptance criteria

- [ ] `pnpm verify` green locally and in CI on `main`.
- [ ] README complete; a reader who has not seen the code can explain the caching model from it.
- [ ] Both URLs public; repo public; tag pushed.
- [ ] Release checklist fully ticked.
- [ ] Email draft in `docs/email.md`.

## Open questions

1. Licence: MIT or none? Settled 2026-09-14: none; README states the code is not licensed for reuse.
2. Do you want the studio URL in the email, or keep the release to the two required links and mention Sanity in the README only? [assumption: include, labelled optional]
