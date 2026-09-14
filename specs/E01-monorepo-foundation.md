# E01 Monorepo foundation

Branch: `epic/E01-foundation`. Depends on: nothing. Blocks: everything.

## Goal

A pnpm + Turborepo workspace with a Next.js 16 store app (Cache Components on) and a Sanity Studio app, both building locally and deployable to Vercel as separate projects.

## Scope

### Workspace

- `pnpm-workspace.yaml` with `apps/*` and `packages/*`.
- Root `package.json`: `private: true`, scripts `dev`, `build`, `lint`, `typecheck`, `test`, `verify` (placeholder that runs lint, typecheck, build, test) all delegating to `turbo`.
- `turbo.json` tasks: `build` (dependsOn `^build`, outputs `.next/**` excluding cache, `dist/**`), `dev` (persistent, no cache), `lint`, `typecheck`, `test`. Declare env vars per task with `env` and `globalEnv` so Turbo's hashing is correct (`API_BASE_URL`, `API_BYPASS_TOKEN`, `NEXT_PUBLIC_SANITY_*`, `SANITY_*`, `NEXT_PUBLIC_SITE_URL`).
- `.nvmrc` pinned to the current Node LTS; `packageManager` field pinned to a pnpm 10 version.
- `.gitignore` covering `.next`, `node_modules`, `.turbo`, `.env*` except `.env.example`, `dist`, `playwright-report`.
- `.editorconfig`, `.prettierrc` (default plus `singleQuote: true`, `semi: false` [assumption]).

### apps/store

- `create-next-app@latest` with TypeScript, App Router, Tailwind v4, ESLint, `src/` directory off [assumption: keep `app/`, `components/`, `lib/` at app root for shorter imports], import alias `@/*`.
- `next.config.ts`: `cacheComponents: true`; `images.remotePatterns` for `i8qy5y6gxkdgdcv9.public.blob.vercel-storage.com` and `cdn.sanity.io`; `typedRoutes: true` [assumption].
- `app/layout.tsx` placeholder with Geist Sans and Geist Mono via `next/font/google` exposing `--font-geist-sans` and `--font-geist-mono`.
- `app/globals.css` with Tailwind v4 `@import "tailwindcss"` and an empty `@theme` block ready for E10.
- `.env.example` listing every variable from `specs/decisions.md` with a one-line comment each.
- `lib/env.ts`: a tiny runtime guard that throws at startup in server code if `API_BASE_URL` or `API_BYPASS_TOKEN` is missing. No zod [assumption: avoid a dependency for six variables].

### apps/studio

- `pnpm create sanity@latest` non-interactive into `apps/studio` with the new project id and dataset `production`, TypeScript, no template schemas.
- `sanity.config.ts` imports schema types from `@repo/sanity` (E08 fills them in; for now an empty array).
- `package.json` scripts: `dev`, `build` (`sanity build`), `deploy` (`sanity deploy`).
- `vercel.json` in `apps/studio` with `outputDirectory: dist` and a rewrite of all paths to `/index.html` so Vercel serves the SPA.

### packages

- `packages/config`: `tsconfig/base.json`, `tsconfig/nextjs.json`, `tsconfig/react-library.json`, `eslint` config exporting the Next core-web-vitals set. Name `@repo/config`.
- `packages/sanity`: name `@repo/sanity`; exports `schemaTypes` (empty for now), `client.ts` (factory taking projectId, dataset, token, `useCdn`), `env.ts`. Built with `tsc` to `dist` or consumed as source via `exports` pointing at `src` [assumption: consume source, transpile in consumers, avoid a build step].

### Repo docs

- `README.md` skeleton with sections: What this is, Architecture, Static vs dynamic, Running locally, Environment, Deployment, How this was built. Fill in only Running locally and Environment now.
- `AGENTS.md` from `specs/AGENTS.md` copied to the repo root.
- `specs/` committed as-is.

### Vercel

- Two projects in the same Vercel team: `vercel-swag-store` (root directory `apps/store`) and `vercel-swag-studio` (root directory `apps/studio`). Framework presets: Next.js and Other. Env vars set for Production and Preview. Comments enabled on previews.
- Ignored Build Step for each project using `npx turbo-ignore` so a studio-only change does not rebuild the store and vice versa.

## Acceptance criteria

- [ ] `pnpm install` from a clean clone succeeds with a frozen lockfile.
- [ ] `pnpm build` builds both apps; `pnpm dev` starts both (store on 3000, studio on 3333).
- [ ] `pnpm lint` and `pnpm typecheck` pass with zero warnings treated as errors in CI.
- [ ] Both Vercel projects deploy from `main`; preview deployments appear on a test PR.
- [ ] `.env.example` is complete; `lib/env.ts` throws a clear message when a variable is missing.
- [ ] No secret in git history.

## Out of scope

Any page content, API client, Sanity schemas, design tokens.

## Open questions

1. GitHub repo name and visibility timing: create public from the start or flip to public at submission? [assumption: private until E12, then public]
2. Vercel team: personal account or a dedicated team? [assumption: personal]
3. Prettier settings: semicolons or not? [assumption: none, single quotes]
