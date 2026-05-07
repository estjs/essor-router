# AGENTS.md - Essor Router Monorepo (AI Guide)

This repository contains the router runtime, file-based routing unplugin, and a TypeScript language service plugin for Essor Router. Use this guide to make changes that fit the codebase and docs.

## Repo Summary
- `essor-router`: runtime package (history, matcher, router APIs)
- `essor-router-unplugin`: file-based routes, codegen, and typed routes
- `essor-router-ts-plugin`: TypeScript language service plugin for route-aware types

## Directory Map
- `packages/router/src`: router runtime implementation
- `packages/unplugin/src`: file routing scanner, codegen, and bundler entry points
- `packages/ts-plugin/src`: TS language service plugin
- `docs/` and `docs/zh/`: documentation sources
- `examples/`: runnable demos
- `e2e/`: Playwright tests

## Key Entry Points
- Router exports: `packages/router/src/index.ts`
- Router core: `packages/router/src/router.ts`
- Matching/parsing: `packages/router/src/matcher/*`
- Router runtime helpers: `packages/router/src/router/*`
- Unplugin entry points: `packages/unplugin/src/index.ts`, `packages/unplugin/src/vite.ts`, `packages/unplugin/src/rollup.ts`, `packages/unplugin/src/webpack.ts`, `packages/unplugin/src/rolldown.ts`, `packages/unplugin/src/esbuild.ts`
- Unplugin core/codegen: `packages/unplugin/src/core/*`, `packages/unplugin/src/codegen/*`

## Router Behavior to Preserve
- `createRouter()` requires a `history` option (`'history' | 'hash' | 'memory'` or a history instance).
- `currentRoute` is an Essor `signal`; changes should keep reactivity predictable.
- Path matching is tokenized and compiled; duplicate param names warn in dev and last wins.
- Scroll behavior is browser-only and runs through the user-provided `scrollBehavior` callback.
- Navigation hooks are coordinated via the guard pipeline in `packages/router/src/router/*`.

## File-Based Routing (Unplugin)
Defaults:
- `routesFolder`: `src/pages`
- Extensions: `.tsx`, `.ts`, `.jsx`, `.js`
- Generated types: `typed-router.d.ts` (commit-friendly, but do not hand-edit)

Conventions:
- `index.tsx` -> `/`
- `users/index.tsx` -> `/users`
- `users/[id].tsx` -> `/users/:id`
- `post/[[id]].tsx` -> `/post/:id?`
- `[...path].tsx` -> `/:path(.*)`
- `users/[id]+.tsx` -> `/users/:id+`
- `(admin)/users.tsx` -> `/users` (group folder ignored in URL)
- `dashboard/_parent.tsx` -> layout-only node (name disabled by convention)
- `index@sidebar.tsx` -> named view `sidebar`
- `users.[id].tsx` -> `/users/:id` when `pathParser.dotNesting: true` (default)

Extraction rules:
- Prefer static object literals in `defineRoute()` / `definePage()` for reliable extraction.
- Generated virtual modules: `essor-router/auto-routes` (route records), `essor-router/auto-resolver` (fixed-priority resolver).
- `$route.ts` companion typings are generated; do not edit by hand.

## TypeScript Plugin
- `essor-router-ts-plugin` maps routes from `routesFolder` and `typed-router.d.ts` to provide precise `useRoute()` types.
- Keep plugin options aligned with unplugin options when both are used.

## Build, Test, and Docs Commands
Root scripts (see `package.json`):
- `pnpm run dev` (router watch build)
- `pnpm run build`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test`
- `pnpm run test:e2e`
- `pnpm run coverage`
- `pnpm run docs:dev`, `pnpm run docs:build`, `pnpm run docs:preview`

Focused package runs:
- `pnpm --filter essor-router test`
- `pnpm --filter essor-router-unplugin test`
- `pnpm --filter essor-router-ts-plugin test`

## Coding Style
- TypeScript + ESM (`"type": "module"`)
- `.editorconfig`: 2-space indent, LF, trim trailing whitespace
- Follow existing file style and naming patterns in each package

## Change Guidelines
- Avoid editing generated outputs in `packages/*/dist` or `doc_build/`.
- If changing matcher or path parsing, add/update tests and relevant docs.
- If changing unplugin codegen, validate against `docs/guide/advanced/file-based-routing-unplugin.md` and update docs when behavior changes.
- Keep `typed-router.d.ts` generation behavior consistent with `routesFolder` rules.


