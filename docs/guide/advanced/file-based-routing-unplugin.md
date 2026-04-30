# File-Based Routing with Unplugin

This guide is the complete reference for `essor-router-unplugin`: setup, file conventions, `defineRoute()` capabilities, generated modules, typing, HMR, and production best practices.

## What You Get

- File-system route generation from `routesFolder`.
- Two virtual modules:
  - `essor-router/auto-routes` (route records)
  - `essor-router/auto-resolver` (fixed-priority matcher resolver)
- Static extraction of `defineRoute()` / `definePage()` metadata.
- Typed route declarations (`typed-router.d.ts`) and page companion typings (`$route.ts`).
- Dev watch + HMR updates for route tree and resolver.
- Experimental param parsers and loader auto-export.

## Quick Start (Vite)

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import essorRouter from 'essor-router-unplugin/vite'

export default defineConfig({
  plugins: [essorRouter({ routesFolder: 'src/pages' })],
})
```

```ts
// src/router.ts
import { createRouter } from 'essor-router'
import { routes } from 'essor-router/auto-routes'
import { resolver } from 'essor-router/auto-resolver'

export const router = createRouter({ history: 'history', routes, resolver })
```

## File Conventions (Full)

- `index.tsx` -> `/`
- `users/index.tsx` -> `/users`
- `users/[id].tsx` -> `/users/:id`
- `post/[[id]].tsx` -> `/post/:id?`
- `[...path].tsx` -> `/:path(.*)`
- `users/[id]+.tsx` -> `/users/:id+`
- `(admin)/users.tsx` -> `/users` (group folder ignored in URL)
- `dashboard/_parent.tsx` -> layout-like parent node (`name: false` by convention)
- `index@sidebar.tsx` -> named view `sidebar`
- `users.[id].tsx` -> `/users/:id` when `pathParser.dotNesting: true` (default)

## `defineRoute()` / `definePage()` Capabilities

Use static object literals for best extraction reliability.

```ts
import { defineRoute } from 'essor-router/experimental'

export const route = defineRoute({
  name: 'users-id',
  path: '/people/:id(\\d+)',
  alias: ['/u/:id'],
  meta: { auth: true },
  props: true,
  params: {
    path: { id: 'int' },
    query: {
      keyword: { queryKey: 'q', parser: 'int', format: 'value', required: true },
    },
  },
  validateSearch: input => ({ q: String(input.q ?? '') }),
  loader: async () => ({ ok: true }),
  beforeLoad: () => ({ canEnter: true }),
  start: { ssr: true, prerender: false, preload: 'intent' },
})
```

Aliases must be absolute (start with `/`). Relative aliases are ignored and will emit a warning.

## Recommended Production Config

```ts
essorRouter({
  routesFolder: [
    { src: 'src/pages' },
    { src: 'src/features', filePatterns: '**/pages/**', path: p => p.replace('/pages', '') },
  ],
  dts: 'typed-router.d.ts',
  importMode: file => file.includes('/critical/') ? 'sync' : 'async',
  watch: true,
  experimental: {
    paramParsers: { dir: ['src/params'] },
    autoExportsDataLoaders: ['src/loaders/**'], // Vite only
  },
})
```

Best practices:
- Keep most routes `async`; mark only critical routes as `sync`.
- Commit `typed-router.d.ts`; include it in `tsconfig.json`.
- Enable `paramParsers` only when using parser-based params.
- Avoid duplicate `path`/`alias`; plugin emits warnings but cleanup should be explicit.

## Troubleshooting Checklist

- Routes not updating in dev: confirm plugin is enabled and `watch` is not disabled.
- Missing parser warnings: ensure parser file exists in `src/params` (or configured dir).
- Unexpected `$route.ts` route entries: generated companions are ignored by scanner; upgrade if stale cache remains.
- Hydration mismatch with SSR: keep server/client route tree and `defineRoute()` behavior deterministic.

Useful commands:
- `pnpm --filter essor-router-unplugin test`
- `pnpm --filter essor-router-unplugin typecheck`
- `pnpm --filter essor-router-unplugin run build`
